import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Accueil' },
  { to: '/reservation', label: 'Réserver' },
  { to: '/suivi', label: 'Suivi de réservation' }
]

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <NavLink to="/" className="flex items-center gap-2 text-lg font-extrabold text-ink-900">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
            
          </span>
          TaxiGo
        </NavLink>

        <div className="hidden gap-1 sm:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-slate-100'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <NavLink
          to="/reservation"
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
        >
          Réserver un taxi
        </NavLink>
      </nav>

      <div className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-1.5 sm:hidden">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              `shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ${
                isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
    </header>
  )
}
