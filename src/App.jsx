
import StickyScroll from './StickyScroll.jsx'
import ScaleComparison from './ScaleComparison.jsx'
import JupiterSaturnEncounter from './JupiterSaturnEncounter.jsx'
import GoldenRecordSection from './GoldenRecordSection.jsx'
import PaleBlueDotSection from './PaleBlueDotSection.jsx'
import HeliopauseSection from './HeliopauseSection.jsx'
import BackgroundMusic from './BackgroundMusic.jsx'
import DistanceScaleSection from './DistanceScaleSection.jsx'
import MissionPowerSection from './MissionPowerSection.jsx'
import FinalVoyageSection from './FinalVoyageSection.jsx'
import Footer from './Footer.jsx'
import SpaceTransition from './SpaceTransition.jsx'
import "./App.css"
function App() {
  return (
    <>
    
      <StickyScroll />
      <SpaceTransition title="MENSAJE PARA QUIEN LO ENCUENTRE" />
      <GoldenRecordSection />
      <SpaceTransition title="LA PEQUEÑEZ DE UNA NAVE" />
      <ScaleComparison />
      <SpaceTransition title="RUMBO A LOS PLANETAS GIGANTES" />
      <JupiterSaturnEncounter />
      <SpaceTransition title="EL PEQUEÑO PUNTO AZUL" />
      <PaleBlueDotSection />
      <SpaceTransition title="CRUZAR LA FRONTERA INVISIBLE" />
      <HeliopauseSection />
      <SpaceTransition title="MEDIR LO INMENSO" />
      <DistanceScaleSection />
      <SpaceTransition title="SOBREVIVIR APAGÁNDOSE" />
      <MissionPowerSection />
      <SpaceTransition title="EL VIAJE QUE SIGUE" />
      <FinalVoyageSection />
      <Footer />
      <BackgroundMusic />
    </>
  )
}

export default App