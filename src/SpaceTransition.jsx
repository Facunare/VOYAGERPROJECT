import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function smooth(from, to, value) {
  const t = clamp((value - from) / (to - from), 0, 1)
  return t * t * (3 - 2 * t)
}

function TransitionVoyager({ progress }) {
  const { scene } = useGLTF('/VoyagerProbe.glb')
  const voyagerScene = useMemo(() => scene.clone(), [scene])
  const groupRef = useRef()

  useFrame((state) => {
    if (!groupRef.current) return

    const time = state.clock.getElapsedTime()
    const travel = smooth(0.02, 0.98, progress)

    groupRef.current.position.x = lerp(-4.5, 5.2, travel)
    groupRef.current.position.y = lerp(0.75, -0.65, travel) + Math.sin(time * 1.2) * 0.08
    groupRef.current.position.z = lerp(0.25, -0.3, travel)

    groupRef.current.rotation.x = -0.18 + Math.sin(time * 0.75) * 0.05
    groupRef.current.rotation.y = lerp(0.95, -0.85, travel) + Math.sin(time * 0.55) * 0.08
    groupRef.current.rotation.z = -0.18

    const scale = lerp(0.16, 0.12, travel)
    groupRef.current.scale.setScalar(scale)
  })

  return <primitive ref={groupRef} object={voyagerScene} />
}

function TransitionScene({ progress }) {
  return (
    <>
      <ambientLight intensity={1.25} />
      <directionalLight position={[4, 4, 5]} intensity={1.6} />
      <TransitionVoyager progress={progress} />
    </>
  )
}

function ShootingTitleText({ title, progress }) {
  const writeProgress = smooth(0.06, 0.42, progress)

  const words = title.split(' ')

  return (
    <div
      className="shooting-title"
      style={{
        '--starMove': writeProgress,
      }}
    >
      <div className="shooting-star" />

      <h2>
        {words.map((word, wordIndex) => (
          <span className="shooting-word" key={`${word}-${wordIndex}`}>
            {word.split('').map((char, charIndex) => {
              const globalIndex =
                words
                  .slice(0, wordIndex)
                  .join('')
                  .length +
                wordIndex +
                charIndex

              const letterProgress = writeProgress * title.length - globalIndex
              const visible = clamp(letterProgress, 0, 1)

              return (
                <span
                  key={`${char}-${charIndex}`}
                  className="shooting-letter"
                  style={{
                    opacity: visible,
                    filter: `blur(${(1 - visible) * 8}px)`,
                    transform: `translateY(${(1 - visible) * 18}px)`,
                  }}
                >
                  {char}
                </span>
              )
            })}
          </span>
        ))}
      </h2>
    </div>
  )
}

export default function SpaceTransition({ title, showVoyager = true }) {
  const sectionRef = useRef()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const updateProgress = () => {
      if (!sectionRef.current) return

      const rect = sectionRef.current.getBoundingClientRect()
      const maxScroll = Math.max(rect.height - window.innerHeight, 1)
      const nextProgress = clamp(-rect.top / maxScroll, 0, 1)

      setProgress(nextProgress)
    }

    updateProgress()
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)

    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [])

  const titleOpacity = title
    ? smooth(0.02, 0.50, progress) * (1 - smooth(0.68, 0.82, progress))
    : 0

  return (
    <section ref={sectionRef} className="space-transition-section" aria-label={title || 'Viaje por el espacio'}>
      <div className="space-transition-sticky">
        <div className="space-transition-stars" />
        <div
          className="space-transition-trail"
          style={{
            opacity: smooth(0.18, 0.38, progress) * (1 - smooth(0.82, 0.97, progress)),
            transform: `translateX(${lerp(-28, 28, progress)}vw)`,
          }}
        />

        {showVoyager && (
  <div className="space-transition-canvas">
    <Canvas camera={{ position: [0, 0, 4.2], fov: 48 }}>
      <TransitionScene progress={progress} />
    </Canvas>
  </div>
)}

        {title && (
  <div
    className="space-transition-title"
    style={{
      opacity: titleOpacity,
      transform: `translate(-50%, calc(-50% + ${lerp(
        22,
        -8,
        smooth(0.02, 0.62, progress)
      )}px))`,
    }}
  >
    <ShootingTitleText title={title} progress={progress} />
  </div>
)}

        <div
          className="space-transition-caption"
          style={{
            opacity: smooth(0.16, 0.64, progress) * (1 - smooth(0.86, 1, progress)),
          }}
        >
          <span>Viajando por el espacio profundo</span>
        </div>
      </div>
    </section>
  )
}
