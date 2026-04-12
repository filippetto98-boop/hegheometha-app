import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import { motion } from 'framer-motion'
import { LogIn, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(username, password)
      navigate(user.ruolo === 'titolare' ? '/titolare' : '/dashboard', { replace: true })
    } catch {
      setError('Username o password non corretti')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center px-5"
      style={{ background: 'linear-gradient(135deg, #1A0533 0%, #2D0A5F 50%, #1A1523 100%)' }}>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-20 h-20 rounded-[22px] mx-auto mb-5 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #9e28b5, #6A1B9A)', boxShadow: '0 8px 32px rgba(158,40,181,0.4)' }}
          >
            <span className="text-white text-3xl font-extrabold">H</span>
          </motion.div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Hegheometha</h1>
          <p className="text-white/50 text-sm mt-1">Gestionale aziendale</p>
        </div>

        {/* Card form */}
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-[24px] p-7 shadow-[0_8px_40px_rgba(0,0,0,0.2)]"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-50 text-red-600 text-sm font-semibold px-4 py-3 rounded-xl mb-5"
            >
              {error}
            </motion.div>
          )}

          <div className="mb-5">
            <label className="block text-[13px] font-semibold text-[#6B6478] mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-4 bg-[#F8F7FA] border-[1.5px] border-[#EEECF4] rounded-2xl text-[16px] font-medium text-[#1A1523] placeholder-[#9E96AB] focus:border-[#9e28b5] focus:bg-white focus:ring-4 focus:ring-purple-500/10 outline-none transition-all"
              placeholder="es. mario.rossi"
              autoComplete="username"
              required
            />
          </div>

          <div className="mb-7">
            <label className="block text-[13px] font-semibold text-[#6B6478] mb-2">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-4 pr-12 bg-[#F8F7FA] border-[1.5px] border-[#EEECF4] rounded-2xl text-[16px] font-medium text-[#1A1523] placeholder-[#9E96AB] focus:border-[#9e28b5] focus:bg-white focus:ring-4 focus:ring-purple-500/10 outline-none transition-all"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9E96AB]">
                {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.97 }}
            className="w-full h-[56px] rounded-2xl font-bold text-[16px] flex items-center justify-center gap-2 text-white transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #9e28b5, #6A1B9A)', boxShadow: '0 4px 20px rgba(158,40,181,0.4)' }}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><LogIn size={20} /> Accedi</>
            )}
          </motion.button>
        </motion.form>
      </motion.div>
    </div>
  )
}
