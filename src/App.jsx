import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { isLoggedIn, getStoredUser } from './api/auth'
import Login from './pages/Login'
import DashboardDipendente from './pages/DashboardDipendente'
import DashboardTitolare from './pages/DashboardTitolare'
import Magazzino from './pages/Magazzino'
import Notifiche from './pages/Notifiche'
import Ferie from './pages/Ferie'
import Spese from './pages/Spese'
import Calendario from './pages/Calendario'

function applyAccentColor() {
  const user = getStoredUser()
  if (user?.azienda?.colore_primario) {
    document.documentElement.style.setProperty('--accent', user.azienda.colore_primario)
  }
}

function ProtectedRoute({ children, ruolo }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />
  if (ruolo) {
    const user = getStoredUser()
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

function AccentWatcher({ children }) {
  const location = useLocation()
  useEffect(() => { applyAccentColor() }, [location.pathname])
  return children
}

export default function App() {
  useEffect(() => { applyAccentColor() }, [])

  return (
    <BrowserRouter>
      <AccentWatcher>
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
          <Route path="/ferie" element={
            <ProtectedRoute ruolo="dipendente"><Ferie /></ProtectedRoute>
          } />
          <Route path="/spese" element={
            <ProtectedRoute ruolo="dipendente"><Spese /></ProtectedRoute>
          } />
          <Route path="/calendario" element={
            <ProtectedRoute ruolo="dipendente"><Calendario /></ProtectedRoute>
          } />
        </Routes>
      </AccentWatcher>
    </BrowserRouter>
  )
}
