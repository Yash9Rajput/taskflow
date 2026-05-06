import React, { useEffect, useRef } from 'react';

export default function CursorGlow() {
  const blobRef   = useRef(null);
  const blob2Ref  = useRef(null);
  const blob3Ref  = useRef(null);

  useEffect(() => {
    let raf;
    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let cx = mx, cy = my;
    let cx2 = mx + 200, cy2 = my - 100;
    let cx3 = mx - 200, cy3 = my + 100;

    const onMove = (e) => {
      mx = e.clientX; my = e.clientY;
    };
    window.addEventListener('mousemove', onMove);

    const animate = () => {
      // Primary blob follows cursor closely
      cx += (mx - cx) * 0.08;
      cy += (my - cy) * 0.08;
      // Secondary blob lags more
      cx2 += (mx - 180 - cx2) * 0.04;
      cy2 += (my + 120 - cy2) * 0.04;
      // Tertiary blob lags most
      cx3 += (mx + 200 - cx3) * 0.025;
      cy3 += (my - 150 - cy3) * 0.025;

      if (blobRef.current) {
        blobRef.current.style.transform = `translate(${cx - 300}px, ${cy - 300}px)`;
      }
      if (blob2Ref.current) {
        blob2Ref.current.style.transform = `translate(${cx2 - 200}px, ${cy2 - 200}px)`;
      }
      if (blob3Ref.current) {
        blob3Ref.current.style.transform = `translate(${cx3 - 150}px, ${cy3 - 150}px)`;
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
      {/* Grid overlay */}
      <div style={{
        position:'absolute', inset:0,
        backgroundImage: `linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      {/* Noise texture */}
      <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.03}}>
        <filter id="noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
          <feColorMatrix type="saturate" values="0"/>
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)"/>
      </svg>

      {/* Primary glow — follows cursor */}
      <div ref={blobRef} style={{
        position:'absolute', width:600, height:600,
        borderRadius:'50%',
        background:'radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.06) 40%, transparent 70%)',
        willChange:'transform', transition:'none',
      }} />

      {/* Secondary glow — purple */}
      <div ref={blob2Ref} style={{
        position:'absolute', width:400, height:400,
        borderRadius:'50%',
        background:'radial-gradient(circle, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.04) 40%, transparent 70%)',
        willChange:'transform',
      }} />

      {/* Tertiary glow — cyan */}
      <div ref={blob3Ref} style={{
        position:'absolute', width:300, height:300,
        borderRadius:'50%',
        background:'radial-gradient(circle, rgba(6,182,212,0.1) 0%, rgba(6,182,212,0.03) 40%, transparent 70%)',
        willChange:'transform',
      }} />

      {/* Static corner accents */}
      <div style={{position:'absolute',top:-100,right:-100,width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)'}}/>
      <div style={{position:'absolute',bottom:-150,left:-100,width:500,height:500,borderRadius:'50%',background:'radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%)'}}/>
    </div>
  );
}
