import './MainContent.css'

function MainContent() {
  return (
    <main className="main-content bg-main p-md">
      <div className="content-header mb-md">
        <nav className="breadcrumb mb-sm">
          <span className="text-secondary">Imaging</span> 
          <span className="text-secondary"> / </span> 
          <span className="text-primary">Medical Images</span>
        </nav>
      </div>
      
      <div className="content-body">
        <div className="card shadow-light">
          <div className="card-header">
            <h5 className="mb-0">Medical Image Viewport</h5>
          </div>
          <div className="card-body" style={{minHeight: '400px'}}>
            <div className="d-flex justify-center align-center" style={{height: '100%', minHeight: '300px'}}>
              <div className="text-center text-secondary">
                <div style={{fontSize: '4rem', marginBottom: '1rem'}}>🖼️</div>
                <h4 className="text-secondary">Medical Image Viewer</h4>
                <p className="text-secondary">Load a study to begin viewing medical images</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default MainContent
