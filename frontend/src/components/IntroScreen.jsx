import React, { useState } from 'react';
import './IntroScreen.css';

const IntroScreen = () => {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    
    // Calculate rotation (-10 to 10 degrees)
    const x = (innerHeight / 2 - clientY) / 30; // Slightly subtler rotation
    const y = (clientX - innerWidth / 2) / 30;
    
    // Calculate mouse position as percentage for the radial gradient
    const mouseX = (clientX / innerWidth) * 100;
    const mouseY = (clientY / innerHeight) * 100;

    setRotate({ x, y });
    setMousePos({ x: mouseX, y: mouseY });
  };

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#020205] overflow-hidden intro-overlay"
      onMouseMove={handleMouseMove}
      style={{
        '--mouse-x': `${mousePos.x}%`,
        '--mouse-y': `${mousePos.y}%`
      }}
    >
      {/* Background Particles (Increased Density) */}
      <div className="particles-container">
        {[...Array(45)].map((_, i) => (
          <div 
            key={i} 
            className="particle" 
            style={{ 
              left: `${Math.random() * 100}%`, 
              top: `${Math.random() * 100 + 100}%`,
              '--duration': `${8 + Math.random() * 12}s`,
              '--max-opacity': `${0.1 + Math.random() * 0.4}`,
              '--drift': `${(Math.random() - 0.5) * 150}px`,
              '--size': `${1 + Math.random() * 2}px`,
              animationDelay: `${Math.random() * 10}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Holographic Overlays */}
      <div className="scanlines"></div>

      <div 
        className="outer"
        style={{ 
          transform: `perspective(1200px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          '--mouse-x': `${mousePos.x}%`,
          '--mouse-y': `${mousePos.y}%`
        }}
      >
        <div className="dot"></div>
        <div className="card">
          <div className="ray"></div>
          <div className="ray-2"></div>
          
          <div className="text-container flex flex-col items-center justify-center p-8 z-20">
            <h1 className="fancy-text text-center flex flex-col gap-2">
              <span className="word word-1">BHARAT</span>
              <span className="word word-2">INTELLIGENCE</span>
              <span className="word word-3">ENGINE</span>
            </h1>
            
            <div className="mt-10 flex flex-col items-center opacity-0 animate-[fadeIn_1s_ease-out_3s_forwards]">
                <span className="text-[10px] tracking-[0.6em] text-slate-500 uppercase font-light animate-pulse">
                    Strategic Intelligence Proxy // Initiating
                </span>
                <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent mt-4"></div>
            </div>
          </div>

          <div className="line topl"></div>
          <div className="line leftl"></div>
          <div className="line bottoml"></div>
          <div className="line rightl"></div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default IntroScreen;
