'use client'

import { useState, useEffect } from 'react'
import { CalendarDays, Clock, MapPin, Phone, Check, Loader2, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'

type Config = {
  slug: string
  businessName: string
  businessType: string
  colorPrimary: string
  colorAccent: string
  practiceAreas: string[]
  scheduleDays: number[]
  slotDuration: number
  phone: string
  address: string
  logoUrl: string | null
}

type Slot = { hora: string; disponible: boolean }
type ViewState = 'calendar' | 'form' | 'success'

const DAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function TurnosBookingClient({ config }: { config: Config }) {
  const [view, setView] = useState<ViewState>('calendar')
  const [currentMonth, setCurrentMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [slots, setSlots] = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Form state
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [dni, setDni] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [area, setArea] = useState(config.practiceAreas[0] || '')
  const [notas, setNotas] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Fetch slots when date selected
  useEffect(() => {
    if (!selectedDate) return
    setLoadingSlots(true)
    setSlots([])
    setSelectedSlot(null)
    fetch(`/api/turnos/public/${config.slug}/disponibilidad?fecha=${selectedDate}`)
      .then(r => r.json())
      .then(data => setSlots(data.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false))
  }, [selectedDate, config.slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre || !apellido || !telefono || !email || !selectedDate || !selectedSlot) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch(`/api/turnos/public/${config.slug}/reservar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre, apellido, dni, telefono, email,
          area, fecha: selectedDate, hora: selectedSlot, notas,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setView('success')
      } else {
        setError(data.error || 'Error al reservar. Intenta de nuevo.')
      }
    } catch {
      setError('Error de conexion. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  // Calendar helpers
  const today = new Date()
  const todayStr = formatDate(today)
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()

  const isDayAvailable = (dayNum: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNum)
    const dateStr = formatDate(date)
    if (dateStr < todayStr) return false
    return config.scheduleDays.includes(date.getDay())
  }

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  const canGoPrev = currentMonth > new Date(today.getFullYear(), today.getMonth(), 1)

  const selectedDateDisplay = selectedDate
    ? (() => {
      const d = new Date(selectedDate + 'T12:00:00')
      return `${DAY_SHORT[d.getDay()]} ${d.getDate()} de ${MONTH_NAMES[d.getMonth()]}`
    })()
    : ''

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="text-white py-8 px-4" style={{ backgroundColor: config.colorPrimary }}>
        <div className="max-w-2xl mx-auto text-center">
          {config.logoUrl && (
            <img src={config.logoUrl} alt={config.businessName} className="h-16 w-auto mx-auto mb-4 rounded-xl object-contain" />
          )}
          <h1 className="text-2xl font-bold">{config.businessName}</h1>
          <p className="text-white/70 text-sm mt-1">{config.businessType}</p>
          <div className="flex items-center justify-center gap-4 mt-3 text-white/60 text-xs">
            {config.phone && (
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" /> {config.phone}
              </span>
            )}
            {config.address && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {config.address}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Success */}
        {view === 'success' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: config.colorAccent + '20' }}>
              <Check className="w-8 h-8" style={{ color: config.colorAccent }} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Turno reservado</h2>
            <p className="text-gray-500 text-sm mb-1">
              {selectedDateDisplay} a las {selectedSlot}hs
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Vas a recibir un email de confirmacion a {email}.
            </p>
            <button
              onClick={() => {
                setView('calendar')
                setSelectedDate(null)
                setSelectedSlot(null)
                setNombre(''); setApellido(''); setDni(''); setTelefono(''); setEmail(''); setNotas('')
              }}
              className="text-sm font-medium px-6 py-2.5 rounded-xl text-white"
              style={{ backgroundColor: config.colorPrimary }}
            >
              Reservar otro turno
            </button>
          </div>
        )}

        {/* Calendar + Slots */}
        {view === 'calendar' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={prevMonth}
                  disabled={!canGoPrev}
                  aria-label="Mes anterior"
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h2 className="font-semibold text-gray-900">
                  {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h2>
                <button type="button" onClick={nextMonth} aria-label="Mes siguiente" className="p-2 rounded-lg hover:bg-gray-100">
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="p-4">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAY_SHORT.map(d => (
                    <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
                  ))}
                </div>
                {/* Days grid */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDayOfWeek }, (_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: daysInMonth }, (_, i) => {
                    const dayNum = i + 1
                    const dateStr = formatDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayNum))
                    const available = isDayAvailable(dayNum)
                    const isSelected = selectedDate === dateStr
                    const isToday = dateStr === todayStr

                    return (
                      <button
                        key={dayNum}
                        disabled={!available}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-colors ${
                          isSelected
                            ? 'text-white shadow-sm'
                            : available
                              ? 'text-gray-700 hover:bg-gray-100'
                              : 'text-gray-300 cursor-not-allowed'
                        } ${isToday && !isSelected ? 'ring-2 ring-inset' : ''}`}
                        style={
                          isSelected
                            ? { backgroundColor: config.colorPrimary }
                            : isToday && !isSelected
                              ? { outlineColor: config.colorPrimary }
                              : undefined
                        }
                      >
                        {dayNum}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Slots */}
            {selectedDate && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <h3 className="font-semibold text-gray-900 text-sm mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Horarios disponibles
                </h3>
                <p className="text-xs text-gray-400 mb-4">{selectedDateDisplay}</p>

                {loadingSlots ? (
                  <div className="flex items-center gap-2 text-gray-400 py-6 justify-center">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm">Cargando horarios...</span>
                  </div>
                ) : slots.length === 0 ? (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    No hay horarios disponibles para esta fecha.
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {slots.map(slot => (
                      <button
                        key={slot.hora}
                        disabled={!slot.disponible}
                        onClick={() => setSelectedSlot(slot.hora)}
                        className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                          selectedSlot === slot.hora
                            ? 'text-white border-transparent'
                            : slot.disponible
                              ? 'text-gray-700 border-gray-200 hover:border-gray-300'
                              : 'text-gray-300 border-gray-100 cursor-not-allowed line-through'
                        }`}
                        style={selectedSlot === slot.hora ? { backgroundColor: config.colorAccent } : undefined}
                      >
                        {slot.hora}
                      </button>
                    ))}
                  </div>
                )}

                {selectedSlot && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setView('form')}
                      className="w-full py-3 rounded-xl text-white font-medium text-sm transition-opacity hover:opacity-90"
                      style={{ backgroundColor: config.colorAccent }}
                    >
                      Continuar con la reserva
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Booking Form */}
        {view === 'form' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <button type="button" onClick={() => setView('calendar')} aria-label="Volver al calendario" className="p-2 rounded-lg hover:bg-gray-100">
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h2 className="font-semibold text-gray-900 text-sm">Completar reserva</h2>
                <p className="text-xs text-gray-400">{selectedDateDisplay} — {selectedSlot}hs</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tb-nombre" className="text-xs font-medium text-gray-600 mb-1 block">Nombre *</label>
                  <input
                    id="tb-nombre"
                    type="text"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="tb-apellido" className="text-xs font-medium text-gray-600 mb-1 block">Apellido *</label>
                  <input
                    id="tb-apellido"
                    type="text"
                    value={apellido}
                    onChange={e => setApellido(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="tb-dni" className="text-xs font-medium text-gray-600 mb-1 block">DNI</label>
                  <input
                    id="tb-dni"
                    type="text"
                    value={dni}
                    onChange={e => setDni(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="tb-telefono" className="text-xs font-medium text-gray-600 mb-1 block">Telefono *</label>
                  <input
                    id="tb-telefono"
                    type="tel"
                    value={telefono}
                    onChange={e => setTelefono(e.target.value)}
                    required
                    placeholder="11-5555-0000"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="tb-email" className="text-xs font-medium text-gray-600 mb-1 block">Email *</label>
                <input
                  id="tb-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              {config.practiceAreas.length > 1 && (
                <div>
                  <label htmlFor="tb-area" className="text-xs font-medium text-gray-600 mb-1 block">Area de consulta</label>
                  <select
                    id="tb-area"
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white"
                  >
                    {config.practiceAreas.map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Notas o motivo de consulta</label>
                <textarea
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  rows={3}
                  placeholder="Breve descripcion del motivo de la consulta..."
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 text-red-600 text-sm bg-red-50 rounded-xl p-3">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl text-white font-medium text-sm transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ backgroundColor: config.colorAccent }}
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Reservando...</>
                ) : (
                  <><CalendarDays className="w-4 h-4" /> Confirmar turno</>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-gray-300 mt-8">
          Turnos Online por{' '}
          <a href="https://automaticialab.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-500">
            Automatic IA Lab
          </a>
        </p>
      </main>
    </div>
  )
}
