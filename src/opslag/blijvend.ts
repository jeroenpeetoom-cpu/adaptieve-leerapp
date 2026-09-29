/** Vraagt de browser om de gegevens niet zomaar te wissen (bijvoorbeeld bij weinig ruimte). */
export async function vraagBlijvendeOpslag(): Promise<boolean> {
  if (!navigator.storage?.persist) return false
  if (await navigator.storage.persisted()) return true
  return navigator.storage.persist()
}

export async function isBlijvend(): Promise<boolean | null> {
  if (!navigator.storage?.persisted) return null
  return navigator.storage.persisted()
}
