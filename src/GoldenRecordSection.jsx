import { useEffect, useRef, useState } from 'react'

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

const panels = [
  {
    title: 'El Golden Record',
    text: 'Una cápsula cultural enviada al espacio: una presentación de la Tierra pensada para cualquier civilización futura.',
    image: '/golden-record/golden-record.png',
    type: 'record',
  },
  {
    title: 'Cómo leer el mensaje',
    text: 'El disco incluía instrucciones visuales para intentar explicar cómo reproducirlo y desde dónde venía.',
    image: '/golden-record/instructions.png',
    type: 'instructions',
  },
  {
    title: 'Información de la Tierra',
    text: 'Además de sonidos, el disco llevaba imágenes, música y saludos en distintos idiomas.',
    image: '/golden-record/earth-images.png',
    type: 'earth-info',
  },
]

export default function GoldenRecordSection() {
  const sectionRef = useRef()
const audioRef = useRef(null)
const englishAudioRef = useRef(null)

const [progress, setProgress] = useState(0)
const [isPlaying, setIsPlaying] = useState(false)
const [isEnglishPlaying, setIsEnglishPlaying] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const section = sectionRef.current
      if (!section) return

      const rect = section.getBoundingClientRect()
      const sectionHeight = section.offsetHeight - window.innerHeight
      const scrolled = -rect.top

      setProgress(clamp(scrolled / sectionHeight, 0, 1))
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

const handleAudioClick = () => {
  if (!audioRef.current) return

  if (isPlaying) {
    audioRef.current.pause()
    setIsPlaying(false)
  } else {
    if (englishAudioRef.current) {
      englishAudioRef.current.pause()
      setIsEnglishPlaying(false)
    }

    audioRef.current.play()
    setIsPlaying(true)
  }
}

  const handleEnglishAudioClick = () => {
  if (!englishAudioRef.current) return

  if (isEnglishPlaying) {
    englishAudioRef.current.pause()
    setIsEnglishPlaying(false)
  } else {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }

    englishAudioRef.current.play()
    setIsEnglishPlaying(true)
  }
}

  const translateX = -progress * (panels.length - 1) * 55

  return (
    <section ref={sectionRef} className="golden-section">
      <audio
        ref={audioRef}
        src="/golden-record/greeting.mp3"
        onEnded={() => setIsPlaying(false)}
      />

      <audio
  ref={englishAudioRef}
  src="/golden-record/english-greeting.mp3"
  onEnded={() => setIsEnglishPlaying(false)}
/>

      <div className="golden-sticky">
        <div className="golden-intro">
          <span>Golden Record</span>
          <h2>El disco dorado: una cápsula de la Tierra</h2>
          <p>
            Las Voyager no llevaban solamente instrumentos científicos.
            También llevaban un mensaje: el Golden Record, un disco pensado
            como una presentación de la Tierra ante una posible civilización futura.
          </p>
          <p>
            La historia deja de ser únicamente científica y se vuelve humana:
            una nave no solo observaba el universo, sino que también llevaba
            una versión de nosotros hacia él.
          </p>
        </div>

        <div className="golden-viewport">
          <div
            className="golden-track"
            style={{ transform: `translateX(${translateX}vw)` }}
          >
            {panels.map((panel, index) => (
              <div key={index} className="golden-panel">
                <div className="golden-panel-inner">
                  <div
                    className={
                      panel.type === 'record'
                        ? 'golden-visual golden-record-visual'
                        : 'golden-visual'
                    }
                  >
                    <img src={panel.image} alt={panel.title} />
                  </div>

                  <div className="golden-panel-caption">
                    <h3>{panel.title}</h3>
                    <p>{panel.text}</p>

                    {panel.type === 'earth-info' && (
  <div className="golden-audio-buttons">
    <button
      className="golden-audio-button"
      onClick={handleAudioClick}
    >
      {isPlaying
        ? 'Pausar mensaje'
        : '¿Querés escuchar lo que mandamos?'}
    </button>

    <button
      className="golden-audio-button golden-audio-button-secondary"
      onClick={handleEnglishAudioClick}
    >
      {isEnglishPlaying
        ? 'Pausar saludo en inglés'
        : 'Escuchar el saludo en inglés'}
    </button>
  </div>
)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}