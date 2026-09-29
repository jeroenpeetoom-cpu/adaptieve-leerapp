import type { Database } from './database'

/** Versie van het formaat van het back-upbestand. */
export const BACKUPFORMAAT = 1

export interface Backup {
  app: 'woordexpeditie'
  formaat: number
  gemaakt: string
  tabellen: Record<string, unknown[]>
}

/** Foto's gaan niet mee: die worden na het bevestigen toch verwijderd, en ze maken het bestand groot. */
function zonderFotos(rij: unknown): unknown {
  if (rij && typeof rij === 'object' && 'foto' in rij) {
    const { foto: _foto, ...rest } = rij as Record<string, unknown>
    return rest
  }
  return rij
}

export async function maakBackup(db: Database, tijdstip: string): Promise<Backup> {
  const tabellen: Record<string, unknown[]> = {}
  for (const tabel of db.tables) {
    if (tabel.name === 'meta') {
      // De datum van de laatste back-up hoort niet in de back-up zelf.
      tabellen.meta = (await tabel.toArray()).filter((r: { sleutel: string }) => r.sleutel !== 'laatsteBackup')
    } else {
      tabellen[tabel.name] = (await tabel.toArray()).map(zonderFotos)
    }
  }
  return { app: 'woordexpeditie', formaat: BACKUPFORMAAT, gemaakt: tijdstip, tabellen }
}

export class OngeldigeBackup extends Error {}

export function leesBackup(tekst: string): Backup {
  let data: unknown
  try {
    data = JSON.parse(tekst)
  } catch {
    throw new OngeldigeBackup('Dit bestand is geen back-up van Woordexpeditie.')
  }
  const b = data as Partial<Backup>
  if (b?.app !== 'woordexpeditie' || typeof b.tabellen !== 'object' || b.tabellen === null) {
    throw new OngeldigeBackup('Dit bestand is geen back-up van Woordexpeditie.')
  }
  if (typeof b.formaat !== 'number' || b.formaat > BACKUPFORMAAT) {
    throw new OngeldigeBackup('Deze back-up is gemaakt met een nieuwere versie van de app. Werk de app eerst bij.')
  }
  return b as Backup
}

/** Vervangt alle gegevens door die uit de back-up. Onbekende tabellen worden genegeerd. */
export async function zetBackupTerug(db: Database, backup: Backup): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    for (const tabel of db.tables) {
      await tabel.clear()
      const rijen = backup.tabellen[tabel.name]
      if (Array.isArray(rijen) && rijen.length > 0) await tabel.bulkAdd(rijen)
    }
  })
}
