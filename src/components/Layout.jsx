import BottomNav from './BottomNav'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen min-h-[100dvh]">
      <main className="pb-safe px-4 pt-4 max-w-lg mx-auto">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
