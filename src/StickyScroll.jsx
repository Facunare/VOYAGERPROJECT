import { useRef, useEffect, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, useTexture } from '@react-three/drei'
import { DoubleSide, RingGeometry, Vector3, ClampToEdgeWrapping } from 'three'
import SpaceTransition from './SpaceTransition.jsx'

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
function SaturnRing({ size, ringTexture }) {
  const ringMap = useTexture(ringTexture)

  useEffect(() => {
    ringMap.wrapS = ClampToEdgeWrapping
    ringMap.wrapT = ClampToEdgeWrapping
    ringMap.needsUpdate = true
  }, [ringMap])

  const ringGeometry = useMemo(() => {
    const innerRadius = size * 1.35
    const outerRadius = size * 2.15

    const geometry = new RingGeometry(innerRadius, outerRadius, 160)

    const position = geometry.attributes.position
    const uv = geometry.attributes.uv
    const v3 = new Vector3()

    for (let i = 0; i < position.count; i++) {
      v3.fromBufferAttribute(position, i)

      const radius = Math.sqrt(v3.x * v3.x + v3.y * v3.y)
      const t = (radius - innerRadius) / (outerRadius - innerRadius)

      uv.setXY(i, t, 0.5)
    }

    uv.needsUpdate = true
    return geometry
  }, [size])

  return (
    <mesh geometry={ringGeometry} rotation={[Math.PI / 2.4, 0, 0]}>
      <meshBasicMaterial
        map={ringMap}
        transparent
        side={DoubleSide}
        opacity={0.85}
        depthWrite={false}
      />
    </mesh>
  )
}

function Planet({ position, size, texture, ringTexture, opacity = 1 }) {
  const planetTexture = useTexture(texture)

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[size, 64, 64]} />
        <meshStandardMaterial
          map={planetTexture}
          roughness={0.8}
          transparent
          opacity={opacity}
        />
      </mesh>

      {ringTexture && (
  <SaturnRing size={size} ringTexture={ringTexture} />
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
  const enterProgress = clamp((scrollProgress - 0.48) / 0.12, 0, 1)
  const travelProgress = clamp((scrollProgress - 0.55) / 0.30, 0, 1)
  const enterY = lerp(-4.2, 0.15, enterProgress)
  const travelY = lerp(0, 3.6, travelProgress)

  const groupY = enterY + travelY

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

    const headerProgress = clamp(scrollProgress / 0.16, 0, 1)
    const crossProgress = clamp((scrollProgress - 0.34) / 0.22, 0, 1)
    const downProgress = clamp((scrollProgress - 0.56) / 0.44, 0, 1)

    /*
      Salida final:
      en el último tramo del sticky scroll, la nave abandona la escena
      por el costado derecho.
    */
    const exitProgress = smooth(0.9, 1, scrollProgress)

    let x
    let y
    let z
    let scale

    if (scrollProgress < 0.34) {
      /*
        Primera etapa:
        esta es la Voyager del header.
        Ya no aparece otra nave.
      */
      const floatStrength = lerp(1, 0.55, headerProgress)

      scale = lerp(0.2, 0.14, headerProgress)

      x =
        lerp(-1.45, -2.4, headerProgress) +
        Math.sin(time * 0.8) * 0.08 * floatStrength

      y =
        lerp(0.05, 0, headerProgress) +
        Math.sin(time * 0.9) * 0.14 * floatStrength

      z =
        lerp(0.15, 0, headerProgress) +
        Math.sin(time * 0.65) * 0.04 * floatStrength
    } else {
      /*
        Segunda etapa:
        la misma nave cruza y empieza a bajar
        por la línea narrativa del sticky scroll.
      */
      scale = lerp(0.14, 0.14, downProgress)
      scale = lerp(scale, 0.08, exitProgress)

      const baseX = lerp(-2.4, 2.15, crossProgress)

const riseY = lerp(0, 1.35, crossProgress)
const fallY = lerp(0, -3.0, downProgress)

const baseY = riseY + fallY
const baseZ = lerp(0, -0.4, downProgress)

/*
  Zigzag real ligado al scroll:
  - empieza suave cuando cruza
  - se nota más cuando baja por los planetas
  - desaparece cuando sale de escena
*/
const pathProgress = clamp((scrollProgress - 0.48) / 0.42, 0, 1)

const zigzagStrength =
  smooth(0.08, 0.28, pathProgress) *
  (1 - exitProgress)

const scrollZigzagX =
  Math.sin(pathProgress * Math.PI * 2.6) * 0.28 * zigzagStrength

const scrollZigzagY =
  Math.sin(pathProgress * Math.PI * 2.0 + 0.8) * 0.10 * zigzagStrength

const floatingX =
  Math.sin(time * 0.9) * 0.035 * zigzagStrength

const floatingY =
  Math.sin(time * 1.1) * 0.025 * zigzagStrength

const zigzagX = scrollZigzagX + floatingX
const zigzagY = scrollZigzagY + floatingY

const waveZ =
  Math.sin(pathProgress * Math.PI * 4) * 0.12 * zigzagStrength

      /*
        Posición normal de la nave en el recorrido.
      */
      const normalX = baseX + zigzagX
      const normalY = baseY + zigzagY
      const normalZ = baseZ + waveZ

      /*
        Posición final fuera de pantalla, hacia la derecha.
        Si querés que se vaya más rápido o más lejos, subí el 5.2.
      */
      x = lerp(normalX, 5.2, exitProgress)
      y = lerp(normalY, -1.15, exitProgress)
      z = lerp(normalZ, -0.15, exitProgress)
    }

    groupRef.current.position.set(x, y, z)
    groupRef.current.scale.set(scale, scale, scale)

    groupRef.current.rotation.x =
      manualRotation.current.x + Math.sin(time * 0.75) * 0.04

    groupRef.current.rotation.y =
      lerp(0.9, 2.2, scrollProgress) + manualRotation.current.y + exitProgress * 0.9
groupRef.current.rotation.z =
  Math.sin(scrollProgress * Math.PI * 7) * 0.18 +
  Math.sin(time * 0.7) * 0.05 -
  exitProgress * 0.35
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
  const showMilestones = scrollProgress > 0.48

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
    title: 'UNA MISION CIENTIFICA',
    text: 'En 1977, dos naves idénticas fueron lanzadas al espacio para explorar los planetas gigantes del sistema solar.',
  },
  {
    year: 'Júpiter y Saturno',
    title: 'El viaje empieza a revelar mundos',
    text: 'Voyager 1 y Voyager 2 fueron lanzadas para explorar planetas lejanos usando asistencia gravitatoria: una técnica que aprovecha la gravedad de un planeta para impulsar la nave hacia el siguiente. Gracias a eso, pudieron viajar más lejos, más rápido y con menos combustible.',
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

    <div
      className="voyager-hero-content"
      style={{
        opacity: 1 - smooth(0.06, 0.16, scrollProgress),
        transform: `translateY(${-smooth(0.06, 0.16, scrollProgress) * 35}px)`,
      }}
    >
      <div className="hero-text">
        <h1>
          <span style={{ color: '#f5a623' }}>
            VOYAGER:
          </span>{' '}
          <span className="title">
            LA HISTORIA EN EL MAS ALLA
          </span>
        </h1>

        <h2>
          El viaje que empezó como una misión y terminó
          como una historia de la humanidad
        </h2>
      </div>
    </div>
    <div className="sticky-right">
  {datos.map((dato, i) => (
    <div key={i} className="sticky-block">
      <span className="sticky-numero">{dato.numero}</span>
      <span className="sticky-unidad">{dato.unidad}</span>
    </div>
  ))}
</div>

<div className="sticky-scroll-space-transition">
  <SpaceTransition title="EL VIAJE MÁS LEJANO DE LA HUMANIDAD" showVoyager={false} />
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