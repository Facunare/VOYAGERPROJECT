import { useEffect, useState } from 'react'

const TITLE_MODE_KEY = 'voyager-hide-story-titles'
const HOTKEY_FLAG = '__voyagerTitleModeHotkeyInstalled'

export function getNarrativeTitlesHidden() {
  return localStorage.getItem(TITLE_MODE_KEY) === 'true'
}

export function setNarrativeTitlesHidden(value) {
  const nextValue = Boolean(value)

  localStorage.setItem(TITLE_MODE_KEY, String(nextValue))
  document.documentElement.classList.toggle('voyager-no-story-titles', nextValue)

  window.dispatchEvent(
    new CustomEvent('voyager-title-mode-change', {
      detail: nextValue,
    })
  )
}

export function toggleNarrativeTitlesHidden() {
  setNarrativeTitlesHidden(!getNarrativeTitlesHidden())
}

function installTitleModeHotkey() {
  if (typeof window === 'undefined') return
  if (window[HOTKEY_FLAG]) return

  window[HOTKEY_FLAG] = true

  window.addEventListener('keydown', (event) => {
    const target = event.target
    const tagName = target?.tagName?.toLowerCase()

    const isTyping =
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      target?.isContentEditable

    if (isTyping) return

    if (event.key.toLowerCase() === 'p') {
      event.preventDefault()
      toggleNarrativeTitlesHidden()
    }
  })
}

export function useNarrativeTitlesHidden() {
  const [hidden, setHidden] = useState(() => getNarrativeTitlesHidden())

  useEffect(() => {
    installTitleModeHotkey()

    const update = () => {
      const nextValue = getNarrativeTitlesHidden()

      setHidden(nextValue)
      document.documentElement.classList.toggle(
        'voyager-no-story-titles',
        nextValue
      )
    }

    update()

    window.addEventListener('voyager-title-mode-change', update)
    window.addEventListener('storage', update)

    return () => {
      window.removeEventListener('voyager-title-mode-change', update)
      window.removeEventListener('storage', update)
    }
  }, [])

  return hidden
}
