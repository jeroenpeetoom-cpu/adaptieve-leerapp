import { useLayoutEffect, useRef, type ChangeEvent } from 'react'

/**
 * Een invoerveld dat meegroeit met de tekst: een lange zin loopt door op een volgende regel in plaats van
 * buiten het veld te verdwijnen, zodat je niet in het veld hoeft te scrollen. Enter maakt geen nieuwe regel.
 */
export function Groeiveld({
  value,
  onChange,
  lang,
}: {
  value: string
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void
  lang: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const veld = ref.current
    if (!veld) return
    veld.style.height = 'auto'
    veld.style.height = `${veld.scrollHeight}px`
  }, [value])
  return (
    <textarea
      ref={ref}
      className="invoer groeiveld"
      rows={1}
      value={value}
      lang={lang}
      autoCapitalize="off"
      spellCheck={false}
      onChange={onChange}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.preventDefault()
      }}
    />
  )
}
