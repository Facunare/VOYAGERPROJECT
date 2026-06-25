import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { AdditiveBlending, DoubleSide } from 'three'

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function VoyagerBoundaryCrossing({ scrollProgress }) {
  const { scene } = useGLTF('/VoyagerProbe.glb')
  const voyagerScene = useMemo(() => scene.clone(), [scene])
  const groupRef = useRef()

  useFrame((state) => {
    if (!groupRef.current) return

    const time = state.clock.getElapsedTime()
    const p = clamp(scrollProgress, 0, 1)

    /*
      La nave avanza de izquierda a derecha
      y cruza la frontera invisible.
    */
    const x = lerp(-3.2, 3.9, p)
    const y = lerp(0.15, -0.05, p)
    const z = lerp(0.25, 0.95, p)

    const scale = lerp(0.18, 0.28, p)

    groupRef.current.position.set(
      x + Math.sin(time * 1.4) * 0.05,
      y + Math.sin(time * 1.8) * 0.04,
      z
    )

    groupRef.current.scale.set(scale, scale, scale)

    groupRef.current.rotation.x = Math.sin(time * 1.3) * 0.1
    groupRef.current.rotation.y = lerp(0.9, 2.2, p)
    groupRef.current.rotation.z = Math.sin(time * 1.1) * 0.16
  })

  return (
    <group ref={groupRef}>
      <primitive object={voyagerScene} />
    </group>
  )
}

function HeliopauseMembrane({ scrollProgress }) {
  const membraneRef = useRef()
  const ringRef = useRef()

  useFrame((state) => {
    const time = state.clock.getElapsedTime()

    if (membraneRef.current) {
      membraneRef.current.rotation.z = Math.sin(time * 0.4) * 0.04
      membraneRef.current.material.opacity =
        0.18 + Math.sin(time * 1.2) * 0.035
    }

    if (ringRef.current) {
      ringRef.current.rotation.z += 0.002
    }
  })

  const appear = clamp((scrollProgress - 0.08) / 0.22, 0, 1)
  const crossing = clamp((scrollProgress - 0.42) / 0.22, 0, 1)

  return (
    <group position={[0.25, 0, -0.55]}>
      {/* Membrana central */}
      <mesh ref={membraneRef} scale={[1.15, 3.2, 1]}>
        <planeGeometry args={[1, 1, 32, 32]} />
        <meshBasicMaterial
          color="#78b7ff"
          transparent
          opacity={appear * lerp(0.2, 0.07, crossing)}
          side={DoubleSide}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Borde luminoso */}
      <mesh ref={ringRef} scale={[0.65, 2, 1]}>
        <torusGeometry args={[1, 0.01, 16, 160]} />
        <meshBasicMaterial
          color="#9fd8ff"
          transparent
          opacity={appear * 0.7}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Línea vertical de frontera */}
      <mesh scale={[0.015, 3.2, 1]} position={[0, 0, 0.02]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#d8f1ff"
          transparent
          opacity={appear * 0.45}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

function ParticleField({ scrollProgress }) {
  const particlesRef = useRef()

  const particles = useMemo(() => {
    const arr = []

    for (let i = 0; i < 90; i++) {
      arr.push({
        x: Math.random() * 7 - 3.5,
        y: Math.random() * 4 - 2,
        z: Math.random() * 2 - 1.5,
        size: Math.random() * 0.018 + 0.01,
        speed: Math.random() * 0.25 + 0.1,
        side: Math.random() > 0.5 ? 'solar' : 'cosmic',
      })
    }

    return arr
  }, [])

  const crossing = clamp((scrollProgress - 0.42) / 0.28, 0, 1)

  useFrame((state) => {
    const time = state.clock.getElapsedTime()

    if (!particlesRef.current) return

    particlesRef.current.children.forEach((particle, index) => {
      const data = particles[index]

      particle.position.x =
        data.x + Math.sin(time * data.speed + index) * 0.08

      particle.position.y =
        data.y + Math.cos(time * data.speed + index) * 0.05

      particle.position.z =
        data.z + Math.sin(time * data.speed + index) * 0.04
    })
  })

  return (
    <group ref={particlesRef}>
      {particles.map((particle, index) => {
        const isSolar = particle.side === 'solar'

        /*
          Antes del cruce dominan las partículas solares.
          Después del cruce dominan las partículas interestelares.
        */
        const opacity = isSolar
          ? lerp(0.75, 0.12, crossing)
          : lerp(0.12, 0.85, crossing)

        const color = isSolar ? '#f5a623' : '#8ecbff'

        return (
          <mesh
            key={index}
            position={[particle.x, particle.y, particle.z]}
            scale={particle.size}
          >
            <sphereGeometry args={[1, 12, 12]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={opacity}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        )
      })}
    </group>
  )
}

function HeliopauseScene({ scrollProgress }) {
  const crossing = clamp((scrollProgress - 0.42) / 0.28, 0, 1)

  return (
    <>
      <ambientLight intensity={lerp(0.35, 0.22, crossing)} />
      <directionalLight
        position={[4, 3, 5]}
        intensity={lerp(1.2, 0.7, crossing)}
      />
      <pointLight
        position={[-2.5, 1.2, 2]}
        color="#f5a623"
        intensity={lerp(1.1, 0.25, crossing)}
      />
      <pointLight
        position={[2.5, 0.8, 2]}
        color="#7ec8ff"
        intensity={lerp(0.2, 1.5, crossing)}
      />

      <ParticleField scrollProgress={scrollProgress} />
      <HeliopauseMembrane scrollProgress={scrollProgress} />
      <VoyagerBoundaryCrossing scrollProgress={scrollProgress} />
    </>
  )
}

const steps = [
  {
    kicker: 'Frontera invisible',
    title: 'El borde invisible del sistema solar',
    text: 'Después de los encuentros planetarios, la misión cambió de sentido. Voyager ya no viajaba hacia un planeta, sino hacia una frontera que no podía verse.',
  },
  {
    kicker: 'Heliopausa',
    title: 'No había una pared, había datos',
    text: 'La heliopausa marca la región donde la influencia del Sol empieza a ceder frente al espacio interestelar. No aparece como una imagen: aparece como un cambio en las mediciones.',
  },
  {
    kicker: 'Cruce',
    title: 'No vio una frontera. La midió.',
    text: 'Al cruzar esa región, las partículas asociadas al Sol disminuyen y aumenta la presencia de partículas provenientes del espacio interestelar.',
  },
  {
    kicker: 'Agosto de 2012',
    title: 'Entrar al espacio interestelar',
    text: 'Voyager 1 se convirtió en el primer objeto humano en alcanzar el espacio interestelar. El cruce no fue el final del viaje, sino el comienzo de una nueva etapa: explorar el espacio entre las estrellas.',
    graph: true,
  },
]

export default function HeliopauseSection() {
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
    <section ref={sectionRef} className="heliopause-section">
      <div className="heliopause-sticky">
        <div className="heliopause-canvas">
          <Canvas camera={{ position: [0, 0, 4.2], fov: 48 }}>
            <HeliopauseScene scrollProgress={scrollProgress} />
          </Canvas>
        </div>
      </div>

      <div className="heliopause-text-steps">
        {steps.map((step, index) => (
          <article key={index} className="heliopause-text-step">
            <span>{step.kicker}</span>
            <h2>{step.title}</h2>
            <p>{step.text}</p>

            {step.graph && (
              <div className="flourish-embed-container">
                 <iframe src='https://flo.uri.sh/visualisation/29372266/embed' title='Interactive or visual content' className='flourish-embed-iframe flourish-iframe'></iframe>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}