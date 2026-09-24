export default function Input({ label, error, hint, className = '', id, ...props }) {
  const inputId = id || props.name

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink-800">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
          error
            ? 'border-rose-400 focus:ring-rose-200'
            : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100'
        }`}
        {...props}
      />
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  )
}
