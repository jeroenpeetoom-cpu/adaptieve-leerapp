import { createWorker, OEM, PSM, type Worker } from 'tesseract.js'
import type { HerkendeRegel } from '../bronverwerking'

/** Voortgang van de herkenning, 0 tot 1, met een korte Nederlandse omschrijving. */
export type Voortgang = (fractie: number, stap: string) => void

export const MAX_BESTANDSGROOTTE = 20 * 1024 * 1024
const MAX_ZIJDE = 2400

const STAPPEN: Record<string, string> = {
  'loading tesseract core': 'Tekstherkenning laden',
  'initializing tesseract': 'Tekstherkenning starten',
  'loading language traineddata': 'Taalbestanden laden',
  'initializing api': 'Voorbereiden',
  'recognizing text': 'Tekst herkennen',
}

let voortgang: Voortgang = () => {}
let worker: Promise<Worker> | null = null

function krijgWorker(): Promise<Worker> {
  const basis = `${import.meta.env.BASE_URL}tesseract/`
  worker ??= createWorker(['eng', 'nld'], OEM.LSTM_ONLY, {
    workerPath: `${basis}worker.min.js`,
    corePath: `${basis}core`,
    langPath: `${basis}lang`,
    workerBlobURL: false,
    // De service worker bewaart de bestanden al; dubbel opslaan in de browser is niet nodig.
    cacheMethod: 'none',
    logger: (m) => voortgang(m.progress ?? 0, STAPPEN[m.status] ?? 'Bezig'),
  })
    .then(async (w) => {
      // "Losse tekst": vindt elk stukje tekst met zijn positie. Werkt beter bij kolommen en tabellen
      // naast elkaar; de bronverwerking koppelt de stukjes daarna op positie.
      await w.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT })
      return w
    })
    .catch((fout) => {
      worker = null
      throw fout
    })
  return worker
}

export class Herkenningsfout extends Error {}

/** Controleert het bestand vóór de herkenning. Geeft een melding terug, of null als het goed is. */
export function controleerBestand(bestand: File): string | null {
  if (!bestand.type.startsWith('image/')) return 'Dit is geen foto. Kies een foto van je woordenlijst.'
  if (bestand.size > MAX_BESTANDSGROOTTE) return 'Deze foto is te groot. Maak een nieuwe foto of kies een kleinere.'
  return null
}

/** Verkleint grote foto's voor snellere herkenning, en draait ze rechtop. */
export async function voorbereiden(bestand: Blob, maxZijde = MAX_ZIJDE): Promise<HTMLCanvasElement> {
  const beeld = await createImageBitmap(bestand, { imageOrientation: 'from-image' })
  const schaal = Math.min(1, maxZijde / Math.max(beeld.width, beeld.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(beeld.width * schaal)
  canvas.height = Math.round(beeld.height * schaal)
  canvas.getContext('2d')!.drawImage(beeld, 0, 0, canvas.width, canvas.height)
  beeld.close()
  return canvas
}

export type Variant = 'gewoon' | 'grijs' | 'rood'

/** Een voorbewerkt canvas nooit groter dan dit (geheugen van de telefoon). */
const MAX_ZIJDE_VOORBEWERKT = 4000

/**
 * Twee keer zo groot, en één kanaal genormaliseerd: de donkerste 1% wordt zwart, de lichtste 1% wit,
 * en alles daartussen wordt opgerekt. "grijs" leest donkere tekst op lichte vlakken beter, "rood"
 * leest tekst op rode en oranje vlakken beter (die worden in het rode kanaal licht).
 */
function voorbewerkt(bron: HTMLCanvasElement, variant: Exclude<Variant, 'gewoon'>): { canvas: HTMLCanvasElement; schaal: number } {
  const schaal = Math.min(2, MAX_ZIJDE_VOORBEWERKT / Math.max(bron.width, bron.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bron.width * schaal)
  canvas.height = Math.round(bron.height * schaal)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(bron, 0, 0, canvas.width, canvas.height)
  const beeld = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const d = beeld.data
  const waarde = (i: number) => (variant === 'rood' ? d[i] : 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2])
  const histogram = new Array<number>(256).fill(0)
  for (let i = 0; i < d.length; i += 4) histogram[Math.round(waarde(i))]++
  const totaal = d.length / 4
  let laag = 0
  let hoog = 255
  for (let som = 0; laag < 255 && (som += histogram[laag]) < totaal * 0.01; laag++);
  for (let som = 0; hoog > 0 && (som += histogram[hoog]) < totaal * 0.01; hoog--);
  const bereik = Math.max(1, hoog - laag)
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.max(0, Math.min(255, ((waarde(i) - laag) / bereik) * 255))
    d[i] = d[i + 1] = d[i + 2] = v
  }
  ctx.putImageData(beeld, 0, 0)
  return { canvas, schaal }
}

type Opmaak = 'losse tekst' | 'kolom'

async function herkenCanvas(w: Worker, canvas: HTMLCanvasElement, opmaak: Opmaak, schaal: number): Promise<HerkendeRegel[]> {
  await w.setParameters({ tessedit_pageseg_mode: opmaak === 'kolom' ? PSM.SINGLE_COLUMN : PSM.SPARSE_TEXT })
  const { data } = await w.recognize(canvas, { rotateAuto: true }, { blocks: true, text: false })
  return (data.blocks ?? []).flatMap((blok) =>
    blok.paragraphs.flatMap((alinea) =>
      alinea.lines.map((regel) => ({
        woorden: regel.words.map((w) => ({
          tekst: w.text,
          zekerheid: w.confidence,
          x0: w.bbox.x0 / schaal,
          x1: w.bbox.x1 / schaal,
          y0: w.bbox.y0 / schaal,
          y1: w.bbox.y1 / schaal,
        })),
      })),
    ),
  )
}

/** Herkent de tekst op een foto, volledig op het apparaat. */
export async function herken(bestand: Blob, opVoortgang: Voortgang): Promise<HerkendeRegel[]> {
  voortgang = opVoortgang
  try {
    const w = await krijgWorker()
    return await herkenCanvas(w, await voorbereiden(bestand), 'losse tekst', 1)
  } catch (fout) {
    throw new Herkenningsfout(fout instanceof Error ? fout.message : String(fout))
  } finally {
    voortgang = () => {}
  }
}

export interface Herkenningen {
  /** De herkende regels per variant, in pixels van het gewone beeld. */
  varianten: HerkendeRegel[][]
  breedte: number
  hoogte: number
  canvas: HTMLCanvasElement
}

/**
 * Herkent een foto meerdere keren, gewoon en voorbewerkt. Samen vinden die veel meer, vooral op een
 * gekleurde kaart of werkblad. Een werkblad leest het best als kolom, een kaart als losse tekst.
 */
export async function herkenMeermaals(
  bestand: Blob,
  opmaak: Opmaak,
  varianten: Variant[],
  opVoortgang: Voortgang,
): Promise<Herkenningen> {
  try {
    const w = await krijgWorker()
    const canvas = await voorbereiden(bestand)
    const uit: HerkendeRegel[][] = []
    for (const [i, variant] of varianten.entries()) {
      voortgang = (f, stap) => opVoortgang((i + f) / varianten.length, stap)
      if (variant === 'gewoon') uit.push(await herkenCanvas(w, canvas, opmaak, 1))
      else {
        const { canvas: voor, schaal } = voorbewerkt(canvas, variant)
        uit.push(await herkenCanvas(w, voor, opmaak, schaal))
      }
    }
    return { varianten: uit, breedte: canvas.width, hoogte: canvas.height, canvas }
  } catch (fout) {
    throw new Herkenningsfout(fout instanceof Error ? fout.message : String(fout))
  } finally {
    voortgang = () => {}
  }
}
