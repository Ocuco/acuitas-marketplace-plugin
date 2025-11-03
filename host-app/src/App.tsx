import './App.css'
import { Provider } from 'react-redux'
import { store } from './store/store'
import Sidebar from './components/Sidebar.tsx'
import Header from './components/Header.tsx'
import MainContent from './components/MainContent.tsx'
import RightPanel from './components/RightPanel.tsx'

function App() {
  return (
    <Provider store={store}>
      <div className="app">
        <Header />
        <div className="app-body">
          <MainContent />
          <RightPanel />
        </div>
      </div>
    </Provider>
  )
}

export default App
