import { useEffect, useRef, useState } from 'react'
import { useNarrativeTitlesHidden } from './useNarrativeTitlesHidden.js'

const clamp = (value, min = 0, max = 1) =>
  Math.min(Math.max(value, min), max)

const smooth = (from, to, value) => {
  const t = clamp((value - from) / (to - from))
  return t * t * (3 - 2 * t)
}

const instruments = [
  { name: 'Magnetómetro', short: 'MAG', voyager1: 'active', voyager2: 'active' },
  { name: 'Ondas de plasma', short: 'PWS', voyager1: 'active', voyager2: 'active' },
  { name: 'Partículas de baja energía', short: 'LECP', voyager1: 'active', voyager2: 'saving' },
  { name: 'Rayos cósmicos', short: 'CRS', voyager1: 'saving', voyager2: 'active' },
  { name: 'Ciencia de plasma', short: 'PLS', voyager1: 'off', voyager2: 'active' },
  { name: 'Sistema de imágenes', short: 'ISS', voyager1: 'off', voyager2: 'off' },
  { name: 'Espectrómetro infrarrojo', short: 'IRIS', voyager1: 'off', voyager2: 'off' },
  { name: 'Fotopolarímetro', short: 'PPS', voyager1: 'off', voyager2: 'off' },
  { name: 'Radioastronomía', short: 'PRA', voyager1: 'off', voyager2: 'off' },
  { name: 'Espectrómetro ultravioleta', short: 'UVS', voyager1: 'off', voyager2: 'off' },
]

const statusCopy = {
  active: 'Activo',
  saving: 'Apagado para ahorrar energía',
  off: 'Apagado',
}

const steps = [
  {
    kicker: 'Energía limitada',
    title: 'Una misión que sobrevive apagándose',
    text: 'Los generadores de Voyager producen cada año un poco menos de energía. Mantener la misión implica elegir cuidadosamente qué sistemas continúan funcionando.',
  },
  {
    kicker: 'Decisiones',
    title: 'No todo puede permanecer encendido',
    text: 'Algunos instrumentos terminaron su función. Otros fueron apagados específicamente para reservar energía para los sistemas científicos prioritarios.',
  },
  {
    kicker: 'Señal débil',
    title: 'Cuanto más lejos llega, más difícil es escucharla',
    text: 'La información cruza miles de millones de kilómetros antes de alcanzar las antenas de la Red del Espacio Profundo.',
  },
  {
    kicker: 'Un eco lento',
    title: 'Una respuesta puede tardar casi dos días',
    text: 'Una orden necesita alrededor de 23 horas para llegar a Voyager 1. Confirmar su respuesta requiere esperar aproximadamente otras 23.',
  },
]

function StatusCell({ finalStatus, reveal }) {
  const status = reveal ? finalStatus : 'active'

  return (
    <div
      className={`mission-status mission-status--${status}`}
      title={statusCopy[status]}
      aria-label={statusCopy[status]}
    >
      <span />
      <small>{status === 'active' ? 'ON' : status === 'saving' ? 'ECO' : 'OFF'}</small>
    </div>
  )
}

function InstrumentMatrix({ progress, flourishUrl }) {
  const shutdownProgress = smooth(0.1, 0.52, progress)

  if (flourishUrl) {
    return (
      <div className="mission-flourish">
        <iframe
          src={flourishUrl}
          title="Instrumentos activos y apagados de Voyager 1 y Voyager 2"
          loading="lazy"
          allowFullScreen
        />
      </div>
    )
  }

  return (
    <div className="mission-matrix" aria-label="Estado de los instrumentos Voyager">
      <div className="mission-matrix__header">
        <span>Instrumento</span>
        <strong>Voyager 1</strong>
        <strong>Voyager 2</strong>
      </div>

      {instruments.map((instrument, index) => {
        const threshold = 0.08 + index * 0.075
        const reveal = shutdownProgress >= threshold

        return (
          <div className="mission-matrix__row" key={instrument.short}>
            <div>
              <strong>{instrument.short}</strong>
              <span>{instrument.name}</span>
            </div>
            <StatusCell finalStatus={instrument.voyager1} reveal={reveal} />
            <StatusCell finalStatus={instrument.voyager2} reveal={reveal} />
          </div>
        )
      })}

      <div className="mission-legend">
        <span><i className="is-active" />Activo</span>
        <span><i className="is-saving" />Ahorro de energía</span>
        <span><i className="is-off" />Apagado</span>
      </div>
    </div>
  )
}

function SignalJourney({ progress }) {
  const visible = smooth(0.55, 0.7, progress)
  const running = progress > 0.68

  return (
    <div
      className={`mission-signal ${running ? 'mission-signal--running' : ''}`}
      style={{ opacity: visible }}
    >
      <div className="mission-signal__labels">
        <div>
          <span className="mission-earth" />
          <strong>Tierra</strong>
        </div>
        <div>
          <span className="mission-voyager">V1</span>
          <strong>Voyager 1</strong>
        </div>
      </div>

      <div className="mission-signal__track">
        <i className="mission-signal__outbound" />
        <i className="mission-signal__return" />
      </div>

      <div className="mission-signal__times">
        <span><strong>≈23 h</strong> señal de ida</span>
        <span><strong>≈46 h</strong> ida y vuelta</span>
      </div>
    </div>
  )
}

function ScienceSystems({ progress }) {
  const activeV1 = instruments.filter((item) => item.voyager1 === 'active').length
  const activeV2 = instruments.filter((item) => item.voyager2 === 'active').length
  const reveal = smooth(0.18, 0.48, progress)

  return (
    <div className="mission-systems" style={{ opacity: reveal }}>
      <span>Sistemas científicos activos</span>
      <div>
        <strong>V1&nbsp; {activeV1}</strong>
        <i />
        <strong>V2&nbsp; {activeV2}</strong>
      </div>
    </div>
  )
}

export default function MissionPowerSection({ flourishUrl = '' }) {
  const sectionRef = useRef(null)
  const [progress, setProgress] = useState(0)
  const hideStoryTitles = useNarrativeTitlesHidden()

  useEffect(() => {
    let frame = 0

    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const section = sectionRef.current
        if (!section) return

        const rect = section.getBoundingClientRect()
        const scrollable = section.offsetHeight - window.innerHeight
        setProgress(clamp(-rect.top / scrollable))
      })
    }

    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    update()

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <section ref={sectionRef} className="mission-power-section">
      <div className="mission-power-sticky">
        

        <div className="mission-control">
          <div className="mission-control__topbar">
            <span>VOYAGER MISSION STATUS</span>
            <i />
            <small>DEEP SPACE NETWORK</small>
          </div>

          <InstrumentMatrix progress={progress} flourishUrl={flourishUrl} />
          <ScienceSystems progress={progress} />
          <SignalJourney progress={progress} />
        </div>

        <div
          className="mission-closing-line"
          style={{ opacity: smooth(0.86, 0.97, progress) }}
        >
          Para mantener viva la misión, hay que apagar partes de ella.
        </div>
      </div>

      <div className="mission-power-steps">
        {steps.map((step) => (
          <article className="mission-power-step" key={step.title}>
            <div>
              <span>{hideStoryTitles ? step.title : step.kicker}</span>
              {!hideStoryTitles && <h2>{step.title}</h2>}
              <p>{step.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
