import { useState, useEffect, useRef } from 'react'
import { getSpese, aggiungiSpesaRapida, inviaNotaSpese, gestisciNotaSpese, getNoteSpeseTitolare, scanScontrino } from '../api/hr'
import Layout from '../components/Layout'
import Card from '../components/Card'
import LoadingSpinner from '../components/LoadingSpinner'
import { motion, AnimatePresence } from 'framer-motion'
import { Receipt, Plus, X, Camera, ChevronDown, Send, CheckCircle, XCircle, Banknote, Trash2 } from 'lucide-react'

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
  const [campiExtra, setCampiExtra] = useState({})
  const [fotoScontrino, setFotoScontrino] = useState(null)
  const [fotoPreview, setFotoPreview] = useState(null)
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

  const handleCategoriaChange = (nuovaCategoria) => {
    setCategoria(nuovaCategoria)
    setCampiExtra({})
    setImporto('')
    setDescrizione('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!importo) { setMsg({ ok: false, text: 'Inserisci importo' }); return }
    setSending(true); setMsg(null)
    try {
      const importoNorm = String(importo).replace(',', '.')
      let descFinale = descrizione || 'Spesa rapida'
      if (categoria === 'carburante' && campiExtra.tipo_carburante) {
        const tipo = campiExtra.tipo_carburante
        const litri = campiExtra.litri ? `${campiExtra.litri}L` : ''
        const prezzo = campiExtra.prezzo_al_litro ? `a ${campiExtra.prezzo_al_litro}€/L` : ''
        const luogo = [campiExtra.stazione, campiExtra.indirizzo, campiExtra.citta].filter(Boolean).join(', ')
        descFinale = `Carburante: ${[tipo, litri, prezzo, luogo ? `- ${luogo}` : ''].filter(Boolean).join(' ')}`
      } else if ((categoria === 'pranzo' || categoria === 'cena') && campiExtra.esercente) {
        const luogo = [campiExtra.indirizzo, campiExtra.citta].filter(Boolean).join(', ')
        const tipo = categoria === 'pranzo' ? 'Pranzo' : 'Cena'
        descFinale = `${tipo}: ${campiExtra.esercente}${luogo ? ` - ${luogo}` : ''}`
      } else if (categoria === 'alloggio' && campiExtra.hotel) {
        const parti = [campiExtra.hotel]
        if (campiExtra.notti) parti.push(`${campiExtra.notti} notti`)
        if (campiExtra.check_in && campiExtra.check_out) parti.push(`${campiExtra.check_in} → ${campiExtra.check_out}`)
        descFinale = parti.join(' - ')
      } else if (categoria === 'pedaggi' && campiExtra.da) {
        descFinale = `Autostrada ${campiExtra.da} → ${campiExtra.a || ''}`
      } else if (categoria === 'trasporto' && campiExtra.tipo) {
        const parti = [campiExtra.tipo]
        if (campiExtra.da) parti.push(`${campiExtra.da} → ${campiExtra.a || ''}`)
        descFinale = parti.join(' ')
      }
      const fd = new FormData()
      fd.append('importo', importoNorm)
      fd.append('categoria', categoria)
      fd.append('descrizione', descFinale)
      if (fotoScontrino) fd.append('scontrino', fotoScontrino)
      await aggiungiSpesaRapida(fd)
      setMsg({ ok: true, text: 'Spesa aggiunta!' })
      setImporto(''); setDescrizione(''); setCampiExtra({}); setFotoScontrino(null); setFotoPreview(null); setShowModal(false)
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
      setFotoScontrino(file)
      setFotoPreview(URL.createObjectURL(file))
      const fd = new FormData()
      fd.append('immagine', file)
      fd.append('categoria', categoria)
      const res = await scanScontrino(fd)
      if (res.successo && res.dati) {
        const d = res.dati
        if (d.importo) setImporto(String(d.importo))
        setCampiExtra(d)
        if (categoria === 'carburante' && d.tipo_carburante) {
          const litri = d.litri ? `${d.litri}L` : ''
          const prezzo = d.prezzo_al_litro ? `a ${d.prezzo_al_litro}€/L` : ''
          const luogo = [d.stazione, d.indirizzo, d.citta].filter(Boolean).join(' - ')
          setDescrizione(`Carburante: ${[d.tipo_carburante, litri, prezzo, luogo ? `- ${luogo}` : ''].filter(Boolean).join(' ')}`)
        } else if ((categoria === 'pranzo' || categoria === 'cena') && d.esercente) {
          const luogo = [d.indirizzo, d.citta].filter(Boolean).join(', ')
          const tipo = categoria === 'pranzo' ? 'Pranzo' : 'Cena'
          setDescrizione(`${tipo}: ${d.esercente}${luogo ? ` - ${luogo}` : ''}`)
        } else if (categoria === 'alloggio' && d.hotel) {
          setDescrizione(`${d.hotel} - ${d.notti || ''} notti`)
        }
        setMsg({ ok: true, text: 'Scontrino letto — verifica i dati' })
      }
    } catch {
      setMsg({ ok: false, text: 'Errore scansione — inserisci manualmente' })
    } finally {
      setScanning(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const eliminaNota = async (notaId) => {
    if (!window.confirm('Eliminare questa nota spese?')) return
    setActionLoading(notaId)
    try {
      await fetch(`/api/hr/spese/${notaId}/elimina/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access')}` }
      })
      setMsg({ ok: true, text: 'Nota eliminata' })
      setTimeout(() => load(), 500)
    } catch {
      setMsg({ ok: false, text: 'Errore eliminazione' })
    } finally { setActionLoading(null) }
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
              {n.created_at && <div className="text-[11px] text-[#9E96AB]">Creata il {n.created_at}</div>}
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
                          {s.scontrino && (
                            <a href={s.scontrino} target="_blank" rel="noopener noreferrer">
                              <img src={s.scontrino} alt="Scontrino"
                                className="w-16 h-16 object-cover rounded-lg border-[1.5px] border-[#EEECF4] mt-2" />
                            </a>
                          )}
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
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => eliminaNota(n.id)}
                      disabled={actionLoading === n.id}
                      className="flex-1 h-11 rounded-xl text-[14px] font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{background:'#FEE2E2', color:'#DC2626'}}>
                      <Trash2 size={16} /> Elimina
                    </button>
                    <button onClick={() => handleInvia(n.id)}
                      disabled={actionLoading === n.id}
                      className="flex-1 h-11 bg-[var(--accent)] rounded-xl text-[14px] font-bold text-white flex items-center justify-center gap-2 disabled:opacity-50">
                      {actionLoading === n.id
                        ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <><Send size={16} /> Invia al titolare</>}
                    </button>
                  </div>
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
        <div className="text-right">
          <div className="text-lg font-bold text-[var(--accent)]">€ {data?.totale_mese?.toFixed(2) || '0.00'}</div>
          <div className="text-[10px] font-semibold text-[#9E96AB] uppercase tracking-wide">Totale mese</div>
        </div>
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

      {(() => {
        const noteBozza = noteList.filter(n => n.stato === 'bozza')
        const noteProcessate = noteList.filter(n => n.stato !== 'bozza')

        // Raggruppa per mese/anno
        const mesiMap = {}
        noteProcessate.forEach(n => {
          const key = `${n.anno}-${String(n.mese).padStart(2,'0')}`
          if (!mesiMap[key]) mesiMap[key] = {
            label: `${n.nome_mese} ${n.anno}`,
            key,
            note: [],
            totale: 0
          }
          mesiMap[key].note.push(n)
          mesiMap[key].totale += Number(n.totale)
        })
        const mesiOrdinati = Object.values(mesiMap).sort((a,b) => b.key.localeCompare(a.key))

        return (
          <>
            {mesiOrdinati.length > 0 && (
              <div className="space-y-3 mb-2">
                {mesiOrdinati.map(mese => (
                  <div key={mese.key} className="mb-2">
                    <button
                      onClick={() => setOpenNota(openNota === mese.key ? null : mese.key)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-[#F8F7FA] rounded-xl mb-2">
                      <div className="flex items-center gap-2">
                        <motion.div animate={{ rotate: openNota === mese.key ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown size={16} className="text-[#9E96AB]" />
                        </motion.div>
                        <span className="text-[14px] font-bold text-[#1A1523]">{mese.label}</span>
                        <span className="text-[11px] text-[#9E96AB]">{mese.note.length} note</span>
                      </div>
                      <span className="text-[14px] font-bold text-[var(--accent)]">€ {mese.totale.toFixed(2)}</span>
                    </button>
                    <AnimatePresence initial={false}>
                      {openNota === mese.key && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden space-y-2 pl-2"
                        >
                          {mese.note.map(n => renderNota(n, tab === 'team'))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            )}

            {noteProcessate.length > 0 && noteBozza.length > 0 && (
              <div className="flex items-center gap-3 my-3">
                <div className="flex-1 h-px bg-[#EEECF4]" />
                <span className="text-[11px] font-bold text-[#9E96AB] uppercase tracking-wider">Da inviare</span>
                <div className="flex-1 h-px bg-[#EEECF4]" />
              </div>
            )}

            {noteBozza.length > 0 && (
              <div className="space-y-3">
                {noteBozza.map(n => renderNota(n, tab === 'team'))}
              </div>
            )}

            {noteList.length === 0 && (
              <div className="text-center py-12">
                <Receipt size={40} className="mx-auto mb-3 text-[#EEECF4]" />
                <p className="text-[#9E96AB]">{tab === 'team' ? 'Nessuna nota spese inviata' : 'Nessuna nota spese'}</p>
              </div>
            )}
          </>
        )
      })()}

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
                <div className="mb-4">
                  <label className="block text-[13px] font-semibold text-[#6B6478] mb-2">Categoria</label>
                  <select value={categoria} onChange={e => handleCategoriaChange(e.target.value)}
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
                <input type="file" ref={fileRef} accept="image/*" capture="environment" className="hidden" onChange={handleScan} />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={scanning}
                  className="w-full h-12 bg-[#F8F7FA] border-[1.5px] border-dashed border-[#EEECF4] rounded-xl text-[14px] font-semibold text-[#6B6478] flex items-center justify-center gap-2 mb-4 active:scale-[0.98] transition-transform disabled:opacity-50">
                  {scanning ? <div className="w-4 h-4 border-2 border-[#9E96AB]/30 border-t-[#9E96AB] rounded-full animate-spin" /> : <Camera size={18} />}
                  {scanning ? 'Analisi con Claude Vision...' : 'Scansiona scontrino'}
                </button>

                {fotoPreview && (
                  <div className="relative mb-4">
                    <img src={fotoPreview} alt="Scontrino"
                      className="w-full max-h-40 object-contain rounded-xl border-[1.5px] border-[#EEECF4]" />
                    <button type="button" onClick={() => { setFotoScontrino(null); setFotoPreview(null) }}
                      className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow text-[#9E96AB]">
                      <X size={14} />
                    </button>
                  </div>
                )}

                {categoria === 'carburante' && (
                  <div className="space-y-3 mb-4 p-3 bg-[#F8F7FA] rounded-xl">
                    <p className="text-[11px] font-bold text-[#9E96AB] uppercase tracking-wider">Dettaglio carburante</p>
                    <div>
                      <p className="text-[11px] text-[#9E96AB] mb-1">Tipo carburante</p>
                      <select value={campiExtra.tipo_carburante || ''} onChange={e => setCampiExtra(p => ({...p, tipo_carburante: e.target.value}))}
                        className="w-full px-3 py-2.5 bg-white border-[1.5px] border-[#EEECF4] rounded-xl text-[14px] focus:border-[var(--accent)] outline-none">
                        <option value="">Seleziona tipo</option>
                        <option value="Benzina">Benzina</option>
                        <option value="Diesel">Diesel</option>
                        <option value="GPL">GPL</option>
                        <option value="Metano">Metano</option>
                        <option value="Elettrico">Elettrico</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-[#9E96AB] mb-1">Litri</p>
                        <input type="number" step="0.01" placeholder="es. 30.75" value={campiExtra.litri || ''}
                          onChange={e => setCampiExtra(p => ({...p, litri: e.target.value}))}
                          className="w-full px-3 py-2.5 bg-white border-[1.5px] border-[#EEECF4] rounded-xl text-[14px] focus:border-[var(--accent)] outline-none" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-[#9E96AB] mb-1">Prezzo €/L</p>
                        <input type="number" step="0.001" placeholder="es. 1.649" value={campiExtra.prezzo_al_litro || ''}
                          onChange={e => setCampiExtra(p => ({...p, prezzo_al_litro: e.target.value}))}
                          className="w-full px-3 py-2.5 bg-white border-[1.5px] border-[#EEECF4] rounded-xl text-[14px] focus:border-[var(--accent)] outline-none" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] text-[#9E96AB] mb-1">Nome stazione</p>
                      <input type="text" placeholder="es. ENI, Q8, MY OIL" value={campiExtra.stazione || ''}
                        onChange={e => setCampiExtra(p => ({...p, stazione: e.target.value}))}
                        className="w-full px-3 py-2.5 bg-white border-[1.5px] border-[#EEECF4] rounded-xl text-[14px] focus:border-[var(--accent)] outline-none" />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-[#9E96AB] mb-1">Indirizzo</p>
                        <input type="text" placeholder="es. Via Aurelia 538" value={campiExtra.indirizzo || ''}
                          onChange={e => setCampiExtra(p => ({...p, indirizzo: e.target.value}))}
                          className="w-full px-3 py-2.5 bg-white border-[1.5px] border-[#EEECF4] rounded-xl text-[14px] focus:border-[var(--accent)] outline-none" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-[#9E96AB] mb-1">Città</p>
                        <input type="text" placeholder="es. Roma" value={campiExtra.citta || ''}
                          onChange={e => setCampiExtra(p => ({...p, citta: e.target.value}))}
                          className="w-full px-3 py-2.5 bg-white border-[1.5px] border-[#EEECF4] rounded-xl text-[14px] focus:border-[var(--accent)] outline-none" />
                      </div>
                    </div>
                  </div>
                )}

                {(categoria === 'pranzo' || categoria === 'cena') && (
                  <div className="space-y-3 mb-4 p-3 bg-[#F8F7FA] rounded-xl">
                    <p className="text-[11px] font-bold text-[#9E96AB] uppercase tracking-wider">Dettaglio pasto</p>
                    <input type="text" placeholder="Ristorante / Bar" value={campiExtra.esercente || ''}
                      onChange={e => setCampiExtra(p => ({...p, esercente: e.target.value}))}
                      className="w-full px-3 py-2.5 bg-white border-[1.5px] border-[#EEECF4] rounded-xl text-[14px] focus:border-[var(--accent)] outline-none" />
                    <input type="text" placeholder="Indirizzo" value={campiExtra.indirizzo || ''}
                      onChange={e => setCampiExtra(p => ({...p, indirizzo: e.target.value}))}
                      className="w-full px-3 py-2.5 bg-white border-[1.5px] border-[#EEECF4] rounded-xl text-[14px] focus:border-[var(--accent)] outline-none" />
                    <input type="text" placeholder="Città" value={campiExtra.citta || ''}
                      onChange={e => setCampiExtra(p => ({...p, citta: e.target.value}))}
                      className="w-full px-3 py-2.5 bg-white border-[1.5px] border-[#EEECF4] rounded-xl text-[14px] focus:border-[var(--accent)] outline-none" />
                    <div className="flex gap-2">
                      <input type="number" step="1" placeholder="N. persone" value={campiExtra.persone || ''}
                        onChange={e => setCampiExtra(p => ({...p, persone: e.target.value}))}
                        className="flex-1 px-3 py-2.5 bg-white border-[1.5px] border-[#EEECF4] rounded-xl text-[14px] focus:border-[var(--accent)] outline-none" />
                      <input type="number" step="0.01" placeholder="Coperto €" value={campiExtra.coperto || ''}
                        onChange={e => setCampiExtra(p => ({...p, coperto: e.target.value}))}
                        className="flex-1 px-3 py-2.5 bg-white border-[1.5px] border-[#EEECF4] rounded-xl text-[14px] focus:border-[var(--accent)] outline-none" />
                    </div>
                  </div>
                )}

                {categoria === 'alloggio' && (
                  <div className="space-y-3 mb-4 p-3 bg-[#F8F7FA] rounded-xl">
                    <p className="text-[11px] font-bold text-[#9E96AB] uppercase tracking-wider">Dettaglio alloggio</p>
                    <input type="text" placeholder="Nome hotel" value={campiExtra.hotel || ''}
                      onChange={e => setCampiExtra(p => ({...p, hotel: e.target.value}))}
                      className="w-full px-3 py-2.5 bg-white border-[1.5px] border-[#EEECF4] rounded-xl text-[14px] focus:border-[var(--accent)] outline-none" />
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <p className="text-[11px] text-[#9E96AB] mb-1">Check-in</p>
                        <input type="date" value={campiExtra.check_in || ''}
                          onChange={e => setCampiExtra(p => ({...p, check_in: e.target.value}))}
                          className="w-full px-3 py-2.5 bg-white border-[1.5px] border-[#EEECF4] rounded-xl text-[14px] focus:border-[var(--accent)] outline-none" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] text-[#9E96AB] mb-1">Check-out</p>
                        <input type="date" value={campiExtra.check_out || ''}
                          onChange={e => setCampiExtra(p => ({...p, check_out: e.target.value}))}
                          className="w-full px-3 py-2.5 bg-white border-[1.5px] border-[#EEECF4] rounded-xl text-[14px] focus:border-[var(--accent)] outline-none" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <input type="number" step="1" placeholder="Notti" value={campiExtra.notti || ''}
                        onChange={e => setCampiExtra(p => ({...p, notti: e.target.value}))}
                        className="flex-1 px-3 py-2.5 bg-white border-[1.5px] border-[#EEECF4] rounded-xl text-[14px] focus:border-[var(--accent)] outline-none" />
                      <input type="number" step="0.01" placeholder="€/notte" value={campiExtra.importo_notte || ''}
                        onChange={e => setCampiExtra(p => ({...p, importo_notte: e.target.value}))}
                        className="flex-1 px-3 py-2.5 bg-white border-[1.5px] border-[#EEECF4] rounded-xl text-[14px] focus:border-[var(--accent)] outline-none" />
                    </div>
                  </div>
                )}

                {categoria === 'pedaggi' && (
                  <div className="space-y-3 mb-4 p-3 bg-[#F8F7FA] rounded-xl">
                    <p className="text-[11px] font-bold text-[#9E96AB] uppercase tracking-wider">Dettaglio pedaggi</p>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Da (es. Milano)" value={campiExtra.da || ''}
                        onChange={e => setCampiExtra(p => ({...p, da: e.target.value}))}
                        className="flex-1 px-3 py-2.5 bg-white border-[1.5px] border-[#EEECF4] rounded-xl text-[14px] focus:border-[var(--accent)] outline-none" />
                      <input type="text" placeholder="A (es. Roma)" value={campiExtra.a || ''}
                        onChange={e => setCampiExtra(p => ({...p, a: e.target.value}))}
                        className="flex-1 px-3 py-2.5 bg-white border-[1.5px] border-[#EEECF4] rounded-xl text-[14px] focus:border-[var(--accent)] outline-none" />
                    </div>
                  </div>
                )}

                {categoria === 'trasporto' && (
                  <div className="space-y-3 mb-4 p-3 bg-[#F8F7FA] rounded-xl">
                    <p className="text-[11px] font-bold text-[#9E96AB] uppercase tracking-wider">Dettaglio trasporto</p>
                    <select value={campiExtra.tipo || ''} onChange={e => setCampiExtra(p => ({...p, tipo: e.target.value}))}
                      className="w-full px-3 py-2.5 bg-white border-[1.5px] border-[#EEECF4] rounded-xl text-[14px] focus:border-[var(--accent)] outline-none">
                      <option value="">Tipo trasporto</option>
                      <option value="taxi">Taxi / NCC</option>
                      <option value="treno">Treno</option>
                      <option value="aereo">Aereo</option>
                      <option value="bus">Bus / Pullman</option>
                      <option value="altro">Altro</option>
                    </select>
                    <div className="flex gap-2">
                      <input type="text" placeholder="Da" value={campiExtra.da || ''}
                        onChange={e => setCampiExtra(p => ({...p, da: e.target.value}))}
                        className="flex-1 px-3 py-2.5 bg-white border-[1.5px] border-[#EEECF4] rounded-xl text-[14px] focus:border-[var(--accent)] outline-none" />
                      <input type="text" placeholder="A" value={campiExtra.a || ''}
                        onChange={e => setCampiExtra(p => ({...p, a: e.target.value}))}
                        className="flex-1 px-3 py-2.5 bg-white border-[1.5px] border-[#EEECF4] rounded-xl text-[14px] focus:border-[var(--accent)] outline-none" />
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-[13px] font-semibold text-[#6B6478] mb-2">Importo (€) *</label>
                  <input type="number" step="0.01" value={importo} onChange={e => setImporto(e.target.value.replace(',', '.'))}
                    placeholder="25.50"
                    className="w-full px-4 py-3.5 bg-[#F8F7FA] border-[1.5px] border-[#EEECF4] rounded-xl text-[16px] font-bold focus:border-[var(--accent)] outline-none" required />
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
