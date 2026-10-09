// Weergave-instellingen per apparaat: speels of rustig, en verhoogd contrast (spec layout, beslissingen 5 en 6).
// Licht of donker volgt de telefoon; daar is geen instelling voor.

export type Weergave = 'speels' | 'rustig'
export type Contrast = 'normaal' | 'hoog'

const WEERGAVE = 'weergave'
const CONTRAST = 'contrast'

function lees<T extends string>(sleutel: string, standaard: T, toegestaan: T[]): T {
  try {
    const waarde = localStorage.getItem(sleutel) as T | null
    return waarde && toegestaan.includes(waarde) ? waarde : standaard
  } catch {
    return standaard
  }
}

function schrijf(sleutel: string, waarde: string) {
  try {
    localStorage.setItem(sleutel, waarde)
  } catch {
    // Zonder opslag geldt de keuze alleen tot de app sluit.
  }
}

export const leesWeergave = () => lees<Weergave>(WEERGAVE, 'speels', ['speels', 'rustig'])
export const leesContrast = () => lees<Contrast>(CONTRAST, 'normaal', ['normaal', 'hoog'])

/** Zet de weergave op de pagina, zodat de opmaak erop kan reageren. */
export function pasWeergaveToe(weergave = leesWeergave(), contrast = leesContrast()) {
  document.documentElement.dataset.weergave = weergave
  document.documentElement.dataset.contrast = contrast
}

export function zetWeergave(weergave: Weergave) {
  schrijf(WEERGAVE, weergave)
  pasWeergaveToe()
}

export function zetContrast(contrast: Contrast) {
  schrijf(CONTRAST, contrast)
  pasWeergaveToe()
}
