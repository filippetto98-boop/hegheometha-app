import { useState, useEffect } from 'react'
import { getDashboard, timbra } from '../api/hr'
import { getStoredUser, logout } from '../api/auth'
import Layout from '../components/Layout'
import Card from '../components/Card'
import LoadingSpinner from '../components/LoadingSpinner'
import { motion } from 'framer-motion'
import { LogIn as LogInIcon, LogOut, Calendar, Clock, Palmtree, ChevronRight } from 'lucide-react'

const GIORNI = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab']
const MESI = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic']

function oggi() {
  const d = new Date()
  return `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`
}

function formattaData(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]}`
}

const TURNO_COLORI = {
  normale: 'bg-blue-600', straordinario: 'bg-orange-600', reperibilita: 'bg-green-700',
  riposo: 'bg-gray-500', ferie: 'bg-cyan-500', permesso: 'bg-yellow-500', malattia: 'bg-red-600',
}

export default function DashboardDipendente() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [timbLoading, setTimbLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [ora, setOra] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
  const user = getStoredUser()

  const load = () => getDashboard().then(setData).catch(() => {}).finally(() => setLoading(false))
  useEffect(() => { load() }, [])
  useEffect(() => {
    const t = setInterval(() => setOra(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })), 1000)
    return () => clearInterval(t)
  }, [])

  const handleTimbra = async (tipo) => {
    setTimbLoading(true)
    setMsg(null)
    try {
      let lat, lng
      try {
        const pos = await new Promise((ok, no) => navigator.geolocation.getCurrentPosition(ok, no, { timeout: 5000 }))
        lat = pos.coords.latitude; lng = pos.coords.longitude
      } catch {}
      const res = await timbra(tipo, lat, lng)
      setMsg({ ok: true, text: res.messaggio })
      setTimeout(load, 1000)
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.errore || 'Errore' })
    } finally { setTimbLoading(false) }
  }

  if (loading) return <Layout><LoadingSpinner /></Layout>

  const inUfficio = data?.stato_timbratura === 'in_ufficio'

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-extrabold text-[#1A1523] tracking-tight">
            Ciao {user?.first_name || user?.username} <span className="inline-block animate-bounce">👋</span>
          </h1>
          <p className="text-sm text-[#9E96AB] font-medium mt-0.5">{oggi()}</p>
        </div>
        <button onClick={logout} className="text-xs text-[#9E96AB] font-semibold">Esci</button>
      </div>

      {/* Card timbratura */}
      <motion.div whileTap={{ scale: 0.98 }} className="mb-5">
        <div className={`rounded-[24px] p-6 text-white text-center relative overflow-hidden ${
          inUfficio
            ? 'bg-gradient-to-br from-emerald-500 to-emerald-700'
            : 'bg-gradient-to-br from-[#6A1B9A] to-[#1A0533]'
        }`}
          style={{ boxShadow: inUfficio ? '0 8px 32px rgba(29,158,117,0.3)' : '0 8px 32px rgba(106,27,154,0.3)' }}
        >
          <p className="text-sm font-medium opacity-80 mb-1">
            {inUfficio
              ? `In sede dalle ${data.ultima_timbratura?.timestamp?.slice(11,16)}`
              : 'Fuori sede'}
          </p>
          <div className="text-[48px] font-extrabold tabular-nums leading-none my-4 tracking-tight">{ora}</div>
          {data.ore_oggi > 0 && (
            <p className="text-sm opacity-70 mb-4">
              <Clock size={14} className="inline mr-1" />
              {Math.floor(data.ore_oggi)}h {Math.round((data.ore_oggi % 1) * 60)}m lavorate
            </p>
          )}
          {msg && (
            <div className={`text-sm font-semibold px-4 py-2.5 rounded-2xl mb-4 ${msg.ok ? 'bg-white/20' : 'bg-red-500/40'}`}>
              {msg.text}
            </div>
          )}
          <motion.button
            onClick={() => handleTimbra(inUfficio ? 'uscita' : 'entrata')}
            disabled={timbLoading}
            whileTap={{ scale: 0.95 }}
            className={`w-full h-[60px] rounded-2xl font-bold text-[17px] flex items-center justify-center gap-2.5 transition-all ${
              inUfficio ? 'bg-white text-red-600' : 'bg-white text-emerald-600'
            }`}
          >
            {timbLoading ? (
              <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            ) : inUfficio ? (
              <><LogOut size={22} /> Timbra Uscita</>
            ) : (
              <><LogInIcon size={22} /> Timbra Entrata</>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Turno oggi */}
      {data.turno_oggi && (
        <Card className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={16} className="text-[var(--accent)]" />
            <span className="text-[11px] font-bold text-[#9E96AB] uppercase tracking-wider">Turno di oggi</span>
          </div>
          <div className="text-[28px] font-extrabold text-[var(--accent)] tracking-tight">
            {data.turno_oggi.ora_inizio?.slice(0,5)} — {data.turno_oggi.ora_fine?.slice(0,5)}
          </div>
          <div className="mt-1">
            <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold text-white ${TURNO_COLORI[data.turno_oggi.tipo] || 'bg-gray-500'}`}>
              {data.turno_oggi.tipo?.charAt(0).toUpperCase() + data.turno_oggi.tipo?.slice(1)}
            </span>
          </div>
        </Card>
      )}

      {/* Turni settimana */}
      {data.turni_settimana?.length > 0 && (
        <Card className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-[#6B6478]" />
            <span className="text-[11px] font-bold text-[#9E96AB] uppercase tracking-wider">Questa settimana</span>
          </div>
          <div className="space-y-0">
            {data.turni_settimana.map(t => (
              <div key={t.id} className="flex items-center justify-between py-3 border-b border-[#EEECF4] last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${TURNO_COLORI[t.tipo] || 'bg-gray-400'}`} />
                  <span className="text-[15px] font-semibold text-[#1A1523]">{formattaData(t.data)}</span>
                </div>
                <span className="text-sm text-[#6B6478] font-medium">{t.ora_inizio?.slice(0,5)}–{t.ora_fine?.slice(0,5)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Ferie e permessi */}
      {data.richieste_assenza?.length > 0 && (
        <Card className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Palmtree size={16} className="text-cyan-500" />
            <span className="text-[11px] font-bold text-[#9E96AB] uppercase tracking-wider">Ferie e permessi</span>
          </div>
          {data.richieste_assenza.slice(0, 5).map(r => (
            <div key={r.id} className="flex items-center justify-between py-3 border-b border-[#EEECF4] last:border-0">
              <div>
                <span className="text-sm font-semibold text-[#1A1523]">{r.tipo_display}</span>
                <span className="text-xs text-[#9E96AB] ml-2">{r.data_inizio} → {r.data_fine}</span>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                r.stato === 'approvata' ? 'bg-emerald-50 text-emerald-700'
                : r.stato === 'rifiutata' ? 'bg-red-50 text-red-600'
                : 'bg-amber-50 text-amber-700'
              }`}>
                {r.stato === 'approvata' ? '✓' : r.stato === 'rifiutata' ? '✗' : '⏳'} {r.stato}
              </span>
            </div>
          ))}
        </Card>
      )}
    </Layout>
  )
}
