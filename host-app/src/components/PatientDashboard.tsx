import { useState } from 'react'
import './PatientDashboard.css'
import PatientPluginHost from './PatientPluginHost'
import { getPlacementsForScreen } from '../config/plugin-placements'

// Mock patient identity for the stripped-down dashboard (matches the A3 sample patient)
const MOCK_PATIENT = {
  patientId: '61000001-1',
  name: 'Ocuco Patient',
  gender: 'F',
  dob: '09/05/1994',
  age: 31,
}

// Patient identifier passed to the plugin — kept in sync with the imaging widget's
// patientId in RightPanel.tsx so both plugins resolve the same patient.
const PLUGIN_PATIENT_ID = '3e87af32-a498-4174-9f59-9fa6865d4597'

function PatientDashboard() {
  const placements = getPlacementsForScreen('PATIENT')
  const mainPlacement = placements.find(placement => placement.section === 'MAIN')
  const sidePlacement = placements.find(placement => placement.section === 'SIDE_PANEL')

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    appointments: false,
    plugin: false,
  })

  const toggleSection = (sectionKey: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }))
  }

  return (
    <>
      <main className="main-content bg-main p-md">
        <div className="content-header">
          <nav className="breadcrumb">
            <span className="text-secondary">Patient</span>
            <span className="text-secondary"> / </span>
            <span className="text-primary">Patient Dashboard</span>
          </nav>
        </div>

        <div className="patient-body">
          {/* Patient identity strip */}
          <div className="card">
            <div className="card-body p-sm">
              <div className="patient-header-strip">
                <div className="patient-avatar">👤</div>
                <div>
                  <div className="text-primary" style={{fontWeight: 600}}>
                    {MOCK_PATIENT.name} ({MOCK_PATIENT.gender})
                  </div>
                  <div className="text-secondary text-small">
                    {MOCK_PATIENT.dob} ({MOCK_PATIENT.age}) &nbsp;·&nbsp; ID: {MOCK_PATIENT.patientId}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard panels (4 columns, mimicking A3) */}
          <div className="patient-grid">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">Patient Snapshot</h6>
              </div>
              <div className="card-body p-sm">
                <div className="mb-xs">
                  <span className="text-secondary text-small">Glasses wearer:</span>
                  <div className="text-primary">No</div>
                </div>
                <div className="mb-xs">
                  <span className="text-secondary text-small">Contact lens wearer:</span>
                  <div className="text-primary">No</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">Contact</h6>
              </div>
              <div className="card-body p-sm">
                <div className="mb-xs">
                  <span className="text-secondary text-small">Email:</span>
                  <div className="text-primary">ocucopatient@Ocuco.com</div>
                </div>
                <div className="mb-xs">
                  <span className="text-secondary text-small">Mobile:</span>
                  <div className="text-primary">087345764568</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">Warnings</h6>
              </div>
              <div className="card-body p-sm">
                <div className="text-secondary text-small">There are no warnings</div>
              </div>
            </div>

            {/* Main-section plugin placement (host supplies the panel title bar) */}
            {mainPlacement && (
              <div className="card">
                <div className="card-header">
                  <h6 className="mb-0">{mainPlacement.pluginName}</h6>
                </div>
                <div className="card-body p-sm">
                  <PatientPluginHost placement={mainPlacement} patientId={PLUGIN_PATIENT_ID} />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <aside className="right-panel bg-secondary p-sm">
        <div className="card mb-sm">
          <div className="card-header segment-header" style={{cursor: 'pointer'}} onClick={() => toggleSection('appointments')}>
            <div className="d-flex justify-between align-center">
              <h6 className="mb-0">Today's Appointments</h6>
              <span className={`collapse-icon ${collapsedSections.appointments ? 'collapsed' : ''}`} />
            </div>
          </div>
          {!collapsedSections.appointments && (
            <div className="card-body p-sm">
              <div className="text-secondary text-small">There are no appointments</div>
            </div>
          )}
        </div>

        {/* Side-panel plugin placement (host supplies the panel title bar) */}
        {sidePlacement && (
          <div className="card mb-sm">
            <div className="card-header segment-header" style={{cursor: 'pointer'}} onClick={() => toggleSection('plugin')}>
              <div className="d-flex justify-between align-center">
                <h6 className="mb-0">{sidePlacement.pluginName}</h6>
                <span className={`collapse-icon ${collapsedSections.plugin ? 'collapsed' : ''}`} />
              </div>
            </div>
            {!collapsedSections.plugin && (
              <div className="card-body p-sm">
                <PatientPluginHost placement={sidePlacement} patientId={PLUGIN_PATIENT_ID} />
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  )
}

export default PatientDashboard
