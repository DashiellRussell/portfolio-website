import { ImageResponse } from 'next/og'

// Image metadata
export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

// Apple Touch Icon component
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0A0A0A',
          borderRadius: '40px',
        }}
      >
        <div
          style={{
            fontSize: 90,
            fontWeight: 700,
            background: 'linear-gradient(90deg, #6B9EFF 0%, #4DD0E1 50%, #6B9EFF 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            display: 'flex',
          }}
        >
          DR
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
