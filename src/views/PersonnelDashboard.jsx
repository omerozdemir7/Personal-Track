import {
  Activity,
  BellRing,
  CalendarClock,
  Clock3,
  FileClock,
  Home,
  Plus,
  Trash2,
  User,
  UserCheck,
  UserCog,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import NoticeBanner from '../components/shared/NoticeBanner'
import SectionCard from '../components/SectionCard'
import StatCard from '../components/StatCard'
import StatusPill from '../components/StatusPill'
import { leaveTypeOptions } from '../data/options'
import { formatDate, formatDateTime, getInitials } from '../utils/dashboard'

function PersonnelDashboard({
  account,
  user,
  currentEmployee,
  leaves,
  announcements,
  loading,
  busyAction,
  notice,
  sessionMessage,
  today,
  tomorrow,
  onSignOut,
  runAction,
  saveOwnProfile,
  markEmployeeCheckIn,
  saveLeaveRequest,
  deleteLeaveRequest,
}) {
  const [activeSection, setActiveSection] = useState('home')

  const pendingLeaves = useMemo(
    () => leaves.filter((leave) => leave.status === 'pending').length,
    [leaves],
  )

  const approvedLeaves = useMemo(
    () => leaves.filter((leave) => leave.status === 'approved').length,
    [leaves],
  )

  const navItems = [
    { id: 'home', label: 'Ana Sayfa', icon: Home, badge: 0 },
    { id: 'profile', label: 'Profilim', icon: User, badge: 0 },
    {
      id: 'leaves',
      label: 'İzinlerim',
      icon: CalendarClock,
      badge: pendingLeaves,
    },
    { id: 'announcements', label: 'Duyurular', icon: BellRing, badge: announcements.length },
  ]

  const homeCards = [
    {
      icon: UserCheck,
      label: 'Bugünkü Durum',
      value: currentEmployee?.status === 'remote' ? 'Uzaktan' : 'Aktif',
      hint: currentEmployee?.shift || '-',
      tone: 'success',
    },
    {
      icon: FileClock,
      label: 'İzin Taleplerim',
      value: leaves.length,
      hint: `${pendingLeaves} beklemede · ${approvedLeaves} onaylı`,
      tone: 'warning',
    },
    {
      icon: Activity,
      label: 'Devamlılık',
      value: `%${currentEmployee?.attendanceRate || 0}`,
      hint: currentEmployee?.lastCheckIn
        ? `Son: ${formatDateTime(currentEmployee.lastCheckIn)}`
        : 'Henüz giriş yok',
      tone: 'info',
    },
    {
      icon: BellRing,
      label: 'Duyurular',
      value: announcements.length,
      hint: 'Yönetimden bildirimler',
      tone: 'accent',
    },
  ]

  const handleProfileSubmit = async (event) => {
    event.preventDefault()
    if (!currentEmployee) return

    const formData = new FormData(event.currentTarget)
    await runAction('save-profile', 'Profil güncellendi.', () =>
      saveOwnProfile({
        fullName: `${formData.get('fullName') || ''}`,
        phone: `${formData.get('phone') || ''}`,
        location: `${formData.get('location') || ''}`,
      }),
    )
  }

  const handleLeaveSubmit = async (event) => {
    event.preventDefault()
    if (!currentEmployee) return

    const formData = new FormData(event.currentTarget)
    await runAction('save-leave', 'İzin talebi gönderildi.', async () => {
      await saveLeaveRequest({
        employeeId: currentEmployee.id,
        fullName: currentEmployee.fullName,
        leaveType: `${formData.get('leaveType') || ''}`,
        startDate: `${formData.get('startDate') || ''}`,
        endDate: `${formData.get('endDate') || ''}`,
        note: `${formData.get('note') || ''}`,
      })
      event.currentTarget.reset()
    })
  }

  return (
    <DashboardLayout
      theme="personnel"
      brandTitle="Personel Portalı"
      brandSubtitle="Çalışan Alanı"
      navItems={navItems}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      account={account}
      user={user}
      onSignOut={onSignOut}
      sidebarFooter={
        <div className="sidebar-panel sidebar-panel--compact">
          <span className="eyebrow">Bugün</span>
          <div className="mini-list">
            <article className="mini-list__item">
              <Clock3 size={16} />
              <div>
                <strong>{currentEmployee?.shift || '-'}</strong>
                <span>Vardiya</span>
              </div>
            </article>
            <article className="mini-list__item">
              <FileClock size={16} />
              <div>
                <strong>{pendingLeaves}</strong>
                <span>Bekleyen izin</span>
              </div>
            </article>
          </div>
        </div>
      }
    >
      <header className="page-header page-header--personnel">
        <div>
          <span className="eyebrow">Hoş geldin, {currentEmployee?.fullName?.split(' ')[0]}</span>
          <h2>
            {activeSection === 'home' && 'Günlük özetin ve hızlı işlemler'}
            {activeSection === 'profile' && 'Kişisel bilgilerin'}
            {activeSection === 'leaves' && 'İzin talepleri ve geçmişin'}
            {activeSection === 'announcements' && 'Yönetim duyuruları'}
          </h2>
          <p>{sessionMessage}</p>
        </div>

        {activeSection === 'home' ? (
          <button
            className="btn btn--personnel"
            type="button"
            onClick={() =>
              runAction('checkin', 'Girişiniz kaydedildi!', () =>
                markEmployeeCheckIn(currentEmployee),
              )
            }
          >
            <UserCheck size={18} />
            {busyAction === 'checkin' ? 'Kaydediliyor...' : 'Bugün giriş yap'}
          </button>
        ) : null}
      </header>

      <NoticeBanner notice={notice} />

      {activeSection === 'home' && (
        <>
          <section className="welcome-banner welcome-banner--personnel">
            <div>
              <h3>{currentEmployee?.fullName}</h3>
              <p>
                {currentEmployee?.jobTitle} · {currentEmployee?.department}
              </p>
            </div>
            <StatusPill value={currentEmployee?.status || 'active'} />
          </section>

          <section className="stats-grid">
            {homeCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </section>

          <section className="content-grid content-grid--personnel">
            <SectionCard title="Hızlı izin talebi" description="Kısa form ile talep oluşturun">
              <form className="composer-form" onSubmit={handleLeaveSubmit}>
                <label>
                  İzin tipi
                  <select name="leaveType" defaultValue={leaveTypeOptions[0]}>
                    {leaveTypeOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="form-grid">
                  <label>
                    Başlangıç
                    <input name="startDate" type="date" defaultValue={today} />
                  </label>
                  <label>
                    Bitiş
                    <input name="endDate" type="date" defaultValue={tomorrow} />
                  </label>
                </div>
                <label>
                  Not
                  <textarea name="note" rows="3" placeholder="İsteğe bağlı açıklama" />
                </label>
                <button className="btn btn--personnel" type="submit">
                  <Plus size={18} />
                  {busyAction === 'save-leave' ? 'Gönderiliyor...' : 'Talep gönder'}
                </button>
              </form>
            </SectionCard>

            <SectionCard title="Son duyurular">
              <div className="announcement-list">
                {announcements.slice(0, 3).map((announcement) => (
                  <article key={announcement.id} className="announcement-card">
                    <div className="announcement-card__top">
                      <div>
                        <strong>{announcement.title}</strong>
                        <span>{formatDateTime(announcement.createdAt)}</span>
                      </div>
                      <StatusPill value={announcement.priority} />
                    </div>
                    <p>{announcement.message}</p>
                  </article>
                ))}
                {!announcements.length ? (
                  <div className="empty-state">Henüz duyuru yok.</div>
                ) : null}
              </div>
            </SectionCard>
          </section>
        </>
      )}

      {activeSection === 'profile' && (
        <section className="content-grid content-grid--single">
          {loading ? (
            <div className="loading-state">Yükleniyor...</div>
          ) : (
            <>
              <article className="profile-hero profile-hero--personnel">
                <div className="avatar-badge avatar-badge--large">
                  {getInitials(currentEmployee?.fullName)}
                </div>
                <div>
                  <h3>{currentEmployee?.fullName}</h3>
                  <p>
                    {currentEmployee?.jobTitle} · {currentEmployee?.department}
                  </p>
                  <StatusPill value={currentEmployee?.status || 'active'} />
                </div>
              </article>

              <div className="key-value-list key-value-list--profile">
                <div>
                  <span>E-posta</span>
                  <strong>{currentEmployee?.email}</strong>
                </div>
                <div>
                  <span>Vardiya</span>
                  <strong>{currentEmployee?.shift}</strong>
                </div>
                <div>
                  <span>Başlangıç</span>
                  <strong>{formatDate(currentEmployee?.startDate)}</strong>
                </div>
                <div>
                  <span>Son giriş</span>
                  <strong>{formatDateTime(currentEmployee?.lastCheckIn)}</strong>
                </div>
                <div>
                  <span>Devamlılık</span>
                  <strong>%{currentEmployee?.attendanceRate || 0}</strong>
                </div>
                <div>
                  <span>Lokasyon</span>
                  <strong>{currentEmployee?.location || '-'}</strong>
                </div>
              </div>

              <SectionCard title="Bilgileri güncelle">
                <form
                  key={currentEmployee?.id}
                  className="composer-form"
                  onSubmit={handleProfileSubmit}
                >
                  <label>
                    Ad Soyad
                    <input name="fullName" defaultValue={currentEmployee?.fullName} required />
                  </label>
                  <div className="form-grid">
                    <label>
                      Telefon
                      <input name="phone" defaultValue={currentEmployee?.phone} />
                    </label>
                    <label>
                      Lokasyon
                      <input name="location" defaultValue={currentEmployee?.location} />
                    </label>
                  </div>
                  <button className="btn btn--personnel" type="submit">
                    <UserCog size={18} />
                    {busyAction === 'save-profile' ? 'Kaydediliyor...' : 'Profili kaydet'}
                  </button>
                </form>
              </SectionCard>
            </>
          )}
        </section>
      )}

      {activeSection === 'leaves' && (
        <section className="content-grid">
          <SectionCard title="Yeni izin talebi">
            <form className="composer-form" onSubmit={handleLeaveSubmit}>
              <label>
                İzin tipi
                <select name="leaveType" defaultValue={leaveTypeOptions[0]}>
                  {leaveTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <div className="form-grid">
                <label>
                  Başlangıç
                  <input name="startDate" type="date" defaultValue={today} />
                </label>
                <label>
                  Bitiş
                  <input name="endDate" type="date" defaultValue={tomorrow} />
                </label>
              </div>
              <label>
                Açıklama
                <textarea name="note" rows="4" placeholder="İzin sebebinizi yazın" />
              </label>
              <button className="btn btn--personnel" type="submit">
                <Plus size={18} />
                {busyAction === 'save-leave' ? 'Gönderiliyor...' : 'Talebi gönder'}
              </button>
            </form>
          </SectionCard>

          <SectionCard title="İzin geçmişim">
            <div className="leave-list">
              {loading ? (
                <div className="loading-state">Yükleniyor...</div>
              ) : leaves.length ? (
                leaves.map((leave) => (
                  <article key={leave.id} className="leave-card leave-card--personnel">
                    <div className="leave-card__top">
                      <div>
                        <strong>{leave.leaveType}</strong>
                        <span>
                          {formatDate(leave.startDate)} – {formatDate(leave.endDate)}
                        </span>
                      </div>
                      <StatusPill value={leave.status} />
                    </div>
                    <p>{leave.note || 'Açıklama yok.'}</p>
                    <div className="action-strip">
                      {leave.reviewedBy ? (
                        <span className="section-meta">İşleyen: {leave.reviewedBy}</span>
                      ) : null}
                      {leave.status === 'pending' ? (
                        <button
                          className="btn btn--danger btn--sm"
                          type="button"
                          onClick={() =>
                            runAction(`del-${leave.id}`, 'Talep silindi.', () =>
                              deleteLeaveRequest(leave),
                            )
                          }
                        >
                          <Trash2 size={14} /> İptal et
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))
              ) : (
                <div className="empty-state">Henüz izin talebiniz yok.</div>
              )}
            </div>
          </SectionCard>
        </section>
      )}

      {activeSection === 'announcements' && (
        <SectionCard title="Tüm duyurular" description="Yönetimden gelen bildirimler">
          <div className="announcement-list">
            {announcements.length ? (
              announcements.map((announcement) => (
                <article key={announcement.id} className="announcement-card">
                  <div className="announcement-card__top">
                    <div>
                      <strong>{announcement.title}</strong>
                      <span>
                        {formatDateTime(announcement.createdAt)} · {announcement.authorName}
                      </span>
                    </div>
                    <StatusPill value={announcement.priority} />
                  </div>
                  <p>{announcement.message}</p>
                </article>
              ))
            ) : (
              <div className="empty-state">Henüz duyuru yayınlanmadı.</div>
            )}
          </div>
        </SectionCard>
      )}
    </DashboardLayout>
  )
}

export default PersonnelDashboard
