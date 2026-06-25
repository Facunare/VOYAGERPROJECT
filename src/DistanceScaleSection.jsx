import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import {
  AdditiveBlending,
  BufferGeometry,
  Float32BufferAttribute,
} from 'three'

const clamp = (value, min = 0, max = 1) =>
  Math.min(Math.max(value, min), max)

const lerp = (a, b, t) => a + (b - a) * t

const smooth = (from, to, value) => {
  const t = clamp((value - from) / (to - from))
  return t * t * (3 - 2 * t)
}

function seededRandom(seed) {
  const value = Math.sin(seed * 999.91) * 43758.5453
  return value - Math.floor(value)
}

function BackgroundStars() {
  const geometry = useMemo(() => {
    const positions = []

    for (let i = 0; i < 900; i += 1) {
      positions.push(
        (seededRandom(i * 3 + 1) - 0.5) * 22,
        (seededRandom(i * 3 + 2) - 0.5) * 13,
        -2 - seededRandom(i * 3 + 3) * 5
      )
    }

    const result = new BufferGeometry()
    result.setAttribute('position', new Float32BufferAttribute(positions, 3))
    return result
  }, [])

  return (
    <points geometry={geometry}>
      <pointsMaterial
        color="#ffffff"
        size={0.018}
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

function Orbit({ radius, opacity = 0.25 }) {
  const points = useMemo(() => {
    return Array.from({ length: 121 }, (_, index) => {
      const angle = (index / 120) * Math.PI * 2
      return [Math.cos(angle) * radius, Math.sin(angle) * radius, 0]
    })
  }, [radius])

  return (
    <Line
      points={points}
      color="#8ecbff"
      lineWidth={0.7}
      transparent
      opacity={opacity}
    />
  )
}

function Marker({ position, color, size, label, visible = 1 }) {
  return (
    <group position={position}>
      <mesh scale={size}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial color={color} />
      </mesh>

      <mesh scale={size * 2.4}>
        <sphereGeometry args={[1, 20, 20]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={visible * 0.13}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {visible > 0.02 && (
        <Html center position={[0, size + 0.2, 0]} style={{ opacity: visible }}>
          <div className="distance-space-label">{label}</div>
        </Html>
      )}
    </group>
  )
}

function SolarSystem({ progress }) {
  const groupRef = useRef()
  const voyagerRef = useRef()
  const reveal = smooth(0.04, 0.44, progress)
  const collapse = smooth(0.5, 0.82, progress)
  const opacity = 1 - smooth(0.75, 0.91, progress)

  useFrame((state) => {
    if (!groupRef.current) return

    const time = state.clock.getElapsedTime()
    const scale = lerp(1, 0.018, collapse)
    groupRef.current.scale.setScalar(scale)
    groupRef.current.rotation.z = lerp(0, -0.18, collapse)

    if (voyagerRef.current) {
      voyagerRef.current.position.x = lerp(2.5, 3.35, reveal)
      voyagerRef.current.position.y = Math.sin(time * 1.5) * 0.025
    }
  })

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <Orbit radius={0.45} opacity={opacity * 0.18} />
      <Orbit radius={1.05} opacity={opacity * 0.2} />
      <Orbit radius={1.7} opacity={opacity * 0.23} />
      <Orbit radius={2.15} opacity={opacity * 0.25} />

      <Marker
        position={[0, 0, 0]}
        color="#74b9ff"
        size={0.12}
        label="Tierra"
        visible={opacity}
      />
      <Marker
        position={[0.45, 0, 0]}
        color="#d6d8dc"
        size={0.035}
        label="Luna · 384.400 km"
        visible={opacity * smooth(0, 0.12, progress)}
      />
      <Marker
        position={[1.05, 0, 0]}
        color="#ffd166"
        size={0.18}
        label="Sol · 1 UA"
        visible={opacity * smooth(0.08, 0.2, progress)}
      />
      <Marker
        position={[1.7, 0, 0]}
        color="#d9a066"
        size={0.1}
        label="Júpiter · 5,2 UA"
        visible={opacity * smooth(0.16, 0.28, progress)}
      />
      <Marker
        position={[2.15, 0, 0]}
        color="#e7c98f"
        size={0.085}
        label="Saturno · 9,5 UA"
        visible={opacity * smooth(0.24, 0.36, progress)}
      />

      <group ref={voyagerRef}>
        <Marker
          position={[0, 0, 0]}
          color="#ffffff"
          size={0.055}
          label="Voyager 1 · más de 160 UA"
          visible={opacity * smooth(0.32, 0.44, progress)}
        />
      </group>

      <Line
        points={[[0, 0, -0.01], [3.35, 0, -0.01]]}
        color="#ffffff"
        lineWidth={1}
        transparent
        opacity={opacity * reveal * 0.35}
        dashed
        dashSize={0.08}
        gapSize={0.06}
      />
    </group>
  )
}

function Galaxy({ progress }) {
  const groupRef = useRef()
  const reveal = smooth(0.58, 0.88, progress)

  const geometry = useMemo(() => {
    const positions = []

    for (let i = 0; i < 8000; i += 1) {
      const arm = i % 4
      const radius = Math.pow(seededRandom(i + 10), 0.58) * 3.5
      const angle = radius * 2.25 + arm * (Math.PI / 2)
      const scatter = (seededRandom(i + 20) - 0.5) * (0.25 + radius * 0.12)

      positions.push(
        Math.cos(angle) * radius + scatter,
        Math.sin(angle) * radius + scatter,
        (seededRandom(i + 30) - 0.5) * 0.14
      )
    }

    const result = new BufferGeometry()
    result.setAttribute('position', new Float32BufferAttribute(positions, 3))
    return result
  }, [])

  useFrame((_, delta) => {
    if (!groupRef.current) return
    groupRef.current.rotation.z += delta * 0.012
    const scale = lerp(4.8, 1.05, reveal)
    groupRef.current.scale.setScalar(scale)
  })

  return (
    <group ref={groupRef}>
      <points geometry={geometry}>
        <pointsMaterial
          color="#b9d8ff"
          size={0.026}
          transparent
          opacity={reveal * 0.78}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <mesh scale={0.45}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#fff3c2"
          transparent
          opacity={reveal * 0.38}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {reveal > 0.88 && (
        <Html position={[-1.55, -1.15, 0]} center>
          <div className="distance-home-marker">
            <span />
            <strong>Todo el viaje ocurrió acá</strong>
          </div>
        </Html>
      )}
    </group>
  )
}

function ScaleScene({ progress }) {
  return (
    <>
      <BackgroundStars />
      <SolarSystem progress={progress} />
      <Galaxy progress={progress} />
    </>
  )
}

const steps = [
  {
    kicker: '384.400 kilómetros',
    title: 'Primero dejamos atrás la Luna',
    text: 'En la escala de nuestras vidas, incluso esta distancia resulta difícil de imaginar.',
  },
  {
    kicker: 'El sistema solar',
    title: 'Después vinieron los planetas gigantes',
    text: 'Júpiter y Saturno convirtieron una misión planetaria en un viaje hacia los límites de la influencia solar.',
  },
  {
    kicker: 'Más de 160 UA',
    title: 'El objeto humano más lejano',
    text: 'Ningún otro objeto construido por nosotros llegó tan lejos como Voyager 1.',
  },
  {
    kicker: 'Cambio de escala',
    title: 'Ahora alejémonos un poco más',
    text: 'La distancia que parecía inmensa empieza a desaparecer cuando la comparamos con nuestra galaxia.',
  },
  {
    kicker: '100.000 años luz',
    title: 'Todo el viaje ocurrió acá',
    text: 'A escala de la Vía Láctea, Voyager y la Tierra siguen ocupando prácticamente el mismo punto.',
  },
]

function ScaleIndicator({ progress }) {
  const labels = [
    'Tierra–Luna',
    'Tierra–Sol',
    'Planetas gigantes',
    'Voyager 1',
    'Vía Láctea',
  ]
  const index = Math.min(labels.length - 1, Math.floor(progress * labels.length))

  return (
    <div className="distance-scale-indicator" aria-hidden="true">
      <span>{labels[index]}</span>
      <div><i style={{ width: `${Math.max(2, progress * 100)}%` }} /></div>
    </div>
  )
}

export default function DistanceScaleSection() {
  const sectionRef = useRef(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0

    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const section = sectionRef.current
        if (!section) return

        const rect = section.getBoundingClientRect()
        const distance = section.offsetHeight - window.innerHeight
        setProgress(clamp(-rect.top / distance))
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
    <section ref={sectionRef} className="distance-scale-section">
      <div className="distance-scale-sticky">
    <Canvas
      camera={{ position: [0, 0, 7], fov: 48 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
    >
      <ScaleScene progress={progress} />
    </Canvas>
        <ScaleIndicator progress={progress} />
      </div>

      <div className="distance-scale-steps">
  {steps.map((step) => (
    <article className="distance-scale-step" key={step.title}>
      <div>
        <span>{step.kicker}</span>
        <h2>{step.title}</h2>
        <p>{step.text}</p>
      </div>
    </article>
  ))}

  <div className="distance-scale-bottom-spacer" aria-hidden="true" />
</div>
    </section>
  )
}
