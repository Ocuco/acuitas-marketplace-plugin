import './Header.css'
import { NavLink } from 'react-router-dom'
import { SCREEN_ROUTES } from '../config/routes'

const navItems: { to: string; label: string }[] = [
  { to: SCREEN_ROUTES.HOME, label: 'Home' },
  { to: SCREEN_ROUTES.MEDICAL_IMAGES, label: 'Medical Images' },
  { to: SCREEN_ROUTES.PATIENT, label: 'Patient Dashboard' },
]

function Header() {
  return (
    <header className="app-bar">
      <div className="d-flex align-center">
        <div className="d-flex align-center gap-2">
          <span className="logo-icon">
            <img src="/logo.png" alt="Medical Logo" style={{height: '1.5rem', width: 'auto'}} />
          </span>
          <span className="logo-text" style={{fontSize: 'var(--font-size-header)', fontWeight: 'var(--font-weight-header)'}}>
            Medical Imaging Shell
          </span>
        </div>
        <nav className="app-nav d-flex align-center gap-2">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}

export default Header
