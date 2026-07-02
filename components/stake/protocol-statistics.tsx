export default function ProtocolStatistics() {
  const stats = [
    ['Current APR', '38.42%', '', 'text-emerald-400'],
    ['Total Rewards Distributed', '1.2M', 'SMAUG', 'text-[#D8B13D]'],
    ['Total Burned', '388M', 'SMAUG', 'text-[#f4f4f4]'],
    ['Average Stake Duration', '210', 'days', 'text-[#f4f4f4]'],
    ['Largest Stake', '250,000', 'SMAUG', 'text-[#f4f4f4]'],
    ['Treasury Balance', '12,543', 'SMAUG', 'text-[#f4f4f4]'],
  ]

  return (
    <div className="rounded-2xl border border-white/10 bg-[#111116] p-6">
      <h2 className="mb-5 font-serif text-2xl font-bold text-[#f4f4f4]">
        Protocol Statistics
      </h2>

      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-6">
        {stats.map(([label, value, sub, color]) => (
          <div key={label} className="border-r border-white/10 last:border-r-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#9a9a9a]">
              {label}
            </p>
            <p className={`mt-2 font-serif text-2xl font-bold ${color}`}>
              {value}
            </p>
            {sub && <p className="text-sm text-[#9a9a9a]">{sub}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}