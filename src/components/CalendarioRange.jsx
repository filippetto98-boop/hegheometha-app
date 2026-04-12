import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const GIORNI = ['LUN','MAR','MER','GIO','VEN','SAB','DOM']
const MESI = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre']

function toStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function fromStr(s) {
  if (!s) return null
  const [y,m,d] = s.split('-').map(Number)
  return new Date(y, m-1, d)
}

export default function CalendarioRange({ dataInizio, dataFine, onChange }) {
  const oggi = new Date()
  oggi.setHours(0,0,0,0)
  const [mese, setMese] = useState(dataInizio ? fromStr(dataInizio).getMonth() : oggi.getMonth())
  const [anno, setAnno] = useState(dataInizio ? fromStr(dataInizio).getFullYear() : oggi.getFullYear())

  const griglia = useMemo(() => {
    const primo = new Date(anno, mese, 1)
    // Lunedì=0 ... Domenica=6
    let startDay = primo.getDay() - 1
    if (startDay < 0) startDay = 6
    const ultimoGiorno = new Date(anno, mese + 1, 0).getDate()
    const celle = []
    for (let i = 0; i < startDay; i++) celle.push(null)
    for (let d = 1; d <= ultimoGiorno; d++) celle.push(d)
    return celle
  }, [mese, anno])

  const handleClick = (giorno) => {
    if (!giorno) return
    const data = new Date(anno, mese, giorno)
    data.setHours(0,0,0,0)
    if (data < oggi) return
    const str = toStr(data)

    if (!dataInizio || (dataInizio && dataFine)) {
      // Primo click o reset
      onChange(str, '')
    } else if (str === dataInizio) {
      // Click sullo stesso → reset
      onChange('', '')
    } else if (str < dataInizio) {
      // Click prima dell'inizio → nuovo inizio
      onChange(str, '')
    } else {
      // Secondo click → fine
      onChange(dataInizio, str)
    }
  }

  const prev = () => {
    if (mese === 0) { setMese(11); setAnno(a => a - 1) }
    else setMese(m => m - 1)
  }
  const next = () => {
    if (mese === 11) { setMese(0); setAnno(a => a + 1) }
    else setMese(m => m + 1)
  }

  const inizio = fromStr(dataInizio)
  const fine = fromStr(dataFine)

  return (
    <div className="mb-4">
      {/* Header mese */}
      <div className="flex items-center justify-between mb-3">
        <button type="button" onClick={prev}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#F8F7FA] active:scale-90 transition-transform">
          <ChevronLeft size={18} className="text-[#6B6478]" />
        </button>
        <span className="text-[15px] font-bold text-[#1A1523]">{MESI[mese]} {anno}</span>
        <button type="button" onClick={next}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#F8F7FA] active:scale-90 transition-transform">
          <ChevronRight size={18} className="text-[#6B6478]" />
        </button>
      </div>

      {/* Nomi giorni */}
      <div className="grid grid-cols-7 mb-1">
        {GIORNI.map(g => (
          <div key={g} className="text-center text-[10px] font-bold text-[#9E96AB] tracking-wider py-1">{g}</div>
        ))}
      </div>

      {/* Griglia giorni */}
      <div className="grid grid-cols-7">
        {griglia.map((giorno, i) => {
          if (!giorno) return <div key={`e${i}`} />

          const data = new Date(anno, mese, giorno)
          data.setHours(0,0,0,0)
          const str = toStr(data)
          const passato = data < oggi
          const isInizio = str === dataInizio
          const isFine = str === dataFine
          const isSelected = isInizio || isFine
          const inRange = inizio && fine && data > inizio && data < fine
          const isOggi = data.getTime() === oggi.getTime()

          let bg = ''
          let textCl = 'text-[#1A1523]'
          let rounded = 'rounded-xl'
          let fontW = 'font-medium'

          if (passato) {
            textCl = 'text-[#D4D0DC]'
          } else if (isSelected) {
            bg = 'bg-[var(--accent)]'
            textCl = 'text-white'
            fontW = 'font-bold'
            if (isInizio && dataFine) rounded = 'rounded-l-xl rounded-r-none'
            if (isFine && dataInizio) rounded = 'rounded-r-xl rounded-l-none'
            if (isInizio && !dataFine) rounded = 'rounded-xl'
          } else if (inRange) {
            bg = 'bg-[var(--accent)]/[0.12]'
            rounded = 'rounded-none'
          }

          return (
            <button
              key={str}
              type="button"
              disabled={passato}
              onClick={() => handleClick(giorno)}
              className={`h-11 flex items-center justify-center text-[14px] transition-all ${bg} ${textCl} ${rounded} ${fontW} ${
                !passato && !isSelected ? 'active:scale-90' : ''
              }`}
            >
              {isOggi && !isSelected ? (
                <span className="relative">
                  {giorno}
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[var(--accent)]" />
                </span>
              ) : giorno}
            </button>
          )
        })}
      </div>
    </div>
  )
}
