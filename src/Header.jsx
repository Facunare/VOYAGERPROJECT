// import { useState } from 'react'
// import './App.css'

// function Header() {

//   return (
//     <header>
//         <h1><span style={{color: '#f5a623'}}>VOYAGER:</span> <span className='title'>LA HISTORIA EN EL MAS ALLA</span></h1>
//         <h2>El viaje que empezó como una misión y terminó como una historia de la humanidad</h2>
//     </header>
//   )
// }

// export default Header

import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import './App.css'

function VoyagerFloat() {
  const { scene } = useGLTF('/VoyagerProbe.glb')
  const model = useMemo(() => scene.clone(), [scene])

  const ref = useRef()

  useFrame((state) => {
    if (!ref.current) return

    ref.current.rotation.y += 0.002

    ref.current.position.y =
      Math.sin(state.clock.elapsedTime * 0.8) * 0.15
  })

  return (
    <primitive
      ref={ref}
      object={model}
      scale={0.35}
      position={[0, 0, 0]}
    />
  )
}

function Header() {
  return (
    <header className="hero-header">

      <div className="hero-voyager">
        <Canvas camera={{ position: [0, 0, 6], fov: 40 }}>
          <ambientLight intensity={2} />
          <directionalLight position={[5, 5, 5]} intensity={2} />
          <VoyagerFloat />
        </Canvas>
      </div>

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

    </header>
  )
}

export default Header