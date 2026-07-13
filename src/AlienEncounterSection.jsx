import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, useTexture } from '@react-three/drei'

function clamp(value, min = 0, max = 1) {
  return Math.min(Math.max(value, min), max)
}

function lerp(a, b, t) {
  return a + (b - a) * t
}

function smooth(from, to, value) {
  const t = clamp((value - from) / (to - from), 0, 1)
  return t * t * (3 - 2 * t)
}

const alienSteps = [
  {
    kicker: 'Año 10000',
    title: 'una señal perdida',
    text: 'Mucho después de nuestra época, Voyager sigue viajando. Ya no pertenece a una misión: pertenece al tiempo.',
  },
  {
    kicker: 'Una llegada imposible',
    title: 'un mundo rojo',
    text: 'Después de miles de años cruzando la oscuridad, la nave se acerca a la superficie de un planeta desconocido.',
  },
  {
    kicker: 'Impacto',
    title: 'el viaje se detiene',
    text: 'La estructura vibra, pierde estabilidad y finalmente golpea la superficie. Por primera vez en milenios, Voyager deja de avanzar.',
  },
  {
    kicker: 'El hallazgo',
    title: 'algo espera ser descubierto',
    text: 'Enterrada en el polvo, la nave conserva todavía una pista: un mensaje enviado desde la Tierra.',
  },
]

function CameraRig({ progress }) {
  const { camera } = useThree()

  useFrame(() => {
    const impactProgress = smooth(0.2, 0.58, progress)

    const targetCamera = {
      x: lerp(0.05, 0.4, impactProgress),
      y: lerp(0.1, -0.05, impactProgress),
      z: lerp(4.9, 4.35, impactProgress),
    }

    camera.position.x = lerp(camera.position.x, targetCamera.x, 0.065)
    camera.position.y = lerp(camera.position.y, targetCamera.y, 0.065)
    camera.position.z = lerp(camera.position.z, targetCamera.z, 0.065)

    camera.lookAt(0.8, -0.85, -0.1)
  })

  return null
}

function VoyagerCrash({ progress }) {
  const { scene } = useGLTF('/VoyagerProbe.glb')
  const voyagerScene = useMemo(() => scene.clone(true), [scene])
  const voyagerRef = useRef()

  useEffect(() => {
    voyagerScene.traverse((child) => {
      if (!child.isMesh) return

      child.castShadow = false
      child.receiveShadow = false

      if (child.material) {
        child.material.roughness = 0.72
        child.material.metalness = 0.18
        child.material.needsUpdate = true
      }
    })
  }, [voyagerScene])

  useFrame((state) => {
    if (!voyagerRef.current) return

    const time = state.clock.getElapsedTime()

    const enter = smooth(0.02, 0.22, progress)
    const approach = smooth(0.18, 0.42, progress)
    const impact = smooth(0.4, 0.56, progress)
    const settle = smooth(0.54, 0.72, progress)

    const x = lerp(-4.4, 1, approach)
    const y = lerp(1.25, -0.9, approach)
    const z = lerp(0.55, 0, approach)

    const visibleLift = lerp(-0.25, 0, enter)

    const vibration =
      smooth(0.28, 0.48, progress) *
      (1 - settle)

    const shakeX = Math.sin(time * 58) * 0.045 * vibration
    const shakeY = Math.cos(time * 46) * 0.032 * vibration
    const shakeZ = Math.sin(time * 52) * 0.018 * vibration

    voyagerRef.current.position.set(
      x + shakeX,
      y + visibleLift + shakeY,
      z + shakeZ
    )

    voyagerRef.current.rotation.x =
      lerp(-0.05, -1.25, impact) +
      Math.sin(time * 34) * 0.05 * vibration

    voyagerRef.current.rotation.y =
      lerp(0.7, 2.45, approach)

    voyagerRef.current.rotation.z =
      lerp(0.12, -0.95, impact) +
      Math.cos(time * 30) * 0.05 * vibration

    const scale = lerp(0.13, 0.22, approach)
    voyagerRef.current.scale.setScalar(scale)
  })

  return <primitive ref={voyagerRef} object={voyagerScene} />
}

function PlanetSurface({ progress }) {
  const marsTexture = useTexture('/textures/mars.jpg')
  const earthTexture = useTexture('/textures/haumea.jpg')

  useFrame(() => {
    marsTexture.anisotropy = 8
    earthTexture.anisotropy = 8
  })

  return (
    <>
      <mesh position={[2.25, -1.1, -5.8]} rotation={[0.05, -0.22, 0]}>
        <sphereGeometry args={[1.18, 128, 128]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.9}
          metalness={0}
          transparent
          opacity={0.92}
        />
      </mesh>

      <mesh position={[1.2, -3.42, -2.18]} rotation={[-0.42, 0.2, 0]}>
        <sphereGeometry args={[3.16, 192, 192]} />
        <meshStandardMaterial
          map={marsTexture}
          roughness={1}
          metalness={0}
        />
      </mesh>

      <mesh position={[1, -0.98, 0.025]} rotation={[-0.32, 0.05, -0.1]}>
        <circleGeometry args={[0.42, 64]} />
        <meshBasicMaterial
          color="#080302"
          transparent
          opacity={smooth(0.44, 0.6, progress) * 0.36}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[1.05, -0.88, 0.06]} rotation={[-0.32, 0.05, -0.1]}>
        <circleGeometry args={[0.24, 64]} />
        <meshBasicMaterial
          color="#5a2718"
          transparent
          opacity={smooth(0.44, 0.6, progress) * 0.22}
          depthWrite={false}
        />
      </mesh>
    </>
  )
}

function AlienWorldScene({ progress }) {
  return (
    <>
      <ambientLight intensity={0.48} />

      <directionalLight
        position={[4.5, 4.2, 5]}
        intensity={1.8}
        color="#ffd1a3"
      />

      <pointLight
        position={[-2.5, 0.6, 2.2]}
        intensity={0.8}
        color="#8ecbff"
      />

      <pointLight
        position={[1, -0.35, 1.4]}
        intensity={smooth(0.42, 0.62, progress) * 1.6}
        color="#ffb36b"
      />

      <CameraRig progress={progress} />
      <PlanetSurface progress={progress} />
      <VoyagerCrash progress={progress} />
    </>
  )
}

function AlienVideoOverlay({ onEnded }) {
  return (
    <div className="alien-video-overlay">
      <video
        className="alien-video"
        src="/video.mp4"
        autoPlay
        muted
        playsInline
        onEnded={onEnded}
      />
    </div>
  )
}

export default function AlienEncounterSection() {
  const sectionRef = useRef(null)
  const [progress, setProgress] = useState(0)
  const [showAlienVideo, setShowAlienVideo] = useState(false)
  const [skipLock, setSkipLock] = useState(
    () => sessionStorage.getItem('skipAlienEncounterLock') === 'true'
  )

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

useEffect(() => {
  const updateSkipLock = () => {
    setSkipLock(sessionStorage.getItem('skipAlienEncounterLock') === 'true')
  }

  window.addEventListener('skipAlienEncounterLockChange', updateSkipLock)
  updateSkipLock()

  return () => {
    window.removeEventListener('skipAlienEncounterLockChange', updateSkipLock)
  }
}, [])

  const yearProgress = smooth(0.02, 0.48, progress)
  const displayYear = Math.round(lerp(2026, 10000, yearProgress))

  const dustOpacity =
    smooth(0.42, 0.5, progress) *
    (1 - smooth(0.64, 0.8, progress))

const showContinue = progress > 0.62 && !showAlienVideo
const shouldLockAlienScroll = progress > 0.62 && !showAlienVideo && !skipLock

  useEffect(() => {
    if (!shouldLockAlienScroll) return

    const section = sectionRef.current
    if (!section) return

    const rect = section.getBoundingClientRect()
    const currentY = window.scrollY
    const sectionTop = currentY + rect.top

    const lockY = sectionTop + section.offsetHeight * 0.66

    const lockScroll = () => {
      if (window.scrollY > lockY) {
        window.scrollTo({
          top: lockY,
          behavior: 'auto',
        })
      }
    }

    const preventWheel = (event) => {
      if (event.deltaY > 0 && window.scrollY >= lockY - 2) {
        event.preventDefault()
      }
    }

    const preventTouch = (event) => {
      if (window.scrollY >= lockY - 2) {
        event.preventDefault()
      }
    }

    window.addEventListener('scroll', lockScroll, { passive: true })
    window.addEventListener('wheel', preventWheel, { passive: false })
    window.addEventListener('touchmove', preventTouch, { passive: false })

    lockScroll()

    return () => {
      window.removeEventListener('scroll', lockScroll)
      window.removeEventListener('wheel', preventWheel)
      window.removeEventListener('touchmove', preventTouch)
    }
  }, [shouldLockAlienScroll])

  const goToFooter = () => {
    sessionStorage.setItem('skipAlienEncounterLock', 'true')
    window.dispatchEvent(new Event('skipAlienEncounterLockChange'))

    const footer = document.querySelector('.footer')

    if (footer) {
      footer.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })
    }
  }

  return (
    <section
      id="alien-postcredits"
      ref={sectionRef}
      className={`alien-section ${showAlienVideo ? 'alien-section--video' : ''}`}
    >
      <div className="alien-sticky">
        <div className="alien-canvas">
          <Canvas
            camera={{ position: [0, 0, 4.9], fov: 48 }}
            gl={{ alpha: true, antialias: true }}
          >
            <AlienWorldScene progress={progress} />
          </Canvas>
        </div>

        <div className="alien-atmosphere" />

        <div
          className="alien-impact-dust"
          style={{ opacity: dustOpacity }}
        />

        <div className="alien-year-counter">
          <span>AÑO</span>
          <strong>{displayYear}</strong>
        </div>

        {showContinue && (
          <button
            className="alien-continue-button"
            onClick={() => setShowAlienVideo(true)}
          >
            <span>Continuar historia</span>
            <i />
          </button>
        )}

        {showAlienVideo && <AlienVideoOverlay onEnded={goToFooter} />}
      </div>

      {!showAlienVideo && (
        <div className="alien-text-track">
  {alienSteps.map((step, index) => (
    <article
      key={index}
      id={index === 0 ? 'alien-si-algun-dia' : undefined}
      className="alien-text-step"
    >
              <div>
                <span>{step.kicker}</span>
                <h2>{step.title}</h2>
                <p>{step.text}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

useGLTF.preload('/VoyagerProbe.glb')