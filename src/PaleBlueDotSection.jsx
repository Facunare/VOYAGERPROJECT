import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, useTexture } from '@react-three/drei'

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

function EarthDot({ scrollProgress }) {
  const earthTexture = useTexture('/textures/earth.jpg')
  const earthRef = useRef()

  useFrame(() => {
    if (!earthRef.current) return
    earthRef.current.rotation.y += 0.002
  })

  const shrinkProgress = clamp(scrollProgress / 0.85, 0, 1)

  /*
    Cuando ya está muy lejos, empieza a verse como punto brillante.
  */
  const starProgress = clamp((shrinkProgress - 0.82) / 0.88, 0, 1)

  const planetScale = lerp(1.15, 0.02, shrinkProgress)

  const x = lerp(1.75, 2.45, shrinkProgress)
  const y = lerp(0.05, 0.65, shrinkProgress)
  const z = lerp(-1.4, -2.4, shrinkProgress)

  return (
    <group position={[x, y, z]}>
      {/* Tierra */}
      <mesh ref={earthRef} scale={planetScale}>
        <sphereGeometry args={[1, 96, 96]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.75}
          emissive="#7ec8ff"
          emissiveIntensity={lerp(0.08, 1.8, starProgress)}
        />
      </mesh>

      {/* Halo interno */}
      <mesh scale={lerp(0.0, 0.12, starProgress)}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial
          color="#9fd8ff"
          transparent
          opacity={lerp(0, 0.65, starProgress)}
        />
      </mesh>

      {/* Halo externo */}
      <mesh scale={lerp(0.0, 0.22, starProgress)}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshBasicMaterial
          color="#7ec8ff"
          transparent
          opacity={lerp(0, 0.22, starProgress)}
        />
      </mesh>

      {/* Luz para que se vea como puntito brillante */}
      <pointLight
        color="#8ecbff"
        intensity={lerp(0, 4.2, starProgress)}
        distance={lerp(0, 2.5, starProgress)}
      />
    </group>
  )
}
function VoyagerApproach({ scrollProgress }) {
  const { scene } = useGLTF('/VoyagerProbe.glb')
  const voyagerScene = useMemo(() => scene.clone(), [scene])
  const groupRef = useRef()

  useFrame((state) => {
    if (!groupRef.current) return

    const time = state.clock.getElapsedTime()
    const p = clamp(scrollProgress, 0, 1)

    const approach = smoothstep(0, 0.58, p)
    const exit = smoothstep(0.78, 1, p)

    const x = lerp(
      lerp(-1.9, 0.5, approach),
      4.4,
      exit
    )

    const y = lerp(
      lerp(-0.45, 0.15, approach),
      -0.05,
      exit
    )

    const z = lerp(
      lerp(-1.4, 1.15, approach),
      0.85,
      exit
    )

    const scale = lerp(
      lerp(0.12, 0.38, approach),
      0.3,
      exit
    )

      groupRef.current.position.set(
        x + Math.sin(time * 0.85) * 0.028,
        y + Math.sin(time * 1.05) * 0.02,
        z
      )

    groupRef.current.scale.set(scale, scale, scale)

    groupRef.current.rotation.x = Math.sin(time * 0.75) * 0.04
    groupRef.current.rotation.y = lerp(0.8, 2.75, p)
    groupRef.current.rotation.z = Math.sin(time * 0.7) * 0.06
  })

  return (
    <group ref={groupRef}>
      <primitive object={voyagerScene} />
    </group>
  )
}

function PaleBlueDotScene({ scrollProgress }) {
  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 3, 5]} intensity={1.35} />
      <pointLight position={[-3, 1, 3]} intensity={0.7} />

      <EarthDot scrollProgress={scrollProgress} />
      <VoyagerApproach scrollProgress={scrollProgress} />
    </>
  )
}

const steps = [
  {
    kicker: '1990',
    title: 'El punto azul pálido',
    text: 'A medida que Voyager se alejaba, la Tierra empezó a perder tamaño. Lo que para nosotros es todo, desde la distancia se convierte en un punto diminuto.',
  },
  {
    kicker: 'Perspectiva',
    title: 'Todo en un punto',
    text: 'Ciudades, países, océanos, historias y problemas quedan contenidos en una pequeña señal azul suspendida en la oscuridad.',
  },
  {
    kicker: 'Distancia',
    title: 'Cuanto más lejos, más pequeña',
    text: 'El viaje deja de tratarse solamente de planetas y kilómetros. Empieza a hablar de perspectiva: cuanto más lejos llega Voyager, más pequeña parece la Tierra, pero también más valiosa.',
    graph: true,
  },
]

const voyagerDistanceChart = {
  kicker: 'Distancias',
  title: 'Dos naves, dos distancias',
  subtitle:
    'Voyager 1 llego mas lejos, pero Voyager 2 exploro mas planetas antes de seguir hacia el espacio interestelar.',
  yTitle: 'Distancia al Sol (AU)',
  xStart: '1975',
  xEnd: '2030',
  yMax: 180,
  voyager1: [
    0, 6, 14, 22, 31, 40, 39, 42, 50, 61, 72, 83, 92, 101, 110, 119,
    128, 137, 146, 155, 164, 170,
  ],
  voyager2: [
    0, 4, 9, 15, 25, 34, 39, 45, 52, 59, 66, 72, 80, 88, 96, 105,
    114, 123, 132, 139, 144, 147,
  ],
}
function VoyagerDistanceGraphSection() {
  const sectionRef = useRef()
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0

    const update = () => {
      cancelAnimationFrame(frame)

      frame = requestAnimationFrame(() => {
        const section = sectionRef.current
        if (!section) return

        const rect = section.getBoundingClientRect()
        const scrollable = section.offsetHeight - window.innerHeight
        const nextProgress = clamp(-rect.top / scrollable, 0, 1)

        setProgress(nextProgress)
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

  const graphFade = clamp(
  Math.min(progress / 0.35, (1 - progress) / 0.35),
  0,
  1
)

return (
  <section ref={sectionRef} className="mission-graph-section">
    <div className="mission-graph-sticky">
      <div
        className="mission-graph-dark-overlay"
        style={{ opacity: graphFade }}
      />

      <div className="mission-scroll-graph">
        <div className="mission-scroll-graph-header">
          <span>{voyagerDistanceChart.kicker}</span>
          <h2>{voyagerDistanceChart.title}</h2>
          <p>{voyagerDistanceChart.subtitle}</p>
        </div>

        <VoyagerDistanceGraph
          chart={voyagerDistanceChart}
          progress={progress}
        />

        <div className="mission-graph-legend">
          <span><i />Voyager 1</span>
          <span><i className="is-blue" />Voyager 2</span>
        </div>
      </div>
    </div>
  </section>
)
}

function buildSmoothPath(points) {
  const path = points.reduce((acc, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`
    }

    const prev = points[index - 1]
    const midX = (prev.x + point.x) / 2
    const midY = (prev.y + point.y) / 2

    return `${acc} Q ${prev.x} ${prev.y} ${midX} ${midY}`
  }, '')

  const last = points[points.length - 1]
  const beforeLast = points[points.length - 2]

  return `${path} Q ${beforeLast.x} ${beforeLast.y} ${last.x} ${last.y}`
}

function ScrollDrawPath({ d, className, progress }) {
  const pathRef = useRef(null)
  const [length, setLength] = useState(1)

  useEffect(() => {
    if (!pathRef.current) return
    setLength(pathRef.current.getTotalLength())
  }, [d])

  return (
    <path
      ref={pathRef}
      d={d}
      className={className}
      style={{
        strokeDasharray: length,
        strokeDashoffset: length * (1 - progress),
      }}
    />
  )
}
function VoyagerDistanceGraph({ chart, progress }) {
  const draw = clamp((progress - 0.05) / 0.9, 0, 1)

  const width = 1000
  const height = 520

const padding = {
  top: 70,
  right: 135,
  bottom: 90,
  left: 120,
}
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const makePoints = (values) =>
    values.map((value, index) => {
      const x = padding.left + (index / (values.length - 1)) * chartWidth
      const y = padding.top + chartHeight - (value / chart.yMax) * chartHeight
      return { x, y, value }
    })

  const voyager1Points = makePoints(chart.voyager1)
  const voyager2Points = makePoints(chart.voyager2)

  const voyager1Path = buildSmoothPath(voyager1Points)
  const voyager2Path = buildSmoothPath(voyager2Points)

  const v1End = voyager1Points[voyager1Points.length - 1]
  const v2End = voyager2Points[voyager2Points.length - 1]

  return (
    <svg
      className="mission-svg-graph"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <text
        x="-310"
        y="58"
        transform="rotate(-90)"
        className="mission-axis-title"
      >
        {chart.yTitle}
      </text>

      {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
        const y = padding.top + chartHeight - tick * chartHeight
        const value = Math.round(chart.yMax * tick)

        return (
          <g key={tick}>
            <line
              x1={padding.left}
              x2={padding.left + chartWidth}
              y1={y}
              y2={y}
              className="mission-grid-line"
            />
            <text
              x={padding.left - 18}
              y={y + 5}
              className="mission-graph-label"
              textAnchor="end"
            >
              {value}
            </text>
          </g>
        )
      })}

      <line
        x1={padding.left}
        y1={padding.top}
        x2={padding.left}
        y2={padding.top + chartHeight}
        className="mission-axis"
      />

      <line
        x1={padding.left}
        y1={padding.top + chartHeight}
        x2={padding.left + chartWidth}
        y2={padding.top + chartHeight}
        className="mission-axis"
      />

      <text
        x={padding.left}
        y={padding.top + chartHeight + 38}
        className="mission-graph-label"
        textAnchor="middle"
      >
        {chart.xStart}
      </text>

      <text
        x={padding.left + chartWidth}
        y={padding.top + chartHeight + 38}
        className="mission-graph-label"
        textAnchor="middle"
      >
        {chart.xEnd}
      </text>

      <path d={voyager1Path} className="mission-graph-line-shadow" />
      <path d={voyager2Path} className="mission-graph-line-shadow" />

      <ScrollDrawPath
        d={voyager1Path}
        className="mission-graph-line-yellow"
        progress={draw}
      />

      <ScrollDrawPath
        d={voyager2Path}
        className="mission-graph-line-blue"
        progress={draw}
      />
<text
  x={v1End.x + 24}
  y={v1End.y + 4}
  className="mission-graph-annotation mission-graph-annotation-yellow"
  style={{ opacity: clamp((draw - 0.82) / 0.12, 0, 1) }}
>
  Voyager 1
</text>

<text
  x={v2End.x + 24}
  y={v2End.y + 4}
  className="mission-graph-annotation mission-graph-annotation-blue"
  style={{ opacity: clamp((draw - 0.82) / 0.12, 0, 1) }}
>
  Voyager 2
</text>
    </svg>
  )
}

export default function PaleBlueDotSection() {
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
  <>
    <section ref={sectionRef} className="pale-section">
      <div className="pale-sticky">
        <div className="pale-canvas">
          <Canvas camera={{ position: [0, 0, 4.2], fov: 48 }}>
            <PaleBlueDotScene scrollProgress={scrollProgress} />
          </Canvas>
        </div>
      </div>

      <div className="pale-text-steps">
        {steps.map((step, index) => (
          <article key={index} className="pale-text-step">
            <span>{step.kicker}</span>
            <h2>{step.title}</h2>
            <p>{step.text}</p>
          </article>
        ))}
      </div>
    </section>

    <VoyagerDistanceGraphSection />
  </>
)
}