import { useState, useEffect } from 'react'
import { getMagazzino } from '../api/magazzino'
import Layout from '../components/Layout'
import Card from '../components/Card'
import LoadingSpinner from '../components/LoadingSpinner'
import { Package, AlertTriangle, Search } from 'lucide-react'

export default function Magazzino() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getMagazzino().then(setData).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout><LoadingSpinner /></Layout>

  const prodotti = (data?.prodotti || []).filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout>
      <h1 className="text-xl font-bold text-[#1A1523] tracking-tight mb-4">📦 Magazzino</h1>

      {data?.prodotti_sotto_soglia > 0 && (
        <div className="flex items-center gap-2 bg-amber-50 text-amber-800 text-sm font-semibold px-4 py-3 rounded-xl mb-4">
          <AlertTriangle size={16} />
          {data.prodotti_sotto_soglia} prodotti con scorte basse
        </div>
      )}

      <div className="relative mb-4">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9E96AB]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cerca prodotto..."
          className="w-full pl-11 pr-4 py-3.5 bg-white border-[1.5px] border-[#EEECF4] rounded-xl text-[15px] focus:border-[var(--accent)] outline-none transition-all"
        />
      </div>

      <div className="space-y-3">
        {prodotti.map(p => (
          <Card key={p.id} className="!p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#F8F7FA] flex items-center justify-center text-xl flex-shrink-0">
                {p.foto ? <img src={`${import.meta.env.VITE_API_URL}${p.foto}`} className="w-full h-full object-cover rounded-xl" onError={(e) => { e.target.style.display='none'; e.target.parentElement.textContent='📦' }} /> : '📦'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-[#1A1523] truncate">{p.nome}</div>
                <div className="text-sm text-[#6B6478]">€ {p.prezzo} · Qty: {p.quantita_disponibile}</div>
              </div>
              {p.sotto_soglia && (
                <span className="text-xs font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg flex-shrink-0">⚠️</span>
              )}
            </div>
          </Card>
        ))}
        {prodotti.length === 0 && (
          <p className="text-center text-[#9E96AB] py-8">Nessun prodotto trovato</p>
        )}
      </div>
    </Layout>
  )
}
