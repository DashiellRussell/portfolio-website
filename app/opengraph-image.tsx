import { ImageResponse } from "next/og"

/** Link-preview card for every page that doesn't define its own. */
export const alt = "Dashiell Russell: mechatronics & physics, robotics, rockets, satellites"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const ZONES = ["#ff6b2c", "#35d6f0", "#9b6bff", "#3ddc84"]

/** Archivo Bold, the site's display face, as a TTF (satori can't read woff2). */
async function archivo(weight: number) {
  const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Archivo:wght@${weight}`)).text()
  const url = css.match(/src: url\((.+?)\) format/)?.[1]
  if (!url) throw new Error("Archivo font URL not found")
  return (await fetch(url)).arrayBuffer()
}

export default async function OpengraphImage() {
  const [bold, regular] = await Promise.all([archivo(700), archivo(400)])
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "radial-gradient(circle at 85% 20%, #14203a 0%, #05070d 55%)",
          color: "#e8ecf5",
          fontFamily: "Archivo",
        }}
      >
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 6, color: "#ff6b2c", textTransform: "uppercase" }}>
          Mechatronics &amp; physics · UNSW
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 132, fontWeight: 700, lineHeight: 0.92, letterSpacing: -4, textTransform: "uppercase" }}>
            Dashiell
          </div>
          <div style={{ fontSize: 132, fontWeight: 700, lineHeight: 0.92, letterSpacing: -4, textTransform: "uppercase" }}>
            Russell
          </div>
          <div style={{ marginTop: 34, fontSize: 30, color: "#8b97ad" }}>
            Roboticist, rocket builder, satellite engineer.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 10 }}>
            {ZONES.map((c) => (
              <div key={c} style={{ width: 90, height: 6, background: c }} />
            ))}
          </div>
          <div style={{ fontSize: 20, letterSpacing: 4, color: "#8b97ad", textTransform: "uppercase" }}>
            Sydney, Australia
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Archivo", data: bold, weight: 700, style: "normal" },
        { name: "Archivo", data: regular, weight: 400, style: "normal" },
      ],
    }
  )
}
