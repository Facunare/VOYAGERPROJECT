import { useEffect, useRef, useState } from 'react'

export default function BackgroundMusic() {
  const audioRef = useRef(null)
  const hasStartedRef = useRef(false)

  const [isPlaying, setIsPlaying] = useState(false)

  const startMusic = async () => {
    if (!audioRef.current) return
    if (hasStartedRef.current) return

    try {
      audioRef.current.volume = 0.25
      await audioRef.current.play()

      hasStartedRef.current = true
      setIsPlaying(true)
    } catch (error) {
      console.log('El navegador bloqueó el autoplay hasta una interacción más clara.')
    }
  }

  useEffect(() => {
    const handleFirstInteraction = () => {
      startMusic()
    }

    window.addEventListener('scroll', handleFirstInteraction, { once: true })
    window.addEventListener('click', handleFirstInteraction, { once: true })
    window.addEventListener('keydown', handleFirstInteraction, { once: true })

    return () => {
      window.removeEventListener('scroll', handleFirstInteraction)
      window.removeEventListener('click', handleFirstInteraction)
      window.removeEventListener('keydown', handleFirstInteraction)
    }
  }, [])

  const toggleMusic = async () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      try {
        audioRef.current.volume = 0.25
        await audioRef.current.play()

        hasStartedRef.current = true
        setIsPlaying(true)
      } catch (error) {
        console.log('No se pudo reproducir el audio.')
      }
    }
  }

  return (
    <>
      <audio
        ref={audioRef}
        src="/audio/background.mp3"
        loop
      />

      <button
        className="background-music-button"
        onClick={toggleMusic}
      >
        {isPlaying ? 'Pausar música' : 'Activar música'}
      </button>
    </>
  )
}