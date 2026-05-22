// Lumio UI Kit — shared primitives
// All styles use CSS vars from ../../colors_and_type.css; we only set layout/local rules inline.

// ─── Icon (subset of Lucide) ────────────────────────────────────────────
const ICON_PATHS = {
  home:        'M3 12L12 3l9 9M5 10v10h14V10',
  book:        'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
  mic:         'M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 19v3',
  layers:      'M12 2l10 5-10 5L2 7l10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  edit:        'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z',
  bell:        'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0',
  settings:    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  sun:         'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42',
  moon:        'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
  save:        'M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21V13H7v8M7 3v5h8',
  bookmark:    'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z',
  play:        'M5 3l14 9-14 9V3z',
  pause:       'M6 4h4v16H6zM14 4h4v16h-4z',
  stop:        'M5 5h14v14H5z',
  chevronRight:'M9 18l6-6-6-6',
  chevronLeft: 'M15 18l-6-6 6-6',
  check:       'M20 6L9 17l-5-5',
  x:           'M18 6L6 18M6 6l12 12',
  plus:        'M12 5v14M5 12h14',
  search:      'M21 21l-4.35-4.35M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z',
  link:        'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  send:        'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  volume:      'M11 5L6 9H2v6h4l5 4V5zM19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07',
  flame:       'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z',
  clock:       'M12 8v4l3 3M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
  trending:    'M22 7l-9.5 9.5-5-5L1 18M16 7h6v6',
  arrowRight:  'M5 12h14M12 5l7 7-7 7',
  dots:        'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  sparkle:     'M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3z',
  globe:       'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
  smile:       'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01',
  trash:       'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
  filter:      'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
  rotate:      'M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5',
};

function Icon({ name, size = 18, strokeWidth = 1.5, fill = 'none', style }) {
  const d = ICON_PATHS[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
         stroke="currentColor" strokeWidth={strokeWidth}
         strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', ...style }}>
      {d.split('M').filter(Boolean).map((seg, i) =>
        <path key={i} d={'M' + seg.trim()} />)}
    </svg>
  );
}

// ─── Logo ───────────────────────────────────────────────────────────────
function Logo({ size = 32, showWord = true, color }) {
  const fg = color || 'var(--lm-fg)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <img src="../../assets/lumio-mark.svg" alt="" width={size} height={size}
           style={{ borderRadius: size / 4 }} />
      {showWord && (
        <span style={{
          fontFamily: 'var(--lm-font-sans)', fontWeight: 800,
          fontSize: size * 0.62, letterSpacing: '-0.02em', color: fg,
          lineHeight: 1,
        }}>
          Lum<span style={{ color: 'var(--lm-primary)' }}>i</span>o
        </span>
      )}
    </div>
  );
}

// ─── Button ─────────────────────────────────────────────────────────────
function Button({ variant = 'primary', size = 'md', icon, children, onClick, style, disabled }) {
  const base = {
    fontFamily: 'var(--lm-font-sans)', fontWeight: 600,
    border: '1px solid transparent', cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all var(--lm-dur-base) var(--lm-ease)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap',
  };
  const sizes = {
    sm: { fontSize: 12, padding: '6px 12px', borderRadius: 'var(--lm-radius-sm)' },
    md: { fontSize: 14, padding: '10px 16px', borderRadius: 'var(--lm-radius-md)' },
    lg: { fontSize: 15, padding: '12px 22px', borderRadius: 'var(--lm-radius-md)' },
  };
  const variants = {
    primary:   { background: 'var(--lm-primary)', color: 'var(--lm-fg-on-primary)', borderColor: 'var(--lm-primary-hover)' },
    secondary: { background: 'var(--lm-bg-elev-1)', color: 'var(--lm-fg)', borderColor: 'var(--lm-border)' },
    ghost:     { background: 'transparent', color: 'var(--lm-fg)' },
    danger:    { background: 'var(--lm-danger-soft)', color: 'var(--lm-danger-ink)', borderColor: 'var(--lm-danger-soft)' },
  };
  return (
    <button onClick={onClick} disabled={disabled}
            style={{ ...base, ...sizes[size], ...variants[variant], ...style }}>
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
}

// ─── Chip / Badge ───────────────────────────────────────────────────────
function Chip({ children, color, mono, style }) {
  const colors = {
    A1: '#87C39A', A2: '#5FB283',
    B1: 'var(--lm-primary)', B2: '#D98A2B',
    C1: '#BD5B85', C2: '#7B3DA0',
    success: 'var(--lm-success)', danger: 'var(--lm-danger)',
    info: 'var(--lm-info)', warning: 'var(--lm-warning)',
  };
  const bg = colors[color] || color || 'var(--lm-bg-muted)';
  const fg = (color === 'B1') ? '#1A1308' : '#fff';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontFamily: mono ? 'var(--lm-font-mono)' : 'var(--lm-font-sans)',
      fontSize: 10, fontWeight: 600, letterSpacing: '0.06em',
      padding: '3px 7px', borderRadius: 4,
      background: bg, color: fg, ...style,
    }}>{children}</span>
  );
}

// ─── Card ───────────────────────────────────────────────────────────────
function Card({ children, style, padding = 20, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--lm-bg-elev-1)', border: '1px solid var(--lm-border)',
      borderRadius: 'var(--lm-radius-lg)', padding,
      boxShadow: 'var(--lm-shadow-soft)',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all var(--lm-dur-base) var(--lm-ease)',
      ...style,
    }}>{children}</div>
  );
}

// ─── Avatar (round + initial fallback) ──────────────────────────────────
function Avatar({ name, size = 32, gradient }) {
  const initial = (name || '?').trim()[0]?.toUpperCase() || '?';
  const palette = gradient || 'linear-gradient(135deg, #E8A33D, #D4912E)';
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%',
      background: palette, color: '#1A1308',
      fontFamily: 'var(--lm-font-sans)', fontWeight: 700,
      fontSize: size * 0.42,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      flex: 'none',
    }}>{initial}</span>
  );
}

// ─── ProgressBar ────────────────────────────────────────────────────────
function ProgressBar({ value, max = 100, color = 'var(--lm-primary)', height = 6 }) {
  return (
    <div style={{
      height, background: 'var(--lm-bg-muted)', borderRadius: 9999, overflow: 'hidden',
    }}>
      <div style={{
        height: '100%', width: `${(value / max) * 100}%`,
        background: color, borderRadius: 9999,
        transition: 'width var(--lm-dur-slow) var(--lm-ease)',
      }} />
    </div>
  );
}

Object.assign(window, { Icon, Logo, Button, Chip, Card, Avatar, ProgressBar });
