"use client";

import { useState, useRef } from "react";

function Card({
  children,
  bg = "bg-gray-100",
  className = "",
  color = "cyan",
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef(null);

  const colorMap = {
    cyan: {
      glow: "cyan-400",
      border: "cyan-500",
      gradient: "from-cyan-500/20 to-cyan-700/20",
    },
    purple: {
      glow: "purple-400",
      border: "purple-500",
      gradient: "from-purple-500/20 to-purple-700/20",
    },
    emerald: {
      glow: "emerald-400",
      border: "emerald-500",
      gradient: "from-emerald-500/20 to-emerald-700/20",
    },
    blue: {
      glow: "blue-400",
      border: "blue-500",
      gradient: "from-blue-500/20 to-blue-700/20",
    },
    pink: {
      glow: "pink-400",
      border: "pink-500",
      gradient: "from-pink-500/20 to-pink-700/20",
    },
    teal: {
      glow: "teal-400",
      border: "teal-500",
      gradient: "from-teal-500/20 to-teal-700/20",
    },
    rose: {
      glow: "rose-300",
      border: "rose-400",
      gradient: "from-rose-400/20 to-rose-600/20",
    },
  };

  const colorStyle = colorMap[color] || colorMap.cyan;

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePosition({ x, y });
  };

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden backdrop-blur-sm rounded-2xl transition-all duration-500 ${className}`}
      style={{
        background: "rgba(15, 23, 42, 0.6)",
        boxShadow: isHovered
          ? `0 0 30px rgba(var(--tw-color-${colorStyle.glow}-rgb), 0.3)`
          : "0 10px 30px rgba(0, 0, 0, 0.1)",
        transform: isHovered ? "translateY(-5px)" : "translateY(0)",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={handleMouseMove}
    >
      {/* Animated border */}
      <div
        className={`absolute inset-0 rounded-2xl border border-${
          colorStyle.border
        }/40 transition-opacity duration-300 ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
      ></div>

      {/* Glow effect that follows mouse */}
      {isHovered && (
        <div
          className={`absolute w-40 h-40 rounded-full bg-${colorStyle.glow}/20 filter blur-xl pointer-events-none transition-opacity duration-300`}
          style={{
            left: `${mousePosition.x - 80}px`,
            top: `${mousePosition.y - 80}px`,
            opacity: 0.7,
          }}
        ></div>
      )}

      {/* Background gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${
          colorStyle.gradient
        } transition-opacity duration-300 ${
          isHovered ? "opacity-100" : "opacity-50"
        }`}
      ></div>

      {/* Content */}
      <div className="relative z-10 p-6">{children}</div>
    </div>
  );
}

export default Card;
