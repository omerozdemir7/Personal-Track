import {
  Activity,
  BarChart3,
  BellRing,
  CalendarClock,
  CheckCircle2,
  Download,
  Gauge,
  LayoutDashboard,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserCog,
  UsersRound,
  XCircle,
} from 'lucide-react'
import { Suspense, lazy, startTransition, useDeferredValue, useMemo, useState } from 'react'
import DashboardLayout from '../components/layout/DashboardLayout'
import NoticeBanner from '../components/shared/NoticeBanner'
import SectionCard from '../components/SectionCard'
import StatCard from '../components/StatCard'
import StatusPill from '../components/StatusPill'
import { departmentOptions, priorityOptions, shiftOptions } from '../data/options'
import {
  buildAttendanceChartData,
  buildDepartmentChartData,
  buildStatusChartData,
  calculateSummary,
  filterEmployees,
  formatDate,
  formatDateTime,
  getInitials,
  getTopPerformers,
} from '../utils/dashboard'

const AnalyticsChart = lazy(() => import('../components/AnalyticsChart'))

const leaveFilters = [
  { id: 'pending', label: 'Bekleyen' },
  { id: 'approved', label: 'Onaylanan' },
  { id: 'rejected', label: 'Reddedilen' },
  { id: 'all', label: 'Tümü' },
]

function AdminDashboard({
  account,
  user,
  employees,
  leaves,
  announcements,
  loading,
  busyAction,
  notice,
  sessionMessage,
  onSignOut,
  onExport,
  runAction,
  saveEmployee,
  markEmployeeCheckIn,
  updateLeaveStatus,
  saveAnnouncement,
  deleteAnnouncement,
}) {
  const [activeSection, setActiveSection] = useState('overview')
  const [search, setSearch] = useState('')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [leaveFilter, setLeaveFilter] = useState('pending')

  const deferredSearch = useDeferredValue(search)

  const summary = useMemo(
    () => calculateSummary(employees, leaves, announcements),
    [employees, leaves, announcements],
  )

  const pendingLeaves = useMemo(
    () => leaves.filter((leave) => leave.status === 'pending'),
    [leaves],
  )

  const filteredLeaves = useMemo(() => {
    if (leaveFilter === 'all') {
      return leaves
    }
    return leaves.filter((leave) => leave.status === leaveFilter)
  }, [leaveFilter, leaves])

  const filteredEmployees = useMemo(
    () => filterEmployees(employees, deferredSearch),
    [employees, deferredSearch],
  )

  const departmentChartData = useMemo(
    () => buildDepartmentChartData(filteredEmployees),
    [filteredEmployees],
  )

  const attendanceChartData = useMemo(
    () => buildAttendanceChartData(filteredEmployees),
    [filteredEmployees],
  )

  const statusChartData = useMemo(
    () => buildStatusChartData(employees),
    [employees],
  )

  const topPerformers = useMemo(() => getTopPerformers(employees), [employees])

  const selectedEmployee =
    employees.find((employee) => employee.id === selectedEmployeeId) || null

  const navItems = [
    { id: 'overview', label: 'Genel Bakış', icon: LayoutDashboard, badge: 0 },
    { id: 'employees', label: 'Personel', icon: UsersRound, badge: 0 },
    {
      id: 'requests',
      label: 'İzin Talepleri',
      icon: CalendarClock,
      badge: pendingLeaves.length,
    },
    { id: 'announcements', label: 'Duyurular', icon: BellRing, badge: 0 },
    { id: 'analytics', label: 'Analitik', icon: BarChart3, badge: 0 },
  ]

  const overviewCards = [
    {
      icon: UsersRound,
      label: 'Toplam Personel',
      value: summary.headcount,
      hint: `${summary.activeHeadcount} aktif · ${summary.remoteHeadcount} uzaktan`,
      tone: 'primary',
    },
    {
      icon: CalendarClock,
      label: 'Bekleyen Talep',
      value: summary.pendingLeaves,
      hint: 'Onayınızı bekleyen izinler',
      tone: 'warning',
    },
    {
      icon: Activity,
      label: 'Devamlılık',
      value: `%${summary.averageAttendance}`,
      hint: 'Ekip ortalaması',
      tone: 'info',
    },
    {
      icon: Gauge,
      label: 'Performans',
      value: `%${summary.averageCompletion}`,
      hint: `${summary.announcements} aktif duyuru`,
      tone: 'accent',
    },
  ]

  const handleEmployeeSubmit = async (event) => {
    event.preventDefault()
    if (!selectedEmployee) return

    const formData = new FormData(event.currentTarget)
    const payload = {
      ...selectedEmployee,
      fullName: `${formData.get('fullName') || ''}`,
      jobTitle: `${formData.get('jobTitle') || ''}`,
      department: `${formData.get('department') || ''}`,
      shift: `${formData.get('shift') || ''}`,
      phone: `${formData.get('phone') || ''}`,
      location: `${formData.get('location') || ''}`,
      status: `${formData.get('status') || ''}`,
      attendanceRate: Number(formData.get('attendanceRate') || 0),
      completionRate: Number(formData.get('completionRate') || 0),
    }

    await runAction('save-employee', 'Personel güncellendi.', () => saveEmployee(payload))
  }

  const handleAnnouncementSubmit = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    await runAction('save-announcement', 'Duyuru yayınlandı.', async () => {
      await saveAnnouncement({
        title: `${formData.get('title') || ''}`,
        message: `${formData.get('message') || ''}`,
        priority: `${formData.get('priority') || ''}`,
      })
      event.currentTarget.reset()
    })
  }

  return (
    <DashboardLayout
      theme="admin"
      brandTitle="Yönetim Paneli"
      brandSubtitle="Admin Kontrol"
      navItems={navItems}
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      account={account}
      user={user}
      onSignOut={onSignOut}
      sidebarFooter={
        <div className="sidebar-panel sidebar-panel--compact">
          <span className="eyebrow">Performans</span>
          <div className="performer-list">
            {topPerformers.map((employee) => (
              <article key={employee.id} className="performer-card">
                <div className="avatar-badge">{getInitials(employee.fullName)}</div>
                <div>
                  <strong>{employee.fullName}</strong>
                  <span>{employee.department}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      }
    >
      <header className="page-header page-header--admin">
        <div>
          <span className="eyebrow">
            <ShieldCheck size={14} /> Yönetici Modu
          </span>
          <h2>
            {activeSection === 'overview' && 'Operasyon özeti ve bekleyen işlemler'}
            {activeSection === 'employees' && 'Personel kadrosu yönetimi'}
            {activeSection === 'requests' && 'İzin talepleri ve onay akışı'}
            {activeSection === 'announcements' && 'Şirket içi duyuru merkezi'}
            {activeSection === 'analytics' && 'Ekip analitiği ve raporlar'}
          </h2>
          <p>{sessionMessage}</p>
        </div>

        <div className="page-header__actions">
          {activeSection === 'employees' ? (
            <label className="search-box">
              <Search size={18} />
              <input
                type="search"
                value={search}
                placeholder="Personel ara..."
                onChange={(event) => {
                  startTransition(() => setSearch(event.target.value))
                }}
              />
            </label>
          ) : null}
          <button className="btn btn--primary" type="button" onClick={onExport}>
            <Download size={18} />
            Rapor indir
          </button>
        </div>
      </header>

      <NoticeBanner notice={notice} />

      {activeSection === 'overview' && (
        <>
          <section className="stats-grid">
            {overviewCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </section>

          {pendingLeaves.length > 0 ? (
            <section className="alert-panel alert-panel--warning">
              <div>
                <strong>{pendingLeaves.length} izin talebi onay bekliyor</strong>
                <p>Hemen inceleyip onaylayın veya reddedin.</p>
              </div>
              <button
                className="btn btn--warning"
                type="button"
                onClick={() => setActiveSection('requests')}
              >
                Talepleri gör
              </button>
            </section>
          ) : null}

          <section className="content-grid">
            <SectionCard
              eyebrow="Acil"
              title="Son bekleyen talepler"
              description="En yeni izin başvuruları"
            >
              <div className="leave-list">
                {pendingLeaves.length ? (
                  pendingLeaves.slice(0, 5).map((leave) => (
                    <article key={leave.id} className="leave-card leave-card--admin">
                      <div className="leave-card__top">
                        <div>
                          <strong>{leave.fullName}</strong>
                          <span>
                            {leave.leaveType} · {formatDate(leave.startDate)} –{' '}
                            {formatDate(leave.endDate)}
                          </span>
                        </div>
                        <StatusPill value={leave.status} />
                      </div>
                      <p>{leave.note || 'Not girilmedi.'}</p>
                      <div className="action-strip">
                        <button
                          className="btn btn--success btn--sm"
                          type="button"
                          onClick={() =>
                            runAction(`approve-${leave.id}`, 'Onaylandı.', () =>
                              updateLeaveStatus(leave, 'approved'),
                            )
                          }
                        >
                          <CheckCircle2 size={16} /> Onayla
                        </button>
                        <button
                          className="btn btn--danger btn--sm"
                          type="button"
                          onClick={() =>
                            runAction(`reject-${leave.id}`, 'Reddedildi.', () =>
                              updateLeaveStatus(leave, 'rejected'),
                            )
                          }
                        >
                          <XCircle size={16} /> Reddet
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">Bekleyen talep yok.</div>
                )}
              </div>
            </SectionCard>

            <SectionCard eyebrow="Kadro" title="Son kayıtlı personel">
              <div className="mini-table">
                {employees.slice(0, 6).map((employee) => (
                  <div key={employee.id} className="mini-table__row">
                    <div className="person-cell">
                      <div className="avatar-badge avatar-badge--soft">
                        {getInitials(employee.fullName)}
                      </div>
                      <div>
                        <strong>{employee.fullName}</strong>
                        <span>{employee.department}</span>
                      </div>
                    </div>
                    <StatusPill value={employee.status} />
                  </div>
                ))}
              </div>
            </SectionCard>
          </section>
        </>
      )}

      {activeSection === 'employees' && (
        <section className="content-grid">
          <div className="content-main">
            <SectionCard
              eyebrow="Kadro"
              title="Tüm personel"
              actions={
                <span className="section-meta">
                  {filteredEmployees.length} / {employees.length}
                </span>
              }
            >
              <div className="table-shell">
                <div className="table-row table-row--header">
                  <span>Personel</span>
                  <span>Departman</span>
                  <span>Rol</span>
                  <span>Devamlılık</span>
                  <span>Son giriş</span>
                  <span>İşlem</span>
                </div>

                {loading ? (
                  <div className="loading-state">Yükleniyor...</div>
                ) : filteredEmployees.length ? (
                  filteredEmployees.map((employee) => (
                    <article key={employee.id} className="table-row table-row--body">
                      <div className="person-cell">
                        <div className="avatar-badge avatar-badge--soft">
                          {getInitials(employee.fullName)}
                        </div>
                        <div>
                          <strong>{employee.fullName}</strong>
                          <span>{employee.jobTitle}</span>
                        </div>
                      </div>
                      <span>{employee.department}</span>
                      <StatusPill value={employee.accountRole} />
                      <div className="progress-cell">
                        <strong>%{employee.attendanceRate}</strong>
                        <div className="progress-track">
                          <span style={{ width: `${employee.attendanceRate}%` }} />
                        </div>
                      </div>
                      <span>{formatDateTime(employee.lastCheckIn)}</span>
                      <div className="action-strip">
                        <button
                          className="btn btn--ghost btn--sm"
                          type="button"
                          onClick={() => setSelectedEmployeeId(employee.id)}
                        >
                          Düzenle
                        </button>
                        <button
                          className="btn btn--ghost btn--sm"
                          type="button"
                          onClick={() =>
                            runAction(`checkin-${employee.id}`, 'Yoklama kaydedildi.', () =>
                              markEmployeeCheckIn(employee),
                            )
                          }
                        >
                          Yoklama
                        </button>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="empty-state">Kayıt bulunamadı.</div>
                )}
              </div>
            </SectionCard>
          </div>

          <div className="content-side">
            <SectionCard title="Personel düzenle" description="Tablodan bir personel seçin">
              {selectedEmployee ? (
                <form
                  key={selectedEmployee.id}
                  className="composer-form"
                  onSubmit={handleEmployeeSubmit}
                >
                  <label>
                    Ad Soyad
                    <input name="fullName" required defaultValue={selectedEmployee.fullName} />
                  </label>
                  <label>
                    Görev
                    <input name="jobTitle" required defaultValue={selectedEmployee.jobTitle} />
                  </label>
                  <div className="form-grid">
                    <label>
                      Departman
                      <select name="department" defaultValue={selectedEmployee.department}>
                        {departmentOptions.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Vardiya
                      <select name="shift" defaultValue={selectedEmployee.shift}>
                        {shiftOptions.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <div className="form-grid">
                    <label>
                      Telefon
                      <input name="phone" defaultValue={selectedEmployee.phone} />
                    </label>
                    <label>
                      Lokasyon
                      <input name="location" defaultValue={selectedEmployee.location} />
                    </label>
                  </div>
                  <div className="form-grid">
                    <label>
                      Durum
                      <select name="status" defaultValue={selectedEmployee.status}>
                        <option value="active">Sahada</option>
                        <option value="remote">Uzaktan</option>
                        <option value="leave">İzinde</option>
                      </select>
                    </label>
                    <label>
                      Rol (Firestore)
                      <input
                        value={
                          selectedEmployee.accountRole === 'admin' ? 'Yönetici' : 'Personel'
                        }
                        disabled
                        readOnly
                      />
                    </label>
                  </div>
                  <div className="form-grid">
                    <label>
                      Devamlılık %
                      <input
                        name="attendanceRate"
                        type="number"
                        min="0"
                        max="100"
                        defaultValue={selectedEmployee.attendanceRate}
                      />
                    </label>
                    <label>
                      Performans %
                      <input
                        name="completionRate"
                        type="number"
                        min="0"
                        max="100"
                        defaultValue={selectedEmployee.completionRate}
                      />
                    </label>
                  </div>
                  <div className="form-actions">
                    <button className="btn btn--primary" type="submit">
                      <UserCog size={18} />
                      {busyAction === 'save-employee' ? 'Kaydediliyor...' : 'Kaydet'}
                    </button>
                    <button
                      className="btn btn--ghost"
                      type="button"
                      onClick={() => setSelectedEmployeeId('')}
                    >
                      İptal
                    </button>
                  </div>
                </form>
              ) : (
                <div className="empty-state">
                  <UserCog size={20} />
                  <p>Düzenlemek için personel seçin.</p>
                </div>
              )}
            </SectionCard>
          </div>
        </section>
      )}

      {activeSection === 'requests' && (
        <SectionCard
          eyebrow="Onay Merkezi"
          title="İzin talepleri"
          description="Gelen tüm personel izin başvurularını yönetin"
          actions={
            <div className="filter-tabs">
              {leaveFilters.map((filter) => (
                <button
                  key={filter.id}
                  type="button"
                  className={`filter-tab ${leaveFilter === filter.id ? 'filter-tab--active' : ''}`}
                  onClick={() => setLeaveFilter(filter.id)}
                >
                  {filter.label}
                  {filter.id === 'pending' && pendingLeaves.length > 0
                    ? ` (${pendingLeaves.length})`
                    : ''}
                </button>
              ))}
            </div>
          }
        >
          <div className="leave-list">
            {loading ? (
              <div className="loading-state">Yükleniyor...</div>
            ) : filteredLeaves.length ? (
              filteredLeaves.map((leave) => (
                <article key={leave.id} className="leave-card leave-card--admin">
                  <div className="leave-card__top">
                    <div>
                      <strong>{leave.fullName}</strong>
                      <span>
                        {leave.leaveType} · {formatDate(leave.startDate)} –{' '}
                        {formatDate(leave.endDate)}
                      </span>
                    </div>
                    <StatusPill value={leave.status} />
                  </div>
                  <p>{leave.note || 'Not girilmedi.'}</p>
                  {leave.reviewedBy ? (
                    <span className="section-meta">İşleyen: {leave.reviewedBy}</span>
                  ) : null}
                  {leave.status === 'pending' ? (
                    <div className="action-strip">
                      <button
                        className="btn btn--success btn--sm"
                        type="button"
                        onClick={() =>
                          runAction(`approve-${leave.id}`, 'Onaylandı.', () =>
                            updateLeaveStatus(leave, 'approved'),
                          )
                        }
                      >
                        <CheckCircle2 size={16} /> Onayla
                      </button>
                      <button
                        className="btn btn--danger btn--sm"
                        type="button"
                        onClick={() =>
                          runAction(`reject-${leave.id}`, 'Reddedildi.', () =>
                            updateLeaveStatus(leave, 'rejected'),
                          )
                        }
                      >
                        <XCircle size={16} /> Reddet
                      </button>
                    </div>
                  ) : null}
                </article>
              ))
            ) : (
              <div className="empty-state">Bu filtrede talep bulunamadı.</div>
            )}
          </div>
        </SectionCard>
      )}

      {activeSection === 'announcements' && (
        <section className="content-grid">
          <SectionCard title="Yeni duyuru yayınla">
            <form className="composer-form" onSubmit={handleAnnouncementSubmit}>
              <label>
                Başlık
                <input name="title" required placeholder="Duyuru başlığı" />
              </label>
              <label>
                Mesaj
                <textarea name="message" rows="5" required placeholder="Duyuru metni..." />
              </label>
              <label>
                Öncelik
                <select name="priority" defaultValue={priorityOptions[1]}>
                  <option value="high">Kritik</option>
                  <option value="medium">Standart</option>
                  <option value="low">Bilgilendirme</option>
                </select>
              </label>
              <button className="btn btn--primary" type="submit">
                <Plus size={18} />
                {busyAction === 'save-announcement' ? 'Yayınlanıyor...' : 'Yayınla'}
              </button>
            </form>
          </SectionCard>

          <SectionCard title="Yayınlanan duyurular">
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
                    <button
                      className="btn btn--danger btn--sm"
                      type="button"
                      onClick={() =>
                        runAction(`del-${announcement.id}`, 'Silindi.', () =>
                          deleteAnnouncement(announcement.id),
                        )
                      }
                    >
                      <Trash2 size={14} /> Sil
                    </button>
                  </article>
                ))
              ) : (
                <div className="empty-state">Henüz duyuru yok.</div>
              )}
            </div>
          </SectionCard>
        </section>
      )}

      {activeSection === 'analytics' && (
        <section className="chart-grid chart-grid--wide">
          <SectionCard title="Departman dağılımı">
            <Suspense fallback={<div className="loading-state">Grafik yükleniyor...</div>}>
              <AnalyticsChart kind="department" data={departmentChartData} />
            </Suspense>
          </SectionCard>
          <SectionCard title="Devamlılık bantları">
            <Suspense fallback={<div className="loading-state">Grafik yükleniyor...</div>}>
              <AnalyticsChart kind="attendance" data={attendanceChartData} />
            </Suspense>
          </SectionCard>
          <SectionCard title="Çalışma durumu">
            <Suspense fallback={<div className="loading-state">Grafik yükleniyor...</div>}>
              <AnalyticsChart kind="status" data={statusChartData} />
            </Suspense>
          </SectionCard>
        </section>
      )}
    </DashboardLayout>
  )
}

export default AdminDashboard
