import React, { useState } from 'react';

// Copy text even where the async clipboard API is unavailable (older browsers / non-HTTPS).
export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true; }
  } catch { /* fall through */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch { return false; }
}

// A link shown as text; hovering reveals "Copy" and "Open in new tab" actions.
// `enabled=false` dims the link and calls onBlocked instead (e.g. card still private).
export default function LinkRow({ url, enabled = true, onBlocked, onCopied }) {
  const [copied, setCopied] = useState(false);

  const copy = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!enabled) { onBlocked && onBlocked(); return; }
    const ok = await copyText(url);
    if (ok) { setCopied(true); setTimeout(() => setCopied(false), 1800); onCopied && onCopied(); }
    else onBlocked && onBlocked(`Copy failed. Select the link and copy it manually: ${url}`);
  };
  const open = (e) => { if (!enabled) { e.preventDefault(); onBlocked && onBlocked(); } };

  const btn = {
    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8,
    border: '1px solid var(--border-hi)', background: 'rgba(255,255,255,0.06)', color: 'var(--text)',
    fontSize: 12, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', fontFamily: 'var(--font-b)', whiteSpace: 'nowrap',
  };

  return (
    <div className="lr-row" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 10, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)', maxWidth: '100%', boxSizing: 'border-box' }}>
      <span title={url} style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: enabled ? '#a5b4fc' : 'var(--text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>{url}</span>
      <span className="lr-acts" style={{ display: 'inline-flex', gap: 6, flexShrink: 0 }}>
        <button type="button" style={btn} onClick={copy} title="Copy link">{copied ? '✓ Copied' : '⧉ Copy'}</button>
        <a href={url} target="_blank" rel="noopener noreferrer" style={btn} onClick={open} title="Open in new tab">↗ Open</a>
      </span>
      <style>{`
        .lr-row .lr-acts{opacity:0;transition:opacity .15s}
        .lr-row:hover .lr-acts,.lr-row:focus-within .lr-acts{opacity:1}
        @media (hover:none){.lr-row .lr-acts{opacity:1}}
      `}</style>
    </div>
  );
}
