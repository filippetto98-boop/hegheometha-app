import { useState, useEffect } from 'react'
import { getTitolareDashboard } from '../api/hr'
import { getStoredUser, logout } from '../api/auth'
import Layout from '../components/Layout'
import Card from '../components/Card'
import LoadingSpinner from '../components/LoadingSpinner'
import { motion } from 'framer-motion'
import { Users, UserCheck, AlertCircle, CalendarDays, Check, X } from 'lucide-react'

const GIORNI = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab']
const MESI = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic']
function oggi() { const d = new Date(); return `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}` }

const AVATAR_COLORI = ['#EEEDFE','#E1F5EE','#FAEEDA','#FCEBEB','#EFF6FF','#F5F3FF']
const AVATAR_TESTI = ['#3C3489','#085041','#633806','#501313','#1E40AF','#5B21B6']

export default function DashboardTitolare() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const user = getStoredUser()

  useEffect(() => {
    getTitolareDashboard().then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout><LoadingSpinner /></Layout>

  const stats = [
    { icon: Users, label: 'Dipendenti', value: data?.dipendenti_count || 0, color: 'text-[#6A1B9A]', bg: 'bg-purple-50' },
    { icon: UserCheck, label: 'Presenti oggi', value: data?.presenti_oggi?.length || 0, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: AlertCircle, label: 'Richieste', value: data?.richieste_in_attesa?.length || 0, color: 'text-amber-600', bg: 'bg-amber-50' },
    { icon: CalendarDays, label: 'Turni settimana', value: data?.turni_settimana?.length || 0, color: 'text-blue-600', bg: 'bg-blue-50' },
  ]

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-extrabold text-[#1A1523] tracking-tight">
            Buongiorno, {user?.first_name || user?.username}
          </h1>
          <p className="text-sm text-[#9E96AB] font-medium mt-0.5">{oggi()}</p>
        </div>
        <button onClick={logout} className="text-xs text-[#9E96AB] font-semibold">Esci</button>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="!p-4">
              <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center mb-2`}>
                <s.icon size={20} className={s.color} />
              </div>
              <div className="text-[28px] font-extrabold text-[#1A1523] tracking-tight leading-none">{s.value}</div>
              <div className="text-[10px] font-bold text-[#9E96AB] uppercase tracking-wider mt-1">{s.label}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Chi c'è oggi */}
      <Card className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <UserCheck size={16} className="text-emerald-500" />
          <span className="text-[11px] font-bold text-[#9E96AB] uppercase tracking-wider">Chi c'è oggi</span>
        </div>
        {data?.presenti_oggi?.length > 0 ? (
          data.presenti_oggi.map((d, i) => {
            const iniziali = d.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
            return (
              <div key={d.id} className="flex items-center justify-between py-3 border-b border-[#EEECF4] last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: AVATAR_COLORI[i % 6], color: AVATAR_TESTI[i % 6] }}>
                    {iniziali}
                  </div>
                  <span className="text-[15px] font-semibold text-[#1A1523]">{d.nome}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#6B6478] font-medium">{d.entrata_ore}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
              </div>
            )
          })
        ) : (
          <p className="text-sm text-[#9E96AB] py-4 text-center">Nessun dipendente in sede</p>
        )}
      </Card>

      {/* Richieste in attesa */}
      {data?.richieste_in_attesa?.length > 0 && (
        <Card className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={16} className="text-amber-500" />
            <span className="text-[11px] font-bold text-[#9E96AB] uppercase tracking-wider">
              Richieste in attesa ({data.richieste_in_attesa.length})
            </span>
          </div>
          {data.richieste_in_attesa.map(r => (
            <div key={r.id} className="py-4 border-b border-[#EEECF4] last:border-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-[15px] font-bold text-[#1A1523]">{r.dipendente_nome}</div>
                  <div className="text-xs text-[#6B6478] mt-0.5">
                    {r.tipo_display} · {r.data_inizio} → {r.data_fine}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex-1 h-11 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm flex items-center justify-center gap-1 active:scale-95 transition-transform">
                  <Check size={16} /> Approva
                </button>
                <button className="flex-1 h-11 rounded-xl bg-red-50 text-red-600 font-bold text-sm flex items-center justify-center gap-1 active:scale-95 transition-transform">
                  <X size={16} /> Rifiuta
                </button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Notifiche badge */}
      {data?.notifiche?.length > 0 && (
        <Card className="mb-4 !bg-[#FEF2F2]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-red-700">🔔 {data.notifiche.length} notifiche non lette</span>
            <a href="/notifiche" className="text-xs font-bold text-red-600">Vedi tutte →</a>
          </div>
        </Card>
      )}
    </Layout>
  )
}
