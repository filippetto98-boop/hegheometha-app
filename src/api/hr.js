import api from './client'

export const getDashboard = () => api.get('/api/hr/dashboard/').then(r => r.data)
export const getTitolareDashboard = () => api.get('/api/hr/titolare/dashboard/').then(r => r.data)
export const timbra = (tipo, lat, lng) => api.post('/api/hr/timbra/', { tipo, latitudine: lat, longitudine: lng }).then(r => r.data)
