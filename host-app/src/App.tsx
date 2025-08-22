import './App.css'
import Sidebar from './components/Sidebar.tsx'
import Header from './components/Header.tsx'
import MainContent from './components/MainContent.tsx'
import RightPanel from './components/RightPanel.tsx'

function App() {
  return (
    <div className="app">
      <Header />
      <div className="app-body">
        <MainContent />
        <RightPanel />
      </div>
    </div>
  )
}

export default App
