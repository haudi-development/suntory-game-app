import MobileNav from '@/components/layout/MobileNav'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <div className="pb-20">
        {children}
      </div>
      <MobileNav />
    </>
  )
}