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

function UranusPlanet() {
  const texture = useTexture('/textures/uranus.jpg')
  const planetRef = useRef()

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (planetRef.current) planetRef.current.rotation.y = time * 0.12
  })

  return (
    <mesh ref={planetRef} position={[1.9, -8.0, -1.25]} scale={1.25}>
      <sphereGeometry args={[1, 96, 96]} />
      <meshStandardMaterial map={texture} roughness={0.85} />
    </mesh>
  )
}

function NeptunePlanet() {
  const texture = useTexture('/textures/neptune.jpg')
  const planetRef = useRef()

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (planetRef.current) planetRef.current.rotation.y = time * 0.13
  })

  return (
    <mesh ref={planetRef} position={[1.9, -11.4, -1.25]} scale={1.28}>
      <sphereGeometry args={[1, 96, 96]} />
      <meshStandardMaterial map={texture} roughness={0.85} />
    </mesh>
  )
}

function VoyagerFlyby({ scrollProgress }) {
  const { scene } = useGLTF('/VoyagerProbe.glb')

  const voyager1Scene = useMemo(() => scene.clone(), [scene])
  const voyager2Scene = useMemo(() => scene.clone(), [scene])

  const voyager1Ref = useRef()
  const voyager2Ref = useRef()

  useFrame((state) => {
    const time = state.clock.getElapsedTime()

    /*
      =========================
      VOYAGER 1
      Júpiter → Saturno → sale
      =========================
    */

    if (voyager1Ref.current) {
      let baseX
      let baseY
      let baseZ

      const jupiterProgress = clamp(scrollProgress / 0.35, 0, 1)
      const saturnProgress = clamp((scrollProgress - 0.35) / 0.2, 0, 1)
      const exitProgress = clamp((scrollProgress - 0.55) / 0.12, 0, 1)

      if (scrollProgress < 0.35) {
        // Sobrevuelo de Júpiter
        baseX = lerp(-3.1, 2.25, jupiterProgress)
        baseY = lerp(0.9, 0.35, jupiterProgress)
        baseZ = lerp(0.35, 0.75, jupiterProgress)
      } else if (scrollProgress < 0.55) {
        // Baja hacia Saturno
        baseX = lerp(2.25, 2.05, saturnProgress)
        baseY = lerp(0.35, -0.3, saturnProgress)
        baseZ = lerp(0.75, 0.85, saturnProgress)
      } else {
        // Después de Saturno se va hacia la derecha
        baseX = lerp(2.05, 4.2, exitProgress)
        baseY = lerp(-0.3, -0.15, exitProgress)
        baseZ = lerp(0.85, 1.1, exitProgress)
      }

      const zigzagX = Math.sin(time * 1.5 + scrollProgress * 12) * 0.16
      const zigzagY = Math.sin(time * 2.1 + scrollProgress * 9) * 0.09
      const waveZ = Math.sin(time * 1.2 + scrollProgress * 6) * 0.06

      const visible = scrollProgress < 0.68

      voyager1Ref.current.visible = visible

      voyager1Ref.current.position.set(
        baseX + zigzagX,
        baseY + zigzagY,
        baseZ + waveZ
      )

      const scale = lerp(0.18, 0.25, clamp(scrollProgress / 0.55, 0, 1))
      voyager1Ref.current.scale.set(scale, scale, scale)

      voyager1Ref.current.rotation.x = Math.sin(time * 1.5) * 0.12
      voyager1Ref.current.rotation.y = scrollProgress * Math.PI * 4 + 0.7
      voyager1Ref.current.rotation.z = Math.sin(time * 1.2) * 0.22
    }

    /*
  =========================
  VOYAGER 2
  Entra desde la izquierda
  Saturno → Urano → Neptuno
  =========================
*/

if (voyager2Ref.current) {
  let baseX
  let baseY
  let baseZ

  const voyager2Progress = clamp((scrollProgress - 0.62) / 0.38, 0, 1)

  // Oculta la nave hasta que realmente empiece a entrar
  voyager2Ref.current.visible = voyager2Progress > 0.03

  if (voyager2Progress < 0.35) {
    const p = clamp(voyager2Progress / 0.35, 0, 1)

    // Entra desde la izquierda de forma continua
    baseX = lerp(-4.2, 1.95, p)
    baseY = lerp(0.1, -0.45, p)
    baseZ = lerp(0.35, 0.85, p)
  } else if (voyager2Progress < 0.7) {
    const p = clamp((voyager2Progress - 0.35) / 0.35, 0, 1)

    // Sigue hacia Urano
    baseX = lerp(1.95, 2.0, p)
    baseY = lerp(-0.45, -0.55, p)
    baseZ = lerp(0.85, 0.95, p)
  } else {
    const p = clamp((voyager2Progress - 0.7) / 0.3, 0, 1)

    // Sigue hacia Neptuno
    baseX = lerp(2.0, 2.15, p)
    baseY = lerp(-0.55, -0.75, p)
    baseZ = lerp(0.95, 1.05, p)
  }

  const zigzagX = Math.sin(time * 1.45 + scrollProgress * 12) * 0.16
  const zigzagY = Math.sin(time * 2.0 + scrollProgress * 9) * 0.09
  const waveZ = Math.sin(time * 1.1 + scrollProgress * 6) * 0.06

  voyager2Ref.current.position.set(
    baseX + zigzagX,
    baseY + zigzagY,
    baseZ + waveZ
  )

  const scale = 0.24
  voyager2Ref.current.scale.set(scale, scale, scale)

  voyager2Ref.current.rotation.x = Math.sin(time * 1.5) * 0.12
  voyager2Ref.current.rotation.y = scrollProgress * Math.PI * 4 + 1.1
  voyager2Ref.current.rotation.z = Math.sin(time * 1.2) * 0.22
}
  })

  return (
    <>
      <group ref={voyager1Ref}>
        <primitive object={voyager1Scene} />
      </group>

      <group ref={voyager2Ref}>
        <primitive object={voyager2Scene} />
      </group>
    </>
  )
}

function PlanetColumn({ scrollProgress }) {

  let groupY = 0

  if (scrollProgress < 0.35) {
    groupY = 0
  } else if (scrollProgress < 0.55) {
    const p = clamp((scrollProgress - 0.35) / 0.2, 0, 1)
    groupY = lerp(0, 4.2, p)
  } else if (scrollProgress < 0.75) {
    const p = clamp((scrollProgress - 0.55) / 0.2, 0, 1)
    groupY = lerp(4.2, 8.0, p)
  } else {
    const p = clamp((scrollProgress - 0.75) / 0.2, 0, 1)
    groupY = lerp(8.0, 11.4, p)
  }

  return (
    <group position={[0, groupY, 0]}>
      <JupiterPlanet />
      <SaturnPlanet />
      <UranusPlanet />
      <NeptunePlanet />
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
    flourishJupiter: true,
  },
  {
    kicker: '1980',
    title: 'Saturno y la decisión que cambió el destino',
    text: 'Después de Júpiter, Voyager 1 llegó a Saturno. Allí la misión tuvo uno de sus momentos clave.',
    flourishSaturn: true,
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
  {
  kicker: 'Voyager 2',
  title: 'La hermana que siguió explorando',
  text: 'Mientras Voyager 1 tomaba el camino hacia el espacio interestelar, Voyager 2 continuó su propio recorrido.',
},
{
  kicker: 'Urano',
  title: 'Un mundo visitado una sola vez',
  text: 'Voyager 2 fue la única nave que sobrevoló Urano, ampliando la exploración más allá de Júpiter y Saturno.',
},
{
  kicker: 'Neptuno',
  title: 'El último planeta gigante',
  text: 'En 1989, Voyager 2 llegó a Neptuno y completó una exploración histórica de los cuatro planetas gigantes.',
},
{
  kicker: 'Dos caminos',
  title: 'Una misión, dos destinos',
  text: 'Voyager 1 llegó más lejos. Voyager 2, en cambio, completó el retrato más amplio de los mundos exteriores.',
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

            {step.flourishJupiter && (
              <div className="flourish-embed-container">
                <iframe
                  src="https://flo.uri.sh/visualisation/29361863/embed"
                  title="Voyager no solo fotografió Júpiter: también midió lo invisible"
                  className="flourish-iframe"
                  allowFullScreen
                />
              </div>
            )}
            {step.flourishSaturn && (
              <div className="flourish-embed-container">
                <iframe src='https://flo.uri.sh/visualisation/29362393/embed' title='Interactive or visual content' className="flourish-iframe"></iframe>
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  )
}

            // {step.compareVoyagers && (
            //   <div className="flourish-embed-container">
            //     <iframe src='https://flo.uri.sh/visualisation/29365005/embed' title='Interactive or visual content' className="flourish-iframe"></iframe>
            //   </div>
            // )}