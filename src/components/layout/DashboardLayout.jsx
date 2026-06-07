import { LogOut } from 'lucide-react'
import StatusPill from '../StatusPill'
import { getInitials } from '../../utils/dashboard'

function DashboardLayout({
  theme,
  brandTitle,
  brandSubtitle,
  navItems,
  activeSection,
  onSectionChange,
  account,
  user,
  onSignOut,
  sidebarFooter,
  children,
}) {
  return (
    <div className={`app-shell theme-${theme}`}>
      <aside className="sidebar">
        <div className="brand-card">
          
          <div>
            <span className="eyebrow">{brandSubtitle}</span>
            <h1>{brandTitle}</h1>
            <p>{theme === 'admin' ? 'Operasyon kontrol merkezi' : 'Kişisel çalışan paneli'}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id

            return (
              <button
                key={item.id}
                type="button"
                className={`sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}
                onClick={() => onSectionChange(item.id)}
              >
                <Icon size={18} />
                <span className="sidebar-link__label">{item.label}</span>
                {item.badge > 0 ? (
                  <span className="sidebar-link__badge">{item.badge}</span>
                ) : null}
              </button>
            )
          })}
        </nav>

        <div className="sidebar-user">
          <div className="profile-chip">
            <div className="avatar-badge">{getInitials(account?.fullName)}</div>
            <div>
              <strong>{account?.fullName || user?.email}</strong>
              <span>{account?.jobTitle || account?.email}</span>
            </div>
            <StatusPill value={account?.accountRole || 'personnel'} />
          </div>

          <button className="ghost-button ghost-button--full" type="button" onClick={onSignOut}>
            <LogOut size={16} />
            Oturumu kapat
          </button>
        </div>

        {sidebarFooter}
      </aside>

      <main className="dashboard">{children}</main>
    </div>
  )
}

export default DashboardLayout
