import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { isLoggedIn, getStoredUser } from './api/auth'
import Login from './pages/Login'
import DashboardDipendente from './pages/DashboardDipendente'
import DashboardTitolare from './pages/DashboardTitolare'
import Magazzino from './pages/Magazzino'
import Notifiche from './pages/Notifiche'

function ProtectedRoute({ children, ruolo }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />
  if (ruolo) {
    const user = getStoredUser()
    // Titolare può accedere a tutto
    if (user?.ruolo !== ruolo && user?.ruolo !== 'titolare') {
      return <Navigate to="/" replace />
    }
  }
  return children
}

function HomeRedirect() {
  if (!isLoggedIn()) return <Navigate to="/login" replace />
  const user = getStoredUser()
  if (user?.ruolo === 'titolare') return <Navigate to="/titolare" replace />
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={
          <ProtectedRoute ruolo="dipendente"><DashboardDipendente /></ProtectedRoute>
        } />
        <Route path="/titolare" element={
          <ProtectedRoute ruolo="titolare"><DashboardTitolare /></ProtectedRoute>
        } />
        <Route path="/magazzino" element={
          <ProtectedRoute><Magazzino /></ProtectedRoute>
        } />
        <Route path="/notifiche" element={
          <ProtectedRoute><Notifiche /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}
