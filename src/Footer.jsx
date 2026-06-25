import { useRef } from "react"

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
  const data = creditos[0]

  return (
    <section className="footer" ref={sectionRef}>
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