import { HelpCircle } from 'lucide-react'

export function QuestionMarkIcon({ className }: { className?: string }) {
  return (
    <HelpCircle
      className={`h-4 w-4 text-[#9ca3af] hover:text-[#d8b13d] transition-colors ${className}`}
    />
  )
}