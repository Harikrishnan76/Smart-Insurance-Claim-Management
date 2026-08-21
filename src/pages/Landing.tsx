import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Search, Menu, X } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div
      style={{
        position: 'relative',
        height: '100vh',
        width: '100%',
        overflow: 'hidden',
        background: '#000',
        fontFamily: "'Geist', 'Inter', -apple-system, sans-serif",
      }}
    >
      {/* ─── CANVAS ANIMATED BACKGROUND ─── */}
      <canvas
        ref={(canvas) => {
          if (!canvas || canvas.dataset.initialized) return;
          canvas.dataset.initialized = 'true';
          const ctx = canvas.getContext('2d')!;
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;

          const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
          window.addEventListener('resize', resize);

          // Particles
          const PARTICLE_COUNT = 80;
          const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.4,
            vy: (Math.random() - 0.5) * 0.4,
            r: Math.random() * 1.5 + 0.5,
            alpha: Math.random() * 0.5 + 0.15,
          }));

          let raf: number;
          const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Deep navy/dark bg
            ctx.fillStyle = '#050810';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Subtle radial glow
            const grd = ctx.createRadialGradient(
              canvas.width * 0.35, canvas.height * 0.3, 0,
              canvas.width * 0.35, canvas.height * 0.3, canvas.width * 0.6,
            );
            grd.addColorStop(0, 'rgba(30,50,120,0.25)');
            grd.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grd;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw connections
            for (let i = 0; i < particles.length; i++) {
              for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 130) {
                  ctx.beginPath();
                  ctx.moveTo(particles[i].x, particles[i].y);
                  ctx.lineTo(particles[j].x, particles[j].y);
                  ctx.strokeStyle = `rgba(100,130,200,${0.15 * (1 - dist / 130)})`;
                  ctx.lineWidth = 0.6;
                  ctx.stroke();
                }
              }
            }

            // Draw particles
            particles.forEach(p => {
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(140,170,255,${p.alpha})`;
              ctx.fill();

              // Move
              p.x += p.vx;
              p.y += p.vy;
              if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
              if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
            });

            raf = requestAnimationFrame(draw);
          };
          draw();
        }}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0,
        }}
      />


      {/* ─── DARK GRADIENT OVERLAY ─── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.75) 100%)',
        }}
      />
      {/* Side vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          background:
            'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* ─── NAVBAR ─── */}
      <nav
        style={{
          position: 'relative',
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px clamp(24px, 5vw, 64px)',
        }}
      >
        {/* Logo + desktop links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <span
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: '#fff',
              letterSpacing: '-0.03em',
            }}
          >
            ClaimSphere
          </span>

          <div className="landing-desktop-links" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {['Home', 'How It Works', 'Features', 'Track Claim'].map((link) => (
              <button
                key={link}
                onClick={() => link === 'Track Claim' && navigate('/login')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 14, color: 'rgba(255,255,255,0.7)',
                  transition: 'color 0.2s',
                  fontFamily: "'Geist', 'Inter', sans-serif",
                  padding: 0,
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
              >
                {link}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop CTA — shown on md+ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: '#fff', color: '#000', border: 'none',
              borderRadius: 8, padding: '9px 22px',
              fontSize: 14, fontWeight: 500, cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              fontFamily: "'Geist', 'Inter', sans-serif",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,255,255,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; }}
            className="landing-cta-btn"
          >
            Submit a Claim
          </button>

          {/* Mobile hamburger — hidden on md+ via CSS */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="landing-hamburger"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#fff', width: 40, height: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <div style={{ position: 'relative', width: 24, height: 24 }}>
              <span style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s', opacity: mobileMenuOpen ? 0 : 1,
                transform: mobileMenuOpen ? 'scale(0.5) rotate(90deg)' : 'scale(1)',
              }}>
                <Menu size={24} />
              </span>
              <span style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.3s', opacity: mobileMenuOpen ? 1 : 0,
                transform: mobileMenuOpen ? 'scale(1)' : 'scale(0.5) rotate(-90deg)',
              }}>
                <X size={24} />
              </span>
            </div>
          </button>
        </div>
      </nav>

      {/* ─── MOBILE MENU ─── */}
      <div
        style={{
          position: 'absolute', inset: '0', zIndex: 20,
          background: 'rgba(0,0,0,0.97)',
          backdropFilter: 'blur(20px)',
          height: mobileMenuOpen ? '100vh' : '0',
          opacity: mobileMenuOpen ? 1 : 0,
          pointerEvents: mobileMenuOpen ? 'auto' : 'none',
          overflow: 'hidden',
          transition: 'height 0.5s cubic-bezier(0.16,1,0.3,1), opacity 0.4s ease',
        }}
      >
        <div style={{
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', height: '100%',
          padding: '0 40px', gap: 28,
        }}>
          {['Home', 'How It Works', 'Features', 'Track Claim'].map(link => (
            <button
              key={link}
              onClick={() => { setMobileMenuOpen(false); if (link === 'Track Claim') navigate('/login'); }}
              style={{
                background: 'none', border: 'none', textAlign: 'left',
                fontSize: 'clamp(26px,6vw,34px)', fontWeight: 500,
                color: 'rgba(255,255,255,0.85)', cursor: 'pointer',
                fontFamily: "'Geist','Inter',sans-serif",
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.85)')}
            >
              {link}
            </button>
          ))}
          <button
            onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
            style={{
              marginTop: 16, background: '#fff', color: '#000', border: 'none',
              borderRadius: 9999, padding: '14px 36px',
              fontSize: 16, fontWeight: 500, cursor: 'pointer',
              width: 'fit-content', fontFamily: "'Geist','Inter',sans-serif",
              transition: 'transform 0.2s',
            }}
          >
            Submit a Claim
          </button>
        </div>
      </div>

      {/* ─── HERO CONTENT ─── */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          height: 'calc(100vh - 76px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',        /* center horizontally */
          justifyContent: 'center',    /* center vertically */
          textAlign: 'center',
          padding: '0 clamp(24px, 6vw, 80px)',
          gap: 0,
        }}
      >
        {/* Badge */}
        <div
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            marginBottom: 'clamp(20px, 3vh, 36px)',
            fontSize: 'clamp(11px, 1.4vw, 13px)',
            color: 'rgba(255,255,255,0.75)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            animation: 'fadeSlideUp 0.8s ease 0.2s both',
          }}
        >
          <span style={{
            display: 'inline-block', width: 6, height: 6,
            borderRadius: '50%', background: 'rgba(255,255,255,0.5)',
            flexShrink: 0,
          }} />
          Smart Insurance Claim Management
          <span style={{
            display: 'inline-block', width: 6, height: 6,
            borderRadius: '50%', background: 'rgba(255,255,255,0.5)',
            flexShrink: 0,
          }} />
        </div>

        {/* Main Heading — centered, full width */}
        <h1
          style={{
            fontSize: 'clamp(36px, 7.5vw, 96px)',
            fontWeight: 500,
            lineHeight: 1.04,
            letterSpacing: '-0.04em',
            color: '#fff',
            maxWidth: 1000,
            margin: '0 auto',
            marginBottom: 'clamp(24px, 4vh, 48px)',
            animation: 'fadeSlideUp 0.8s ease 0.4s both',
            fontFamily: "'Geist','Inter',sans-serif",
          }}
        >
          Simplifying claims
          <br />
          with smarter
          <br />
          insurance technology.
        </h1>

        {/* Tagline */}
        <p
          style={{
            fontSize: 'clamp(13px, 1.6vw, 18px)',
            lineHeight: 1.75,
            color: 'rgba(255,255,255,0.5)',
            maxWidth: 560,
            margin: '0 auto',
            marginBottom: 'clamp(28px, 4vh, 48px)',
            animation: 'fadeSlideUp 0.8s ease 0.7s both',
            fontFamily: "'Geist','Inter',sans-serif",
          }}
        >
          Submit your insurance claim digitally, validate documents, detect
          duplicate claims, assess risk, and track every step from submission
          to resolution.
        </p>

        {/* CTAs */}
        <div
          style={{
            display: 'flex',
            gap: 14,
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginBottom: 'clamp(36px, 6vh, 64px)',
            animation: 'fadeSlideUp 0.8s ease 0.9s both',
          }}
        >
          <button
            onClick={() => navigate('/login')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: '#fff', color: '#000', border: 'none',
              borderRadius: 9, padding: 'clamp(10px,1.5vh,14px) clamp(20px,2vw,28px)',
              fontSize: 'clamp(13px,1.2vw,15px)', fontWeight: 500,
              cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s',
              fontFamily: "'Geist','Inter',sans-serif",
              boxShadow: '0 4px 24px rgba(255,255,255,0.15)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(255,255,255,0.25)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(255,255,255,0.15)'; }}
          >
            Submit a Claim
            <ArrowRight size={16} />
          </button>

          <button
            onClick={() => navigate('/login')}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.22)',
              backdropFilter: 'blur(10px)',
              color: '#fff', borderRadius: 9,
              padding: 'clamp(10px,1.5vh,14px) clamp(20px,2vw,28px)',
              fontSize: 'clamp(13px,1.2vw,15px)', fontWeight: 500,
              cursor: 'pointer', transition: 'background 0.2s, border-color 0.2s',
              fontFamily: "'Geist','Inter',sans-serif",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.22)'; }}
          >
            Track a Claim
            <Search size={16} />
          </button>
        </div>

        {/* Bottom meta */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            animation: 'fadeSlideUp 0.8s ease 1.1s both',
          }}
        >
          <div style={{
            fontSize: 11, color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            Powered by Guidewire ClaimCenter
          </div>
          <div style={{
            display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
            alignItems: 'center', gap: '6px 12px',
            fontSize: 11, color: 'rgba(255,255,255,0.25)',
          }}>
            {['Smart Prioritization', 'Document Validation', 'Duplicate Detection', 'Risk Assessment', 'Real-Time Tracking'].map((f, i, arr) => (
              <React.Fragment key={f}>
                <span>{f}</span>
                {i < arr.length - 1 && <span>•</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
