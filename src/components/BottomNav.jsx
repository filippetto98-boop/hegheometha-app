import { NavLink } from 'react-router-dom'
import { Home, Palmtree, Receipt, Bell, Package } from 'lucide-react'
import { getStoredUser } from '../api/auth'

export default function BottomNav() {
  const user = getStoredUser()
  const isTitolare = user?.ruolo === 'titolare'

  const items = isTitolare
    ? [
        { to: '/titolare', icon: Home, label: 'Dashboard' },
        { to: '/magazzino', icon: Package, label: 'Magazzino' },
        { to: '/notifiche', icon: Bell, label: 'Notifiche' },
      ]
    : [
        { to: '/dashboard', icon: Home, label: 'Home' },
        { to: '/ferie', icon: Palmtree, label: 'Ferie' },
        { to: '/spese', icon: Receipt, label: 'Spese' },
        { to: '/notifiche', icon: Bell, label: 'Notifiche' },
      ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-[#EEECF4] z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-2 text-[10px] font-semibold transition-colors ${
                isActive ? 'text-[var(--accent)]' : 'text-[#9E96AB]'
              }`
            }>
            {({ isActive }) => (
              <>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.5} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
