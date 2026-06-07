import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore'
import { assertFirebaseReady, db } from './firebase'

const getNowIso = () => new Date().toISOString()

const sorters = {
  employees: (first, second) => first.fullName.localeCompare(second.fullName, 'tr'),
  leaves: (first, second) => new Date(second.createdAt) - new Date(first.createdAt),
  announcements: (first, second) =>
    new Date(second.createdAt) - new Date(first.createdAt),
}

const sortCollection = (key, values) => [...values].sort(sorters[key])

const createId = (prefix) =>
  `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)}`

const cleanText = (value = '') => value.trim()

const ensureAuthenticated = (session) => {
  assertFirebaseReady()

  if (!session?.user?.uid || !session?.account) {
    throw new Error('Bu işlem için giriş yapmanız gerekiyor.')
  }
}

const ensureAdmin = (session) => {
  ensureAuthenticated(session)

  if (session.account.accountRole !== 'admin') {
    throw new Error('Bu işlem yalnızca yönetici hesabıyla yapılabilir.')
  }
}

const ensureSelfOrAdmin = (session, employeeId) => {
  ensureAuthenticated(session)

  if (session.account.accountRole === 'admin') {
    return
  }

  if (session.user.uid !== employeeId) {
    throw new Error('Bu kaydı güncelleme yetkiniz bulunmuyor.')
  }
}

const subscribeList = (key, source, callback, onError) =>
  onSnapshot(
    source,
    (snapshot) => {
      callback(
        sortCollection(
          key,
          snapshot.docs.map((item) => ({
            id: item.id,
            ...item.data(),
          })),
        ),
      )
    },
    (error) => {
      callback([])
      onError?.(error)
    },
  )

const subscribeSingleEmployee = (employeeId, callback, onError) =>
  onSnapshot(
    doc(db, 'employees', employeeId),
    (snapshot) => {
      callback(
        sortCollection(
          'employees',
          snapshot.exists() ? [{ id: snapshot.id, ...snapshot.data() }] : [],
        ),
      )
    },
    (error) => {
      callback([])
      onError?.(error)
    },
  )

export const subscribeEmployees = (session, callback) => {
  ensureAuthenticated(session)

  if (session.account.accountRole === 'admin') {
    return subscribeList('employees', collection(db, 'employees'), callback)
  }

  return subscribeSingleEmployee(session.user.uid, callback)
}

export const subscribeLeaves = (session, callback) => {
  ensureAuthenticated(session)

  if (session.account.accountRole === 'admin') {
    return subscribeList('leaves', collection(db, 'leaves'), callback)
  }

  return subscribeList(
    'leaves',
    query(collection(db, 'leaves'), where('employeeId', '==', session.user.uid)),
    callback,
  )
}

export const subscribeAnnouncements = (session, callback) => {
  ensureAuthenticated(session)
  return subscribeList('announcements', collection(db, 'announcements'), callback)
}

const buildEmployeeRecord = (payload, existingEmployee = {}, existingAccount = {}) => {
  const now = getNowIso()

  return {
    id: payload.id,
    userId: existingEmployee.userId || payload.id,
    email: existingEmployee.email || existingAccount.email || payload.email || '',
    fullName: cleanText(payload.fullName),
    department: payload.department,
    jobTitle: cleanText(payload.jobTitle),
    accountRole: existingEmployee.accountRole || existingAccount.accountRole || 'personnel',
    status: payload.status,
    shift: payload.shift,
    phone: cleanText(payload.phone),
    location: cleanText(payload.location),
    attendanceRate: Number(payload.attendanceRate) || 0,
    completionRate: Number(payload.completionRate) || 0,
    lastCheckIn: payload.lastCheckIn || existingEmployee.lastCheckIn || null,
    startDate: payload.startDate || existingEmployee.startDate || existingAccount.startDate,
    createdAt: existingEmployee.createdAt || existingAccount.createdAt || now,
    updatedAt: now,
  }
}

const buildAccountMirror = (employee, existingAccount = {}) => ({
  uid: employee.id,
  email: existingAccount.email || employee.email,
  fullName: employee.fullName,
  accountRole: existingAccount.accountRole || employee.accountRole,
  department: employee.department,
  jobTitle: employee.jobTitle,
  phone: employee.phone,
  location: employee.location,
  shift: employee.shift,
  startDate: employee.startDate,
  status: employee.status,
  createdAt: existingAccount.createdAt || employee.createdAt,
  updatedAt: employee.updatedAt,
})

export const saveEmployee = async (session, payload) => {
  ensureAdmin(session)

  const employeeRef = doc(db, 'employees', payload.id)
  const accountRef = doc(db, 'users', payload.id)
  const [employeeSnapshot, accountSnapshot] = await Promise.all([
    getDoc(employeeRef),
    getDoc(accountRef),
  ])

  const employee = buildEmployeeRecord(
    payload,
    employeeSnapshot.exists() ? employeeSnapshot.data() : {},
    accountSnapshot.exists() ? accountSnapshot.data() : {},
  )
  const account = buildAccountMirror(
    employee,
    accountSnapshot.exists() ? accountSnapshot.data() : {},
  )

  await Promise.all([setDoc(employeeRef, employee), setDoc(accountRef, account)])
  return employee
}

export const saveOwnProfile = async (session, payload) => {
  ensureSelfOrAdmin(session, session.user.uid)

  const employeeRef = doc(db, 'employees', session.user.uid)
  const accountRef = doc(db, 'users', session.user.uid)
  const [employeeSnapshot, accountSnapshot] = await Promise.all([
    getDoc(employeeRef),
    getDoc(accountRef),
  ])

  const existingEmployee = employeeSnapshot.exists() ? employeeSnapshot.data() : {}
  const existingAccount = accountSnapshot.exists() ? accountSnapshot.data() : {}
  const now = getNowIso()

  const nextEmployee = {
    ...existingEmployee,
    id: session.user.uid,
    userId: existingEmployee.userId || session.user.uid,
    email: existingEmployee.email || existingAccount.email || session.user.email || '',
    fullName: cleanText(payload.fullName) || existingEmployee.fullName || existingAccount.fullName,
    department: existingEmployee.department || existingAccount.department || 'Operasyon',
    jobTitle: existingEmployee.jobTitle || existingAccount.jobTitle || 'Personel',
    accountRole:
      existingEmployee.accountRole || existingAccount.accountRole || session.account.accountRole,
    status: existingEmployee.status || existingAccount.status || 'active',
    shift: existingEmployee.shift || existingAccount.shift || '09:00 - 18:00',
    phone: cleanText(payload.phone),
    location: cleanText(payload.location),
    attendanceRate: Number(existingEmployee.attendanceRate || 0),
    completionRate: Number(existingEmployee.completionRate || 0),
    lastCheckIn: existingEmployee.lastCheckIn || null,
    startDate: existingEmployee.startDate || existingAccount.startDate,
    createdAt: existingEmployee.createdAt || existingAccount.createdAt || now,
    updatedAt: now,
  }

  const nextAccount = {
    ...existingAccount,
    uid: session.user.uid,
    email: existingAccount.email || session.user.email || '',
    fullName: nextEmployee.fullName,
    accountRole: existingAccount.accountRole || session.account.accountRole,
    department: existingAccount.department || nextEmployee.department,
    jobTitle: existingAccount.jobTitle || nextEmployee.jobTitle,
    phone: nextEmployee.phone,
    location: nextEmployee.location,
    shift: existingAccount.shift || nextEmployee.shift,
    startDate: existingAccount.startDate || nextEmployee.startDate,
    status: existingAccount.status || nextEmployee.status,
    createdAt: existingAccount.createdAt || nextEmployee.createdAt,
    updatedAt: now,
  }

  await Promise.all([setDoc(employeeRef, nextEmployee), setDoc(accountRef, nextAccount)])
  return nextEmployee
}

export const markEmployeeCheckIn = async (session, employee) => {
  ensureSelfOrAdmin(session, employee.id)

  const employeeRef = doc(db, 'employees', employee.id)
  const accountRef = doc(db, 'users', employee.id)
  const [employeeSnapshot, accountSnapshot] = await Promise.all([
    getDoc(employeeRef),
    getDoc(accountRef),
  ])

  const existingEmployee = employeeSnapshot.exists() ? employeeSnapshot.data() : employee
  const existingAccount = accountSnapshot.exists() ? accountSnapshot.data() : {}
  const now = getNowIso()

  const nextEmployee = {
    ...existingEmployee,
    id: employee.id,
    userId: existingEmployee.userId || employee.id,
    email: existingEmployee.email || existingAccount.email || employee.email || '',
    fullName: existingEmployee.fullName || employee.fullName,
    department: existingEmployee.department || employee.department,
    jobTitle: existingEmployee.jobTitle || employee.jobTitle,
    accountRole:
      existingEmployee.accountRole || existingAccount.accountRole || employee.accountRole,
    status: 'active',
    shift: existingEmployee.shift || employee.shift,
    phone: existingEmployee.phone || employee.phone || '',
    location: existingEmployee.location || employee.location || '',
    attendanceRate: Math.min(100, Number(existingEmployee.attendanceRate || 0) + 1),
    completionRate: Number(existingEmployee.completionRate || 0),
    lastCheckIn: now,
    startDate: existingEmployee.startDate || employee.startDate,
    createdAt: existingEmployee.createdAt || now,
    updatedAt: now,
  }

  const nextAccount = {
    ...existingAccount,
    uid: employee.id,
    email: existingAccount.email || nextEmployee.email,
    fullName: existingAccount.fullName || nextEmployee.fullName,
    accountRole: existingAccount.accountRole || nextEmployee.accountRole,
    department: existingAccount.department || nextEmployee.department,
    jobTitle: existingAccount.jobTitle || nextEmployee.jobTitle,
    phone: nextEmployee.phone,
    location: nextEmployee.location,
    shift: existingAccount.shift || nextEmployee.shift,
    startDate: existingAccount.startDate || nextEmployee.startDate,
    status: 'active',
    createdAt: existingAccount.createdAt || nextEmployee.createdAt,
    updatedAt: now,
  }

  await Promise.all([setDoc(employeeRef, nextEmployee), setDoc(accountRef, nextAccount)])
  return nextEmployee
}

export const saveLeaveRequest = async (session, payload) => {
  ensureAuthenticated(session)

  const leaveId = payload.id || createId('leave')
  const leaveRef = doc(db, 'leaves', leaveId)
  const existingSnapshot = payload.id ? await getDoc(leaveRef) : null
  const existingRecord = existingSnapshot?.exists() ? existingSnapshot.data() : {}
  const now = getNowIso()
  const isAdmin = session.account.accountRole === 'admin'

  const nextRecord = {
    id: leaveId,
    employeeId: isAdmin ? payload.employeeId : session.user.uid,
    fullName: cleanText(
      isAdmin ? payload.fullName : payload.fullName || session.account.fullName,
    ),
    leaveType: payload.leaveType,
    startDate: payload.startDate,
    endDate: payload.endDate,
    status: isAdmin ? payload.status || existingRecord.status || 'pending' : 'pending',
    note: cleanText(payload.note),
    createdAt: existingRecord.createdAt || now,
    updatedAt: now,
    reviewedBy: existingRecord.reviewedBy || '',
  }

  await setDoc(leaveRef, nextRecord)
  return nextRecord
}

export const updateLeaveStatus = async (session, leave, status) => {
  ensureAdmin(session)

  const nextRecord = {
    ...leave,
    status,
    reviewedBy: session.account.fullName,
    updatedAt: getNowIso(),
  }

  await setDoc(doc(db, 'leaves', leave.id), nextRecord)
  return nextRecord
}

export const deleteLeaveRequest = async (session, leave) => {
  ensureAuthenticated(session)

  if (session.account.accountRole !== 'admin') {
    if (leave.employeeId !== session.user.uid || leave.status !== 'pending') {
      throw new Error('Sadece kendi bekleyen izin taleplerinizi silebilirsiniz.')
    }
  }

  await deleteDoc(doc(db, 'leaves', leave.id))
  return leave.id
}

export const saveAnnouncement = async (session, payload) => {
  ensureAdmin(session)

  const announcementId = payload.id || createId('announcement')
  const announcementRef = doc(db, 'announcements', announcementId)
  const existingSnapshot = payload.id ? await getDoc(announcementRef) : null
  const existingRecord = existingSnapshot?.exists() ? existingSnapshot.data() : {}
  const now = getNowIso()

  const nextRecord = {
    id: announcementId,
    title: cleanText(payload.title),
    message: cleanText(payload.message),
    priority: payload.priority,
    authorName: session.account.fullName,
    createdAt: existingRecord.createdAt || now,
    updatedAt: now,
  }

  await setDoc(announcementRef, nextRecord)
  return nextRecord
}

export const deleteAnnouncement = async (session, announcementId) => {
  ensureAdmin(session)
  await deleteDoc(doc(db, 'announcements', announcementId))
  return announcementId
}
