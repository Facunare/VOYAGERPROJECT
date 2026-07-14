import { useEffect, useRef, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function RotatableScaleModel({
  modelPath,
  modelScale = 1,
  modelPosition = [0, 0, 0],
  modelRotation = [0, 0, 0],
  hitSize = 2,
}) {
  const { scene } = useGLTF(modelPath)
  const modelScene = useMemo(() => scene.clone(), [scene])

  const groupRef = useRef()
  const isDragging = useRef(false)
  const lastPointer = useRef({ x: 0, y: 0 })

  useEffect(() => {
    modelScene.traverse((child) => {
      if (!child.isMesh) return

      child.castShadow = false
      child.receiveShadow = false

      if (child.material) {
        child.material.depthWrite = true
        child.material.needsUpdate = true
      }
    })
  }, [modelScene])

  useEffect(() => {
    const stopDragging = () => {
      isDragging.current = false
      document.body.style.cursor = ''
    }

    window.addEventListener('pointerup', stopDragging)
    window.addEventListener('blur', stopDragging)

    return () => {
      window.removeEventListener('pointerup', stopDragging)
      window.removeEventListener('blur', stopDragging)
      document.body.style.cursor = ''
    }
  }, [])

  useFrame(() => {
    /*
      Mantiene el canvas vivo.
      El modelo no rota solo: solo rota si el usuario lo arrastra.
    */
  })

  const handlePointerDown = (e) => {
    e.stopPropagation()

    isDragging.current = true
    lastPointer.current = {
      x: e.clientX,
      y: e.clientY,
    }

    document.body.style.cursor = 'grabbing'

    if (e.target?.setPointerCapture) {
      e.target.setPointerCapture(e.pointerId)
    }
  }

  const handlePointerMove = (e) => {
    if (!isDragging.current || !groupRef.current) return

    e.stopPropagation()

    const deltaX = e.clientX - lastPointer.current.x
    const deltaY = e.clientY - lastPointer.current.y

    groupRef.current.rotation.y += deltaX * 0.008
    groupRef.current.rotation.x += deltaY * 0.008

    lastPointer.current = {
      x: e.clientX,
      y: e.clientY,
    }
  }

  const handlePointerUp = (e) => {
    e.stopPropagation()

    isDragging.current = false
    document.body.style.cursor = ''

    if (e.target?.releasePointerCapture) {
      e.target.releasePointerCapture(e.pointerId)
    }
  }

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 5, 5]} intensity={1.3} />

      <group
        ref={groupRef}
        position={modelPosition}
        rotation={modelRotation}
      >
        <primitive object={modelScene} scale={modelScale} />
      </group>

      <mesh
        position={[0, 0, 1.6]}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <planeGeometry args={[hitSize, hitSize]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
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
    type: 'model',
    modelPath: '/scale/james-webb.glb',
    label: 'James Webb',
    size: '21 m',
    visualClass: 'scale-object-james-webb',
    modelScale: 0.18,
    modelPosition: [0, -0.05, 0],
    modelRotation: [0.25, -0.7, 0.05],
    hitSize: 5.5,
  },
  {
    type: 'model',
    modelPath: '/VoyagerProbe.glb',
    label: 'Voyager',
    size: '3,7 m',
    visualClass: 'scale-object-voyager',
    modelScale: 0.35,
    modelPosition: [0, -0.15, 0],
    modelRotation: [0.25, -0.6, 0.1],
    hitSize: 10,
  },
  {
    type: 'model',
    modelPath: '/scale/perseverance.glb',
    label: 'Perseverance',
    size: '3 m',
    visualClass: 'scale-object-perseverance',
    modelScale: 0.7,
    modelPosition: [0, -0.4, 0],
    modelRotation: [0.2, -0.7, 0],
    hitSize: 3,
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
    let frame = 0

    const handleScroll = () => {
      cancelAnimationFrame(frame)

      frame = requestAnimationFrame(() => {
        const section = sectionRef.current
        if (!section) return

        const rect = section.getBoundingClientRect()
        const sectionHeight = section.offsetHeight - window.innerHeight
        const scrolled = -rect.top

        setProgress(clamp(scrolled / sectionHeight, 0, 1))
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    handleScroll()

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  const currentPanel = progress * (scaleItems.length - 1)
  const translateX = -progress * ((scaleItems.length - 1) * 100)

  return (
    <section ref={sectionRef} className="scale-section scale-section-fullscreen">
      <div className="scale-sticky">
        <div className="scale-top-title">
          <span>Comparación de escala</span>
          <p>
            Una nave que, aunque mide solo
            3,7 metros, llegó más lejos que cualquier creación humana.
          </p>
        </div>

        <div className="scale-viewport scale-viewport-fullscreen">
          <div
            className="scale-horizontal-track"
            style={{
              transform: `translateX(${translateX}vw)`,
            }}
          >
            {scaleItems.map((item, index) => {
              const distance = Math.abs(index - currentPanel)

              const panelOpacity = clamp(1 - distance * 0.85, 0, 1)
              const panelBlur = clamp(distance * 5, 0, 5)
              const panelScale = clamp(1 - distance * 0.04, 0.95, 1)

              return (
                <div
                  key={index}
                  className="scale-panel scale-panel-fullscreen"
                  style={{
                    opacity: panelOpacity,
                    filter: `blur(${panelBlur}px)`,
                    transform: `scale(${panelScale})`,
                  }}
                >
                  <div className="scale-object-stage">
                    <div className={`scale-object-visual ${item.visualClass}`}>
                      {item.type === 'model' && distance < 0.55 ? (
                        <Canvas
                          camera={{ position: [0, 0, 4], fov: 45 }}
                          gl={{ alpha: true, antialias: true }}
                          style={{ background: 'transparent' }}
                        >
                          <RotatableScaleModel
                            modelPath={item.modelPath}
                            modelScale={item.modelScale}
                            modelPosition={item.modelPosition}
                            modelRotation={item.modelRotation}
                            hitSize={item.hitSize}
                          />
                        </Canvas>
                      ) : item.type === 'model' ? (
                        <div className="scale-model-placeholder" />
                      ) : (
                        <img src={item.src} alt={item.label} />
                      )}
                    </div>

                    <div className="scale-object-info">
                      <p>{item.label}</p>
                      <span>{item.size}</span>
                    </div>
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

useGLTF.preload('/VoyagerProbe.glb')
useGLTF.preload('/scale/james-webb.glb')
useGLTF.preload('/scale/perseverance.glb')
