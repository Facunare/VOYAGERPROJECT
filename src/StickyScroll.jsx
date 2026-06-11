import { useRef, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'

function VoyagerModel({ scrollProgress }) {
  const { scene } = useGLTF('/VoyagerProbe.glb')

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

    // Intro: arranca chica y lejos, y se acerca rápido
    const introProgress = Math.min(scrollProgress / 0.18, 1)

    const initialScale = 0.15
    const finalScale = 0.3
    const scale = initialScale + (finalScale - initialScale) * introProgress

    groupRef.current.scale.set(scale, scale, scale)

    const initialZ = -8
    const finalZ = 0
    const zPosition = initialZ + (finalZ - initialZ) * introProgress

    // Movimiento tipo nave espacial
    const movementProgress = introProgress

    const zigzagX =
      Math.sin(time * 1.2 + scrollProgress * 8) * 0.35 * movementProgress

    const floatingY =
      Math.sin(time * 1.8 + scrollProgress * 5) * 0.18 * movementProgress

    const forwardZ =
      Math.sin(time * 0.8) * 0.08 * movementProgress

    groupRef.current.position.x = zigzagX
    groupRef.current.position.y = floatingY
    groupRef.current.position.z = zPosition + forwardZ

    // Rotación automática + rotación manual
    const autoRotationY = scrollProgress * Math.PI * 4

    groupRef.current.rotation.x =
      manualRotation.current.x +
      Math.sin(time * 1.5) * 0.12 * movementProgress

    groupRef.current.rotation.y =
      autoRotationY + manualRotation.current.y

    groupRef.current.rotation.z =
      Math.sin(time * 1.2 + scrollProgress * 8) * 0.25 * movementProgress
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
      <primitive object={scene} />

      {/* Hitbox invisible para poder agarrar la Voyager fácil */}
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

const datos = [
  { numero: '24 mil millones', unidad: 'km de la Tierra' },
  { numero: '48', unidad: 'años en el espacio' },
  { numero: '17', unidad: 'km por segundo' },
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
      const progress = Math.min(Math.max(scrolled / sectionHeight, 0), 1)
      setScrollProgress(progress)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <section ref={sectionRef} className="sticky-section">
      <div className="sticky-left">
        <div className="sticky-overlay" />
        <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <VoyagerModel scrollProgress={scrollProgress} />
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
    </section>
  )
}