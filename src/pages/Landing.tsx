import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight, Shield, Zap, FileText, Activity, CheckCircle,
  Clock, Search, Menu, X, ChevronRight, Star, ScanLine,
  BarChart3, Lock, Globe, AlertTriangle,
} from 'lucide-react';

// ── Animated Counter ──────────────────────────────────────────────────────────
function Counter({ to, suffix = '', prefix = '' }: { to: number; suffix?: string; prefix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      let start = 0;
      const step = Math.ceil(to / 60);
      const timer = setInterval(() => {
        start = Math.min(start + step, to);
        setVal(start);
        if (start >= to) clearInterval(timer);
      }, 20);
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [to]);
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>;
}

// ── Feature Card ──────────────────────────────────────────────────────────────
function FeatureCard({
  icon, title, desc, color, delay,
}: { icon: React.ReactNode; title: string; desc: string; color: string; delay: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? `linear-gradient(135deg, rgba(${color},0.1) 0%, rgba(${color},0.04) 100%)`
          : 'rgba(13,15,26,0.8)',
        border: `1px solid rgba(${color},${hovered ? 0.4 : 0.12})`,
        borderRadius: 20, padding: '28px 26px',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
        transform: hovered ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hovered ? `0 20px 48px rgba(${color},0.15)` : 'none',
        cursor: 'default',
        animationDelay: `${delay}s`,
      }}
      className="fade-in"
    >
      <div style={{
        width: 48, height: 48, borderRadius: 14,
        background: `rgba(${color},0.12)`,
        border: `1px solid rgba(${color},0.25)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 18, transition: 'all 0.3s',
        boxShadow: hovered ? `0 0 20px rgba(${color},0.3)` : 'none',
        color: `rgb(${color})`,
      }}>
        {icon}
      </div>
      <h3 style={{
        fontSize: 16, fontWeight: 700, marginBottom: 10, fontFamily: "'Space Grotesk', sans-serif",
        color: '#f0f4ff',
      }}>{title}</h3>
      <p style={{ fontSize: 13, color: '#8892b0', lineHeight: 1.7 }}>{desc}</p>
    </div>
  );
}

// ── Step Card ─────────────────────────────────────────────────────────────────
function StepCard({ num, title, desc, color }: { num: string; title: string; desc: string; color: string }) {
  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: `rgba(${color},0.1)`,
        border: `1px solid rgba(${color},0.25)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif",
        color: `rgb(${color})`,
      }}>{num}</div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f4ff', marginBottom: 6, fontFamily: "'Space Grotesk',sans-serif" }}>{title}</div>
        <div style={{ fontSize: 13, color: '#8892b0', lineHeight: 1.65 }}>{desc}</div>
      </div>
    </div>
  );
}

// ── Main Landing ──────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Particle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf: number;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);

    const N = 70;
    const pts = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 1.5 + 0.4,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // connections
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const d = Math.sqrt(dx*dx + dy*dy);
          if (d < 120) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(124,58,237,${0.18*(1-d/120)})`;
            ctx.lineWidth = 0.6; ctx.stroke();
          }
        }
      }
      pts.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(167,139,250,0.5)`; ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  const navLinks = ['Features', 'How It Works', 'Stats'];

  return (
    <div style={{ background: '#050508', fontFamily: "'Inter', sans-serif", overflowX: 'hidden' }}>

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(20px,4vw,56px)', height: 64,
        background: scrollY > 20 ? 'rgba(5,5,8,0.92)' : 'transparent',
        backdropFilter: scrollY > 20 ? 'blur(20px)' : 'none',
        borderBottom: scrollY > 20 ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}>
        {/* Gradient top line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, transparent 0%, #7c3aed 30%, #06b6d4 60%, #10b981 85%, transparent 100%)',
          opacity: scrollY > 20 ? 1 : 0, transition: 'opacity 0.3s',
        }} />

        {/* Logo */}
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 14px rgba(124,58,237,0.5)',
          }}>
            <Shield size={17} color="#fff" />
          </div>
          <span style={{
            fontSize: 18, fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif",
            letterSpacing: '-0.03em', color: '#fff',
          }}>
            Claim<span style={{ background: 'linear-gradient(135deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Sphere</span>
          </span>
        </a>

        {/* Desktop nav */}
        <div className="landing-desktop-links" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {navLinks.map(l => (
            <button key={l} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)',
              fontSize: 14, fontFamily: "'Inter',sans-serif", padding: '7px 14px', borderRadius: 8,
              transition: 'color 0.2s, background 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'none'; }}
            >{l}</button>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.7)', fontSize: 14, padding: '7px 14px', borderRadius: 8,
              fontFamily: "'Inter',sans-serif", transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
            className="landing-cta-btn"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate('/register')}
            className="landing-cta-btn"
            style={{
              background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff',
              border: 'none', borderRadius: 9, padding: '9px 20px',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: "'Inter',sans-serif",
              boxShadow: '0 4px 20px rgba(124,58,237,0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(124,58,237,0.5)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,58,237,0.4)'; }}
          >
            <Zap size={13} /> Get Started
          </button>

          {/* Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(p => !p)}
            className="landing-hamburger"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 4 }}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 90,
          background: 'rgba(5,5,8,0.97)', backdropFilter: 'blur(20px)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '0 40px', gap: 24, animation: 'fadeIn 0.2s ease',
        }}>
          {navLinks.map(l => (
            <button key={l} onClick={() => setMobileMenuOpen(false)} style={{
              background: 'none', border: 'none', textAlign: 'left', fontSize: 28,
              fontWeight: 600, color: 'rgba(255,255,255,0.85)', cursor: 'pointer',
              fontFamily: "'Space Grotesk',sans-serif", letterSpacing: '-0.02em',
            }}>{l}</button>
          ))}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={() => { setMobileMenuOpen(false); navigate('/login'); }} style={{ flex: 1, padding: '13px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Sign In</button>
            <button onClick={() => { setMobileMenuOpen(false); navigate('/register'); }} style={{ flex: 1, padding: '13px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>Get Started</button>
          </div>
        </div>
      )}

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {/* Canvas bg */}
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }} />

        {/* Gradient overlays */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(180deg, rgba(5,5,8,0.3) 0%, rgba(5,5,8,0.1) 40%, rgba(5,5,8,0.8) 100%)' }} />
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 65%)', pointerEvents: 'none', zIndex: 1 }} />

        {/* Hero content */}
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: 'clamp(80px,10vh,120px) clamp(24px,5vw,80px) 80px', maxWidth: 900, width: '100%' }}>

          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28,
            padding: '7px 16px', borderRadius: 99,
            background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)',
            color: '#a78bfa', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em',
            animation: 'fadeSlideUp 0.7s ease 0.1s both',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed', boxShadow: '0 0 8px #7c3aed', flexShrink: 0 }} />
            AI-Powered Insurance Claim Management
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#06b6d4', boxShadow: '0 0 8px #06b6d4', flexShrink: 0 }} />
          </div>

          {/* Heading */}
          <h1 style={{
            fontSize: 'clamp(40px, 8vw, 96px)', fontWeight: 800, lineHeight: 1.05,
            letterSpacing: '-0.04em', color: '#fff',
            fontFamily: "'Space Grotesk',sans-serif",
            marginBottom: 'clamp(20px,3vh,32px)',
            animation: 'fadeSlideUp 0.8s ease 0.3s both',
          }}>
            Smarter Claims,<br />
            <span style={{
              background: 'linear-gradient(135deg, #a78bfa 0%, #22d3ee 50%, #34d399 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>Faster Resolution.</span>
          </h1>

          {/* Subheading */}
          <p style={{
            fontSize: 'clamp(15px,2vw,20px)', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7,
            maxWidth: 620, margin: '0 auto clamp(32px,5vh,48px)',
            animation: 'fadeSlideUp 0.8s ease 0.5s both',
          }}>
            Submit claims digitally, verify documents with AI-powered OCR, detect fraud, assess risk, and track every step from submission to resolution.
          </p>

          {/* CTA buttons */}
          <div style={{
            display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 56,
            animation: 'fadeSlideUp 0.8s ease 0.7s both',
          }}>
            <button
              onClick={() => navigate('/register')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
                color: '#fff', border: 'none', borderRadius: 12,
                padding: 'clamp(12px,2vh,16px) clamp(24px,3vw,32px)',
                fontSize: 'clamp(14px,1.5vw,16px)', fontWeight: 700,
                cursor: 'pointer', fontFamily: "'Inter',sans-serif",
                boxShadow: '0 8px 32px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
                transition: 'all 0.25s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(124,58,237,0.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(124,58,237,0.5)'; }}
            >
              <Zap size={17} /> Start a Claim <ArrowRight size={16} />
            </button>

            <button
              onClick={() => navigate('/login')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.18)',
                color: '#fff', borderRadius: 12, backdropFilter: 'blur(12px)',
                padding: 'clamp(12px,2vh,16px) clamp(24px,3vw,32px)',
                fontSize: 'clamp(14px,1.5vw,16px)', fontWeight: 600,
                cursor: 'pointer', fontFamily: "'Inter',sans-serif",
                transition: 'all 0.25s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
            >
              <Search size={16} /> Track My Claim
            </button>
          </div>

          {/* Trust strip */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px 24px',
            fontSize: 12, color: 'rgba(255,255,255,0.28)',
            animation: 'fadeSlideUp 0.8s ease 0.9s both',
          }}>
            {['OCR Document Verification', 'Fraud Detection', 'Real-time Tracking', 'Risk Assessment', 'Guidewire Powered'].map((f, i, a) => (
              <React.Fragment key={f}>
                <span>{f}</span>
                {i < a.length - 1 && <span style={{ opacity: 0.4 }}>·</span>}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS STRIP ────────────────────────────────────────────────────── */}
      <section style={{
        background: 'rgba(13,15,26,0.8)', borderTop: '1px solid rgba(255,255,255,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '40px clamp(24px,5vw,80px)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
          {[
            { label: 'Claims Processed', value: 48000, suffix: '+', color: '#a78bfa' },
            { label: 'Avg. Resolution Time', value: 48, suffix: 'hrs', color: '#22d3ee' },
            { label: 'Fraud Detected', value: 99, suffix: '%', color: '#34d399' },
            { label: 'Customer Satisfaction', value: 98, suffix: '%', color: '#fbbf24' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{
                fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800,
                fontFamily: "'Space Grotesk',sans-serif", color: s.color,
                marginBottom: 4, letterSpacing: '-0.03em',
              }}>
                <Counter to={s.value} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(60px,8vh,100px) clamp(24px,5vw,80px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Section label */}
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16,
              fontSize: 11, fontWeight: 800, color: '#a78bfa', letterSpacing: '0.1em', textTransform: 'uppercase',
            }}>
              <div style={{ width: 24, height: 1, background: 'linear-gradient(90deg, transparent, #7c3aed)' }} />
              Platform Features
              <div style={{ width: 24, height: 1, background: 'linear-gradient(90deg, #7c3aed, transparent)' }} />
            </div>
            <h2 style={{
              fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, color: '#f0f4ff',
              fontFamily: "'Space Grotesk',sans-serif", letterSpacing: '-0.03em', marginBottom: 14,
            }}>
              Everything you need to manage<br />
              <span style={{ background: 'linear-gradient(135deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                insurance claims at scale
              </span>
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', maxWidth: 520, margin: '0 auto' }}>
              From AI-powered document verification to real-time fraud detection — built for modern insurance workflows.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 20 }}>
            <FeatureCard delay={0}    color="124,58,237"  icon={<ScanLine size={22} />}     title="AI OCR Document Scan"      desc="Automatically extract and verify details from policy documents, licenses, and reports using Tesseract-powered OCR." />
            <FeatureCard delay={0.05} color="6,182,212"   icon={<Shield size={22} />}       title="Authenticity Verification" desc="Cross-validate extracted document data against claim context — policy numbers, dates, names, and FIR details." />
            <FeatureCard delay={0.1}  color="16,185,129"  icon={<AlertTriangle size={22} /> } title="Fraud Detection Engine"   desc="Detect suspicious patterns with per-check trust scoring. Get instant fraud flags and confidence scores (0–100)." />
            <FeatureCard delay={0.15} color="245,158,11"  icon={<Activity size={22} />}     title="Real-Time Claim Tracking"  desc="Monitor your claim through every stage — from submission to approval. Get live status updates with a visual timeline." />
            <FeatureCard delay={0.2}  color="239,68,68"   icon={<BarChart3 size={22} />}    title="Risk Assessment"          desc="Automatic risk scoring based on claim type, amount, damage severity, and historical data for smarter decisions." />
            <FeatureCard delay={0.25} color="167,139,250" icon={<Lock size={22} />}         title="Secure & Compliant"       desc="End-to-end encrypted document storage. JWT-based authentication with role-based access control." />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(60px,8vh,100px) clamp(24px,5vw,80px)',
        background: 'rgba(13,15,26,0.5)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>

          {/* Left: steps */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 11, fontWeight: 800, color: '#22d3ee', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              <div style={{ width: 24, height: 1, background: 'linear-gradient(90deg, transparent, #06b6d4)' }} />
              How It Works
            </div>
            <h2 style={{ fontSize: 'clamp(26px,3.5vw,42px)', fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif", letterSpacing: '-0.03em', marginBottom: 40, lineHeight: 1.2, color: '#f0f4ff' }}>
              From upload to<br />
              <span style={{ background: 'linear-gradient(135deg,#67e8f9,#34d399)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                settlement in hours
              </span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <StepCard num="1" color="124,58,237" title="Submit Your Claim" desc="Fill in claim details — incident date, location, type — and upload your supporting documents." />
              <StepCard num="2" color="6,182,212"  title="AI Scans & Verifies" desc="Our OCR engine extracts data from every document and cross-validates it against your claim in real-time." />
              <StepCard num="3" color="16,185,129" title="Fraud & Risk Check" desc="The system flags inconsistencies, checks for fraud patterns, and assigns a trust score to each document." />
              <StepCard num="4" color="245,158,11" title="Track & Settle" desc="Monitor progress with live status updates. Get notified when your claim moves to the next stage." />
            </div>
          </div>

          {/* Right: visual card */}
          <div style={{ position: 'relative' }}>
            {/* Glow */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 65%)', pointerEvents: 'none' }} />

            <div style={{ background: 'rgba(13,15,26,0.9)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 24, padding: 28, position: 'relative', backdropFilter: 'blur(20px)' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, paddingBottom: 18, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={16} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff' }}>Claim #CLM-2026-4892</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Vehicle Accident · ₹85,000</div>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 99, background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>
                  APPROVED
                </span>
              </div>

              {/* Document checks */}
              {[
                { label: 'Policy Document', status: 'pass', score: 94 },
                { label: 'Driving License', status: 'pass', score: 88 },
                { label: 'Vehicle Registration', status: 'warn', score: 72 },
                { label: 'Police FIR Report', status: 'pass', score: 91 },
                { label: 'Medical Report', status: 'pass', score: 85 },
              ].map(doc => (
                <div key={doc.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                    background: doc.status === 'pass' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {doc.status === 'pass'
                      ? <CheckCircle size={13} color="#34d399" />
                      : <AlertTriangle size={13} color="#fbbf24" />
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{doc.label}</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: doc.status === 'pass' ? '#34d399' : '#fbbf24' }}>{doc.score}/100</span>
                    </div>
                    <div style={{ height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${doc.score}%`, borderRadius: 99, background: doc.status === 'pass' ? 'linear-gradient(90deg,#10b981,#34d399)' : 'linear-gradient(90deg,#f59e0b,#fbbf24)', transition: 'width 1s ease' }} />
                    </div>
                  </div>
                </div>
              ))}

              {/* Trust score */}
              <div style={{ marginTop: 20, padding: '14px 16px', borderRadius: 12, background: 'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(6,182,212,0.06))', border: '1px solid rgba(124,58,237,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>Overall Trust Score</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ fontSize: 24, fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif", background: 'linear-gradient(135deg,#a78bfa,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>87</div>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>/100</span>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>HIGH</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(60px,8vh,100px) clamp(24px,5vw,80px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(24px,3vw,36px)', fontWeight: 800, color: '#f0f4ff', fontFamily: "'Space Grotesk',sans-serif", letterSpacing: '-0.03em' }}>
              Trusted by policyholders
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 18 }}>
            {[
              { name: 'Arjun Mehta', role: 'Vehicle Insurance Customer', stars: 5, text: 'Got my accident claim approved in under 2 days. The AI OCR scanned all my documents in seconds and the trust score gave me confidence.' },
              { name: 'Priya Nair', role: 'Fleet Owner', stars: 5, text: 'Managing claims for 12 vehicles was a nightmare before. ClaimSphere\'s document verification catches errors before they become problems.' },
              { name: 'Ravi Shankar', role: 'Insurance Adjuster', stars: 5, text: 'The fraud detection flags are incredibly accurate. We\'ve reduced fraudulent claims by 40% since deploying this platform.' },
            ].map(t => (
              <div key={t.name} style={{ background: 'rgba(13,15,26,0.8)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '24px 22px', transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(124,58,237,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
              >
                <div style={{ display: 'flex', gap: 2, marginBottom: 14 }}>
                  {Array(t.stars).fill(0).map((_, i) => <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />)}
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 18 }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff' }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f4ff' }}>{t.name}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ────────────────────────────────────────────────────── */}
      <section style={{
        padding: 'clamp(60px,8vh,100px) clamp(24px,5vw,80px)',
        background: 'rgba(13,15,26,0.5)', borderTop: '1px solid rgba(255,255,255,0.05)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 0 32px rgba(124,58,237,0.5)' }}>
            <Zap size={28} color="#fff" />
          </div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,48px)', fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif", letterSpacing: '-0.03em', marginBottom: 16, color: '#f0f4ff' }}>
            Ready to file your claim?
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginBottom: 36, lineHeight: 1.7 }}>
            Join thousands of policyholders who get faster claim resolutions with AI-powered verification and real-time tracking.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/register')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 9,
                background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: '#fff',
                border: 'none', borderRadius: 12, padding: '14px 28px',
                fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Inter',sans-serif",
                boxShadow: '0 8px 32px rgba(124,58,237,0.5)', transition: 'all 0.25s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(124,58,237,0.6)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(124,58,237,0.5)'; }}
            >
              <ArrowRight size={17} /> Get Started — It's Free
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff', borderRadius: 12, padding: '14px 28px',
                fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter',sans-serif",
                transition: 'all 0.25s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
            >
              Sign In <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '28px clamp(24px,5vw,80px)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: 'linear-gradient(135deg,#7c3aed,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={13} color="#fff" />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)', fontFamily: "'Space Grotesk',sans-serif" }}>ClaimSphere</span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
            © 2026 ClaimSphere · Powered by Guidewire AI · All rights reserved
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacy', 'Terms', 'Contact'].map(l => (
              <button key={l} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: "'Inter',sans-serif", transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
              >{l}</button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
