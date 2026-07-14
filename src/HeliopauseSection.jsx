import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { AdditiveBlending, DoubleSide } from 'three'
import { useNarrativeTitlesHidden } from './useNarrativeTitlesHidden.js'

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function smoothstep(from, to, value) {
  const t = clamp((value - from) / (to - from), 0, 1)
  return t * t * (3 - 2 * t)
}
function VoyagerBoundaryCrossing({ scrollProgress }) {
  const { scene } = useGLTF('/VoyagerProbe.glb')
  const voyagerScene = useMemo(() => scene.clone(), [scene])
  const groupRef = useRef()

  useFrame((state) => {
    if (!groupRef.current) return

    const time = state.clock.getElapsedTime()
    const p = clamp(scrollProgress, 0, 1)

    const enter = smoothstep(0.06, 1, p)

    const x = lerp(-4.4, 3.9, enter)
    const y = lerp(0.15, -0.05, enter)
    const z = lerp(0.25, 0.95, enter)

    const scale = lerp(0.18, 0.28, enter)

    groupRef.current.position.set(
      x + Math.sin(time * 0.7) * 0.038,
      y + Math.sin(time * 0.6) * 0.03,
      z
    )
groupRef.current.scale.set(scale, scale, scale)
    groupRef.current.rotation.x = Math.sin(time * 0.75) * 0.04
    groupRef.current.rotation.y = lerp(0.9, 2.2, enter)
    groupRef.current.rotation.z = Math.sin(time * 0.7) * 0.06
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
function HeliopauseScrollGraph({ progress }) {
  const svgRef = useRef(null)
  const solarPathRef = useRef(null)
  const cosmicPathRef = useRef(null)
  const [hoveredPoint, setHoveredPoint] = useState(null)

  const draw = clamp(progress, 0, 1)

  const width = 1000
  const height = 520

  const graphBounds = {
    x: 125,
    y: 70,
    width: 815,
    height: 360,
  }

  const crossingX = 635

  const solarPath =
    'M 130 120 C 240 130, 350 145, 455 170 C 555 210, 630 300, 700 365 C 770 415, 860 425, 940 420'

  const cosmicPath =
    'M 130 405 C 260 398, 370 390, 485 360 C 585 320, 645 210, 720 140 C 790 88, 865 75, 940 82'

  const getIntensityLabel = (y) => {
    const intensity = clamp(
      1 - (y - graphBounds.y) / graphBounds.height,
      0,
      1
    )

    if (intensity > 0.68) return 'Alta'
    if (intensity > 0.34) return 'Media'
    return 'Baja'
  }

  const getPopupData = (point) => {
    if (!point) return null

    const isSolar = point.type === 'solar'
    const intensity = getIntensityLabel(point.y)

    if (isSolar) {
      if (point.x < crossingX - 90) {
        return {
          eyebrow: 'Partículas solares',
          title: 'Dominio del Sol',
          value: intensity,
          description:
            'Antes del cruce, las partículas asociadas al viento solar todavía dominan las mediciones de Voyager 1.',
        }
      }

      if (point.x < crossingX + 90) {
        return {
          eyebrow: 'Partículas solares',
          title: 'La señal solar cae',
          value: intensity,
          description:
            'Cerca de la heliopausa, la influencia del Sol empieza a debilitarse de forma clara en los datos.',
        }
      }

      return {
        eyebrow: 'Partículas solares',
        title: 'El Sol queda atrás',
        value: intensity,
        description:
          'Después del cruce, las partículas solares bajan y Voyager 1 entra en un entorno dominado por el espacio interestelar.',
      }
    }

    if (point.x < crossingX - 90) {
      return {
        eyebrow: 'Rayos cósmicos',
        title: 'Señal interestelar baja',
        value: intensity,
        description:
          'Antes de atravesar la heliopausa, las partículas interestelares todavía aparecen con baja intensidad.',
      }
    }

    if (point.x < crossingX + 90) {
      return {
        eyebrow: 'Rayos cósmicos',
        title: 'Aumenta lo interestelar',
        value: intensity,
        description:
          'Durante el cruce, los rayos cósmicos empiezan a crecer: los datos muestran que Voyager 1 está cambiando de región.',
      }
    }

    return {
      eyebrow: 'Rayos cósmicos',
      title: 'Nuevo entorno',
      value: intensity,
      description:
        'Después de la heliopausa, las partículas interestelares dominan la medición: Voyager 1 ya está en el espacio entre las estrellas.',
    }
  }

  const getNearestPointOnPath = (pathRef, mouseX, mouseY, type) => {
    const path = pathRef.current
    if (!path || draw <= 0.02) return null

    const totalLength = path.getTotalLength()
    const visibleLength = totalLength * draw
    const samples = Math.max(12, Math.floor(160 * draw))

    let bestPoint = null
    let bestDistance = Infinity

    for (let i = 0; i <= samples; i++) {
      const point = path.getPointAtLength((i / samples) * visibleLength)

      const distance = Math.hypot(
        (point.x - mouseX) * 1.15,
        (point.y - mouseY) * 0.85
      )

      if (distance < bestDistance) {
        bestDistance = distance
        bestPoint = {
          x: point.x,
          y: point.y,
          type,
          distance,
        }
      }
    }

    return bestPoint
  }

  const handleGraphMouseMove = (event) => {
    if (!svgRef.current) return

    const rect = svgRef.current.getBoundingClientRect()

    const mouseX = ((event.clientX - rect.left) / rect.width) * width
    const mouseY = ((event.clientY - rect.top) / rect.height) * height

    const insideGraph =
      mouseX >= graphBounds.x &&
      mouseX <= graphBounds.x + graphBounds.width &&
      mouseY >= graphBounds.y &&
      mouseY <= graphBounds.y + graphBounds.height

    if (!insideGraph) {
      setHoveredPoint(null)
      return
    }

    const nearestSolar = getNearestPointOnPath(
      solarPathRef,
      mouseX,
      mouseY,
      'solar'
    )

    const nearestCosmic = getNearestPointOnPath(
      cosmicPathRef,
      mouseX,
      mouseY,
      'cosmic'
    )

    if (!nearestSolar && !nearestCosmic) {
      setHoveredPoint(null)
      return
    }

    if (!nearestCosmic || nearestSolar?.distance < nearestCosmic.distance) {
      setHoveredPoint(nearestSolar)
    } else {
      setHoveredPoint(nearestCosmic)
    }
  }

  const handleGraphMouseLeave = () => {
    setHoveredPoint(null)
  }

  const popup = getPopupData(hoveredPoint)

  return (
    <div className="heliopause-scroll-graph">
      <div className="heliopause-scroll-graph-header">
        <span>Datos de cruce</span>
        <h2>El cruce se vio en las mediciones</h2>
        <p>
          A medida que Voyager 1 atravesó la heliopausa, las partículas solares
          bajaron y las partículas interestelares empezaron a dominar.
        </p>
      </div>

      <svg
        ref={svgRef}
        className="heliopause-svg-graph"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        <line x1="125" y1="430" x2="940" y2="430" className="graph-axis" />
        <line x1="125" y1="70" x2="125" y2="430" className="graph-axis" />

        <text
          x="-390"
          y="10"
          className="graph-axis-title"
          transform="rotate(-90)"
        >
          INTENSIDAD RELATIVA
        </text>

        <text x="42" y="100" className="graph-label">Alta</text>
        <text x="42" y="430" className="graph-label">Baja</text>

        <text x="125" y="475" className="graph-label">2011</text>
        <text x="470" y="475" className="graph-label">2012</text>
        <text x="820" y="475" className="graph-label">2013</text>

        <path
          ref={solarPathRef}
          d={solarPath}
          className="graph-line graph-line-solar"
          pathLength="1"
          style={{ strokeDasharray: 1, strokeDashoffset: 1 - draw }}
        />

        <path
          ref={cosmicPathRef}
          d={cosmicPath}
          className="graph-line graph-line-cosmic"
          pathLength="1"
          style={{ strokeDasharray: 1, strokeDashoffset: 1 - draw }}
        />

        <line
          x1="635"
          y1="70"
          x2="635"
          y2="430"
          className="graph-crossing-line"
          style={{ opacity: smoothstep(0.45, 0.62, draw) }}
        />

        <rect
          x="650"
          y="82"
          width="285"
          height="38"
          rx="6"
          className="graph-label-bg"
          style={{ opacity: smoothstep(0.55, 0.7, draw) }}
        />

        <text
          x="665"
          y="108"
          className="graph-crossing-label"
          style={{ opacity: smoothstep(0.55, 0.7, draw) }}
        >
          Heliopausa · Agosto 2012
        </text>

        <rect
          x={graphBounds.x}
          y={graphBounds.y}
          width={graphBounds.width}
          height={graphBounds.height}
          fill="transparent"
          style={{ cursor: 'crosshair', pointerEvents: 'all' }}
          onMouseMove={handleGraphMouseMove}
          onMouseLeave={handleGraphMouseLeave}
        />

        {hoveredPoint && popup && (
          <g className="heliopause-hover-popup" style={{ pointerEvents: 'none' }}>
            <line
              x1={hoveredPoint.x}
              x2={hoveredPoint.x}
              y1={graphBounds.y}
              y2={graphBounds.y + graphBounds.height}
              className="mission-hover-line"
            />

            <circle
              cx={hoveredPoint.x}
              cy={hoveredPoint.y}
              r="8"
              className="mission-hover-dot"
            />

            <foreignObject
              x={
                hoveredPoint.x > width * 0.64
                  ? hoveredPoint.x - 360
                  : hoveredPoint.x + 26
              }
              y={clamp(hoveredPoint.y - 105, graphBounds.y + 10, height - 215)}
              width="340"
              height="205"
              style={{ pointerEvents: 'none' }}
            >
              <div
                className="mission-hover-card"
                style={{
                  width: '305px',
                  minHeight: '126px',
                  padding: '16px 18px',
                  borderRadius: '18px',
                  border:
                    hoveredPoint.type === 'solar'
                      ? '1px solid rgba(245, 166, 35, 0.6)'
                      : '1px solid rgba(126, 200, 255, 0.65)',
                  background:
                    hoveredPoint.type === 'solar'
                      ? 'radial-gradient(circle at top left, rgba(245, 166, 35, 0.24), transparent 45%), linear-gradient(135deg, rgba(8, 12, 28, 0.96), rgba(3, 5, 14, 0.9))'
                      : 'radial-gradient(circle at top left, rgba(126, 200, 255, 0.24), transparent 45%), linear-gradient(135deg, rgba(8, 12, 28, 0.96), rgba(3, 5, 14, 0.9))',
                  boxShadow:
                    hoveredPoint.type === 'solar'
                      ? '0 0 34px rgba(245, 166, 35, 0.28), 0 18px 60px rgba(0, 0, 0, 0.62)'
                      : '0 0 34px rgba(126, 200, 255, 0.3), 0 18px 60px rgba(0, 0, 0, 0.62)',
                  color: 'white',
                }}
              >
                <span
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    color:
                      hoveredPoint.type === 'solar' ? '#f5a623' : '#8ecbff',
                    fontSize: '0.64rem',
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                  }}
                >
                  {popup.eyebrow}
                </span>

                <h3
                  style={{
                    margin: 0,
                    color: 'white',
                    fontSize: '1.05rem',
                    lineHeight: 1.1,
                    textTransform: 'uppercase',
                  }}
                >
                  {popup.title}
                </h3>

                <strong
                  style={{
                    display: 'block',
                    marginTop: '8px',
                    color:
                      hoveredPoint.type === 'solar' ? '#f5a623' : '#8ecbff',
                    fontSize: '1.65rem',
                    lineHeight: 1,
                  }}
                >
                  {popup.value}
                </strong>

                <p
                  style={{
                    margin: '8px 0 0',
                    color: 'rgba(255, 255, 255, 0.78)',
                    fontSize: '0.72rem',
                    lineHeight: 1.35,
                  }}
                >
                  {popup.description}
                </p>
              </div>
            </foreignObject>
          </g>
        )}
      </svg>

      <div className="heliopause-graph-legend">
        <span><i className="solar" />Partículas solares</span>
        <span><i className="cosmic" />Rayos cósmicos interestelares</span>
      </div>
    </div>
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
  const graphRef = useRef()
  const [scrollProgress, setScrollProgress] = useState(0)
  const [graphProgress, setGraphProgress] = useState(0)
  const hideStoryTitles = useNarrativeTitlesHidden()

  useEffect(() => {
    const handleScroll = () => {
      const section = sectionRef.current
      const graph = graphRef.current
      if (!section) return

      const rect = section.getBoundingClientRect()
      const scrolled = -rect.top

      const textScrollable = window.innerHeight * (steps.length - 1)
      setScrollProgress(clamp(scrolled / textScrollable, 0, 1))

      if (graph) {
        const graphRect = graph.getBoundingClientRect()
        const graphScrollable = graph.offsetHeight - window.innerHeight
        setGraphProgress(clamp(-graphRect.top / graphScrollable, 0, 1))
      }
    }

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleScroll)
    handleScroll()

    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
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
            <span>{hideStoryTitles ? step.title : step.kicker}</span>
            {!hideStoryTitles && <h2>{step.title}</h2>}
            <p>{step.text}</p>
          </article>
        ))}
      </div>

      <div ref={graphRef} className="heliopause-graph-section">
        <div className="heliopause-graph-sticky">
          <HeliopauseScrollGraph progress={graphProgress} />
        </div>
      </div>
    </section>
  )
}
