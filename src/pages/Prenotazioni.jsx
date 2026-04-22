import { useState, useEffect } from 'react'
import { getPrenotazioni, aggiornaStato } from '../api/prenotazioni'
import Layout from '../components/Layout'
import Card from '../components/Card'
import LoadingSpinner from '../components/LoadingSpinner'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, User, Phone, Mail, MapPin, X, CheckCircle, XCircle, Check, Timer } from 'lucide-react'

const STATO_COLORI = {
  in_attesa: 'bg-amber-50 text-amber-700',
  confermata: 'bg-emerald-50 text-emerald-700',
  annullata: 'bg-red-50 text-red-600',
  completata: 'bg-blue-50 text-blue-700',
}

const STATO_LABEL = {
  in_attesa: 'In attesa',
  confermata: 'Confermata',
  annullata: 'Annullata',
  completata: 'Completata',
}

function formatData(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function formatOra(timeStr) {
  if (!timeStr) return ''
  return timeStr.slice(0, 5)
}

export default function Prenotazioni() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [vista, setVista] = useState('oggi')
  const [statoFiltro, setStatoFiltro] = useState('')
  const [selected, setSelected] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [msg, setMsg] = useState(null)

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isTitolare = user.ruolo === 'titolare'

  const load = () => {
    const params = { vista }
    if (statoFiltro) params.stato = statoFiltro
    getPrenotazioni(params).then(setData).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { setLoading(true); load() }, [vista, statoFiltro])

  const handleStato = async (id, stato) => {
    setActionLoading(stato)
    setMsg(null)
    try {
      const res = await aggiornaStato(id, stato)
      setMsg({ ok: true, text: res.messaggio })
      setSelected(null)
      load()
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.errore || 'Errore' })
    } finally { setActionLoading(null) }
  }

  if (loading) return <Layout><LoadingSpinner /></Layout>

  const prenotazioni = data?.prenotazioni || []
  const stats = data?.stats || {}

  const viste = [
    { key: 'oggi', label: 'Oggi' },
    { key: 'prossime', label: 'Prossime' },
    { key: 'passate', label: 'Passate' },
  ]

  const filtriStato = [
    { key: '', label: 'Tutti' },
    { key: 'in_attesa', label: 'In attesa' },
    { key: 'confermata', label: 'Confermate' },
    { key: 'completata', label: 'Completate' },
    { key: 'annullata', label: 'Annullate' },
  ]

  return (
    <Layout>
      <div className="mb-5">
        <h1 className="text-[22px] font-extrabold text-[#1A1523] tracking-tight">Prenotazioni</h1>
        <p className="text-sm text-[#9E96AB] font-medium mt-0.5">Gestisci gli appuntamenti</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { label: 'In attesa', value: stats.in_attesa || 0, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Confermate', value: stats.confermate || 0, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Oggi', value: stats.oggi || 0, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Completate mese', value: stats.completate_mese || 0, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((s, i) => (
          <Card key={i} className="text-center py-3">
            <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-[#9E96AB] font-semibold mt-0.5">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Vista tabs */}
      <div className="flex gap-2 mb-3 overflow-x-auto">
        {viste.map(v => (
          <button key={v.key} onClick={() => setVista(v.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
              vista === v.key
                ? 'bg-[var(--accent)] text-white'
                : 'bg-gray-100 text-[#9E96AB]'
            }`}>
            {v.label}
          </button>
        ))}
      </div>

      {/* Filtri stato */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {filtriStato.map(f => (
          <button key={f.key} onClick={() => setStatoFiltro(f.key)}
            className={`px-3 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-colors ${
              statoFiltro === f.key
                ? 'bg-[#1A1523] text-white'
                : 'bg-gray-50 text-[#9E96AB] border border-gray-200'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Messaggio feedback */}
      <AnimatePresence>
        {msg && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className={`mb-3 p-3 rounded-xl text-sm font-semibold ${msg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista prenotazioni */}
      {prenotazioni.length === 0 ? (
        <div className="text-center py-12 text-[#9E96AB]">
          <Calendar size={40} className="mx-auto mb-3 opacity-40" />
          <p className="font-semibold text-sm">Nessuna prenotazione</p>
        </div>
      ) : (
        <div className="space-y-3 pb-24">
          {prenotazioni.map(p => (
            <motion.div key={p.id} layoutId={`pren-${p.id}`}
              onClick={() => setSelected(p)}
              className="cursor-pointer">
              <Card>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[#1A1523] truncate">{p.nome_cliente}</p>
                    <p className="text-xs text-[var(--accent)] font-semibold mt-0.5">{p.servizio?.nome}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[11px] text-[#9E96AB] flex items-center gap-1">
                        <Calendar size={12} /> {formatData(p.data)}
                      </span>
                      <span className="text-[11px] text-[#9E96AB] flex items-center gap-1">
                        <Clock size={12} /> {formatOra(p.ora)}
                      </span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${STATO_COLORI[p.stato] || 'bg-gray-100 text-gray-600'}`}>
                    {STATO_LABEL[p.stato] || p.stato_display}
                  </span>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Bottom sheet dettaglio */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[60] flex items-end justify-center" onClick={() => setSelected(null)}>
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="bg-white w-full rounded-t-3xl flex flex-col"
              style={{ maxHeight: '85vh', paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}>
              {/* Contenuto scrollabile */}
              <div className="flex-1 overflow-y-auto p-5 pb-2 min-h-0">
                {/* Handle */}
                <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />

                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-[#1A1523]">{selected.nome_cliente}</h2>
                    <p className="text-sm text-[var(--accent)] font-semibold">{selected.servizio?.nome}</p>
                  </div>
                  <button onClick={() => setSelected(null)}
                    className="p-1.5 rounded-full bg-gray-100">
                    <X size={16} className="text-[#9E96AB]" />
                  </button>
                </div>

                {/* Badge stato */}
                <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold mb-4 ${STATO_COLORI[selected.stato]}`}>
                  {STATO_LABEL[selected.stato] || selected.stato_display}
                </span>

                {/* Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-[#9E96AB]" />
                    <span className="text-sm text-[#1A1523] font-medium">
                      {formatData(selected.data)} alle {formatOra(selected.ora)}
                    </span>
                  </div>
                  {selected.servizio?.durata_minuti && selected.servizio?.prezzo != null && (
                    <div className="flex items-center gap-3">
                      <Timer size={16} className="text-[#9E96AB]" />
                      <span className="text-sm text-[#1A1523] font-medium">
                        {selected.servizio.durata_minuti} min · €{Number(selected.servizio.prezzo).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {selected.email_cliente && (
                    <div className="flex items-center gap-3">
                      <Mail size={16} className="text-[#9E96AB]" />
                      <a href={`mailto:${selected.email_cliente}`} className="text-sm text-[var(--accent)] font-semibold">
                        {selected.email_cliente}
                      </a>
                    </div>
                  )}
                  {selected.telefono_cliente && (
                    <div className="flex items-center gap-3">
                      <Phone size={16} className="text-[#9E96AB]" />
                      <a href={`tel:${selected.telefono_cliente}`} className="text-sm text-[var(--accent)] font-semibold">
                        {selected.telefono_cliente}
                      </a>
                    </div>
                  )}
                  {selected.indirizzo_cliente && (
                    <div className="flex items-center gap-3">
                      <MapPin size={16} className="text-[#9E96AB]" />
                      <span className="text-sm text-[#1A1523]">{selected.indirizzo_cliente}</span>
                    </div>
                  )}
                  {selected.note_cliente && (
                    <div className="bg-gray-50 rounded-xl p-3 mt-2">
                      <p className="text-[11px] text-[#9E96AB] font-semibold mb-1">Note cliente</p>
                      <p className="text-sm text-[#1A1523]">{selected.note_cliente}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Azioni titolare — sticky bottom */}
              {isTitolare && selected.stato === 'in_attesa' && (
                <div className="flex gap-3 p-4 border-t border-gray-100 bg-white flex-shrink-0">
                  <button onClick={() => handleStato(selected.id, 'confermata')}
                    disabled={actionLoading}
                    className="flex-1 py-3 rounded-2xl bg-emerald-500 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                    <CheckCircle size={16} /> Conferma
                  </button>
                  <button onClick={() => handleStato(selected.id, 'annullata')}
                    disabled={actionLoading}
                    className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                    <XCircle size={16} /> Annulla
                  </button>
                </div>
              )}

              {isTitolare && selected.stato === 'confermata' && (
                <div className="flex gap-3 p-4 border-t border-gray-100 bg-white flex-shrink-0">
                  <button onClick={() => handleStato(selected.id, 'completata')}
                    disabled={actionLoading}
                    className="flex-1 py-3 rounded-2xl bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                    <Check size={16} /> Completa
                  </button>
                  <button onClick={() => handleStato(selected.id, 'annullata')}
                    disabled={actionLoading}
                    className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                    <XCircle size={16} /> Annulla
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}
