"use client"

import { useRef, useEffect } from "react"
import { ReactTyped } from "react-typed"

const Hero = (props) => {
  const heroRef = useRef(null)
  const particlesRef = useRef(null)

  useEffect(() => {
    if (!heroRef.current) return

    const handleMouseMove = (e) => {
      const { clientX, clientY } = e
      const rect = heroRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      const y = clientY - rect.top

      // Parallax effect for the hero background
      const moveX = (x - rect.width / 2) / 50
      const moveY = (y - rect.height / 2) / 50

      heroRef.current.style.backgroundPosition = `${50 + moveX}% ${50 + moveY}%`

      // Move particles
      if (particlesRef.current) {
        const particles = particlesRef.current.children
        for (let i = 0; i < particles.length; i++) {
          const particle = particles[i]
          const speed = Number.parseFloat(particle.dataset.speed)
          const moveFactorX = moveX * speed
          const moveFactorY = moveY * speed

          particle.style.transform = `translate(${moveFactorX}px, ${moveFactorY}px)`
        }
      }
    }

    heroRef.current.addEventListener("mousemove", handleMouseMove)

    return () => {
      if (heroRef.current) {
        heroRef.current.removeEventListener("mousemove", handleMouseMove)
      }
    }
  }, [])

  // Create particles
  const particles = []
  for (let i = 0; i < 20; i++) {
    const size = Math.random() * 6 + 2
    const speed = Math.random() * 0.8 + 0.2
    const left = Math.random() * 100
    const top = Math.random() * 100
    const opacity = Math.random() * 0.5 + 0.1

    particles.push({
      size,
      speed,
      left,
      top,
      opacity,
    })
  }

  // Determine colors based on static (maintenance/error) mode
  const isStatic = props.static
  const heroBg = isStatic
    ? "radial-gradient(circle at center, rgba(162, 11, 11, 0.18) 0%, rgba(0, 0, 0, 0) 70%)"
    : "radial-gradient(circle at center, rgba(56, 189, 248, 0.15) 0%, rgba(0, 0, 0, 0) 70%)"
  const particleColor = isStatic ? "bg-red-600" : "bg-cyan-400"
  const pulse1 = isStatic ? "bg-red-500/10" : "bg-cyan-500/10"
  const pulse2 = isStatic ? "bg-orange-500/10" : "bg-purple-500/10"
  const gradientText = isStatic
    ? "bg-clip-text text-transparent bg-gradient-to-r from-red-500 via-orange-500 to-yellow-600 animate-gradient-x"
    : "bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-gradient-x"
  const underlineGradient = isStatic
    ? "bg-gradient-to-r from-red-500 to-yellow-500"
    : "bg-gradient-to-r from-cyan-500 to-purple-500"

  return (
    <section
      ref={heroRef}
      className="hero-section relative min-h-[60vh] flex items-center justify-center py-20 overflow-hidden"
      style={{
        background: heroBg,
        transition: "background-position 0.3s ease-out",
      }}
    >
      <meta name="description" content="SpeakEval: Give foreign language oral exams quickly and confidently, online" />
      {/* Animated background elements */}
      <div ref={particlesRef} className="absolute inset-0 overflow-hidden">
        {particles.map((particle, index) => (
          <div
            key={index}
            data-speed={particle.speed}
            className={`absolute rounded-full ${particleColor}`}
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              opacity: particle.opacity,
              filter: "blur(1px)",
              transition: "transform 0.2s ease-out",
            }}
          ></div>
        ))}
        <div className={`absolute top-1/4 left-1/4 w-64 h-64 ${pulse1} rounded-full filter blur-3xl animate-pulse-slow`}></div>
        <div className={`absolute bottom-1/4 right-1/4 w-64 h-64 ${pulse2} rounded-full filter blur-3xl animate-pulse-slow animation-delay-2000`}></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center relative z-10">
        <div className="text-center">
          <h1 className="text-[4xl] font-extrabold sm:text-5xl md:text-1xl drop-shadow-lg mb-6 w-full whitespace-nowrap">
            <span className={gradientText}>
              {props.static ? props.title : <ReactTyped strings={props.title} typeSpeed={100} loop backSpeed={65} cursorChar="_" showCursor={true} />}
            </span>
          </h1>
          <div className="relative">
            <p name="description" className="my-6 text-xl text-white drop-shadow-md max-w-2xl mx-auto leading-relaxed">{props.subtitle}</p>
            <div className={`absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-32 h-1 ${underlineGradient} rounded-full`}></div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero

