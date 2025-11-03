import './MainContent.css'
import ImagingViewer from './ImagingViewer'

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
          <div className="card-body" style={{minHeight: '400px', padding: 0}}>
            <ImagingViewer />
          </div>
        </div>
      </div>
    </main>
  )
}

export default MainContent
