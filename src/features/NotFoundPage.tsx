import { ArrowLeft, Compass } from 'lucide-react'
import { ButtonLink } from '@/components/ui/Button'
import { Card, Page } from '@/components/ui/PageHeader'
import { EmptyState } from '@/components/ui/States'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export function NotFoundPage() {
  useDocumentTitle('Page not found')
  return (
    <Page>
      <Card>
        <EmptyState
          icon={<Compass />}
          title="This page doesn’t exist."
          detail="The link may be old or mistyped. Use the menu to find what you need."
          action={
            <ButtonLink to="/dashboard" variant="primary" icon={<ArrowLeft aria-hidden />}>
              Go to Overview
            </ButtonLink>
          }
        />
      </Card>
    </Page>
  )
}
