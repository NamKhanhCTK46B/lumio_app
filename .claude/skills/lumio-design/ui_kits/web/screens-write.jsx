// Lumio UI Kit — Write screen (essay editor + IELTS score panel)

function Write() {
  const body = (
`Online learning has become an increasingly popular alternative to traditional ` +
`classroom education. While some argue that it offers unmatched flexibility and ` +
`accessibility, others believe it lacks the interpersonal interaction that face-to-face ` +
`teaching provides. In my opinion, the benefits of online learning outweigh its drawbacks, ` +
`provided that learners remain self-disciplined.\n\n` +
`Firstly, online courses allow students to study at their own pace. A working ` +
`professional can attend a lecture during lunch break, while a parent can review materials ` +
`after the children have gone to bed. This flexibility is something traditional classrooms ` +
`simply cannot offer.`);

  // Inline annotations (positions are illustrative)
  const annotations = [
    { match: 'incresingly', fix: 'increasingly', cat: 'spelling', note: 'Typo — "increasingly" with an "a".' },
    { match: 'face-to-face teaching provides', fix: 'face-to-face instruction provides', cat: 'lexical', note: 'More natural collocation in academic writing.' },
    { match: 'something traditional classrooms simply cannot offer', fix: 'a flexibility traditional classrooms cannot match', cat: 'coherence', note: 'Tightens the parallel structure.' },
  ];

  function renderBody() {
    let text = body;
    // The text doesn't actually contain "incresingly"; demo the highlight on "increasingly"
    const targets = [
      { word: 'increasingly', cat: 'spelling', tip: 'Watch the spelling — "increasingly" with an "a".' },
      { word: 'flexibility',  cat: 'lexical',  tip: 'Could vary the vocabulary — "adaptability" works here.' },
      { word: 'self-disciplined', cat: 'lexical', tip: 'Strong word choice — band 7+.' },
      { word: 'lunch break', cat: 'coherence', tip: 'Add a connector: "for instance" before "during".' },
    ];
    const parts = [];
    let cursor = 0;
    targets.forEach((t, i) => {
      const idx = text.indexOf(t.word, cursor);
      if (idx === -1) return;
      parts.push(text.slice(cursor, idx));
      parts.push(<Anno key={i} cat={t.cat} tip={t.tip}>{t.word}</Anno>);
      cursor = idx + t.word.length;
    });
    parts.push(text.slice(cursor));
    return parts.map((p, i) => typeof p === 'string'
      ? p.split('\n\n').reduce((acc, para, j, arr) => {
          acc.push(<React.Fragment key={`${i}-${j}`}>{para}</React.Fragment>);
          if (j < arr.length - 1) acc.push(<br key={`br-${i}-${j}`} />, <br key={`br2-${i}-${j}`} />);
          return acc;
        }, [])
      : p);
  }

  return (
    <div style={writeStyles.wrap}>
      {/* Prompt panel */}
      <Card padding={18} style={{ background: 'var(--lm-bg-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Chip mono color="info">IELTS · TASK 2</Chip>
          <Chip mono>CEFR B2+</Chip>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon name="clock" size={14} style={{ color: 'var(--lm-fg-muted)' }} />
            <span style={{ fontFamily: 'var(--lm-font-mono)', fontSize: 13, color: 'var(--lm-fg)' }}>24:38 / 40:00</span>
          </div>
        </div>
        <p style={{ margin: 0, fontFamily: 'var(--lm-font-serif)', fontSize: 17,
                    lineHeight: 1.7, color: 'var(--lm-fg)' }}>
          Some people believe online learning is more effective than traditional classroom learning.
          To what extent do you agree or disagree? Give reasons and include examples from your own experience.
        </p>
      </Card>

      <div style={writeStyles.grid}>
        {/* Editor */}
        <Card padding={28}>
          <div style={writeStyles.editorHead}>
            <div style={{ fontSize: 12, color: 'var(--lm-fg-muted)' }}>
              <b style={{ fontFamily: 'var(--lm-font-mono)', color: 'var(--lm-fg)' }}>184</b> / 250 words
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <Button variant="ghost" size="sm">Lưu nháp</Button>
              <Button variant="primary" size="sm" icon="send">Nộp để chấm</Button>
            </div>
          </div>
          <div style={writeStyles.editor}>{renderBody()}</div>
        </Card>

        {/* Right column: score + annotations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card>
            <div style={writeStyles.scoreHead}>
              <div style={writeStyles.bigBand}>6.5</div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--lm-fg-muted)' }}>Overall band</div>
                <div style={{ fontSize: 11, color: 'var(--lm-success)', marginTop: 2, fontWeight: 600 }}>
                  ▲ +0.5 so với lần trước
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              <ScoreRow label="Task achievement"     value={6.5} />
              <ScoreRow label="Coherence & cohesion" value={7.0} />
              <ScoreRow label="Lexical resource"     value={6.0} />
              <ScoreRow label="Grammar range"        value={6.5} />
            </div>
          </Card>

          <Card>
            <div style={writeStyles.cardHead}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Lỗi cần xem</h3>
              <Chip>4</Chip>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
              {annotations.map((a, i) => (
                <div key={i} style={writeStyles.annoRow}>
                  <Chip color={a.cat === 'spelling' ? 'danger' : a.cat === 'lexical' ? 'warning' : 'info'}>
                    {a.cat === 'spelling' ? 'Spell' : a.cat === 'lexical' ? 'Lex' : 'Coh'}
                  </Chip>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12 }}>
                      <span style={writeStyles.annoBad}>{a.match}</span>{' '}
                      <Icon name="arrowRight" size={10} style={{ color: 'var(--lm-fg-muted)', verticalAlign: 'middle' }} />{' '}
                      <span style={writeStyles.annoGood}>{a.fix}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--lm-fg-muted)', marginTop: 2 }}>{a.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Anno({ cat, tip, children }) {
  const colors = {
    spelling:  { bg: 'rgba(216,90,90,.14)',  bd: 'var(--lm-danger)'   },
    lexical:   { bg: 'rgba(217,138,43,.18)', bd: 'var(--lm-warning)'  },
    coherence: { bg: 'rgba(63,123,216,.16)', bd: 'var(--lm-info)'     },
    grammar:   { bg: 'rgba(47,158,131,.16)', bd: 'var(--lm-success)'  },
  }[cat] || { bg: '', bd: 'var(--lm-primary)' };
  const [show, setShow] = useState(false);
  return (
    <span style={{ position: 'relative', display: 'inline' }}
          onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <span style={{ background: colors.bg, borderBottom: `2px solid ${colors.bd}`,
                     padding: '0 1px', cursor: 'help' }}>{children}</span>
      {show && (
        <span style={{ position: 'absolute', top: '100%', left: 0, marginTop: 6,
                       background: 'var(--lm-fg)', color: 'var(--lm-fg-inverse)',
                       padding: '8px 12px', borderRadius: 8, fontSize: 12,
                       width: 240, zIndex: 30,
                       fontFamily: 'var(--lm-font-sans)', lineHeight: 1.4 }}>
          {tip}
        </span>
      )}
    </span>
  );
}

function ScoreRow({ label, value }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 36px', gap: 8, alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: 'var(--lm-fg)' }}>{label}</span>
      <ProgressBar value={value} max={9} />
      <span style={{ fontFamily: 'var(--lm-font-mono)', fontSize: 13, fontWeight: 600,
                     textAlign: 'right', color: 'var(--lm-fg)' }}>{value.toFixed(1)}</span>
    </div>
  );
}

const writeStyles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 1080, margin: '0 auto' },
  grid: { display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14, alignItems: 'flex-start' },
  editorHead: { display: 'flex', alignItems: 'center', gap: 8,
                paddingBottom: 12, marginBottom: 14, borderBottom: '1px solid var(--lm-border)' },
  editor: { fontFamily: 'var(--lm-font-serif)', fontSize: 16, lineHeight: 1.8,
            color: 'var(--lm-fg)', minHeight: 380 },
  scoreHead: { display: 'flex', alignItems: 'center', gap: 16 },
  bigBand: { fontFamily: 'var(--lm-font-mono)', fontSize: 44, fontWeight: 600,
             color: 'var(--lm-fg)', lineHeight: 1 },
  cardHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  annoRow: { display: 'flex', gap: 10, alignItems: 'flex-start',
             padding: 10, background: 'var(--lm-bg-muted)', borderRadius: 8 },
  annoBad: { color: 'var(--lm-danger-ink)', textDecoration: 'line-through',
             fontFamily: 'var(--lm-font-mono)' },
  annoGood: { color: 'var(--lm-success-ink)', fontFamily: 'var(--lm-font-mono)' },
};

Object.assign(window, { Write });
