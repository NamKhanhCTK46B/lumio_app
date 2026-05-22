// Lumio UI Kit — Speak screen (roleplay with AI character)

function Speak() {
  const characters = [
    { name: 'Sophie', accent: 'British',   tag: 'casual',   grad: 'linear-gradient(135deg,#E8A33D,#D4912E)' },
    { name: 'Marcus', accent: 'American',  tag: 'business', grad: 'linear-gradient(135deg,#3F7BD8,#2056A8)' },
    { name: 'Mei',    accent: 'Australian', tag: 'travel',  grad: 'linear-gradient(135deg,#BD5B85,#86406A)' },
  ];
  const [active, setActive] = useState('Sophie');
  const [recording, setRecording] = useState(false);

  const turns = [
    { who: 'ai', text: "Hi! Welcome to The Daily Grind. What can I get you this morning?" },
    { who: 'user', text: "I would like one cappuccino, please. Medium size.",
      corrections: [
        { phrase: "would like", fix: "would like", note: null },
        { phrase: "one cappuccino", fix: "a cappuccino", note: 'Natural English uses "a" rather than "one" for ordering.' },
      ], score: 7.8 },
    { who: 'ai', text: "Sure thing — a medium cappuccino. Would you like that for here or to go?" },
  ];

  return (
    <div style={speakStyles.wrap}>
      {/* Character picker */}
      <div style={speakStyles.charRow}>
        {characters.map(c => {
          const isActive = c.name === active;
          return (
            <button key={c.name} onClick={() => setActive(c.name)}
              style={{
                ...speakStyles.charCard,
                borderColor: isActive ? 'var(--lm-primary)' : 'var(--lm-border)',
                boxShadow: isActive ? 'var(--lm-shadow-soft)' : 'none',
              }}>
              <Avatar name={c.name} size={48} gradient={c.grad} />
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--lm-fg)' }}>{c.name}</div>
                <div style={{ fontSize: 11, color: 'var(--lm-fg-muted)' }}>{c.accent} · {c.tag}</div>
              </div>
              {isActive && <Chip color="success">Đang nói</Chip>}
            </button>
          );
        })}
      </div>

      {/* Scenario header */}
      <div style={speakStyles.scenarioBar}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
                        color: 'var(--lm-fg-subtle)', fontWeight: 700 }}>SCENARIO</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--lm-fg)', marginTop: 4 }}>
            Ordering coffee · café in London
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="ghost" size="sm" icon="rotate">Đổi tình huống</Button>
          <Button variant="secondary" size="sm" icon="x">Kết thúc</Button>
        </div>
      </div>

      {/* Conversation transcript */}
      <Card style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, minHeight: 280 }}>
        {turns.map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 12,
                                flexDirection: t.who === 'user' ? 'row-reverse' : 'row' }}>
            {t.who === 'ai'
              ? <Avatar name={active} size={36} gradient="linear-gradient(135deg,#E8A33D,#D4912E)" />
              : <Avatar name="Hoa" size={36} gradient="linear-gradient(135deg,#5FB283,#3D8E64)" />}
            <div style={{ maxWidth: '70%' }}>
              <div style={{
                ...speakStyles.bubble,
                background: t.who === 'user' ? 'var(--lm-primary-soft)' : 'var(--lm-bg-muted)',
                color: t.who === 'user' ? 'var(--lm-primary-ink)' : 'var(--lm-fg)',
              }}>
                {t.text}
              </div>
              {t.corrections && (
                <div style={speakStyles.correctionPanel}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Icon name="sparkle" size={12} style={{ color: 'var(--lm-primary)' }} />
                    <span style={speakStyles.cTitle}>Phản hồi · {t.score}/10 phát âm</span>
                  </div>
                  {t.corrections.filter(c => c.note).map((c, j) => (
                    <div key={j} style={speakStyles.cRow}>
                      <span style={speakStyles.cBad}>{c.phrase}</span>
                      <Icon name="arrowRight" size={12} style={{ color: 'var(--lm-fg-muted)' }} />
                      <span style={speakStyles.cGood}>{c.fix}</span>
                      <div style={speakStyles.cNote}>{c.note}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {recording && (
          <div style={speakStyles.listening}>
            <div style={speakStyles.wave}>
              {[14, 22, 16, 28, 20, 32, 18, 26, 14, 22].map((h, i) =>
                <span key={i} style={{ ...speakStyles.waveBar, height: h }} />)}
            </div>
            <span style={{ fontSize: 13, color: 'var(--lm-fg-muted)' }}>Đang lắng nghe…</span>
          </div>
        )}
      </Card>

      {/* Mic dock */}
      <div style={speakStyles.micDock}>
        <button style={speakStyles.iconBtn}><Icon name="rotate" size={18} /></button>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setRecording(r => !r)}
          style={{
            ...speakStyles.micBtn,
            background: recording ? 'var(--lm-danger)' : 'var(--lm-fg)',
            animation: recording ? 'lumioPulse 1.2s cubic-bezier(.2,.8,.2,1) infinite' : 'none',
          }}>
          {recording
            ? <svg width="32" height="32" viewBox="0 0 24 24" fill="#FBF9F5"><rect x="7" y="7" width="10" height="10" rx="2"/></svg>
            : <Icon name="mic" size={28} style={{ color: '#FBF9F5' }} />}
        </button>
        <div style={{ flex: 1 }} />
        <button style={speakStyles.iconBtn}><Icon name="volume" size={18} /></button>
      </div>
      <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--lm-fg-muted)' }}>
        {recording ? 'Nhả để dừng' : 'Nhấn để nói · hoặc gõ ở phía dưới'}
      </div>

      <style>{`
        @keyframes lumioPulse {
          0%,100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(216,90,90,.5); }
          50% { transform: scale(1.04); box-shadow: 0 0 0 22px rgba(216,90,90,0); }
        }
      `}</style>
    </div>
  );
}

const speakStyles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 880, margin: '0 auto' },
  charRow: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 },
  charCard: { display: 'flex', alignItems: 'center', gap: 12, padding: 12,
              background: 'var(--lm-bg-elev-1)', border: '1px solid var(--lm-border)',
              borderRadius: 'var(--lm-radius-md)', cursor: 'pointer',
              fontFamily: 'var(--lm-font-sans)' },
  scenarioBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                 padding: '12px 16px', background: 'var(--lm-bg-muted)',
                 borderRadius: 'var(--lm-radius-md)' },
  bubble: { padding: '10px 14px', borderRadius: 14, fontSize: 14, lineHeight: 1.5 },
  correctionPanel: { marginTop: 8, padding: 12, border: '1px solid var(--lm-border)',
                     borderRadius: 10, background: 'var(--lm-bg-elev-1)' },
  cTitle: { fontSize: 11, letterSpacing: '0.06em', color: 'var(--lm-fg-subtle)',
            fontWeight: 700, textTransform: 'uppercase' },
  cRow: { display: 'grid', gridTemplateColumns: 'auto auto auto', gap: 6, alignItems: 'center',
          marginBottom: 6 },
  cBad: { color: 'var(--lm-danger-ink)', background: 'var(--lm-danger-soft)',
          padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--lm-font-mono)',
          fontSize: 11, textDecoration: 'line-through' },
  cGood: { color: 'var(--lm-success-ink)', background: 'var(--lm-success-soft)',
           padding: '2px 6px', borderRadius: 4, fontFamily: 'var(--lm-font-mono)',
           fontSize: 11 },
  cNote: { gridColumn: '1 / -1', fontSize: 12, color: 'var(--lm-fg-muted)',
           marginTop: 2 },
  listening: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12,
               padding: 16, background: 'var(--lm-bg-muted)', borderRadius: 12 },
  wave: { display: 'flex', alignItems: 'center', gap: 3, height: 32 },
  waveBar: { width: 3, background: 'var(--lm-primary)', borderRadius: 2 },
  micDock: { display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0' },
  micBtn: { width: 80, height: 80, borderRadius: '50%', border: 'none', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--lm-shadow-soft)', transition: 'transform 90ms' },
  iconBtn: { width: 44, height: 44, borderRadius: '50%',
             background: 'var(--lm-bg-elev-1)', border: '1px solid var(--lm-border)',
             cursor: 'pointer', color: 'var(--lm-fg-muted)',
             display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
};

Object.assign(window, { Speak });
