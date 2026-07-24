/**
 * Curated stock-photo searches per rubro.
 *
 * Facing an empty search box, an owner types their business name and gets
 * nothing useful. These are the one-click starting points instead: a handful of
 * searches that actually look like their trade.
 *
 * Labels are what the owner reads (Spanish); queries are what we send to Pexels
 * (English, which has far deeper coverage than the Spanish index).
 */
export interface StockSuggestion {
  label: string
  query: string
}

const GENERIC: StockSuggestion[] = [
  { label: 'Oficina', query: 'modern office workspace' },
  { label: 'Equipo', query: 'business team working' },
  { label: 'Atención', query: 'customer service handshake' },
  { label: 'Abstracto', query: 'abstract background minimal' },
]

export const STOCK_SUGGESTIONS: Record<string, StockSuggestion[]> = {
  restaurante: [
    { label: 'Platos', query: 'gourmet food plate' },
    { label: 'Salón', query: 'restaurant interior cozy' },
    { label: 'Cocina', query: 'chef cooking kitchen' },
    { label: 'Café', query: 'coffee cafe table' },
    { label: 'Delivery', query: 'food delivery takeaway' },
  ],
  abogado: [
    { label: 'Estudio', query: 'law office desk' },
    { label: 'Justicia', query: 'justice scales gavel' },
    { label: 'Reunión', query: 'lawyer client meeting' },
    { label: 'Biblioteca', query: 'law books library' },
    { label: 'Firma', query: 'signing contract document' },
  ],
  consultorio: [
    { label: 'Consultorio', query: 'medical office clean' },
    { label: 'Atención', query: 'doctor patient consultation' },
    { label: 'Equipamiento', query: 'medical equipment stethoscope' },
    { label: 'Bienestar', query: 'health wellness care' },
    { label: 'Recepción', query: 'clinic reception waiting room' },
  ],
  contable: [
    { label: 'Números', query: 'accounting calculator finance' },
    { label: 'Escritorio', query: 'accountant desk documents' },
    { label: 'Gráficos', query: 'financial charts analysis' },
    { label: 'Reunión', query: 'business advisor meeting' },
    { label: 'Impuestos', query: 'tax paperwork forms' },
  ],
  inmobiliaria: [
    { label: 'Casas', query: 'modern house exterior' },
    { label: 'Interiores', query: 'living room interior design' },
    { label: 'Llaves', query: 'house keys handover' },
    { label: 'Departamentos', query: 'apartment building city' },
    { label: 'Fachadas', query: 'residential facade architecture' },
  ],
  gimnasio: [
    { label: 'Pesas', query: 'gym weights training' },
    { label: 'Funcional', query: 'functional training workout' },
    { label: 'Clases', query: 'fitness group class' },
    { label: 'Cardio', query: 'running treadmill cardio' },
    { label: 'Yoga', query: 'yoga stretching wellness' },
  ],
  peluqueria: [
    { label: 'Corte', query: 'hair salon haircut' },
    { label: 'Color', query: 'hair coloring salon' },
    { label: 'Salón', query: 'beauty salon interior' },
    { label: 'Peinados', query: 'hairstyle woman beauty' },
    { label: 'Estética', query: 'manicure nails beauty' },
  ],
  boutique: [
    { label: 'Ropa', query: 'clothing rack boutique' },
    { label: 'Vidriera', query: 'fashion store window' },
    { label: 'Accesorios', query: 'fashion accessories bag' },
    { label: 'Moda', query: 'fashion model style' },
    { label: 'Local', query: 'boutique store interior' },
  ],
  agencia: [
    { label: 'Equipo', query: 'creative team brainstorming' },
    { label: 'Diseño', query: 'graphic design workspace' },
    { label: 'Marketing', query: 'digital marketing analytics' },
    { label: 'Reunión', query: 'agency meeting presentation' },
    { label: 'Redes', query: 'social media phone content' },
  ],
  arquitectura: [
    { label: 'Planos', query: 'architecture blueprint plans' },
    { label: 'Obra', query: 'construction site building' },
    { label: 'Diseño', query: 'modern architecture design' },
    { label: 'Interiores', query: 'minimal interior architecture' },
    { label: 'Maquetas', query: 'architectural model desk' },
  ],
  fotografo: [
    { label: 'Cámara', query: 'photographer camera lens' },
    { label: 'Estudio', query: 'photo studio lighting' },
    { label: 'Retratos', query: 'portrait photography natural light' },
    { label: 'Eventos', query: 'wedding photography celebration' },
    { label: 'Producto', query: 'product photography setup' },
  ],
  profesional: GENERIC,
}

/** Suggested searches for a rubro; falls back to a generic professional set. */
export function stockSuggestionsFor(id: string | undefined | null): StockSuggestion[] {
  return (id && STOCK_SUGGESTIONS[id]) || GENERIC
}
