import { useState, useEffect, useRef } from 'react'
import { getDashboard, richiediAssenza } from '../api/hr'
import Layout from '../components/Layout'
import Card from '../components/Card'
import LoadingSpinner from '../components/LoadingSpinner'
import { motion } from 'framer-motion'
import { Palmtree, Send, Calendar } from 'lucide-react'

const GIORNI = ['Dom','Lun','Mar','Mer','Gio','Ven','Sab']
const MESI = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic']
function formattaData(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]} ${d.getFullYear()}`
}

function formatDataBreve(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

function calcolaGiorni(inizio, fine) {
  if (!inizio || !fine) return 0
  return Math.ceil((new Date(fine) - new Date(inizio)) / (1000 * 60 * 60 * 24)) + 1
}

export default function Ferie() {
  const [richieste, setRichieste] = useState([])
  const [loading, setLoading] = useState(true)
  const [tipo, setTipo] = useState('permesso')
  const [dataInizio, setDataInizio] = useState('')
  const [dataFine, setDataFine] = useState('')
  const [note, setNote] = useState('')
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState(null)
  const fineRef = useRef(null)

  useEffect(() => {
    getDashboard().then(d => setRichieste(d.richieste_assenza || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleInizioChange = (e) => {
    setDataInizio(e.target.value)
    if (e.target.value && fineRef.current) {
      setTimeout(() => fineRef.current.focus(), 100)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!dataInizio || !dataFine) { setMsg({ ok: false, text: 'Compila le date' }); return }
    setSending(true); setMsg(null)
    try {
      await richiediAssenza({ tipo, data_inizio: dataInizio, data_fine: dataFine, note })
      setMsg({ ok: true, text: 'Richiesta inviata!' })
      setDataInizio(''); setDataFine(''); setNote('')
      const d = await getDashboard()
      setRichieste(d.richieste_assenza || [])
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.errore || 'Errore' })
    } finally { setSending(false) }
  }

  if (loading) return <Layout><LoadingSpinner /></Layout>

  const giorni = calcolaGiorni(dataInizio, dataFine)

  const STATI_COLORI = {
    in_attesa: 'bg-amber-50 text-amber-700',
    approvata: 'bg-emerald-50 text-emerald-700',
    rifiutata: 'bg-red-50 text-red-600',
  }

  return (
    <Layout>
      <h1 className="text-xl font-bold text-[#1A1523] tracking-tight mb-5">📅 Permessi</h1>

      <Card className="mb-5">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-[13px] font-semibold text-[#6B6478] mb-2">Tipo</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)}
              className="w-full px-4 py-3.5 bg-[#F8F7FA] border-[1.5px] border-[#EEECF4] rounded-xl text-[15px] focus:border-[var(--accent)] outline-none">
              <option value="permesso">Permesso</option>
              <option value="ferie">Ferie</option>
              <option value="malattia">Malattia</option>
              <option value="altro">Altro</option>
            </select>
          </div>
          <div className="w-full overflow-hidden mb-2">
            <label className="block text-[13px] font-semibold text-[#6B6478] mb-2">Dal</label>
            <input type="date" value={dataInizio} onChange={handleInizioChange}
              style={{ maxWidth: '100%', paddingLeft: '16px', paddingRight: '16px', boxSizing: 'border-box' }}
              className="w-full py-3.5 bg-[#F8F7FA] border-[1.5px] border-[#EEECF4] rounded-xl text-[15px] focus:border-[var(--accent)] outline-none appearance-none" required />
          </div>
          {dataInizio && (
            <div className="flex items-center justify-center my-1">
              <div className="h-0.5 flex-1 rounded-full" style={{background:'var(--accent)', opacity: dataFine ? 1 : 0.3}} />
              <span className="mx-2 text-xs font-bold" style={{color:'var(--accent)'}}>
                {dataFine ? `${giorni} giorni` : '→'}
              </span>
              <div className="h-0.5 flex-1 rounded-full" style={{background:'var(--accent)', opacity: dataFine ? 1 : 0.3}} />
            </div>
          )}
          <div className="w-full overflow-hidden mb-4">
            <label className="block text-[13px] font-semibold text-[#6B6478] mb-2">Al</label>
            <input type="date" ref={fineRef} value={dataFine} onChange={e => setDataFine(e.target.value)}
              style={{ maxWidth: '100%', paddingLeft: '16px', paddingRight: '16px', boxSizing: 'border-box' }}
              className="w-full py-3.5 bg-[#F8F7FA] border-[1.5px] border-[#EEECF4] rounded-xl text-[15px] focus:border-[var(--accent)] outline-none appearance-none" required />
          </div>
          {dataInizio && dataFine && giorni > 0 && (
            <div className="mb-4 text-center">
              <div className="text-[15px] font-semibold text-[#1A1523]">
                {formatDataBreve(dataInizio)} → {formatDataBreve(dataFine)}
              </div>
              <div className="text-[28px] font-extrabold mt-1" style={{color:'var(--accent)'}}>
                {giorni} giorn{giorni === 1 ? 'o' : 'i'}
              </div>
            </div>
          )}
          <div className="mb-4">
            <label className="block text-[13px] font-semibold text-[#6B6478] mb-2">Note</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
              placeholder="Motivazione (opzionale)"
              className="w-full px-4 py-3.5 bg-[#F8F7FA] border-[1.5px] border-[#EEECF4] rounded-xl text-[15px] focus:border-[var(--accent)] outline-none resize-none" />
          </div>
          {msg && (
            <div className={`text-sm font-semibold px-4 py-3 rounded-xl mb-4 ${msg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
              {msg.text}
            </div>
          )}
          <motion.button type="submit" disabled={sending} whileTap={{ scale: 0.97 }}
            className="w-full h-[52px] bg-[var(--accent)] text-white rounded-[14px] font-bold text-[15px] flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ boxShadow: '0 4px 16px color-mix(in srgb, var(--accent), transparent 70%)' }}>
            {sending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={18} /> Invia richiesta</>}
          </motion.button>
        </form>
      </Card>

      {richieste.length > 0 && (
        <Card>
          <p className="text-[11px] font-bold text-[#9E96AB] uppercase tracking-wider mb-3">Le mie richieste</p>
          {richieste.map(r => (
            <div key={r.id} className="flex items-center justify-between py-3 border-b border-[#EEECF4] last:border-0">
              <div>
                <span className="text-sm font-semibold text-[#1A1523]">{r.tipo_display}</span>
                <p className="text-xs text-[#9E96AB] mt-0.5">{formattaData(r.data_inizio)} → {formattaData(r.data_fine)}</p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${STATI_COLORI[r.stato] || 'bg-gray-100 text-gray-600'}`}>
                {r.stato}
              </span>
            </div>
          ))}
        </Card>
      )}
    </Layout>
  )
}
