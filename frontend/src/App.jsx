import { Routes, Route } from 'react-router-dom'
import PublicLayout from './layouts/PublicLayout'
import AdminLayout from './layouts/AdminLayout'
import ProtectedRoute from './components/common/ProtectedRoute'

import Home from './pages/Home'
import Reservation from './pages/Reservation'
import ReservationSummary from './pages/ReservationSummary'
import ReservationStatus from './pages/ReservationStatus'
import NotFound from './pages/NotFound'

import Login from './pages/admin/Login'
import Dashboard from './pages/admin/Dashboard'
import Reservations from './pages/admin/Reservations'
import ReservationDetails from './pages/admin/ReservationDetails'
import Taxis from './pages/admin/Taxis'
import Chauffeurs from './pages/admin/Chauffeurs'

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/reservation" element={<Reservation />} />
        <Route path="/reservation/confirmation/:reference" element={<ReservationSummary />} />
        <Route path="/suivi" element={<ReservationStatus />} />
      </Route>

      <Route path="/admin/connexion" element={<Login />} />

      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="reservations" element={<Reservations />} />
        <Route path="reservations/:id" element={<ReservationDetails />} />
        <Route path="taxis" element={<Taxis />} />
        <Route path="chauffeurs" element={<Chauffeurs />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
