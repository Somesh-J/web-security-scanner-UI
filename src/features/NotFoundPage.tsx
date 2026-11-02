import { useLocation } from 'react-router-dom'
import { ButtonLink } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/States'

export function NotFoundPage() {
  const { pathname } = useLocation()
  return (
    <div className="px-4 py-10 md:px-6">
      <EmptyState
        title={`cd ${pathname}: no such screen`}
        detail="Check the address, or use the menu or the prompt to get where you are going."
        action={<ButtonLink to="/dashboard">Go to dashboard</ButtonLink>}
      />
    </div>
  )
}
