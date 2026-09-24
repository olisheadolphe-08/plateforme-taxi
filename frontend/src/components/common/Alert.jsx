export default function Alert({ variant = 'error', children }) {
  const variants = {
    error: 'bg-rose-50 text-rose-700 border-rose-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200'
  }

  return (
    <div className={`rounded-lg border px-4 py-3 text-sm font-medium ${variants[variant]}`}>
      {children}
    </div>
  )
}
