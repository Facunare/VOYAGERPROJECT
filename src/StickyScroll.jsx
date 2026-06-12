import { useRef, useEffect, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, useTexture } from '@react-three/drei'
import { DoubleSide } from 'three'

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function Planet({ position, size, texture, ringTexture }) {
  const planetTexture = useTexture(texture)
  const ringMap = ringTexture ? useTexture(ringTexture) : null

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[size, 64, 64]} />
        <meshStandardMaterial map={planetTexture} roughness={0.8} />
      </mesh>

      {ringTexture && (
        <mesh rotation={[Math.PI / 2.4, 0, 0]}>
          <ringGeometry args={[size * 1.35, size * 2.15, 96]} />
          <meshBasicMaterial
            map={ringMap}
            transparent
            side={DoubleSide}
            opacity={0.85}
          />
        </mesh>
      )}
    </group>
  )
}

function InterstellarBoundary({ position }) {
  return (
    <group position={position}>
      <mesh>
        <torusGeometry args={[0.38, 0.015, 16, 96]} />
        <meshBasicMaterial color="#9aa4ff" transparent opacity={0.8} />
      </mesh>

      <mesh>
        <sphereGeometry args={[0.08, 32, 32]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  )
}

function Milestones({ scrollProgress }) {
  /*
    Los planetas conservan tu separación.
    Lo que se mueve es el grupo entero.
  */
  const milestonesProgress = clamp((scrollProgress - 0.45) / 0.55, 0, 1)

  /*
    Si los últimos hitos siguen quedando muy abajo,
    subí el 3.6 a 4 o 4.5.
  */
  const groupY = lerp(0.15, 3.6, milestonesProgress)

  return (
    <group position={[0, groupY, 0]}>

      <Planet
        texture="/textures/earth.jpg"
        position={[2.65, 1.25, -1]}
        size={0.32}
      />
      <Planet
        texture="/textures/jupiter.jpg"
        position={[2.65, 0, -1]}
        size={0.53}
      />

      <Planet
        texture="/textures/saturn.jpg"
        ringTexture="/textures/saturnRing.png"
        position={[2.65, -1.25, -1]}
        size={0.56}
      />

      <Planet
        texture="/textures/uranus.jpg"
        position={[2.65, -2.5, -1]}
        size={0.5}
      />

      <Planet
        texture="/textures/neptune.jpg"
        position={[2.65, -3.75, -1]}
        size={0.5}
      />

      <InterstellarBoundary position={[2.65, -5, -1]} />
    </group>
  )
}

function VoyagerModel({ scrollProgress }) {
  const { scene } = useGLTF('/VoyagerProbe.glb')
  const voyagerScene = useMemo(() => scene.clone(), [scene])

  const groupRef = useRef()
  const isRotating = useRef(false)
  const lastPointer = useRef({ x: 0, y: 0 })

  const manualRotation = useRef({
    x: 0,
    y: 0,
  })

  useFrame((state) => {
    if (!groupRef.current) return

    const time = state.clock.getElapsedTime()

    const introProgress = clamp(scrollProgress / 0.28, 0, 1)
    const crossProgress = clamp((scrollProgress - 0.35) / 0.22, 0, 1)
    const downProgress = clamp((scrollProgress - 0.57) / 0.43, 0, 1)

    let x
    let y
    let z
    let scale

    if (scrollProgress < 0.35) {
      scale = lerp(0.15, 0.3, introProgress)

      x =
        -2.4 +
        Math.sin(time * 1.2 + scrollProgress * 8) * 0.35 * introProgress

      y =
        Math.sin(time * 1.8 + scrollProgress * 5) * 0.18 * introProgress

      z = lerp(-8, 0, introProgress) + Math.sin(time * 0.8) * 0.08
    } else {
      scale = lerp(0.3, 0.24, downProgress)

const baseX = lerp(-2.4, 2.15, crossProgress)

/*
  Primero sube suavemente mientras cruza.
  Después baja pasando por los planetas.
  Así evitamos el salto de y = 0 a y = 1.35.
*/
const riseY = lerp(0, 1.35, crossProgress)
const fallY = lerp(0, -3.0, downProgress)

const baseY = riseY + fallY
const baseZ = lerp(0, -0.4, downProgress)

/*
  El zigzag también entra suavemente.
  Así no aparece de golpe justo cuando cambia de etapa.
*/
const zigzagStrength = lerp(0, 1, crossProgress)

const zigzagX =
  Math.sin(time * 1.5 + scrollProgress * 12) * 0.22 * zigzagStrength

const zigzagY =
  Math.sin(time * 2.1 + scrollProgress * 9) * 0.12 * zigzagStrength

const waveZ =
  Math.sin(time * 1.1 + scrollProgress * 6) * 0.08 * zigzagStrength

x = baseX + zigzagX
y = baseY + zigzagY
z = baseZ + waveZ
    }

    groupRef.current.position.set(x, y, z)
    groupRef.current.scale.set(scale, scale, scale)

    groupRef.current.rotation.x =
      manualRotation.current.x + Math.sin(time * 1.5) * 0.12

    groupRef.current.rotation.y =
      scrollProgress * Math.PI * 4 + manualRotation.current.y

    groupRef.current.rotation.z =
      Math.sin(time * 1.2 + scrollProgress * 8) * 0.22
  })

  const handlePointerDown = (e) => {
    e.stopPropagation()

    isRotating.current = true

    lastPointer.current = {
      x: e.clientX,
      y: e.clientY,
    }

    e.target.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e) => {
    if (!isRotating.current) return

    e.stopPropagation()

    const deltaX = e.clientX - lastPointer.current.x
    const deltaY = e.clientY - lastPointer.current.y

    manualRotation.current.y += deltaX * 0.01
    manualRotation.current.x += deltaY * 0.01

    lastPointer.current = {
      x: e.clientX,
      y: e.clientY,
    }
  }

  const handlePointerUp = (e) => {
    e.stopPropagation()

    isRotating.current = false
    e.target.releasePointerCapture(e.pointerId)
  }

  return (
    <group ref={groupRef}>
      <primitive object={voyagerScene} />

      <mesh
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <sphereGeometry args={[1.4, 32, 32]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  )
}

function SpaceScene({ scrollProgress }) {
  const showMilestones = scrollProgress > 0.35

  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />

      <VoyagerModel scrollProgress={scrollProgress} />

      {showMilestones && <Milestones scrollProgress={scrollProgress} />}
    </>
  )
}

const datos = [
  { numero: '24 mil millones', unidad: 'km de la Tierra' },
  { numero: '48', unidad: 'años en el espacio' },
  { numero: '17', unidad: 'km por segundo' },
]

const storyBlocks = [
  {
    year: '1977',
    title: 'Una misión científica',
    text: 'En 1977, dos naves idénticas fueron lanzadas al espacio para explorar los planetas gigantes del sistema solar.',
  },
  {
    year: 'Júpiter y Saturno',
    title: 'El viaje empieza a revelar mundos',
    text: 'Voyager 1 y Voyager 2 no fueron pensadas como objetos destinados a sobrevivir por generaciones. Su objetivo era aprovechar una tecnica conocida como asistencia gravitatoria para visitar mundos lejanos y enviar datos e imágenes a la Tierra. Esta técnica permitia usar la gravedad de un planeta para impulsar la nave hacia el siguiente. Lo que en otro contexto hubiera requerido mucho más combustible y tiempo, en ese momento podía lograrse con una trayectoria precisa y ambiciosa.',
  },
  {
    year: 'Urano y Neptuno',
    title: 'Dos caminos distintos',
    text: 'Mientras Voyager 1 siguió su camino hacia las afueras del sistema solar, Voyager 2 continuó explorando Urano y Neptuno.',
  },
  {
    year: '1990',
    title: 'Pale Blue Dot',
    text: 'A medida que la nave se alejaba, la Tierra dejó de verse como un mundo inmenso y empezó a aparecer como un punto mínimo en la oscuridad.',
  },
  {
    year: '2012',
    title: 'Espacio interestelar',
    text: 'Voyager 1 cruzó una frontera invisible y se convirtió en el primer objeto humano en entrar al espacio interestelar.',
  },
]

export default function StickyScroll() {
  const sectionRef = useRef()
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const section = sectionRef.current
      if (!section) return

      const rect = section.getBoundingClientRect()
      const sectionHeight = section.offsetHeight - window.innerHeight
      const scrolled = -rect.top

      const progress = clamp(scrolled / sectionHeight, 0, 1)
      setScrollProgress(progress)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section ref={sectionRef} className="voyager-section">
      <div className="voyager-canvas">
        <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
          <SpaceScene scrollProgress={scrollProgress} />
        </Canvas>
      </div>

      <div className="sticky-right">
        {datos.map((dato, i) => (
          <div key={i} className="sticky-block">
            <span className="sticky-numero">{dato.numero}</span>
            <span className="sticky-unidad">{dato.unidad}</span>
          </div>
        ))}
      </div>

      <div className="story-wrapper">
        {storyBlocks.map((block, i) => (
          <div key={i} className="story-step">
            <div className="story-text">
              <span className="story-year">{block.year}</span>
              <h2>{block.title}</h2>
              <p>{block.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}