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
async function voorbereiden(bestand: Blob, maxZijde = MAX_ZIJDE): Promise<HTMLCanvasElement> {
  const beeld = await createImageBitmap(bestand, { imageOrientation: 'from-image' })
  const schaal = Math.min(1, maxZijde / Math.max(beeld.width, beeld.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(beeld.width * schaal)
  canvas.height = Math.round(beeld.height * schaal)
  canvas.getContext('2d')!.drawImage(beeld, 0, 0, canvas.width, canvas.height)
  beeld.close()
  return canvas
}

/** Groter, zwart-wit en met meer contrast: leest vaak beter bij gekleurde achtergronden en kleine letters. */
function voorbewerkt(bron: HTMLCanvasElement, schaal: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bron.width * schaal)
  canvas.height = Math.round(bron.height * schaal)
  const ctx = canvas.getContext('2d')!
  ctx.filter = 'grayscale(1) contrast(1.6)'
  ctx.drawImage(bron, 0, 0, canvas.width, canvas.height)
  return canvas
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
  /** De herkende regels per variant (gewoon en voorbewerkt), in pixels van het gewone beeld. */
  varianten: HerkendeRegel[][]
  breedte: number
  hoogte: number
  canvas: HTMLCanvasElement
}

/**
 * Herkent een foto twee keer: gewoon en voorbewerkt (groter, zwart-wit, meer contrast). Samen vinden
 * die meer, vooral op een kaart of een gekleurd werkblad. Een werkblad leest het best als kolom,
 * een kaart als losse tekst.
 */
export async function herkenTweeKeer(bestand: Blob, opmaak: Opmaak, opVoortgang: Voortgang): Promise<Herkenningen> {
  try {
    const w = await krijgWorker()
    const canvas = await voorbereiden(bestand, 1600)
    voortgang = (f, stap) => opVoortgang(f / 2, stap)
    const gewoon = await herkenCanvas(w, canvas, opmaak, 1)
    voortgang = (f, stap) => opVoortgang(0.5 + f / 2, stap)
    const groot = await herkenCanvas(w, voorbewerkt(canvas, 2), opmaak, 2)
    return { varianten: [gewoon, groot], breedte: canvas.width, hoogte: canvas.height, canvas }
  } catch (fout) {
    throw new Herkenningsfout(fout instanceof Error ? fout.message : String(fout))
  } finally {
    voortgang = () => {}
  }
}
