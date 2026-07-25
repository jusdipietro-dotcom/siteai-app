import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { LocationSection } from '@/components/site/sections/LocationSection'
import type { ContactData } from '@/types'

const base: ContactData = {
  phone: '+54 11 5555-5555',
  whatsapp: '',
  email: '',
  address: 'Av. Corrientes 1234',
  city: 'Buenos Aires',
  province: 'CABA',
  country: 'Argentina',
  schedule: 'Lun a Vie: 9 a 18',
}

function html(contact: Partial<ContactData>) {
  return renderToStaticMarkup(
    <LocationSection anchor="ubicacion" color="#6366f1" contact={{ ...base, ...contact }} />
  )
}

describe('LocationSection', () => {
  it('renders a keyless Google Maps embed built from the full address', () => {
    const h = html({})
    expect(h).toContain('www.google.com/maps')
    expect(h).toContain('output=embed')
    // Address parts joined and URL-encoded into the query.
    expect(h).toContain(encodeURIComponent('Av. Corrientes 1234, Buenos Aires, CABA'))
  })

  it('URL-encodes the address so it cannot break out of the src', () => {
    const h = html({ address: 'Calle "rara" & rота', city: '', province: '' })
    // No raw quote/ampersand from the address leaks into the attribute value.
    expect(h).toContain('output=embed')
    expect(h).not.toContain('q=Calle "rara"')
  })

  it('shows schedule and phone when present, and a directions link', () => {
    const h = html({})
    expect(h).toContain('Lun a Vie: 9 a 18')
    expect(h).toContain('+54 11 5555-5555')
    expect(h).toContain('Cómo llegar')
  })

  it('omits schedule and phone rows when they are empty', () => {
    const h = html({ schedule: '', phone: '' })
    // Match the ROW label specifically — the section title is "Horarios y
    // ubicación", so a bare "Horarios" check would false-positive on the title.
    expect(h).not.toContain('location-item-label">Horarios')
    expect(h).not.toContain('location-item-label">Teléfono')
    // But the address + map still render.
    expect(h).toContain('output=embed')
    expect(h).toContain('location-item-label">Dirección')
  })

  it('renders nothing without an address (no map target)', () => {
    const h = html({ address: '', city: '', province: '' })
    expect(h).toBe('')
  })
})
