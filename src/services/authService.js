import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { assertAppConfigured, auth, db } from './firebase'

const getNowIso = () => new Date().toISOString()
const getToday = () => new Date().toISOString().slice(0, 10)

const normalizeEmail = (value = '') => value.trim().toLowerCase()
const cleanText = (value = '') => value.trim()

const inferNameFromEmail = (email = '') =>
  email
    .split('@')[0]
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Yeni Kullanıcı'

const resolveStoredRole = (existingUser, existingEmployee) =>
  existingUser?.accountRole ?? existingEmployee?.accountRole ?? 'personnel'

const buildFallbackAccount = (user) => {
  const now = getNowIso()
  const email = normalizeEmail(user.email || '')
  const fullName = user.displayName || inferNameFromEmail(email)

  return {
    uid: user.uid,
    email,
    fullName,
    accountRole: 'personnel',
    department: 'Operasyon',
    jobTitle: 'Personel',
    phone: '',
    location: 'İstanbul',
    shift: '09:00 - 18:00',
    startDate: getToday(),
    status: 'active',
    createdAt: now,
    updatedAt: now,
  }
}

const hasProfileSeed = (payload) =>
  Object.values(payload).some(
    (value) => value !== undefined && value !== null && `${value}`.trim() !== '',
  )

const buildDocuments = ({ user, existingUser, existingEmployee, profileSeed = {} }) => {
  const now = getNowIso()
  const role = resolveStoredRole(existingUser, existingEmployee)
  const fullName =
    cleanText(profileSeed.fullName) ||
    existingUser?.fullName ||
    user.displayName ||
    inferNameFromEmail(user.email)
  const email = normalizeEmail(user.email || profileSeed.email || existingUser?.email || '')
  const department = cleanText(profileSeed.department) || existingUser?.department || 'Operasyon'
  const jobTitle =
    cleanText(profileSeed.jobTitle) ||
    existingUser?.jobTitle ||
    (role === 'admin' ? 'Sistem Yöneticisi' : 'Personel')
  const phone = cleanText(profileSeed.phone) || existingUser?.phone || ''
  const location = cleanText(profileSeed.location) || existingUser?.location || 'İstanbul'
  const shift = profileSeed.shift || existingUser?.shift || '09:00 - 18:00'
  const startDate = profileSeed.startDate || existingUser?.startDate || getToday()
  const status = profileSeed.status || existingUser?.status || 'active'

  const account = {
    uid: user.uid,
    email,
    fullName,
    accountRole: role,
    department,
    jobTitle,
    phone,
    location,
    shift,
    startDate,
    status,
    createdAt: existingUser?.createdAt || now,
    updatedAt: now,
  }

  const employee = {
    id: user.uid,
    userId: user.uid,
    email,
    fullName,
    department,
    jobTitle,
    accountRole: role,
    status,
    shift,
    phone,
    location,
    attendanceRate: Number(
      profileSeed.attendanceRate ??
        existingEmployee?.attendanceRate ??
        (role === 'admin' ? 98 : 90),
    ),
    completionRate: Number(
      profileSeed.completionRate ??
        existingEmployee?.completionRate ??
        (role === 'admin' ? 94 : 80),
    ),
    lastCheckIn: existingEmployee?.lastCheckIn || null,
    startDate,
    createdAt: existingEmployee?.createdAt || account.createdAt,
    updatedAt: now,
  }

  return { account, employee }
}

const withTimeout = (promise, message, timeoutMs = 20000) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), timeoutMs)
    }),
  ])

const firestoreErrorMessages = {
  'permission-denied':
    'Firestore erişim izni reddedildi. Firebase Console > Firestore > Rules bölümündeki kuralları güncelleyin.',
  unavailable:
    'Firestore şu an kullanılamıyor. Veritabanının oluşturulduğundan emin olun.',
  'failed-precondition':
    'Firestore veritabanı bulunamadı. Firebase Console > Firestore Database > Create database ile oluşturun.',
  'not-found':
    'Firestore (default) veritabanı yok. Realtime Database değil, Firestore oluşturmanız gerekiyor.',
}

export const resolveFirestoreError = (error) => {
  const message = `${error?.message || ''}`

  if (message.includes("Database '(default)' not found")) {
    return 'Firestore veritabanı henüz oluşturulmamış. Firebase Console → Firestore Database → Create database adımlarını izleyin. (Realtime Database yeterli değildir.)'
  }

  if (message.includes('BLOCKED_BY_CLIENT') || message.includes('blocked')) {
    return 'Firestore isteği tarayıcı eklentisi (reklam engelleyici) tarafından engellendi. uBlock/AdBlock kapatın veya localhost için izin verin.'
  }

  return (
    firestoreErrorMessages[error?.code] ||
    message ||
    'Veritabanı işlemi tamamlanamadı.'
  )
}

export const syncAccountRecord = async (user, profileSeed = {}) => {
  assertAppConfigured()

  const userRef = doc(db, 'users', user.uid)
  const employeeRef = doc(db, 'employees', user.uid)

  const [userSnapshot, employeeSnapshot] = await withTimeout(
    Promise.all([getDoc(userRef), getDoc(employeeRef)]),
    'Firestore yanıt vermiyor. Firestore veritabanı ve güvenlik kurallarını kontrol edin.',
  )

  const existingUser = userSnapshot.exists() ? userSnapshot.data() : null
  const existingEmployee = employeeSnapshot.exists() ? employeeSnapshot.data() : null
  const { account, employee } = buildDocuments({
    user,
    existingUser,
    existingEmployee,
    profileSeed,
  })

  const shouldWriteSeed = hasProfileSeed(profileSeed)
  const shouldSyncRole =
    userSnapshot.exists() &&
    employeeSnapshot.exists() &&
    existingUser?.accountRole !== existingEmployee?.accountRole
  const writes = []

  if (!userSnapshot.exists() || shouldWriteSeed) {
    writes.push(setDoc(userRef, account))
  }

  if (!employeeSnapshot.exists() || shouldWriteSeed || shouldSyncRole) {
    writes.push(setDoc(employeeRef, employee))
  }

  if (writes.length) {
    try {
      await withTimeout(
        Promise.all(writes),
        'Kullanıcı kaydı Firestore\'a yazılamadı. Güvenlik kurallarını kontrol edin.',
      )
    } catch (error) {
      throw new Error(resolveFirestoreError(error))
    }
  }

  return { account, employee }
}

const authErrorMessages = {
  'auth/email-already-in-use': 'Bu e-posta adresiyle zaten bir hesap var.',
  'auth/invalid-credential': 'E-posta veya şifre hatalı.',
  'auth/invalid-email': 'Geçerli bir e-posta adresi girin.',
  'auth/missing-password': 'Şifre alanı boş bırakılamaz.',
  'auth/weak-password': 'Şifre en az 6 karakter olmalıdır.',
  'auth/too-many-requests': 'Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin.',
  'auth/role-mismatch': 'Seçilen giriş türü bu hesapla eşleşmiyor.',
}

export const resolveAuthError = (error) =>
  authErrorMessages[error?.code] ||
  error?.message ||
  'İşlem tamamlanamadı. Lütfen tekrar deneyin.'

export const subscribeSession = (callback) => {
  assertAppConfigured()

  return onAuthStateChanged(
    auth,
    async (user) => {
      if (!user) {
        callback({
          status: 'guest',
          user: null,
          account: null,
          message: 'Devam etmek için giriş yapın veya hesap oluşturun.',
        })
        return
      }

      try {
        const { account } = await syncAccountRecord(user)
        callback({
          status: 'authenticated',
          user,
          account,
          message:
            account.accountRole === 'admin'
              ? 'Yönetici oturumu aktif.'
              : 'Personel oturumu aktif.',
        })
      } catch (error) {
        const fallbackAccount = buildFallbackAccount(user)
        callback({
          status: 'authenticated',
          user,
          account: fallbackAccount,
          message: `${resolveFirestoreError(error)} Geçici olarak personel modunda açıldı.`,
        })
      }
    },
    (error) => {
      callback({
        status: 'error',
        user: null,
        account: null,
        message: resolveAuthError(error),
      })
    },
  )
}

const roleMismatchMessages = {
  admin:
    'Bu hesap yönetici değil.',
  personnel: 'Bu hesap yönetici. Yönetici girişini kullanın.',
}

export const signInWithCredentials = async ({ email, password, expectedRole }) => {
  assertAppConfigured()

  const credential = await signInWithEmailAndPassword(
    auth,
    normalizeEmail(email),
    password,
  )

  if (!expectedRole) {
    return credential
  }

  let account
  try {
    ;({ account } = await syncAccountRecord(credential.user))
  } catch {
    account = buildFallbackAccount(credential.user)
  }

  if (account.accountRole !== expectedRole) {
    await signOut(auth)
    const error = new Error(roleMismatchMessages[expectedRole])
    error.code = 'auth/role-mismatch'
    throw error
  }

  return credential
}

export const registerAccount = async (payload) => {
  assertAppConfigured()

  let credential = null

  try {
    credential = await createUserWithEmailAndPassword(
      auth,
      normalizeEmail(payload.email),
      payload.password,
    )

    await updateProfile(credential.user, {
      displayName: cleanText(payload.fullName),
    })

    await syncAccountRecord(credential.user, payload)
    return credential
  } catch (error) {
    if (error?.code?.startsWith?.('auth/')) {
      if (credential?.user) {
        await signOut(auth).catch(() => {})
      }
      throw error
    }

    if (credential?.user) {
      return credential
    }

    throw new Error(resolveFirestoreError(error))
  }
}

export const signOutUser = async () => {
  assertAppConfigured()
  return signOut(auth)
}
