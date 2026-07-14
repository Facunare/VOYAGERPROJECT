import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF, useTexture } from '@react-three/drei'
import { DoubleSide, RingGeometry, Vector3, ClampToEdgeWrapping } from 'three'
import { useNarrativeTitlesHidden } from './useNarrativeTitlesHidden.js'

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

      const zigzagX = Math.sin(time * 0.65) * 0.020
      const zigzagY = Math.sin(time * 0.55) * 0.01
      const waveZ = 0

      const visible = scrollProgress < 0.68

      voyager1Ref.current.visible = visible

      voyager1Ref.current.position.set(
        baseX + zigzagX,
        baseY + zigzagY,
        baseZ + waveZ
      )

      const scale = lerp(0.18, 0.25, clamp(scrollProgress / 0.55, 0, 1))
      voyager1Ref.current.scale.set(scale, scale, scale)

      voyager1Ref.current.rotation.x = Math.sin(time * 0.75) * 0.035
      voyager1Ref.current.rotation.y = scrollProgress * Math.PI * 4 + 0.6
      voyager1Ref.current.rotation.z =  Math.sin(time * 0.7) * 0.06
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

  voyager2Ref.current.visible = voyager2Progress > 0.03

  if (voyager2Progress < 0.35) {
    const p = clamp(voyager2Progress / 0.35, 0, 1)

    // Entra desde la izquierda
    baseX = lerp(-4.2, 1.95, p)
    baseY = lerp(0.1, -0.45, p)
    baseZ = lerp(0.35, 0.85, p)
  } else if (voyager2Progress < 0.68) {
    const p = clamp((voyager2Progress - 0.35) / 0.33, 0, 1)

    // Sigue hacia Urano
    baseX = lerp(1.95, 2.0, p)
    baseY = lerp(-0.45, -0.55, p)
    baseZ = lerp(0.85, 0.95, p)
  } else if (voyager2Progress < 0.86) {
    const p = clamp((voyager2Progress - 0.68) / 0.18, 0, 1)

    // Llega a Neptuno
    baseX = lerp(2.0, 2.15, p)
    baseY = lerp(-0.55, -0.75, p)
    baseZ = lerp(0.95, 1.05, p)
  } else {
    const p = clamp((voyager2Progress - 0.86) / 0.14, 0, 1)

    // Al final se va por la derecha y desaparece
    baseX = lerp(2.15, 5.3, p)
    baseY = lerp(-0.75, -0.55, p)
    baseZ = lerp(1.05, 1.35, p)
  }

  const exitProgress = clamp((voyager2Progress - 0.86) / 0.14, 0, 1)

  const zigzagStrength = 1 - exitProgress * 0.45

const zigzagX =
  Math.sin(time * 0.7) * 0.024 * zigzagStrength

const zigzagY =
  Math.sin(time * 0.6) * 0.01 * zigzagStrength

const waveZ = 0

  voyager2Ref.current.position.set(
    baseX + zigzagX,
    baseY + zigzagY,
    baseZ + waveZ
  )

  const scale = lerp(0.24, 0.16, exitProgress)
  voyager2Ref.current.scale.set(scale, scale, scale)

voyager2Ref.current.rotation.x = Math.sin(time * 0.75) * 0.04
voyager2Ref.current.rotation.y = lerp(0.9, 2.2, voyager2Progress) + exitProgress * 0.8
voyager2Ref.current.rotation.z = Math.sin(time * 0.7) * 0.06
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
  },
  {
    kicker: '1980',
    title: 'Saturno',
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

const magnetometerCharts = {
  jupiter: {
    kicker: 'Datos de cruce',
    title: 'Cuando Jupiter dejo de ser solo una imagen',
    subtitle:
      'Mediciones del magnetometro de Voyager 1 durante su sobrevuelo de Jupiter, marzo de 1979.',
    xStart: '1979-03-03',
    xEnd: '1979-03-16',
    yMax: 3500,
    annotation: 'Maximo acercamiento a Jupiter',
    points: [
      20, 15, 18, 24, 20, 34, 38, 52, 80, 120, 260, 620, 1320, 2450,
      3300, 1850, 760, 260, 120, 70, 45, 34, 28, 25, 20, 22, 18, 16,
      18, 15, 14, 18, 12,
    ],
  },
  saturn: {
    kicker: 'Datos de cruce',
    title: 'El encuentro que cambio el destino de Voyager',
    subtitle:
      'Mediciones del magnetometro de Voyager 1 durante su sobrevuelo de Saturno, noviembre de 1980.',
    xStart: '1980-11-10',
    xEnd: '1980-11-21',
    yMax: 1100,
    annotation: 'Maximo acercamiento a Saturno',
    points: [
      2, 3, 2, 3, 2, 4, 5, 12, 18, 22, 34, 65, 140, 360, 1080, 360,
      120, 42, 24, 16, 12, 9, 7, 5, 4, 4, 3, 3, 2, 2, 2, 2,
    ],
  },
}
function MagnetometerGraphSection({ chart, sceneStart, sceneEnd }) {
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

  const sceneProgress = lerp(sceneStart, sceneEnd, progress)

  return (
    <section ref={sectionRef} className="mission-graph-section">
      <div className="mission-graph-sticky">

        <div className="mission-scroll-graph">
          <div className="mission-scroll-graph-header">
            <span>{chart.kicker}</span>
            <h2>{chart.title}</h2>
            <p>{chart.subtitle}</p>
          </div>

          <MagnetometerGraph chart={chart} progress={progress} />

          <div className="mission-graph-legend">
            <span><i />BMAG_NT</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function MagnetometerGraphStep({ chart, progress }) {
  return (
    <article className="jupiter-saturn-graph-step">
      <div className="jupiter-saturn-graph-sticky">
        <div className="jupiter-saturn-graph-dark-overlay" />

        <div className="mission-scroll-graph">
          <div className="mission-scroll-graph-header">
            <span>{chart.kicker}</span>
            <h2>{chart.title}</h2>
            <p>{chart.subtitle}</p>
          </div>

          <MagnetometerGraph chart={chart} progress={progress} />

          <div className="mission-graph-legend">
            <span><i />BMAG_NT</span>
          </div>
        </div>
      </div>
    </article>
  )
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

function MagnetometerGraph({ chart, progress }) {
  const [hoveredPoint, setHoveredPoint] = useState(null)
  const svgRef = useRef(null)

  const draw = clamp((progress - 0.05) / 0.9, 0, 1)

  const width = 1000
  const height = 520

  const padding = {
    top: 70,
    right: 80,
    bottom: 90,
    left: 120,
  }

  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const points = chart.points.map((value, index) => {
    const x = padding.left + (index / (chart.points.length - 1)) * chartWidth
    const y = padding.top + chartHeight - (value / chart.yMax) * chartHeight

    return { x, y, value }
  })

const smoothPath = points.reduce((acc, point, index) => {
  if (index === 0) {
    return `M ${point.x} ${point.y}`
  }

  const prev = points[index - 1]

  const controlX = (prev.x + point.x) / 2
  const controlY = prev.y

  return `${acc} C ${controlX} ${controlY}, ${controlX} ${point.y}, ${point.x} ${point.y}`
}, '')

  const maxPoint = points.reduce((best, point) =>
    point.value > best.value ? point : best
  )

  const getPopupData = (point) => {
  if (!point) return null

  const isJupiter = chart.annotation.toLowerCase().includes('jupiter')
  const intensityRatio = point.value / chart.yMax
  const isAfterPeak = point.x > maxPoint.x
  const isPeakZone = intensityRatio > 0.75

  if (isPeakZone) {
    return isJupiter
      ? {
          title: 'Zona crítica',
          value: `${point.value} nT`,
          description:
            'La señal alcanza su punto máximo: Voyager 1 atraviesa la región de mayor intensidad magnética cerca de Júpiter.',
        }
      : {
          title: 'Pico magnético',
          value: `${point.value} nT`,
          description:
            'El campo magnético llega a su máxima intensidad durante el encuentro con Saturno.',
        }
  }

  if (isAfterPeak) {
    return isJupiter
      ? {
          title: 'Salida del entorno joviano',
          value: `${point.value} nT`,
          description:
            'Después del máximo acercamiento, la señal empieza a caer mientras Voyager 1 se aleja de Júpiter.',
        }
      : {
          title: 'Después del encuentro',
          value: `${point.value} nT`,
          description:
            'Tras el máximo acercamiento, la intensidad disminuye mientras Voyager 1 deja atrás el sistema de Saturno.',
        }
  }

  if (intensityRatio > 0.35) {
    return isJupiter
      ? {
          title: 'Entrada al entorno joviano',
          value: `${point.value} nT`,
          description:
            'La intensidad empieza a crecer. Voyager 1 se aproxima al dominio magnético de Júpiter.',
        }
      : {
          title: 'Aproximación a Saturno',
          value: `${point.value} nT`,
          description:
            'La señal aumenta mientras la nave se acerca al sistema de Saturno.',
        }
  }

  return isJupiter
    ? {
        title: 'Antes del encuentro',
        value: `${point.value} nT`,
        description:
          'La señal todavía es baja. Voyager 1 se encuentra antes de la zona de mayor influencia magnética de Júpiter.',
      }
    : {
        title: 'Antes del encuentro',
        value: `${point.value} nT`,
        description:
          'La medición permanece estable antes de que Saturno empiece a dominar los datos.',
      }
}

  const getNearestPoint = (mouseX) => {
    const visiblePoints = points.filter((_, index) => {
      const pointProgress = index / (points.length - 1)
      return pointProgress <= draw
    })

    if (visiblePoints.length === 0) return null

    return visiblePoints.reduce((nearest, point) => {
      const currentDistance = Math.abs(point.x - mouseX)
      const nearestDistance = Math.abs(nearest.x - mouseX)

      return currentDistance < nearestDistance ? point : nearest
    })
  }

  const handleGraphMouseMove = (event) => {
    const svg = svgRef.current
    if (!svg) return

    const svgPoint = svg.createSVGPoint()
    svgPoint.x = event.clientX
    svgPoint.y = event.clientY

    const cursor = svgPoint.matrixTransform(svg.getScreenCTM().inverse())

    const insideChart =
      cursor.x >= padding.left &&
      cursor.x <= padding.left + chartWidth &&
      cursor.y >= padding.top &&
      cursor.y <= padding.top + chartHeight

    if (!insideChart) {
      setHoveredPoint(null)
      return
    }

    setHoveredPoint(getNearestPoint(cursor.x))
  }

  const handleGraphMouseLeave = () => {
    setHoveredPoint(null)
  }

  return (
    <svg
      ref={svgRef}
      className="mission-svg-graph"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      <text
        x="-400"
        y="10"
        transform="rotate(-90)"
        className="mission-axis-title"
      >
        Intensidad BMAG_NT
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
        y={padding.top + chartHeight + 65}
        className="mission-graph-label"
        textAnchor="middle"
      >
        {chart.xStart}
      </text>

      <text
        x={padding.left + chartWidth}
        y={padding.top + chartHeight + 65}
        className="mission-graph-label"
        textAnchor="middle"
      >
        {chart.xEnd}
      </text>

      <path
        d={smoothPath}
        className="mission-graph-line-shadow"
      />

      <ScrollDrawPath
        d={smoothPath}
        className="mission-graph-line-yellow"
        progress={draw}
      />

      <line
        x1={maxPoint.x}
        x2={maxPoint.x}
        y1={padding.top}
        y2={padding.top + chartHeight}
        className="mission-graph-crossing-line"
        style={{ opacity: clamp((draw - 0.48) / 0.14, 0, 1) }}
      />

      <rect
        x={maxPoint.x + 18}
        y={Math.max(maxPoint.y + 4, padding.top + 10)}
        width="290"
        height="44"
        rx="6"
        className="mission-graph-label-bg"
        style={{ opacity: clamp((draw - 0.55) / 0.15, 0, 1) }}
      />

      <text
        x={maxPoint.x + 32}
        y={Math.max(maxPoint.y + 31, padding.top + 37)}
        className="mission-graph-annotation"
        style={{ opacity: clamp((draw - 0.55) / 0.15, 0, 1) }}
      >
        {chart.annotation}
      </text>

      <line
        x1={padding.left}
        x2={width - 40}
        y1={height - 48}
        y2={height - 48}
        className="mission-graph-footer-line"
      />

      <text
        x={padding.left}
        y={height+35}
        className="mission-graph-footnote"
      >
        BMAG_NT = MAGNITUD DEL CAMPO MAGNETICO
      </text>

      <rect
        x={padding.left}
        y={padding.top}
        width={chartWidth}
        height={chartHeight}
        fill="transparent"
        style={{ cursor: 'crosshair', pointerEvents: 'all' }}
        onMouseMove={handleGraphMouseMove}
        onMouseLeave={handleGraphMouseLeave}
      />

      {hoveredPoint && (() => {
  const popup = getPopupData(hoveredPoint)

  return (
    <g className="mission-hover-popup" pointerEvents="none">
      <line
        x1={hoveredPoint.x}
        x2={hoveredPoint.x}
        y1={padding.top}
        y2={padding.top + chartHeight}
        className="mission-hover-line"
      />

      <circle
        cx={hoveredPoint.x}
        cy={hoveredPoint.y}
        r="8"
        className="mission-hover-dot"
      />

      <foreignObject
        x={hoveredPoint.x > width * 0.65 ? hoveredPoint.x - 330 : hoveredPoint.x + 24}
        y={Math.max(hoveredPoint.y - 95, padding.top + 10)}
        width="340"
        height="210"
      >
        <div className="mission-hover-card">
          <span>Lectura detectada</span>
          <h3>{popup.title}</h3>
          <strong>{popup.value}</strong>
          <p>{popup.description}</p>
        </div>
      </foreignObject>
    </g>
  )
})()}
    </svg>
  )
}

function JupiterSaturnStoryBlock({ blockSteps, sceneStart, sceneEnd }) {
  const sectionRef = useRef()
  const [localProgress, setLocalProgress] = useState(0)

  const sectionHeight = `${blockSteps.length * 100}vh`
  const sceneProgress = lerp(sceneStart, sceneEnd, localProgress)

  useEffect(() => {
    const handleScroll = () => {
      const section = sectionRef.current
      if (!section) return

      const rect = section.getBoundingClientRect()
      const sectionHeight = section.offsetHeight - window.innerHeight
      const scrolled = -rect.top

      setLocalProgress(clamp(scrolled / sectionHeight, 0, 1))
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
    <section
      ref={sectionRef}
      className="jupiter-saturn-section"
      style={{ height: sectionHeight }}
    >
      <div className="jupiter-saturn-sticky">
        <div className="jupiter-saturn-canvas">
          <Canvas camera={{ position: [0, 0, 4.2], fov: 48 }}>
            <JupiterSaturnScene scrollProgress={sceneProgress} />
          </Canvas>
        </div>
      </div>

      <div
        className="jupiter-saturn-text-steps"
        style={{ height: sectionHeight }}
      >
        {blockSteps.map((step, index) => (
          <article key={index} className="jupiter-saturn-text-step">
            <span>{hideStoryTitles ? step.title : step.kicker}</span>
            {!hideStoryTitles && <h2>{step.title}</h2>}
            <p>{step.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
export default function JupiterSaturnEncounter() {
  const sectionRef = useRef()
  const [scrollProgress, setScrollProgress] = useState(0)
  const hideStoryTitles = useNarrativeTitlesHidden()


  const timelineItems = [

    { type: 'story', step: steps[0], units: 1 },
    { type: 'story', step: steps[1], units: 1 },
    { type: 'story', step: steps[2], units: 1 },

    { type: 'graph', chart: magnetometerCharts.jupiter, units: 2.4 },

    { type: 'story', step: steps[3], units: 1 },

    { type: 'graph', chart: magnetometerCharts.saturn, units: 2.4 },

    { type: 'story', step: steps[4], units: 1 },
    { type: 'story', step: steps[5], units: 1 },
    { type: 'story', step: steps[6], units: 1 },
    { type: 'story', step: steps[7], units: 1 },
    { type: 'story', step: steps[8], units: 1 },
    { type: 'story', step: steps[9], units: 1 },
  ]

  const totalUnits = timelineItems.reduce((sum, item) => sum + item.units, 0)
  const sectionHeight = `${totalUnits * 100}vh`

  const itemStarts = timelineItems.reduce((acc, item, index) => {
    if (index === 0) return [0]
    return [...acc, acc[index - 1] + timelineItems[index - 1].units]
  }, [])

  useEffect(() => {
    let frame = 0

    const handleScroll = () => {
      cancelAnimationFrame(frame)

      frame = requestAnimationFrame(() => {
        const section = sectionRef.current
        if (!section) return

        const rect = section.getBoundingClientRect()
        const sectionScrollable = section.offsetHeight - window.innerHeight
        const scrolled = -rect.top

        setScrollProgress(clamp(scrolled / sectionScrollable, 0, 1))
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

  /*
    El scroll real disponible es totalUnits - 1 porque el sticky principal
    ocupa 100vh. Esto permite calcular en qué bloque estamos.
  */
  const unitsScrolled = scrollProgress * (totalUnits - 1)

  /*
    El titulo usa solo el primer bloque intro.
    Como el intro mide 1.6 units, el titulo aparece y desaparece
    antes de que empiece el primer texto.
  */


  return (
    <section
      ref={sectionRef}
      className="jupiter-saturn-section"
      style={{ height: sectionHeight }}
    >
      <div className="jupiter-saturn-sticky">
        <div className="jupiter-saturn-canvas">
          <Canvas camera={{ position: [0, 0, 4.2], fov: 48 }}>
            <JupiterSaturnScene scrollProgress={scrollProgress} />
          </Canvas>
        </div>

      </div>

      <div
        className="jupiter-saturn-timeline"
        style={{ height: sectionHeight }}
      >
        {timelineItems.map((item, index) => {
          const start = itemStarts[index]

          if (item.type === 'intro') {
            return (
              <article
                key={index}
                className="jupiter-saturn-intro-spacer"
                style={{ height: `${item.units * 100}vh` }}
              />
            )
          }

          if (item.type === 'graph') {
            /*
              Como el gráfico mide 2.4 pantallas y su contenido sticky mide 1 pantalla,
              el tiempo útil del sticky es item.units - 1.
            */
            const graphProgress = clamp(
              (unitsScrolled - start) / (item.units - 1),
              0,
              1
            )

            return (
              <MagnetometerGraphStep
                key={index}
                chart={item.chart}
                progress={graphProgress}
              />
            )
          }

          return (
            <article
              key={index}
              className="jupiter-saturn-text-step"
            >
              <span>{hideStoryTitles ? item.step.title : item.step.kicker}</span>
              {!hideStoryTitles && <h2>{item.step.title}</h2>}
              <p>{item.step.text}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}