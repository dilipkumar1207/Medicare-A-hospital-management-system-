import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AdminDataProvider } from './context/AdminDataContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AdminDataProvider>
          <App />
        </AdminDataProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
