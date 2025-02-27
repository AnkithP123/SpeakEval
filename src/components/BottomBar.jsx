"use client";

import { useState, useEffect } from "react";
import { Mail, Github, ExternalLink } from "lucide-react";
import { BsDiscord } from "react-icons/bs";
import logo from "../../public/logo_centered_white.png";

function BottomBar() {
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="relative overflow-hidden bg-gradient-to-r from-blue-900 to-purple-900 border-t border-cyan-500/30 py-[2px]">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -bottom-8 left-1/4 w-72 h-72 bg-cyan-500/10 rounded-full filter blur-3xl animate-pulse-slow"></div>
        <div className="absolute -top-8 right-1/4 w-72 h-72 bg-purple-500/10 rounded-full filter blur-3xl animate-pulse-slow animation-delay-2000"></div>
        <div className="absolute top-1/2 left-3/4 w-64 h-64 bg-blue-500/10 rounded-full filter blur-3xl animate-pulse-slow animation-delay-4000"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Logo and brand section */}
          <div className="flex flex-col items-center md:items-start space-y-2">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <img
                  src={logo}
                  alt="SpeakEval Logo"
                  className="h-8 w-8 translate-y-[-1px]"
                />
              </div>
              <span className="text-white text-xl font-medium tracking-wide">
                SpeakEval
              </span>
            </div>
          </div>

          {/* Social and copyright section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="flex flex-wrap justify-center gap-4">
              <div className="text-center md:text-center">
                <p className="text-cyan-200 text-sm">
                  Created by Ankith Prabhakar with Nikunj Bafna
                </p>
                <p className="text-cyan-300/70 text-xs mt-1">
                  © {year} SpeakEval. All rights reserved.
                </p>
              </div>
            </div>
          </div>

          {/* Links Section */}
          <div className="flex flex-col items-center md:items-end space-y-4">
            <div className="flex space-x-4 items-left">
              <a
                href="mailto:info@speakeval.org"
                className="text-cyan-200 hover:text-cyan-400 transition-all transform hover:scale-110"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
              <a
                href="https://github.com/AnkithP123/SpeakEval"
                className="text-cyan-200 hover:text-cyan-400 transition-all transform hover:scale-110"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="#discord-sever" //idk
                className="text-cyan-200 hover:text-cyan-400 transition-all transform hover:scale-110"
                aria-label="discord"
              >
                <BsDiscord className="h-5 w-5" />
              </a>
            </div>
            <div className="flex flex-wrap justify-center gap-4">
              <a
                href="#features"
                className="text-cyan-200 text-sm hover:text-cyan-400 transition-colors flex items-center gap-1 group"
              >
                Features
                <span className="inline-block transition-transform group-hover:translate-x-0.5">
                  <ExternalLink className="h-3 w-3" />
                </span>
              </a>
              <a
                href="#about"
                className="text-cyan-200 text-sm hover:text-cyan-400 transition-colors flex items-center gap-1 group"
              >
                About
                <span className="inline-block transition-transform group-hover:translate-x-0.5">
                  <ExternalLink className="h-3 w-3" />
                </span>
              </a>
              <a
                href="mailto:support@speakeval.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-200 text-sm hover:text-cyan-400 transition-colors flex items-center gap-1 group"
              >
                Support
                <span className="inline-block transition-transform group-hover:translate-x-0.5">
                  <ExternalLink className="h-3 w-3" />
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom border with gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500/50 via-purple-500/50 to-blue-500/50"></div>
    </footer>
  );
}

export default BottomBar;
