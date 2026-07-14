import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Line, useGLTF } from '@react-three/drei'
import { AdditiveBlending } from 'three'
import { useNarrativeTitlesHidden } from './useNarrativeTitlesHidden.js'

const clamp = (value, min = 0, max = 1) =>
  Math.min(Math.max(value, min), max)

const lerp = (a, b, t) => a + (b - a) * t

const smooth = (from, to, value) => {
  const t = clamp((value - from) / (to - from))
  return t * t * (3 - 2 * t)
}

function VoyagerLeaving({ progress }) {
  const { scene } = useGLTF('/VoyagerProbe.glb')
  const voyager = useMemo(() => scene.clone(true), [scene])
  const groupRef = useRef()
  const glowRef = useRef()

  useFrame((state) => {
    if (!groupRef.current) return

    const time = state.clock.getElapsedTime()
    const leaving = smooth(0.03, 0.88, progress)
    const finalDrift = smooth(0.82, 1, progress)
    const dotReveal = smooth(0.76, 0.92, progress)

    const x = lerp(1.45, 0.38, leaving) + finalDrift * 0.18
    const y = lerp(-0.15, 0.52, leaving)
    const z = lerp(0.4, -8.5, leaving)
    const scale = lerp(0.38, 0.026, leaving)

    groupRef.current.position.set(
      x + Math.sin(time * 0.32) * lerp(0.025, 0.004, leaving),
      y + Math.cos(time * 0.28) * lerp(0.018, 0.003, leaving),
      z
    )

    groupRef.current.scale.setScalar(scale)
    groupRef.current.rotation.x = 0.14 + Math.sin(time * 0.18) * 0.035
    groupRef.current.rotation.y = 1.15 + time * 0.025
    groupRef.current.rotation.z = -0.1 + Math.sin(time * 0.14) * 0.03

    if (glowRef.current) {
      const pulse = 0.82 + Math.sin(time * 1.6) * 0.18
      glowRef.current.position.copy(groupRef.current.position)
      glowRef.current.scale.setScalar(0.022 * dotReveal * pulse)
      glowRef.current.material.opacity = 0.72 * dotReveal * pulse
    }
  })

  return (
    <>
      <group ref={groupRef}>
        <primitive object={voyager} />
        <pointLight position={[0.15, 0.05, 0.2]} color="#e6c982" intensity={1.2} distance={1.4} />
      </group>

      <mesh ref={glowRef} scale={0}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color="#d9efff" transparent opacity={0} blending={AdditiveBlending} depthWrite={false} />
      </mesh>
    </>
  )
}

function EndlessPath({ progress }) {
  const opacity = smooth(0.58, 0.82, progress) * 0.25

  return (
    <Line
      points={[
        [1.2, -0.2, 0],
        [0.98, 0.05, -2],
        [0.75, 0.28, -5],
        [0.48, 0.5, -9],
      ]}
      color="#9bcdf2"
      lineWidth={0.7}
      transparent
      opacity={opacity}
      dashed
      dashSize={0.08}
      gapSize={0.12}
    />
  )
}

function FinalScene({ progress }) {
  return (
    <>
      <ambientLight intensity={lerp(0.24, 0.06, progress)} />
      <directionalLight position={[3, 2, 4]} color="#e8f3ff" intensity={lerp(1.15, 0.18, progress)} />
      <EndlessPath progress={progress} />
      <VoyagerLeaving progress={progress} />
    </>
  )
}

const steps = [
  {
    kicker: 'Más allá de la misión',
    title: 'El viaje continúa',
    text: 'Voyager no se detiene. Aunque algún día deje de transmitir, seguirá moviéndose por el espacio interestelar.',
  },
  {
    kicker: 'Cuando llegue el silencio',
    title: 'La misión terminará antes que el viaje',
    text: 'Sus instrumentos dejarán de enviar datos, pero la nave conservará su dirección y su movimiento.',
  },
  {
    kicker: 'Un futuro lejano',
    title: 'Ya no será una herramienta científica',
    text: 'Será una cápsula silenciosa: tecnología antigua, un mensaje humano y rastros de un planeta distante.',
  },
]

export default function FinalVoyageSection() {
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

const goToPostCredits = () => {
  sessionStorage.removeItem('skipAlienEncounterLock')
  window.dispatchEvent(new Event('skipAlienEncounterLockChange'))

  const postcreditsTransition = document.querySelector('#postcredits-transition')

  if (postcreditsTransition) {
    postcreditsTransition.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }
}

  const goToFooter = () => {
    sessionStorage.setItem('skipAlienEncounterLock', 'true')
    window.dispatchEvent(new Event('skipAlienEncounterLockChange'))

    const footer = document.querySelector('.footer')

    if (footer) {
      footer.scrollIntoView({
        behavior: 'auto',
        block: 'start',
      })
    }
  }

  return (
    <section ref={sectionRef} className="final-voyage-section">
      <div className="final-voyage-sticky">
        <Canvas
          camera={{ position: [0, 0, 4.8], fov: 48 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <FinalScene progress={progress} />
          </Suspense>
        </Canvas>

        <div
          className="final-voyage-ending"
          style={{ opacity: smooth(0.82, 0.96, progress) }}
        >
          <p>Seguimos escuchando porque todavía responde.</p>
          <h2>Seguirá viajando incluso cuando ya no podamos escucharla.</h2>
          <span className="final-voyage-date">
            Voyager · 1977 <i>—</i> <strong>∞</strong>
          </span>
        </div>

        <div
          className="final-voyage-actions"
          style={{
            opacity: smooth(0.72, 0.84, progress),
            pointerEvents: progress > 0.72 ? 'auto' : 'none',
            transform: `translate(-50%, ${lerp(22, 0, smooth(0.72, 0.84, progress))}px)`,
          }}
        >
          <button
            className="final-voyage-postcredits-button"
            onClick={goToPostCredits}
          >
            <span>Escena postcréditos</span>
            <strong>¿Qué pasaría si...?</strong>
          </button>

          <button
            className="final-voyage-skip-button"
            onClick={goToFooter}
            aria-label="Saltar escena postcréditos"
          >
            ×
          </button>
        </div>
      </div>

      <div className="final-voyage-steps">
        {steps.map((step, index) => (
          <article
            className={`final-voyage-step final-voyage-step--${index + 1}`}
            key={step.title}
          >
            <div>
              <span>{hideStoryTitles ? step.title : step.kicker}</span>
              {!hideStoryTitles && <h2>{step.title}</h2>}
              <p>{step.text}</p>
            </div>
          </article>
        ))}

        <div className="final-voyage-empty-step" aria-hidden="true" />
      </div>
    </section>
  )
}

useGLTF.preload('/VoyagerProbe.glb')
