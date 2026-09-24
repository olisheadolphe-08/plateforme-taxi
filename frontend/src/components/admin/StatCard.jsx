export default function StatCard({ label, value, accent = 'text-ink-900' }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-3xl font-extrabold ${accent}`}>{value}</p>
    </div>
  )
}
