import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import NotificationBell from '../components/admin/NotificationBell.jsx'
import { TaxiIcon } from '../components/common/Icons.jsx'

const links = [
  { to: '/admin', label: 'Tableau de bord', end: true },
  { to: '/admin/reservations', label: 'Réservations' },
  { to: '/admin/taxis', label: 'Taxis' },
  { to: '/admin/chauffeurs', label: 'Chauffeurs' }
]

export default function AdminLayout() {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/admin/connexion')
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-ink-900 text-white sm:flex">
        <div className="flex items-center justify-between gap-2 px-6 py-5">
          <div className="flex items-center gap-2 text-lg font-extrabold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <TaxiIcon className="h-5 w-5" />
            </span>
            TaxiGo Admin
          </div>
          <NotificationBell />
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-white/10'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 px-4 py-4 text-sm">
          <p className="font-semibold">
            {admin?.prenom} {admin?.nom}
          </p>
          <p className="truncate text-xs text-slate-400">{admin?.email}</p>
          <button
            onClick={handleLogout}
            className="mt-3 w-full rounded-lg border border-white/20 px-3 py-2 text-xs font-semibold hover:bg-white/10"
          >
            Se déconnecter
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 sm:hidden">
          <span className="font-extrabold text-ink-900">TaxiGo Admin</span>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-ink-900 p-1">
              <NotificationBell />
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold"
            >
              Déconnexion
            </button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
