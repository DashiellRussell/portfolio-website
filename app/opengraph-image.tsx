import { ImageResponse } from 'next/og'

// Image metadata
export const alt = 'Dashiell Russell - Mechatronics Engineer & Full-Stack Developer'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

// Open Graph Image component
export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)',
          position: 'relative',
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: 'absolute',
            top: '80px',
            left: '100px',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: '#6B9EFF',
            opacity: 0.1,
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '80px',
            right: '100px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: '#4DD0E1',
            opacity: 0.1,
            display: 'flex',
          }}
        />

        {/* DR Logo */}
        <div
          style={{
            fontSize: 140,
            fontWeight: 700,
            background: 'linear-gradient(90deg, #6B9EFF 0%, #4DD0E1 50%, #6B9EFF 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            marginBottom: '20px',
            display: 'flex',
          }}
        >
          DR
        </div>

        {/* Name */}
        <div
          style={{
            fontSize: 48,
            fontWeight: 600,
            color: '#FFFFFF',
            marginBottom: '20px',
            display: 'flex',
          }}
        >
          Dashiell Russell
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            fontWeight: 400,
            color: '#999999',
            marginBottom: '60px',
            display: 'flex',
          }}
        >
          Mechatronics Engineer &amp; Full-Stack Developer
        </div>

        {/* Skills */}
        <div
          style={{
            fontSize: 22,
            fontWeight: 400,
            color: '#666666',
            display: 'flex',
          }}
        >
          Hardware • Software • Robotics • PCB Design
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
