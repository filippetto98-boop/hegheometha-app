import { useState, useEffect } from 'react'
import { getNotifiche, segnaLetta } from '../api/notifiche'
import Layout from '../components/Layout'
import Card from '../components/Card'
import LoadingSpinner from '../components/LoadingSpinner'
import { Bell, Package, Calendar, Truck, Settings, Check } from 'lucide-react'

const ICONE = {
  stock: Package,
  ferie: Calendar,
  veicolo: Truck,
  turno: Calendar,
  sistema: Settings,
}

export default function Notifiche() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => getNotifiche().then(setData).catch(() => {}).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleLetta = async (id) => {
    await segnaLetta(id)
    load()
  }

  if (loading) return <Layout><LoadingSpinner /></Layout>

  const notifiche = data?.notifiche || []

  return (
    <Layout>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-[#1A1523] tracking-tight">🔔 Notifiche</h1>
        {notifiche.length > 0 && (
          <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">{data.conteggio}</span>
        )}
      </div>

      {notifiche.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={40} className="mx-auto mb-3 text-[#EEECF4]" />
          <p className="text-[#9E96AB]">Nessuna notifica</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifiche.map(n => {
            const Icon = ICONE[n.tipo] || Bell
            return (
              <Card key={n.id} className="!p-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F8F7FA] flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-[var(--accent)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-[#1A1523]">{n.titolo}</div>
                    <div className="text-xs text-[#6B6478] mt-0.5">{n.messaggio}</div>
                    <div className="text-[11px] text-[#9E96AB] mt-1">{n.created_at}</div>
                  </div>
                  <button onClick={() => handleLetta(n.id)}
                    className="w-9 h-9 rounded-xl bg-[#ECFDF5] flex items-center justify-center flex-shrink-0 active:scale-90 transition-transform">
                    <Check size={16} className="text-[#065F46]" />
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </Layout>
  )
}
