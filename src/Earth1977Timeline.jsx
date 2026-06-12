import { useEffect, useRef, useState } from 'react'

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

const timelineItems = [
  {
    year: '1969',
    title: 'La llegada a la Luna',
    text: 'El ser humano pisa la Luna. La exploración espacial todavía está marcada por la carrera por llegar primero.',
  },
  {
    year: '1972',
    title: 'El final de una etapa',
    text: 'Terminan las misiones Apolo tripuladas a la Luna. La mirada espacial empieza a cambiar.',
  },
  {
    year: '1977',
    title: 'Voyager despega',
    text: 'Dos naves idénticas son lanzadas para explorar los planetas gigantes del sistema solar.',
  },
  {
    year: '1979',
    title: 'Júpiter',
    text: 'Voyager transforma un punto brillante del cielo en un mundo lleno de nubes, tormentas y lunas observables.',
  },
  {
    year: '1980',
    title: 'Saturno',
    text: 'Después de Saturno, Voyager 1 toma una trayectoria que la aleja del plano principal de los planetas.',
  },
]

export default function Earth1977Timeline() {
  const sectionRef = useRef()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const section = sectionRef.current
      if (!section) return

      const rect = section.getBoundingClientRect()
      const sectionHeight = section.offsetHeight - window.innerHeight
      const scrolled = -rect.top

      const nextProgress = clamp(scrolled / sectionHeight, 0, 1)
      setProgress(nextProgress)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const translateX = -progress * 80

  return (
    <section ref={sectionRef} className="earth-timeline-section">
      <div className="earth-timeline-sticky">
        <div className="earth-timeline-intro">
          <h2>
            Después de la carrera espacial, empezó otra forma de mirar el
            universo.
          </h2>
          <p>
            Cuando Voyager despegó, el mundo todavía recordaba la llegada a la
            Luna. Pero la exploración espacial empezaba a cambiar: ya no se
            trataba solo de llegar primero, sino de entender mejor el lugar de
            la Tierra en un sistema mucho más grande.
          </p>
        </div>

        <div
          className="timeline-track"
          style={{
            transform: `translateX(${translateX}vw)`,
          }}
        >
          {timelineItems.map((item, index) => (
            <article key={index} className="timeline-card">
              <span className="timeline-year">{item.year}</span>
              <div className="timeline-dot" />
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}