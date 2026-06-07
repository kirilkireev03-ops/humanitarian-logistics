import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'
import AppShell from './components/AppShell.jsx'
import AuthGate from './components/AuthGate.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Warehouses from './pages/Warehouses.jsx'
import CargoPage from './pages/CargoPage.jsx'
import Requests from './pages/Requests.jsx'
import Transactions from './pages/Transactions.jsx'
import Stock from './pages/Stock.jsx'
import Users from './pages/Users.jsx'
import Settings from './pages/Settings.jsx'
import Login from './pages/Login.jsx'
import { isAuthed } from './auth'

const Forecast = lazy(() => import('./pages/Forecast.jsx'))

function PageLoader() {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight: 280 }}>
      <CircularProgress />
    </Box>
  )
}

function Protected({ children }) {
  if (!isAuthed()) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <>
      <AuthGate />
      <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="warehouses" element={<Warehouses />} />
        <Route path="cargo" element={<CargoPage />} />
        <Route path="requests" element={<Requests />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="stock" element={<Stock />} />
        <Route
          path="forecast"
          element={
            <Suspense fallback={<PageLoader />}>
              <Forecast />
            </Suspense>
          }
        />
        <Route path="users" element={<Users />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
      </Routes>
    </>
  )
}
