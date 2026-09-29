import { createWorker, OEM, type Worker } from 'tesseract.js'
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
  }).catch((fout) => {
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
async function voorbereiden(bestand: Blob): Promise<HTMLCanvasElement> {
  const beeld = await createImageBitmap(bestand, { imageOrientation: 'from-image' })
  const schaal = Math.min(1, MAX_ZIJDE / Math.max(beeld.width, beeld.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(beeld.width * schaal)
  canvas.height = Math.round(beeld.height * schaal)
  canvas.getContext('2d')!.drawImage(beeld, 0, 0, canvas.width, canvas.height)
  beeld.close()
  return canvas
}

/** Herkent de tekst op een foto, volledig op het apparaat. */
export async function herken(bestand: Blob, opVoortgang: Voortgang): Promise<HerkendeRegel[]> {
  voortgang = opVoortgang
  try {
    const w = await krijgWorker()
    const canvas = await voorbereiden(bestand)
    const { data } = await w.recognize(canvas, { rotateAuto: true }, { blocks: true, text: false })
    return (data.blocks ?? []).flatMap((blok) =>
      blok.paragraphs.flatMap((alinea) =>
        alinea.lines.map((regel) => ({
          woorden: regel.words.map((w) => ({
            tekst: w.text,
            zekerheid: w.confidence,
            x0: w.bbox.x0,
            x1: w.bbox.x1,
          })),
        })),
      ),
    )
  } catch (fout) {
    throw new Herkenningsfout(fout instanceof Error ? fout.message : String(fout))
  } finally {
    voortgang = () => {}
  }
}
