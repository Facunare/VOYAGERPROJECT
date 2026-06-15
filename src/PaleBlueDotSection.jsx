import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, useTexture } from '@react-three/drei'

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function EarthDot({ scrollProgress }) {
  const earthTexture = useTexture('/textures/earth.jpg')
  const earthRef = useRef()

  useFrame(() => {
    if (!earthRef.current) return
    earthRef.current.rotation.y += 0.002
  })

  const shrinkProgress = clamp(scrollProgress / 0.85, 0, 1)

  /*
    Cuando ya está muy lejos, empieza a verse como punto brillante.
  */
  const starProgress = clamp((shrinkProgress - 0.82) / 0.88, 0, 1)

  const planetScale = lerp(1.15, 0.02, shrinkProgress)

  const x = lerp(1.75, 2.45, shrinkProgress)
  const y = lerp(0.05, 0.65, shrinkProgress)
  const z = lerp(-1.4, -2.4, shrinkProgress)

  return (
    <group position={[x, y, z]}>
      {/* Tierra */}
      <mesh ref={earthRef} scale={planetScale}>
        <sphereGeometry args={[1, 96, 96]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.75}
          emissive="#7ec8ff"
          emissiveIntensity={lerp(0.08, 1.8, starProgress)}
        />
      </mesh>

      {/* Halo interno */}
      <mesh scale={lerp(0.0, 0.12, starProgress)}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial
          color="#9fd8ff"
          transparent
          opacity={lerp(0, 0.65, starProgress)}
        />
      </mesh>

      {/* Halo externo */}
      <mesh scale={lerp(0.0, 0.22, starProgress)}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial
          color="#7ec8ff"
          transparent
          opacity={lerp(0, 0.22, starProgress)}
        />
      </mesh>

      {/* Luz para que se vea como puntito brillante */}
      <pointLight
        color="#8ecbff"
        intensity={lerp(0, 4.2, starProgress)}
        distance={lerp(0, 2.5, starProgress)}
      />
    </group>
  )
}
function VoyagerApproach({ scrollProgress }) {
  const { scene } = useGLTF('/VoyagerProbe.glb')
  const voyagerScene = useMemo(() => scene.clone(), [scene])
  const groupRef = useRef()

  useFrame((state) => {
    if (!groupRef.current) return

    const time = state.clock.getElapsedTime()
    const p = clamp(scrollProgress, 0, 1)

    const x = lerp(-1.9, 0.5, p)
    const y = lerp(-0.45, 0.15, p)
    const z = lerp(-1.4, 1.15, p)

    const scale = lerp(0.12, 0.38, p)

    groupRef.current.position.set(
      x + Math.sin(time * 1.4) * 0.05,
      y + Math.sin(time * 1.8) * 0.04,
      z
    )

    groupRef.current.scale.set(scale, scale, scale)

    groupRef.current.rotation.x = Math.sin(time * 1.2) * 0.08
    groupRef.current.rotation.y = lerp(0.8, 2.4, p)
    groupRef.current.rotation.z = Math.sin(time * 1.1) * 0.12
  })

  return (
    <group ref={groupRef}>
      <primitive object={voyagerScene} />
    </group>
  )
}

function PaleBlueDotScene({ scrollProgress }) {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 3, 5]} intensity={1.35} />
      <pointLight position={[-3, 1, 3]} intensity={0.7} />

      <EarthDot scrollProgress={scrollProgress} />
      <VoyagerApproach scrollProgress={scrollProgress} />
    </>
  )
}

const steps = [
  {
    kicker: '1990',
    title: 'El punto azul pálido',
    text: 'A medida que Voyager se alejaba, la Tierra empezó a perder tamaño. Lo que para nosotros es todo, desde la distancia se convierte en un punto diminuto.',
  },
  {
    kicker: 'Perspectiva',
    title: 'Todo en un punto',
    text: 'Ciudades, países, océanos, historias y problemas quedan contenidos en una pequeña señal azul suspendida en la oscuridad.',
  },
  {
    kicker: 'Distancia',
    title: 'Cuanto más lejos, más pequeña',
    text: 'El viaje deja de tratarse solamente de planetas y kilómetros. Empieza a hablar de perspectiva: cuanto más lejos llega Voyager, más pequeña parece la Tierra, pero también más valiosa.',
    graph: true,
  },
]

export default function PaleBlueDotSection() {
  const sectionRef = useRef()
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const section = sectionRef.current
      if (!section) return

      const rect = section.getBoundingClientRect()
      const sectionHeight = section.offsetHeight - window.innerHeight
      const scrolled = -rect.top

      setScrollProgress(clamp(scrolled / sectionHeight, 0, 1))
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section ref={sectionRef} className="pale-section">
      <div className="pale-sticky">
        <div className="pale-canvas">
          <Canvas camera={{ position: [0, 0, 4.2], fov: 48 }}>
            <PaleBlueDotScene scrollProgress={scrollProgress} />
          </Canvas>
        </div>
      </div>

      <div className="pale-text-steps">
        {steps.map((step, index) => (
          <article key={index} className="pale-text-step">
            <span>{step.kicker}</span>
            <h2>{step.title}</h2>
            <p>{step.text}</p>

            {step.graph && (
              <div className="flourish-embed-container">
                <iframe src='https://flo.uri.sh/visualisation/29365005/embed' title='Interactive or visual content' className="flourish-iframe"></iframe>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}