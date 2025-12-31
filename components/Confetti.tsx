
import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  w: number;
  h: number;
  velX: number;
  velY: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  tilt: number;
  tiltAngle: number;
  tiltAngleIncrement: number;
}

const Confetti: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let particles: Particle[] = [];
    const particleCount = 150;
    const colors = ['#22d3ee', '#3b82f6', '#a855f7', '#f472b6', '#facc15', '#4ade80'];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height - canvas.height,
          w: Math.random() * 5 + 5,
          h: Math.random() * 5 + 5,
          velX: Math.random() * 4 - 2,
          velY: Math.random() * 5 + 2,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          rotationSpeed: Math.random() * 10 - 5,
          tilt: Math.random() * 10 - 10,
          tiltAngle: Math.random(),
          tiltAngleIncrement: Math.random() * 0.05 + 0.05
        });
      }
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        ctx.beginPath();
        ctx.lineWidth = p.w / 2;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.w / 2, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.h);
        ctx.stroke();
      });

      updateParticles();
      animationId = requestAnimationFrame(drawParticles);
    };

    const updateParticles = () => {
      particles.forEach((p, i) => {
        p.tiltAngle += p.tiltAngleIncrement;
        p.tilt = Math.sin(p.tiltAngle) * 15;
        p.y += p.velY;
        p.x += p.velX + Math.sin(p.tiltAngle) * 2; // Add some sway
        p.rotation += p.rotationSpeed;

        // Reset particles that fall off screen to top
        if (p.y > canvas.height) {
           // Instead of infinite loop, we let them fall off for a cleaner finish in this context,
           // or we could respawn them if we wanted a continuous rain. 
           // For a "burst" feel that fades, let's stop updating them or respawn them at top 
           // only if we want continuous.
           // Since the parent component controls visibility duration, we loop them for now.
           p.x = Math.random() * canvas.width;
           p.y = -20;
           p.velY = Math.random() * 5 + 2;
        }
      });
    };

    resizeCanvas();
    createParticles();
    drawParticles();

    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[100] animate-fade-out-delayed"
      style={{ width: '100%', height: '100%' }}
    />
  );
};

export default Confetti;
