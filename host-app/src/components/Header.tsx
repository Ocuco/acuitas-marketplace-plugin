import './Header.css'

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
      </div>
    </header>
  )
}

export default Header
