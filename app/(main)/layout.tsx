import MobileNav from '@/components/layout/MobileNav'
import { CheckInProvider } from '@/contexts/CheckInContext'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CheckInProvider>
      <div className="pb-20">
        {children}
      </div>
      <MobileNav />
    </CheckInProvider>
  )
}