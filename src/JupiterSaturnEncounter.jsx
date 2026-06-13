import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, useTexture } from '@react-three/drei'
import { DoubleSide, RingGeometry, Vector3, ClampToEdgeWrapping } from 'three'

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function lerp(a, b, t) {
  return a + (b - a) * t
}
function JupiterPlanet() {
  const texture = useTexture('/textures/jupiter.jpg')
  const planetRef = useRef()

  useFrame(() => {
    if (!planetRef.current) return
    planetRef.current.rotation.y += 0.002
  })

  return (
    <mesh ref={planetRef} position={[1.85, 0, -1.2]} scale={1.55}>
      <sphereGeometry args={[1, 96, 96]} />
      <meshStandardMaterial map={texture} roughness={0.8} />
    </mesh>
  )
}
function SaturnPlanet() {
  const saturnTexture = useTexture('/textures/saturn.jpg')
  const ringTexture = useTexture('/textures/saturnRing.png')

  const planetRef = useRef()
  const ringRef = useRef()

  useEffect(() => {
    ringTexture.wrapS = ClampToEdgeWrapping
    ringTexture.wrapT = ClampToEdgeWrapping
    ringTexture.needsUpdate = true
  }, [ringTexture])

  const ringGeometry = useMemo(() => {
    const innerRadius = 1.35
    const outerRadius = 2.35
    const geometry = new RingGeometry(innerRadius, outerRadius, 160)

    const position = geometry.attributes.position
    const uv = geometry.attributes.uv
    const v3 = new Vector3()

    for (let i = 0; i < position.count; i++) {
      v3.fromBufferAttribute(position, i)

      const radius = Math.sqrt(v3.x * v3.x + v3.y * v3.y)
      const t = (radius - innerRadius) / (outerRadius - innerRadius)

      // t recorre el radio del anillo
      // 0.5 deja la textura estable en el otro eje
      uv.setXY(i, t, 0.5)
    }

    uv.needsUpdate = true
    return geometry
  }, [])

  useFrame(() => {
    if (planetRef.current) {
      planetRef.current.rotation.y += 0.0088
    }

  })

  return (
    <group position={[1.95, -4.2, -1.35]} scale={1.45}>
      {/* Planeta */}
      <mesh ref={planetRef}>
        <sphereGeometry args={[1, 96, 96]} />
        <meshStandardMaterial map={saturnTexture} roughness={0.88} />
      </mesh>

      {/* Anillos */}
      <mesh
        ref={ringRef}
        geometry={ringGeometry}
        rotation={[Math.PI / 2.18, 0, 0.12]}
      >
        <meshBasicMaterial
          map={ringTexture}
          transparent
          opacity={0.95}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

function VoyagerFlyby({ scrollProgress }) {
  const { scene } = useGLTF('/VoyagerProbe.glb')
  const voyagerScene = useMemo(() => scene.clone(), [scene])
  const groupRef = useRef()

  useFrame((state) => {
    if (!groupRef.current) return

    const time = state.clock.getElapsedTime()

    const jupiterFlyby = clamp(scrollProgress / 0.32, 0, 1)
    const travelToSaturn = clamp((scrollProgress - 0.28) / 0.42, 0, 1)
    const saturnFlyby = clamp((scrollProgress - 0.62) / 0.28, 0, 1)

    let baseX
    let baseY
    let baseZ

    if (scrollProgress < 0.32) {
      /*
        Sobrevuelo de Júpiter.
      */
      baseX = lerp(-3.1, 2.25, jupiterFlyby)
      baseY = lerp(0.95, 0.55, jupiterFlyby)
      baseZ = lerp(0.35, 0.75, jupiterFlyby)
    } else if (scrollProgress < 0.62) {
      /*
        Baja desde Júpiter hacia Saturno.
        Como la columna de planetas también sube,
        la nave no necesita irse tan abajo.
      */
      baseX = lerp(2.25, 2.05, travelToSaturn)
      baseY = lerp(0.55, -0.25, travelToSaturn)
      baseZ = lerp(0.75, 0.85, travelToSaturn)
    } else {
      /*
        Sobrevuela Saturno y empieza a salir.
      */
      baseX = lerp(2.05, 3.1, saturnFlyby)
      baseY = lerp(-0.25, -0.65, saturnFlyby)
      baseZ = lerp(0.85, 1.15, saturnFlyby)
    }

    const zigzagX = Math.sin(time * 1.5 + scrollProgress * 12) * 0.18
    const zigzagY = Math.sin(time * 2.1 + scrollProgress * 9) * 0.1
    const waveZ = Math.sin(time * 1.2 + scrollProgress * 6) * 0.07

    const scale = lerp(0.18, 0.26, clamp(scrollProgress / 0.7, 0, 1))

    groupRef.current.position.set(
      baseX + zigzagX,
      baseY + zigzagY,
      baseZ + waveZ
    )

    groupRef.current.scale.set(scale, scale, scale)

    groupRef.current.rotation.x = Math.sin(time * 1.5) * 0.12
    groupRef.current.rotation.y = scrollProgress * Math.PI * 4 + 0.7
    groupRef.current.rotation.z = Math.sin(time * 1.2) * 0.22
  })

  return (
    <group ref={groupRef}>
      <primitive object={voyagerScene} />
    </group>
  )
}

function PlanetColumn({ scrollProgress }) {
  /*
    Mueve toda la columna de planetas hacia arriba.
    Al principio se ve Júpiter.
    Después, cuando la nave baja, Saturno entra al centro.
  */
  const travelProgress = clamp((scrollProgress - 0.25) / 0.48, 0, 1)
  const groupY = lerp(0, 4.2, travelProgress)

  return (
    <group position={[0, groupY, 0]}>
      <JupiterPlanet />
      <SaturnPlanet />
    </group>
  )
}

function JupiterSaturnScene({ scrollProgress }) {
  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 3, 5]} intensity={1.4} />
      <pointLight position={[-3, 1, 3]} intensity={0.8} />

      <PlanetColumn scrollProgress={scrollProgress} />
      <VoyagerFlyby scrollProgress={scrollProgress} />
    </>
  )
}

const steps = [
  {
    kicker: '1979',
    title: 'El primer gran encuentro',
    text: 'El paso por Júpiter transformó la misión en algo visible para el público. Voyager permitió observar de cerca al planeta más grande del sistema solar.',
  },
  {
    kicker: 'Júpiter',
    title: 'De punto brillante a mundo dinámico',
    text: 'Sus nubes, tormentas y lunas dejaron de ser manchas lejanas. La distancia empezó a convertirse en detalle, imagen y conocimiento.',
  },
  {
    kicker: 'Datos invisibles',
    title: 'No solo imágenes',
    text: 'Además de fotografiar, Voyager midió campos magnéticos y partículas. El encuentro con Júpiter también fue una forma de registrar fenómenos que no podían verse a simple vista.',
    flourish: true,
  },
  {
    kicker: '1980',
    title: 'Saturno y la decisión que cambió el destino',
    text: 'Después de Júpiter, Voyager 1 llegó a Saturno. Allí la misión tuvo uno de sus momentos clave.',
  },
  {
    kicker: 'Titán',
    title: 'La trayectoria que cambió el recorrido',
    text: 'La ruta elegida permitió estudiar Titán, una de las lunas más importantes de Saturno. Pero esa decisión también hizo que Voyager 1 abandonara el plano principal de los planetas.',
  },
  {
    kicker: 'Salida',
    title: 'El comienzo del viaje hacia afuera',
    text: 'Después de Saturno, Voyager 1 ya no seguiría visitando otros mundos. Desde ese momento empezó su salida definitiva hacia las afueras del sistema solar.',
  },
]

export default function JupiterSaturnEncounter() {
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
    <section ref={sectionRef} className="jupiter-saturn-section">
      <div className="jupiter-saturn-sticky">
        <div className="jupiter-saturn-canvas">
          <Canvas camera={{ position: [0, 0, 4.2], fov: 48 }}>
            <JupiterSaturnScene scrollProgress={scrollProgress} />
          </Canvas>
        </div>
      </div>

      <div className="jupiter-saturn-text-steps">
        {steps.map((step, index) => (
          <article key={index} className="jupiter-saturn-text-step">
            <span>{step.kicker}</span>
            <h2>{step.title}</h2>
            <p>{step.text}</p>

            {step.flourish && (
              <div className="flourish-embed-container">
                <iframe
                  src="https://flo.uri.sh/visualisation/29361863/embed"
                  title="Voyager no solo fotografió Júpiter: también midió lo invisible"
                  className="flourish-iframe"
                  allowFullScreen
                />
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}