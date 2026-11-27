import React, { useEffect, useRef, useState, useCallback } from 'react';

const VIEW = 280;   // on-screen crop square (px)
const OUT  = 256;   // saved size (px)

// Drag to reposition, slider / wheel to zoom, then "Save photo". Output is a small JPEG.
export default function PhotoCropper({ file, onCancel, onSave }) {
  const [img, setImg]     = useState(null);       // HTMLImageElement
  const [url, setUrl]     = useState('');
  const [zoom, setZoom]   = useState(1);
  const [off, setOff]     = useState({ x: 0, y: 0 });
  const [error, setError] = useState('');
  const drag = useRef(null);

  // load the file
  useEffect(() => {
    const u = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => { setImg(im); setUrl(u); };
    im.onerror = () => { setError('Could not read that image. Use a PNG, JPG or WebP file.'); };
    im.src = u;
    return () => URL.revokeObjectURL(u);
  }, [file]);

  const base  = img ? VIEW / Math.min(img.width, img.height) : 1;   // scale at which the image just covers the square
  const scale = base * zoom;

  const clamp = useCallback((x, y, sc) => {
    if (!img) return { x, y };
    const w = img.width * sc, h = img.height * sc;
    return { x: Math.min(0, Math.max(VIEW - w, x)), y: Math.min(0, Math.max(VIEW - h, y)) };
  }, [img]);

  // centre the image initially
  useEffect(() => {
    if (!img) return;
    const sc = VIEW / Math.min(img.width, img.height);
    setOff(clamp((VIEW - img.width * sc) / 2, (VIEW - img.height * sc) / 2, sc));
  }, [img, clamp]);

  const changeZoom = (z) => {
    if (!img) return;
    const nz = Math.min(4, Math.max(1, z));
    // keep the point at the centre of the square fixed while zooming
    const cx = (VIEW / 2 - off.x) / scale, cy = (VIEW / 2 - off.y) / scale;
    const ns = base * nz;
    setZoom(nz);
    setOff(clamp(VIEW / 2 - cx * ns, VIEW / 2 - cy * ns, ns));
  };

  const onDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y };
  };
  const onMove = (e) => {
    if (!drag.current) return;
    setOff(clamp(drag.current.ox + (e.clientX - drag.current.x), drag.current.oy + (e.clientY - drag.current.y), scale));
  };
  const onUp = () => { drag.current = null; };
  const onWheel = (e) => { changeZoom(zoom + (e.deltaY < 0 ? 0.1 : -0.1)); };

  const save = () => {
    if (!img) return;
    const encode = (size, q) => {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, -off.x / scale, -off.y / scale, VIEW / scale, VIEW / scale, 0, 0, size, size);
      return c.toDataURL('image/jpeg', q);
    };
    let out = encode(OUT, 0.85);
    if (out.length > 85000) out = encode(OUT, 0.7);
    if (out.length > 85000) out = encode(192, 0.7);
    if (out.length > 85000) { setError('This photo is too detailed to save. Try a different one.'); return; }
    onSave(out);
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="modal-box" style={{ width: 380, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-d)', fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Adjust your photo</div>
        <div style={{ fontSize: 12.5, color: 'var(--text-2)', marginBottom: '1rem' }}>Drag to move · use the slider or scroll to zoom</div>

        {error && <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 13, marginBottom: 12 }}>⚠ {error}</div>}

        <div
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onWheel={onWheel}
          style={{ position: 'relative', width: VIEW, height: VIEW, margin: '0 auto', overflow: 'hidden', borderRadius: 12, background: '#000', cursor: drag.current ? 'grabbing' : 'grab', touchAction: 'none', userSelect: 'none' }}>
          {img && (
            <img src={url} alt="" draggable={false}
              style={{ position: 'absolute', left: off.x, top: off.y, width: img.width * scale, height: img.height * scale, maxWidth: 'none', pointerEvents: 'none' }} />
          )}
          {/* circular preview mask: dark outside the circle shows what will be visible as the round avatar */}
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', boxShadow: '0 0 0 400px rgba(0,0,0,0.55)', border: '2px solid rgba(255,255,255,0.85)', pointerEvents: 'none' }} />
          {!img && !error && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: 13 }}>Loading…</div>}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '1.1rem auto 0', width: VIEW }}>
          <span style={{ fontSize: 14, color: 'var(--text-3)' }}>−</span>
          <input type="range" min="1" max="4" step="0.01" value={zoom} onChange={e => changeZoom(parseFloat(e.target.value))}
            style={{ flex: 1, padding: 0, height: 20, background: 'transparent', border: 'none', boxShadow: 'none' }} />
          <span style={{ fontSize: 14, color: 'var(--text-3)' }}>+</span>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: '1.25rem' }}>
          <button className="btn" onClick={onCancel} style={{ minWidth: 100 }}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={!img} style={{ minWidth: 120 }}>Save photo</button>
        </div>
      </div>
    </div>
  );
}
