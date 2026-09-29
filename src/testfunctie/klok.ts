/** De instelbare klok van de testfunctie: de echte tijd plus een aantal dagen. */
export function testTijd(verschuivingDagen: number): string {
  return new Date(Date.now() + verschuivingDagen * 86_400_000).toISOString()
}
