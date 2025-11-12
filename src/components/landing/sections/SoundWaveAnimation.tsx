"use client"

import { useEffect, useRef } from "react"

interface SoundWaveAnimationProps {
  className?: string
}

export const SoundWaveAnimation = ({ className }: SoundWaveAnimationProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    let animationId: number
    const waves = [
      { amplitude: 45, frequency: 0.01, phase: 0, speed: 0.01, color: "rgba(59, 130, 246, 0.4)" },
      { amplitude: 30, frequency: 0.015, phase: Math.PI / 3, speed: 0.012, color: "rgba(147, 197, 253, 0.3)" },
      { amplitude: 35, frequency: 0.008, phase: Math.PI / 2, speed: 0.009, color: "rgba(96, 165, 250, 0.35)" },
      { amplitude: 25, frequency: 0.012, phase: Math.PI, speed: 0.015, color: "rgba(37, 99, 235, 0.25)" },
    ]

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
      const centerY = canvas.offsetHeight / 2

      waves.forEach((wave) => {
        ctx.beginPath()
        ctx.strokeStyle = wave.color as string
        ctx.lineWidth = 2
        ctx.lineCap = "round"

        for (let x = 0; x < canvas.offsetWidth; x += 2) {
          const y = centerY + Math.sin(x * (wave.frequency as number) + (wave.phase as number)) * (wave.amplitude as number)
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }

        ctx.stroke()
        ;(wave as any).phase += wave.speed
      })

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute w-full h-[250px] md:h-[300px] opacity-80 ${className || ""}`}
      aria-hidden="true"
    />
  )
}

export default SoundWaveAnimation;
