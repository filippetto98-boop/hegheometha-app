import { useState, useEffect, useMemo } from 'react'
import { getTurniMese } from '../api/hr'
import Layout from '../components/Layout'
import Card from '../components/Card'
import LoadingSpinner from '../components/LoadingSpinner'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const GIORNI = ['LUN','MAR','MER','GIO','VEN','SAB','DOM']
const MESI = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']

const TURNO_COLORI = {
  normale: 'bg-blue-600',
  straordinario: 'bg-orange-600',
  reperibilita: 'bg-green-700',
  riposo: 'bg-gray-500',
}

function toStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

export default function Calendario() {
  const oggi = new Date()
  oggi.setHours(0,0,0,0)
  const [mese, setMese] = useState(oggi.getMonth())
  const [anno, setAnno] = useState(oggi.getFullYear())
  const [turni, setTurni] = useState([])
  const [loading, setLoading] = useState(true)

  const meseStr = `${anno}-${String(mese+1).padStart(2,'0')}`

  useEffect(() => {
    setLoading(true)
    getTurniMese(meseStr).then(d => setTurni(d.turni || [])).catch(() => {}).finally(() => setLoading(false))
  }, [meseStr])

  const turniMap = useMemo(() => {
    const map = {}
    turni.forEach(t => { map[t.data] = t })
    return map
  }, [turni])

  const griglia = useMemo(() => {
    const primo = new Date(anno, mese, 1)
    let startDay = primo.getDay() - 1
    if (startDay < 0) startDay = 6
    const ultimoGiorno = new Date(anno, mese + 1, 0).getDate()

    const celle = []
    // Giorni mese precedente (grigi)
    const prevUltimo = new Date(anno, mese, 0).getDate()
    for (let i = startDay - 1; i >= 0; i--) {
      celle.push({ giorno: prevUltimo - i, fuori: true })
    }
    // Giorni mese corrente
    for (let d = 1; d <= ultimoGiorno; d++) {
      celle.push({ giorno: d, fuori: false })
    }
    // Giorni mese successivo (grigi)
    const rimanenti = 7 - (celle.length % 7)
    if (rimanenti < 7) {
      for (let d = 1; d <= rimanenti; d++) {
        celle.push({ giorno: d, fuori: true })
      }
    }
    return celle
  }, [mese, anno])

  const prev = () => {
    if (mese === 0) { setMese(11); setAnno(a => a - 1) }
    else setMese(m => m - 1)
  }
  const next = () => {
    if (mese === 11) { setMese(0); setAnno(a => a + 1) }
    else setMese(m => m + 1)
  }

  return (
    <Layout>
      <h1 className="text-xl font-bold text-[#1A1523] tracking-tight mb-4">📅 I miei turni</h1>

      <Card>
        {/* Header mese */}
        <div className="flex items-center justify-between mb-4">
          <button type="button" onClick={prev}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#F8F7FA] active:scale-90 transition-transform">
            <ChevronLeft size={20} className="text-[#6B6478]" />
          </button>
          <span className="text-[16px] font-bold text-[#1A1523]">{MESI[mese]} {anno}</span>
          <button type="button" onClick={next}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#F8F7FA] active:scale-90 transition-transform">
            <ChevronRight size={20} className="text-[#6B6478]" />
          </button>
        </div>

        {/* Nomi giorni */}
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
              if (cella.fuori) {
                return (
                  <div key={`f${i}`} className="h-16 flex flex-col items-center justify-start pt-1.5">
                    <span className="text-[13px] text-[#D4D0DC]">{cella.giorno}</span>
                  </div>
                )
              }

              const dataStr = `${anno}-${String(mese+1).padStart(2,'0')}-${String(cella.giorno).padStart(2,'0')}`
              const turno = turniMap[dataStr]
              const isOggi = dataStr === toStr(oggi)

              return (
                <div key={dataStr} className="h-16 flex flex-col items-center justify-start pt-1.5">
                  <span className={`text-[13px] font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                    isOggi ? 'bg-[var(--accent)] text-white font-bold' : 'text-[#1A1523]'
                  }`}>
                    {cella.giorno}
                  </span>
                  {turno && (
                    <span className={`mt-0.5 text-[8px] font-bold text-white px-1 py-0.5 rounded leading-none ${
                      TURNO_COLORI[turno.tipo] || 'bg-gray-400'
                    }`}>
                      {turno.tipo === 'riposo' ? 'R' : `${turno.ora_inizio?.slice(0,5)}`}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Lista turni del mese */}
      {turni.length > 0 && (
        <Card className="mt-4">
          <p className="text-[11px] font-bold text-[#9E96AB] uppercase tracking-wider mb-3">Dettaglio turni</p>
          {turni.map(t => (
            <div key={t.id} className="flex items-center justify-between py-3 border-b border-[#EEECF4] last:border-0">
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${TURNO_COLORI[t.tipo] || 'bg-gray-400'}`} />
                <div>
                  <span className="text-[14px] font-semibold text-[#1A1523]">{t.data}</span>
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

      {!loading && turni.length === 0 && (
        <div className="text-center py-8 text-[#9E96AB] text-sm mt-4">
          Nessun turno questo mese
        </div>
      )}
    </Layout>
  )
}
