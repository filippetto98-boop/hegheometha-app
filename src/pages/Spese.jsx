import { useState, useEffect, useRef } from 'react'
import { getSpese, aggiungiSpesaRapida, inviaNotaSpese, gestisciNotaSpese, getNoteSpeseTitolare } from '../api/hr'
import Layout from '../components/Layout'
import Card from '../components/Card'
import LoadingSpinner from '../components/LoadingSpinner'
import { motion, AnimatePresence } from 'framer-motion'
import { Receipt, Plus, X, Camera, ChevronDown, Send, CheckCircle, XCircle, Banknote } from 'lucide-react'

const STATI = {
  bozza: 'bg-gray-100 text-gray-600',
  inviata: 'bg-amber-50 text-amber-700',
  approvata: 'bg-blue-50 text-blue-700',
  rifiutata: 'bg-red-50 text-red-600',
  pagata: 'bg-emerald-50 text-emerald-700',
}

const STATO_LABEL = {
  bozza: 'Bozza',
  inviata: 'In attesa approvazione',
  approvata: 'Approvata — in attesa rimborso',
  rifiutata: 'Rifiutata',
  pagata: 'Pagata',
}

function formatData(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}`
}

export default function Spese() {
  const [data, setData] = useState(null)
  const [titolareData, setTitolareData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [importo, setImporto] = useState('')
  const [categoria, setCategoria] = useState('altro')
  const [descrizione, setDescrizione] = useState('')
  const [sending, setSending] = useState(false)
  const [msg, setMsg] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [openNota, setOpenNota] = useState(null)
  const [actionLoading, setActionLoading] = useState(null)
  const [motivazione, setMotivazione] = useState('')
  const [tab, setTab] = useState('mie')
  const safeBottom = 50
  const fileRef = useRef(null)

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isTitolare = user.ruolo === 'titolare'

  const load = () => {
    const promises = [getSpese().then(setData).catch(() => {})]
    if (isTitolare) promises.push(getNoteSpeseTitolare().then(setTitolareData).catch(() => {}))
    Promise.all(promises).finally(() => setLoading(false))
  }
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

  const handleInvia = async (notaId) => {
    setActionLoading(notaId)
    try {
      await inviaNotaSpese(notaId)
      setTimeout(() => load(), 500)
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.errore || 'Errore invio' })
    } finally { setActionLoading(null) }
  }

  const handleGestisci = async (notaId, azione) => {
    if (azione === 'rifiuta' && !motivazione.trim()) {
      setMsg({ ok: false, text: 'Inserisci una motivazione per il rifiuto' })
      return
    }
    setActionLoading(notaId)
    try {
      await gestisciNotaSpese(notaId, azione, motivazione)
      setMotivazione('')
      setTimeout(() => load(), 500)
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.errore || 'Errore' })
    } finally { setActionLoading(null) }
  }

  if (loading) return <Layout><LoadingSpinner /></Layout>

  const noteList = tab === 'mie' ? (data?.note || []) : (titolareData?.note || [])

  const renderNota = (n, isTitolareView) => {
    const isOpen = openNota === n.id
    return (
      <Card key={n.id} className="!p-0 overflow-hidden">
        <div className="p-4 cursor-pointer" onClick={() => setOpenNota(isOpen ? null : n.id)}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[15px] font-bold text-[#1A1523]">
                {isTitolareView && n.dipendente_nome ? `${n.dipendente_nome} — ` : ''}{n.nome_mese} {n.anno}
              </div>
              <div className="text-xs text-[#9E96AB] mt-0.5">{n.spese_count || n.spese?.length || 0} spese</div>
            </div>
            <div className="text-right flex items-center gap-2">
              <div>
                <div className="text-lg font-bold text-[var(--accent)]">€ {Number(n.totale).toFixed(2)}</div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${STATI[n.stato] || 'bg-gray-100'}`}>
                  {STATO_LABEL[n.stato] || n.stato}
                </span>
              </div>
              <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={18} className="text-[#9E96AB]" />
              </motion.div>
            </div>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 border-t border-[#EEECF4]">
                {(n.spese || []).length > 0 ? (
                  <div className="mt-3 space-y-2">
                    {n.spese.map(s => (
                      <div key={s.id} className="flex items-center justify-between py-2 border-b border-[#EEECF4]/60 last:border-0">
                        <div>
                          <div className="text-[13px] font-semibold text-[#1A1523]">{s.categoria_display}</div>
                          <div className="text-[11px] text-[#9E96AB]">{formatData(s.data)} — {s.descrizione}</div>
                        </div>
                        <span className="text-[14px] font-bold text-[#1A1523]">€ {Number(s.importo).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-[#9E96AB] mt-3">Nessuna spesa registrata</p>
                )}

                {/* Note titolare per rifiuto */}
                {n.stato === 'rifiutata' && n.note_titolare && (
                  <div className="mt-3 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                    <p className="text-[11px] font-bold text-red-500 uppercase mb-1">Motivazione rifiuto</p>
                    <p className="text-[13px] text-red-700">{n.note_titolare}</p>
                  </div>
                )}

                {/* Azioni dipendente */}
                {!isTitolareView && n.stato === 'bozza' && (
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleInvia(n.id)}
                    disabled={actionLoading === n.id}
                    className="w-full h-11 bg-[var(--accent)] text-white rounded-xl font-bold text-[14px] flex items-center justify-center gap-2 mt-3 disabled:opacity-50">
                    {actionLoading === n.id
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><Send size={16} /> Invia al titolare</>}
                  </motion.button>
                )}

                {/* Azioni titolare */}
                {isTitolareView && n.stato === 'inviata' && (
                  <div className="mt-3 space-y-2">
                    <textarea value={motivazione} onChange={e => setMotivazione(e.target.value)}
                      placeholder="Note / motivazione rifiuto..."
                      className="w-full px-3 py-2.5 bg-[#F8F7FA] border-[1.5px] border-[#EEECF4] rounded-xl text-[13px] focus:border-[var(--accent)] outline-none resize-none"
                      rows={2} />
                    <div className="flex gap-2">
                      <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleGestisci(n.id, 'approva')}
                        disabled={actionLoading === n.id}
                        className="flex-1 h-10 bg-emerald-600 text-white rounded-xl font-bold text-[13px] flex items-center justify-center gap-1.5 disabled:opacity-50">
                        <CheckCircle size={15} /> Approva
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleGestisci(n.id, 'rifiuta')}
                        disabled={actionLoading === n.id}
                        className="flex-1 h-10 bg-red-500 text-white rounded-xl font-bold text-[13px] flex items-center justify-center gap-1.5 disabled:opacity-50">
                        <XCircle size={15} /> Rifiuta
                      </motion.button>
                    </div>
                  </div>
                )}

                {isTitolareView && n.stato === 'approvata' && (
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleGestisci(n.id, 'pagata')}
                    disabled={actionLoading === n.id}
                    className="w-full h-10 bg-blue-600 text-white rounded-xl font-bold text-[13px] flex items-center justify-center gap-1.5 mt-3 disabled:opacity-50">
                    <Banknote size={15} /> Segna come pagata
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    )
  }

  return (
    <Layout>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-[#1A1523] tracking-tight">Note spese</h1>
        <span className="text-lg font-bold text-[var(--accent)]">€ {data?.totale_mese?.toFixed(2) || '0.00'}</span>
      </div>

      {msg && (
        <div className={`text-sm font-semibold px-4 py-3 rounded-xl mb-4 ${msg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
          {msg.text}
        </div>
      )}

      <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setShowModal(true); setMsg(null) }}
        className="w-full h-[52px] bg-[var(--accent)] text-white rounded-[14px] font-bold text-[15px] flex items-center justify-center gap-2 mb-5"
        style={{ boxShadow: '0 4px 16px color-mix(in srgb, var(--accent), transparent 70%)' }}>
        <Plus size={20} /> Aggiungi spesa
      </motion.button>

      {/* Tab titolare */}
      {isTitolare && (
        <div className="flex gap-2 mb-4">
          <button onClick={() => setTab('mie')}
            className={`flex-1 h-9 rounded-xl text-[13px] font-bold transition-colors ${
              tab === 'mie' ? 'bg-[var(--accent)] text-white' : 'bg-[#F8F7FA] text-[#6B6478]'
            }`}>Le mie</button>
          <button onClick={() => setTab('team')}
            className={`flex-1 h-9 rounded-xl text-[13px] font-bold transition-colors ${
              tab === 'team' ? 'bg-[var(--accent)] text-white' : 'bg-[#F8F7FA] text-[#6B6478]'
            }`}>Team</button>
        </div>
      )}

      {noteList.length > 0 ? (
        <div className="space-y-3">
          {noteList.map(n => renderNota(n, tab === 'team'))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Receipt size={40} className="mx-auto mb-3 text-[#EEECF4]" />
          <p className="text-[#9E96AB]">{tab === 'team' ? 'Nessuna nota spese inviata' : 'Nessuna nota spese'}</p>
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
                  {scanning ? 'Analisi in corso...' : 'Scansiona scontrino'}
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
