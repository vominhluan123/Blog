import React from 'react'

type SpinnerProps = {
  size?: number // kích thước (px)
  color?: string // màu tailwind
  children?: React.ReactNode
  className?: string
}

const Spinner: React.FC<SpinnerProps> = ({ size = 20, color = 'bg-white', className, children }) => {
  const bars = Array.from({ length: 12 })
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {/* Children text or icon */}
      {children && <span className='text-white text-center'>{children}</span>}
      {/* Loader part */}
      <div
        className='relative inline-block'
        style={{
          width: size,
          height: size
        }}
      >
        {bars.map((_, i) => (
          <span
            key={i}
            className={`absolute left-1/2 top-1/2 ${color} rounded-full`}
            style={{
              width: size * 0.1,
              height: size * 0.25,
              transform: `rotate(${i * 30}deg) translate(-50%, -${size * 0.38}px)`,
              transformOrigin: 'center',
              animation: 'spinnerFade 1.2s linear infinite',
              animationDelay: `${(i * 1.2) / 12}s`
            }}
          />
        ))}

        <style>{`
          @keyframes spinnerFade {
            0%, 39%, 100% { opacity: 0.2; }
            40% { opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  )
}

export default Spinner
