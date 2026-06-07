import { useState } from 'react'
import LoadingPage from './components/LoadingPage'
import LoginPage from './components/LoginPage'
import { useActionRunner } from './hooks/useActionRunner'
import { useDashboardData } from './hooks/useDashboardData'
import AdminDashboard from './views/AdminDashboard'
import PersonnelDashboard from './views/PersonnelDashboard'

function App() {
  const {
    configurationIssues,
    requiresSetup,
    sessionStatus,
    sessionMessage,
    user,
    account,
    isAdmin,
    currentEmployee,
    employees,
    leaves,
    announcements,
    loading,
    signIn,
    signUp,
    signOut,
    saveEmployee,
    saveOwnProfile,
    markEmployeeCheckIn,
    saveLeaveRequest,
    updateLeaveStatus,
    deleteLeaveRequest,
    saveAnnouncement,
    deleteAnnouncement,
  } = useDashboardData()

  const { busyAction, notice, runAction } = useActionRunner()

  const [today] = useState(() => new Date().toISOString().slice(0, 10))
  const [tomorrow] = useState(() => {
    const nextDate = new Date()
    nextDate.setDate(nextDate.getDate() + 1)
    return nextDate.toISOString().slice(0, 10)
  })

  const handleSignIn = async (payload) =>
    runAction('sign-in', 'Giriş başarılı.', () => signIn(payload), { skipNotice: true })

  const handleSignUp = async (payload) =>
    runAction('sign-up', 'Hesap oluşturuldu.', () => signUp(payload), { skipNotice: true })

  const handleSignOut = async () => {
    await runAction('sign-out', 'Oturum kapatıldı.', () => signOut(), { skipNotice: true })
  }

  const handleExport = () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      accountRole: account?.accountRole,
      employees,
      leaves,
      announcements,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const blobUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = blobUrl
    anchor.download = `personel-takip-rapor-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    URL.revokeObjectURL(blobUrl)
  }

  if (sessionStatus === 'loading' && !requiresSetup) {
    return <LoadingPage />
  }

  if (sessionStatus === 'guest' || sessionStatus === 'error' || requiresSetup) {
    return (
      <LoginPage
        configurationIssues={configurationIssues}
        requiresSetup={requiresSetup}
        sessionMessage={sessionMessage}
        sessionStatus={sessionStatus}
        busyAction={busyAction}
        notice={notice}
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
      />
    )
  }

  const sharedProps = {
    account,
    user,
    leaves,
    announcements,
    loading,
    busyAction,
    notice,
    sessionMessage,
    onSignOut: handleSignOut,
    runAction,
  }

  if (isAdmin) {
    return (
      <AdminDashboard
        {...sharedProps}
        employees={employees}
        onExport={handleExport}
        saveEmployee={saveEmployee}
        markEmployeeCheckIn={markEmployeeCheckIn}
        updateLeaveStatus={updateLeaveStatus}
        saveAnnouncement={saveAnnouncement}
        deleteAnnouncement={deleteAnnouncement}
      />
    )
  }

  return (
    <PersonnelDashboard
      {...sharedProps}
      currentEmployee={currentEmployee}
      today={today}
      tomorrow={tomorrow}
      saveOwnProfile={saveOwnProfile}
      markEmployeeCheckIn={markEmployeeCheckIn}
      saveLeaveRequest={saveLeaveRequest}
      deleteLeaveRequest={deleteLeaveRequest}
    />
  )
}

export default App
