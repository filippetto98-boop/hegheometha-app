import { useState, useEffect, useMemo } from 'react'
import { getTurniMese, getDashboard } from '../api/hr'
import Layout from '../components/Layout'
import Card from '../components/Card'
import LoadingSpinner from '../components/LoadingSpinner'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const GIORNI = ['LUN','MAR','MER','GIO','VEN','SAB','DOM']
const MESI_NOME = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']

const TURNO_COLORI = {
  normale: 'bg-blue-600',
  straordinario: 'bg-orange-600',
  reperibilita: 'bg-green-700',
  riposo: 'bg-gray-500',
}

const ASSENZA_COLORI = {
  ferie: 'bg-cyan-500',
  malattia: 'bg-red-500',
  permesso: 'bg-yellow-500',
  maternita: 'bg-purple-500',
  altro: 'bg-gray-400',
}

const ASSENZA_LABEL = {
  ferie: 'Ferie', malattia: 'Malattia', permesso: 'Permesso', maternita: 'Maternità', altro: 'Assenza',
}

function toStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function formatData(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export default function Calendario() {
  const oggi = new Date()
  oggi.setHours(0,0,0,0)
  const [mese, setMese] = useState(oggi.getMonth())
  const [anno, setAnno] = useState(oggi.getFullYear())
  const [turni, setTurni] = useState([])
  const [assenze, setAssenze] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(null)

  const meseStr = `${anno}-${String(mese+1).padStart(2,'0')}`

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getTurniMese(meseStr).then(d => setTurni(d.turni || [])).catch(() => {}),
      getDashboard().then(d => {
        const approvate = (d.richieste_assenza || []).filter(r => r.stato === 'approvata')
        setAssenze(approvate)
      }).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [meseStr])

  const turniMap = useMemo(() => {
    const map = {}
    turni.forEach(t => { map[t.data] = t })
    return map
  }, [turni])

  // Mappa assenze: per ogni giorno che cade in un range approvato
  const assenzeMap = useMemo(() => {
    const map = {}
    assenze.forEach(a => {
      const start = new Date(a.data_inizio + 'T00:00:00')
      const end = new Date(a.data_fine + 'T00:00:00')
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        map[toStr(d)] = a
      }
    })
    return map
  }, [assenze])

  const griglia = useMemo(() => {
    const primo = new Date(anno, mese, 1)
    let startDay = primo.getDay() - 1
    if (startDay < 0) startDay = 6
    const ultimoGiorno = new Date(anno, mese + 1, 0).getDate()
    const celle = []
    const prevUltimo = new Date(anno, mese, 0).getDate()
    for (let i = startDay - 1; i >= 0; i--) celle.push({ giorno: prevUltimo - i, fuori: true })
    for (let d = 1; d <= ultimoGiorno; d++) celle.push({ giorno: d, fuori: false })
    const rimanenti = 7 - (celle.length % 7)
    if (rimanenti < 7) for (let d = 1; d <= rimanenti; d++) celle.push({ giorno: d, fuori: true })
    return celle
  }, [mese, anno])

  const prev = () => { setSelectedDay(null); if (mese === 0) { setMese(11); setAnno(a => a-1) } else setMese(m => m-1) }
  const next = () => { setSelectedDay(null); if (mese === 11) { setMese(0); setAnno(a => a+1) } else setMese(m => m+1) }

  const handleDayClick = (dataStr) => {
    setSelectedDay(selectedDay === dataStr ? null : dataStr)
  }

  const GIORNI_FULL = ['Lun','Mar','Mer','Gio','Ven','Sab','Dom']
  const settimanaSelezionata = useMemo(() => {
    if (!selectedDay) return null
    const d = new Date(selectedDay + 'T00:00:00')
    let dayOfWeek = d.getDay() - 1
    if (dayOfWeek < 0) dayOfWeek = 6
    const lunedi = new Date(d)
    lunedi.setDate(d.getDate() - dayOfWeek)
    const giorni = []
    for (let i = 0; i < 7; i++) {
      const g = new Date(lunedi)
      g.setDate(lunedi.getDate() + i)
      const ds = toStr(g)
      giorni.push({ data: ds, giorno: GIORNI_FULL[i], turno: turniMap[ds] || null, assenza: assenzeMap[ds] || null })
    }
    return giorni
  }, [selectedDay, turniMap, assenzeMap])

  return (
    <Layout>
      <h1 className="text-xl font-bold text-[#1A1523] tracking-tight mb-4">📅 I miei turni</h1>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <button type="button" onClick={prev} className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#F8F7FA] active:scale-90 transition-transform">
            <ChevronLeft size={20} className="text-[#6B6478]" />
          </button>
          <span className="text-[16px] font-bold text-[#1A1523]">{MESI_NOME[mese]} {anno}</span>
          <button type="button" onClick={next} className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#F8F7FA] active:scale-90 transition-transform">
            <ChevronRight size={20} className="text-[#6B6478]" />
          </button>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {GIORNI.map(g => (
            <div key={g} className="text-center text-[10px] font-bold text-[#9E96AB] tracking-wider py-1">{g}</div>
          ))}
        </div>

        {loading ? (
          <div className="py-8"><LoadingSpinner /></div>
        ) : (
          <div className="grid grid-cols-7">
            {griglia.map((cella, i) => {
              if (cella.fuori) return (
                <div key={`f${i}`} className="h-16 flex flex-col items-center justify-start pt-1.5">
                  <span className="text-[13px] text-[#D4D0DC]">{cella.giorno}</span>
                </div>
              )

              const dataStr = `${anno}-${String(mese+1).padStart(2,'0')}-${String(cella.giorno).padStart(2,'0')}`
              const turno = turniMap[dataStr]
              const assenza = assenzeMap[dataStr]
              const isOggi = dataStr === toStr(oggi)

              const isSelected = dataStr === selectedDay

              return (
                <div key={dataStr} className={`h-16 flex flex-col items-center justify-start pt-1.5 cursor-pointer rounded-xl transition-colors ${
                  isSelected ? 'bg-[var(--accent)]/[0.08]' : ''
                }`} onClick={() => handleDayClick(dataStr)}>
                  <span className={`text-[13px] font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                    isOggi ? 'bg-[var(--accent)] text-white font-bold'
                    : isSelected ? 'ring-2 ring-[var(--accent)] font-bold text-[var(--accent)]'
                    : 'text-[#1A1523]'
                  }`}>
                    {cella.giorno}
                  </span>
                  {assenza ? (
                    <span className={`mt-0.5 text-[7px] font-bold text-white px-1 py-0.5 rounded leading-none ${
                      ASSENZA_COLORI[assenza.tipo] || 'bg-gray-400'
                    }`}>
                      {ASSENZA_LABEL[assenza.tipo] || 'Ass.'}
                    </span>
                  ) : turno ? (
                    <span className={`mt-0.5 text-[8px] font-bold text-white px-1 py-0.5 rounded leading-none ${
                      TURNO_COLORI[turno.tipo] || 'bg-gray-400'
                    }`}>
                      {turno.tipo === 'riposo' ? 'R' : `${turno.ora_inizio?.slice(0,5)}`}
                    </span>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Legenda */}
      <div className="flex flex-wrap gap-2 mt-3 px-1">
        {Object.entries(TURNO_COLORI).map(([k, c]) => (
          <div key={k} className="flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${c}`} />
            <span className="text-[10px] text-[#9E96AB] capitalize">{k}</span>
          </div>
        ))}
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500" /><span className="text-[10px] text-[#9E96AB]">Ferie</span></div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-[10px] text-[#9E96AB]">Malattia</span></div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /><span className="text-[10px] text-[#9E96AB]">Permesso</span></div>
      </div>

      {/* Vista settimana selezionata */}
      {settimanaSelezionata && (
        <Card className="mt-4">
          <p className="text-[11px] font-bold text-[#9E96AB] uppercase tracking-wider mb-3">
            Settimana del {formatData(selectedDay)}
          </p>
          {settimanaSelezionata.map(g => (
            <div key={g.data} className={`flex items-center justify-between py-3 border-b border-[#EEECF4] last:border-0 ${
              g.data === selectedDay ? 'bg-[var(--accent)]/[0.06] -mx-3 px-3 rounded-lg' : ''
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 text-center">
                  <div className="text-[10px] font-bold text-[#9E96AB] uppercase">{g.giorno}</div>
                  <div className="text-[14px] font-bold text-[#1A1523]">{formatData(g.data).slice(0,5)}</div>
                </div>
                {g.assenza ? (
                  <span className={`text-[12px] font-bold text-white px-2.5 py-1 rounded-lg ${ASSENZA_COLORI[g.assenza.tipo] || 'bg-gray-400'}`}>
                    {ASSENZA_LABEL[g.assenza.tipo] || 'Assenza'}
                  </span>
                ) : g.turno ? (
                  <span className={`text-[12px] font-bold text-white px-2.5 py-1 rounded-lg ${TURNO_COLORI[g.turno.tipo] || 'bg-gray-400'}`}>
                    {g.turno.tipo === 'riposo' ? 'Riposo' : `${g.turno.ora_inizio?.slice(0,5)}–${g.turno.ora_fine?.slice(0,5)}`}
                  </span>
                ) : (
                  <span className="text-[12px] text-[#D4D0DC]">—</span>
                )}
              </div>
              {g.turno && g.turno.tipo !== 'riposo' && (
                <span className="text-[10px] font-bold text-[#9E96AB] uppercase">{g.turno.tipo}</span>
              )}
            </div>
          ))}
        </Card>
      )}

      {/* Lista turni del mese */}
      {turni.length > 0 && (
        <Card className="mt-4">
          <p className="text-[11px] font-bold text-[#9E96AB] uppercase tracking-wider mb-3">Dettaglio turni</p>
          {turni.map(t => (
            <div key={t.id} className="flex items-center justify-between py-3 border-b border-[#EEECF4] last:border-0">
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${TURNO_COLORI[t.tipo] || 'bg-gray-400'}`} />
                <div>
                  <span className="text-[14px] font-semibold text-[#1A1523]">{formatData(t.data)}</span>
                  {t.note && <p className="text-[11px] text-[#9E96AB] mt-0.5">{t.note}</p>}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[14px] font-semibold text-[#6B6478]">
                  {t.tipo === 'riposo' ? 'Riposo' : `${t.ora_inizio?.slice(0,5)}–${t.ora_fine?.slice(0,5)}`}
                </span>
                <p className="text-[10px] font-bold text-[#9E96AB] uppercase">{t.tipo}</p>
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Lista assenze approvate */}
      {assenze.length > 0 && (
        <Card className="mt-4">
          <p className="text-[11px] font-bold text-[#9E96AB] uppercase tracking-wider mb-3">Assenze approvate</p>
          {assenze.map(a => (
            <div key={a.id} className="flex items-center justify-between py-3 border-b border-[#EEECF4] last:border-0">
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${ASSENZA_COLORI[a.tipo] || 'bg-gray-400'}`} />
                <span className="text-[14px] font-semibold text-[#1A1523]">{ASSENZA_LABEL[a.tipo] || a.tipo}</span>
              </div>
              <span className="text-[13px] text-[#6B6478]">{formatData(a.data_inizio)} → {formatData(a.data_fine)}</span>
            </div>
          ))}
        </Card>
      )}

      {!loading && turni.length === 0 && assenze.length === 0 && (
        <div className="text-center py-8 text-[#9E96AB] text-sm mt-4">
          Nessun turno o assenza questo mese
        </div>
      )}
    </Layout>
  )
}
