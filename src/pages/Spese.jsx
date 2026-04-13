import { useState, useEffect } from 'react'
import { getSpese, aggiungiSpesaRapida } from '../api/hr'
import Layout from '../components/Layout'
import Card from '../components/Card'
import LoadingSpinner from '../components/LoadingSpinner'
import { motion, AnimatePresence } from 'framer-motion'
import { Receipt, Plus, X, Camera } from 'lucide-react'
import { useRef } from 'react'

export default function Spese() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [importo, setImporto] = useState('')
  const [categoria, setCategoria] = useState('altro')
  const [descrizione, setDescrizione] = useState('')
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState(null)
  const [scanning, setScanning] = useState(false)
  const safeBottom = 50
  const fileRef = useRef(null)

  const load = () => getSpese().then(setData).catch(() => {}).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!importo) { setMsg({ ok: false, text: 'Inserisci importo' }); return }
    setSending(true); setMsg(null)
    try {
      const importoNorm = String(importo).replace(',', '.')
      await aggiungiSpesaRapida({ importo: importoNorm, categoria, descrizione: descrizione || 'Spesa rapida' })
      setMsg({ ok: true, text: 'Spesa aggiunta!' })
      setImporto(''); setDescrizione(''); setShowModal(false)
      setTimeout(() => load(), 500)
    } catch (err) {
      const detail = err.response?.data?.errore
        || err.response?.data?.detail
        || err.response?.data?.non_field_errors?.[0]
        || (err.response?.status ? `HTTP ${err.response.status}` : null)
        || err.message
        || 'Errore sconosciuto'
      setMsg({ ok: false, text: detail })
    } finally { setSending(false) }
  }

  const handleScan = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setScanning(true)
    setMsg(null)
    try {
      const Tesseract = await import('https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.esm.min.js')
      const result = await Tesseract.default.recognize(file, 'ita')
      const text = result.data.text || ''
      const match = text.match(/(?:totale|total|eur|€|importo|da pagare)\s*:?\s*[€]?\s*(\d+[.,]\d{2})/i)
      if (match) {
        setImporto(match[1].replace(',', '.'))
        setMsg({ ok: true, text: `Importo rilevato: € ${match[1]}` })
      } else {
        const amounts = text.match(/\d+[.,]\d{2}/g)
        if (amounts && amounts.length > 0) {
          const last = amounts[amounts.length - 1].replace(',', '.')
          setImporto(last)
          setMsg({ ok: true, text: `Possibile importo: € ${last} — verifica` })
        } else {
          setMsg({ ok: false, text: 'Importo non rilevato — inserisci manualmente' })
        }
      }
    } catch {
      setMsg({ ok: false, text: 'Errore scansione — inserisci manualmente' })
    } finally {
      setScanning(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  if (loading) return <Layout><LoadingSpinner /></Layout>

  const STATI = {
    bozza: 'bg-gray-100 text-gray-600',
    inviata: 'bg-amber-50 text-amber-700',
    approvata: 'bg-emerald-50 text-emerald-700',
    rifiutata: 'bg-red-50 text-red-600',
    pagata: 'bg-blue-50 text-blue-700',
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-[#1A1523] tracking-tight">🧾 Note spese</h1>
        <span className="text-lg font-bold text-[var(--accent)]">€ {data?.totale_mese?.toFixed(2) || '0.00'}</span>
      </div>

      <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowModal(true)}
        className="w-full h-[52px] bg-[var(--accent)] text-white rounded-[14px] font-bold text-[15px] flex items-center justify-center gap-2 mb-5"
        style={{ boxShadow: '0 4px 16px color-mix(in srgb, var(--accent), transparent 70%)' }}>
        <Plus size={20} /> Aggiungi spesa
      </motion.button>

      {(data?.note || []).length > 0 ? (
        <div className="space-y-3">
          {data.note.map(n => (
            <Card key={n.id} className="!p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[15px] font-bold text-[#1A1523]">{n.nome_mese} {n.anno}</div>
                  <div className="text-xs text-[#9E96AB] mt-0.5">{n.spese_count} spese</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-[var(--accent)]">€ {n.totale.toFixed(2)}</div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${STATI[n.stato] || 'bg-gray-100'}`}>{n.stato}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Receipt size={40} className="mx-auto mb-3 text-[#EEECF4]" />
          <p className="text-[#9E96AB]">Nessuna nota spese</p>
        </div>
      )}

      {/* Modal aggiungi spesa */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={() => setShowModal(false)}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={e => e.stopPropagation()}
              className="bg-white w-full max-w-lg rounded-t-[24px] flex flex-col"
              style={{ maxHeight: '90vh' }}>
              <div className="overflow-y-auto px-6 pt-6" style={{ paddingBottom: `${safeBottom + 16}px` }}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold">Nuova spesa</h2>
                <button onClick={() => setShowModal(false)} className="text-[#9E96AB]"><X size={22} /></button>
              </div>
              <form onSubmit={handleSubmit}>
                <input type="file" ref={fileRef} accept="image/*" capture="environment" className="hidden" onChange={handleScan} />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={scanning}
                  className="w-full h-12 bg-[#F8F7FA] border-[1.5px] border-dashed border-[#EEECF4] rounded-xl text-[14px] font-semibold text-[#6B6478] flex items-center justify-center gap-2 mb-4 active:scale-[0.98] transition-transform disabled:opacity-50">
                  {scanning ? <div className="w-4 h-4 border-2 border-[#9E96AB]/30 border-t-[#9E96AB] rounded-full animate-spin" /> : <Camera size={18} />}
                  {scanning ? 'Analisi in corso...' : '📷 Scansiona scontrino'}
                </button>
                <div className="mb-4">
                  <label className="block text-[13px] font-semibold text-[#6B6478] mb-2">Importo (€) *</label>
                  <input type="number" step="0.01" value={importo} onChange={e => setImporto(e.target.value.replace(',', '.'))}
                    placeholder="25.50"
                    className="w-full px-4 py-3.5 bg-[#F8F7FA] border-[1.5px] border-[#EEECF4] rounded-xl text-[16px] font-bold focus:border-[var(--accent)] outline-none" required />
                </div>
                <div className="mb-4">
                  <label className="block text-[13px] font-semibold text-[#6B6478] mb-2">Categoria</label>
                  <select value={categoria} onChange={e => setCategoria(e.target.value)}
                    className="w-full px-4 py-3.5 bg-[#F8F7FA] border-[1.5px] border-[#EEECF4] rounded-xl text-[15px] focus:border-[var(--accent)] outline-none">
                    <option value="carburante">Carburante</option>
                    <option value="pranzo">Pranzo</option>
                    <option value="cena">Cena</option>
                    <option value="pedaggi">Pedaggi</option>
                    <option value="alloggio">Alloggio</option>
                    <option value="trasporto">Trasporto</option>
                    <option value="materiale">Materiale</option>
                    <option value="altro">Altro</option>
                  </select>
                </div>
                <div className="mb-5">
                  <label className="block text-[13px] font-semibold text-[#6B6478] mb-2">Descrizione</label>
                  <input type="text" value={descrizione} onChange={e => setDescrizione(e.target.value)}
                    placeholder="Es. Pranzo cliente"
                    className="w-full px-4 py-3.5 bg-[#F8F7FA] border-[1.5px] border-[#EEECF4] rounded-xl text-[15px] focus:border-[var(--accent)] outline-none" />
                </div>
                {msg && (
                  <div className={`text-sm font-semibold px-4 py-3 rounded-xl mb-4 ${msg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>{msg.text}</div>
                )}
                <motion.button type="submit" disabled={sending} whileTap={{ scale: 0.97 }}
                  className="w-full h-[52px] bg-[var(--accent)] text-white rounded-[14px] font-bold text-[15px] flex items-center justify-center gap-2 disabled:opacity-50">
                  {sending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Salva spesa'}
                </motion.button>
              </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}
