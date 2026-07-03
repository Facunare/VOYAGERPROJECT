import { useEffect, useRef, useState } from "react"

const creditos = [
  {
    trabajo: "TP final - Voyager Project",
    materia: "Visualización de Datos - UTDT 2026",
    nombres: ["Facundo Arechaga", "Peter Ahn", "Franco Bergman", "Ramiro Bozzoli"],
    saludo: "¡Muchas gracias!"
  }
]

export default function Footer() {
  const sectionRef = useRef()
  const [active, setActive] = useState(false)
  const data = creditos[0]

  useEffect(() => {
    const handleScroll = () => {
      const section = sectionRef.current
      if (!section) return

      const rect = section.getBoundingClientRect()

      /*
        Se activa recién cuando el footer llega a la pantalla.
        Como el footer está al final de la página, esto ocurre al llegar abajo.
      */
      if (rect.top <= window.innerHeight * 0.85) {
        setActive(true)
      }
    }

    window.addEventListener("scroll", handleScroll)
    handleScroll()

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <section
      className={`footer ${active ? "footer-active" : ""}`}
      ref={sectionRef}
    >
      <div className="fade" />

      <div className="crawl-wrap">
        <div className="crawl">
          <div className="title">
            <h1>{data.trabajo}</h1>
            <h2>{data.materia}</h2>
          </div>

          <div className="credits">
            <p className="lead">Realizado por</p>
            <ul>
              {data.nombres.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
            <p className="saludo">{data.saludo}</p>
          </div>
        </div>
      </div>
    </section>
  )
}