import './App.css'
import { Provider } from 'react-redux'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { store } from './store/store'
import Header from './components/Header.tsx'
import MainContent from './components/MainContent.tsx'
import RightPanel from './components/RightPanel.tsx'
import PatientDashboard from './components/PatientDashboard.tsx'
import HomeDashboard from './components/HomeDashboard.tsx'
import PartnerModulePage from './components/PartnerModulePage.tsx'
import { SCREEN_ROUTES, DEFAULT_ROUTE, PARTNER_MODULE_ROUTE } from './config/routes'

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <div className="app">
          <Header />
          <div className="app-body">
            <Routes>
              <Route path={SCREEN_ROUTES.HOME} element={<HomeDashboard />} />
              <Route path={PARTNER_MODULE_ROUTE} element={<PartnerModulePage />} />
              <Route
                path={SCREEN_ROUTES.MEDICAL_IMAGES}
                element={<><MainContent /><RightPanel /></>}
              />
              <Route path={SCREEN_ROUTES.PATIENT} element={<PatientDashboard />} />
              <Route path="*" element={<Navigate to={DEFAULT_ROUTE} replace />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </Provider>
  )
}

export default App
