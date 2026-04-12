import { useState, useEffect } from 'react'
import { getSpese, aggiungiSpesaRapida } from '../api/hr'
import Layout from '../components/Layout'
import Card from '../components/Card'
import LoadingSpinner from '../components/LoadingSpinner'
import { motion, AnimatePresence } from 'framer-motion'
import { Receipt, Plus, X } from 'lucide-react'

export default function Spese() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [importo, setImporto] = useState('')
  const [categoria, setCategoria] = useState('altro')
  const [descrizione, setDescrizione] = useState('')
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState(null)

  const load = () => getSpese().then(setData).catch(() => {}).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!importo) { setMsg({ ok: false, text: 'Inserisci importo' }); return }
    setSending(true); setMsg(null)
    try {
      await aggiungiSpesaRapida({ importo, categoria, descrizione: descrizione || 'Spesa rapida' })
      setMsg({ ok: true, text: 'Spesa aggiunta!' })
      setImporto(''); setDescrizione(''); setShowModal(false)
      load()
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.errore || 'Errore' })
    } finally { setSending(false) }
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
              className="bg-white w-full max-w-lg rounded-t-[24px] p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold">Nuova spesa</h2>
                <button onClick={() => setShowModal(false)} className="text-[#9E96AB]"><X size={22} /></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-[13px] font-semibold text-[#6B6478] mb-2">Importo (€) *</label>
                  <input type="number" step="0.01" value={importo} onChange={e => setImporto(e.target.value)}
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
                {msg && !msg.ok && (
                  <div className="bg-red-50 text-red-600 text-sm font-semibold px-4 py-3 rounded-xl mb-4">{msg.text}</div>
                )}
                <motion.button type="submit" disabled={sending} whileTap={{ scale: 0.97 }}
                  className="w-full h-[52px] bg-[var(--accent)] text-white rounded-[14px] font-bold text-[15px] flex items-center justify-center gap-2 disabled:opacity-50">
                  {sending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Salva spesa'}
                </motion.button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}
