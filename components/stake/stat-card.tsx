interface StatCardProps {
  label: string
  value: string
  sublabel: string
}

export default function StatCard({ label, value, sublabel }: StatCardProps) {
  return (
    <div className="flex flex-col">
      <p className="font-sans text-xs font-medium text-[#9a9a9a] mb-2 uppercase tracking-wide">
        {label}
      </p>
      <p className="font-serif text-2xl font-bold text-[#B87333] md:text-3xl">
        {value}
      </p>
      <p className="font-sans text-sm text-[#9a9a9a] mt-1">
        {sublabel}
      </p>
    </div>
  )
}
