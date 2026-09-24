import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import { formatDateTime } from '../../utils/format'
import { BellIcon } from '../common/Icons'

const POLL_INTERVAL_MS = 15000

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const containerRef = useRef(null)
  const navigate = useNavigate()

  async function fetchUnreadCount() {
    try {
      const res = await api.unreadNotificationsCount()
      setUnreadCount(res.data.count)
    } catch {
      // Silencieux : un échec de sondage ne doit pas perturber l'admin.
    }
  }

  async function fetchList() {
    try {
      const res = await api.notifications()
      setItems(res.data)
      setLoaded(true)
    } catch {
      // idem
    }
  }

  useEffect(() => {
    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function toggleOpen() {
    const next = !open
    setOpen(next)
    if (next && !loaded) fetchList()
  }

  async function handleItemClick(item) {
    if (!item.is_read) {
      try {
        await api.markNotificationRead(item.id)
        setItems((prev) =>
          prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
        )
        setUnreadCount((c) => Math.max(0, c - 1))
      } catch {
        // on navigue quand même même si le marquage échoue
      }
    }
    setOpen(false)
    navigate(`/admin/reservations/${item.reservation_id}`)
  }

  async function handleMarkAllRead() {
    try {
      await api.markAllNotificationsRead()
      setItems((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch {
      // silencieux
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={toggleOpen}
        aria-label="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 text-white hover:bg-white/10"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-80 max-w-[90vw] right-0 sm:left-0 rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-ink-900">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">
                Aucune notification pour le moment.
              </p>
            ) : (
              items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`block w-full border-b border-slate-50 px-4 py-3 text-left text-sm last:border-0 hover:bg-slate-50 ${
                    item.is_read ? 'text-slate-500' : 'bg-brand-50/50 text-ink-800'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!item.is_read && (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
                    )}
                    <div className="flex-1">
                      <p className={item.is_read ? '' : 'font-medium'}>{item.message}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {formatDateTime(item.created_at)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
