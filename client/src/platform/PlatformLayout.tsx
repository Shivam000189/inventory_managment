import { Building2, ChevronRight, LayoutDashboard, LogOut, Menu, ShieldCheck, Users, X } from 'lucide-react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import './platform.css'

const navigation = [
  { label: 'Dashboard', to: '/super-admin/dashboard', icon: LayoutDashboard },
  { label: 'Businesses', to: '/super-admin/businesses', icon: Building2 },
  { label: 'Business Admins', to: '/super-admin/business-admins', icon: Users },
]

function pageName(pathname: string) {
  if (pathname.startsWith('/super-admin/businesses')) return 'Businesses'
  if (pathname.startsWith('/super-admin/business-admins')) return 'Business Admins'
  return 'Dashboard'
}

function initials(name?: string) {
  return (name || 'Super Admin')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function PlatformLayout() {
  const { account, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const signOut = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  const closeMenu = () => setMobileMenuOpen(false)

  return (
    <div className="platform-shell">
      {mobileMenuOpen && (
        <button
          className="platform-sidebar-backdrop"
          type="button"
          onClick={closeMenu}
          aria-label="Close navigation menu"
        />
      )}

      <aside className={`platform-sidebar${mobileMenuOpen ? ' platform-sidebar-open' : ''}`}>
        <div className="platform-sidebar-brand-row">
          <Link className="platform-brand" to="/super-admin/dashboard" onClick={closeMenu}>
            <span className="platform-brand-mark"><ShieldCheck size={19} aria-hidden="true" /></span>
            <span className="platform-brand-copy">
              <strong>Stockroom</strong>
              <small>PLATFORM</small>
            </span>
          </Link>
          <button
            className="platform-mobile-close"
            type="button"
            onClick={closeMenu}
            aria-label="Close sidebar"
          >
            <X size={19} />
          </button>
        </div>

        <div className="platform-sidebar-section-label">Workspace</div>
        <nav className="platform-sidebar-nav" aria-label="Super Admin navigation">
          {navigation.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/super-admin/dashboard'}
              onClick={closeMenu}
              className={({ isActive }) => `platform-sidebar-link${isActive ? ' is-active' : ''}`}
            >
              <Icon size={18} strokeWidth={1.9} aria-hidden="true" />
              <span>{label}</span>
              <ChevronRight className="platform-sidebar-chevron" size={15} aria-hidden="true" />
            </NavLink>
          ))}
        </nav>

        <div className="platform-sidebar-footer">
          <div className="platform-sidebar-profile">
            <span className="platform-avatar" aria-hidden="true">{initials(account?.name)}</span>
            <span className="platform-profile-copy">
              <strong>{account?.name || 'Super Admin'}</strong>
              <small>Platform administrator</small>
            </span>
          </div>
          <button className="platform-sidebar-signout" type="button" onClick={() => void signOut()}>
            <LogOut size={17} aria-hidden="true" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="platform-workspace">
        <header className="platform-header">
          <div className="platform-header-leading">
            <button
              className="platform-menu-toggle"
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu size={20} />
            </button>
            <div className="platform-breadcrumb" aria-label="Current page">
              <span>Platform</span>
              <ChevronRight size={15} aria-hidden="true" />
              <strong>{pageName(location.pathname)}</strong>
            </div>
          </div>
          <div className="platform-header-account">
            <span className="platform-header-avatar" aria-hidden="true">{initials(account?.name)}</span>
            <span className="platform-header-account-copy">
              <strong>{account?.name || 'Super Admin'}</strong>
              <small>Super Admin</small>
            </span>
          </div>
        </header>
        <main className="platform-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
