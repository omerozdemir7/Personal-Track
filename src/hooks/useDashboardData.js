import { useEffect, useEffectEvent, useMemo, useState } from 'react'
import {
  registerAccount,
  signInWithCredentials,
  signOutUser,
  subscribeSession,
} from '../services/authService'
import { configurationIssues, hasAppConfig } from '../services/firebase'
import {
  deleteAnnouncement,
  deleteLeaveRequest,
  markEmployeeCheckIn,
  saveAnnouncement,
  saveEmployee,
  saveLeaveRequest,
  saveOwnProfile,
  subscribeAnnouncements,
  subscribeEmployees,
  subscribeLeaves,
  updateLeaveStatus,
} from '../services/personnelService'

const initialReadyState = {
  employees: false,
  leaves: false,
  announcements: false,
}

const settledReadyState = {
  employees: true,
  leaves: true,
  announcements: true,
}

const initialSessionState = hasAppConfig
  ? {
      status: 'loading',
      user: null,
      account: null,
      message: 'Oturum doğrulanıyor...',
    }
  : {
      status: 'guest',
      user: null,
      account: null,
      message: 'Devam etmek için giriş yapın.',
    }

export const useDashboardData = () => {
  const [sessionState, setSessionState] = useState(initialSessionState)
  const [employees, setEmployees] = useState([])
  const [leaves, setLeaves] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [readyState, setReadyState] = useState(
    hasAppConfig ? initialReadyState : settledReadyState,
  )

  const markReady = useEffectEvent((key) => {
    setReadyState((current) =>
      current[key] ? current : { ...current, [key]: true },
    )
  })

  const sessionUser = sessionState.user
  const sessionAccount = sessionState.account

  useEffect(() => {
    if (!hasAppConfig) {
      return undefined
    }

    return subscribeSession((nextSession) => {
      setSessionState(nextSession)
      setEmployees([])
      setLeaves([])
      setAnnouncements([])
      setReadyState(
        nextSession.status === 'authenticated' ? initialReadyState : settledReadyState,
      )
    })
  }, [])

  useEffect(() => {
    if (sessionState.status !== 'authenticated' || !sessionUser || !sessionAccount) {
      return undefined
    }

    const session = {
      user: sessionUser,
      account: sessionAccount,
    }

    const unsubscribers = [
      subscribeEmployees(session, (data) => {
        setEmployees(data)
        markReady('employees')
      }),
      subscribeLeaves(session, (data) => {
        setLeaves(data)
        markReady('leaves')
      }),
      subscribeAnnouncements(session, (data) => {
        setAnnouncements(data)
        markReady('announcements')
      }),
    ]

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe?.())
    }
  }, [sessionState.status, sessionUser, sessionAccount])

  const loading = useMemo(
    () =>
      sessionState.status === 'loading' ||
      (sessionState.status === 'authenticated' &&
        Object.values(readyState).some((value) => !value)),
    [readyState, sessionState.status],
  )

  const currentEmployee = useMemo(() => {
    if (sessionState.status !== 'authenticated') {
      return null
    }

    return (
      employees.find((employee) => employee.id === sessionState.user.uid) || {
        id: sessionState.user.uid,
        userId: sessionState.user.uid,
        email: sessionState.account.email,
        fullName: sessionState.account.fullName,
        department: sessionState.account.department,
        jobTitle: sessionState.account.jobTitle,
        accountRole: sessionState.account.accountRole,
        status: sessionState.account.status,
        shift: sessionState.account.shift,
        phone: sessionState.account.phone,
        location: sessionState.account.location,
        attendanceRate: 0,
        completionRate: 0,
        lastCheckIn: null,
        startDate: sessionState.account.startDate,
      }
    )
  }, [employees, sessionState])

  const callService = (serviceMethod, ...args) => {
    if (sessionState.status !== 'authenticated') {
      throw new Error('Devam etmek için giriş yapmalısınız.')
    }

    return serviceMethod(
      {
        user: sessionState.user,
        account: sessionState.account,
      },
      ...args,
    )
  }

  return {
    configurationIssues,
    requiresSetup: !hasAppConfig,
    sessionStatus: sessionState.status,
    sessionMessage: sessionState.message,
    user: sessionState.user,
    account: sessionState.account,
    isAdmin: sessionState.account?.accountRole === 'admin',
    currentEmployee,
    employees,
    leaves,
    announcements,
    loading,
    signIn: signInWithCredentials,
    signUp: registerAccount,
    signOut: signOutUser,
    saveEmployee: (payload) => callService(saveEmployee, payload),
    saveOwnProfile: (payload) => callService(saveOwnProfile, payload),
    markEmployeeCheckIn: (employee) => callService(markEmployeeCheckIn, employee),
    saveLeaveRequest: (payload) => callService(saveLeaveRequest, payload),
    updateLeaveStatus: (leave, status) =>
      callService(updateLeaveStatus, leave, status),
    deleteLeaveRequest: (leave) => callService(deleteLeaveRequest, leave),
    saveAnnouncement: (payload) => callService(saveAnnouncement, payload),
    deleteAnnouncement: (announcementId) =>
      callService(deleteAnnouncement, announcementId),
  }
}
