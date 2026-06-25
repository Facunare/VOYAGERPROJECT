import { useEffect, useRef, useState, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function VoyagerScaleModel() {
  const { scene } = useGLTF('/VoyagerProbe.glb')
  const voyagerScene = useMemo(() => scene.clone(), [scene])

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[4, 5, 5]} intensity={1.2} />

      <primitive
        object={voyagerScene}
        scale={0.42}
        position={[0, -0.2, 0]}
        rotation={[0.25, -0.6, 0.1]}
      />
    </>
  )
}

const scaleItems = [
  {
    type: 'image',
    src: '/scale/eiffel.png',
    label: 'Torre Eiffel',
    size: '330 m',
    visualClass: 'scale-object-eiffel',
  },
  {
    type: 'image',
    src: '/scale/airplane.png',
    label: 'Avión comercial',
    size: '70 m',
    visualClass: 'scale-object-airplane',
  },
  {
    type: 'voyager',
    label: 'Voyager',
    size: '3,7 m',
    visualClass: 'scale-object-voyager',
  },
  {
    type: 'image',
    src: '/scale/person.png',
    label: 'Persona',
    size: '1,75 m',
    visualClass: 'scale-object-person',
  },
]

export default function ScaleComparison() {
  const sectionRef = useRef()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const section = sectionRef.current
      if (!section) return

      const rect = section.getBoundingClientRect()
      const sectionHeight = section.offsetHeight - window.innerHeight
      const scrolled = -rect.top

      setProgress(clamp(scrolled / sectionHeight, 0, 1))
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  /*
    4 objetos, cada panel mide 50vw.
    Para pasar del primero al último:
    3 desplazamientos de 50vw = 150vw
  */
  const translateX = -progress * 150

  return (
    <section ref={sectionRef} className="scale-section">
      <div className="scale-sticky">
        <div className="scale-intro">
          <span>Escala</span>
          <h2>Una nave pequeña frente a un viaje inmenso</h2>
          <p>
            Voyager no parece, a simple vista, un objeto destinado a convertirse
            en leyenda. Es una estructura pequeña frente a objetos mucho más
            grandes, pero llegó más lejos que cualquier creación humana.
          </p>
        </div>

        <div className="scale-viewport">
          <div
            className="scale-horizontal-track"
            style={{
              transform: `translateX(${translateX}vw)`,
            }}
          >
{scaleItems.map((item, index) => {
  const currentPanel = progress * (scaleItems.length - 1)
  const distance = Math.abs(index - currentPanel)

  const panelOpacity = clamp(1 - distance * 0.85, 0, 1)
  const panelBlur = clamp(distance * 5, 0, 5)
  const panelScale = clamp(1 - distance * 0.04, 0.95, 1)

  return (
    <div
      key={index}
      className="scale-panel"
      style={{
        opacity: panelOpacity,
        filter: `blur(${panelBlur}px)`,
        transform: `scale(${panelScale})`,
      }}
    >
      <div className={`scale-object-visual ${item.visualClass}`}>
        {item.type === 'voyager' ? (
          <Canvas camera={{ position: [0, 0, 4], fov: 45 }}>
            <VoyagerScaleModel />
          </Canvas>
        ) : (
          <img src={item.src} alt={item.label} />
        )}
      </div>

      <div className="scale-object-info">
        <span>{item.size}</span>
        <p>{item.label}</p>
      </div>
    </div>
  )
})}
          </div>
        </div>

        <div className="scale-ground-line" />
      </div>
    </section>
  )
}