// Lumio UI Kit — Reader screen (paste link, click words, save to deck)

function Reader() {
  const [popup, setPopup] = useState(null); // { word, x, y }

  // Sample transcript paragraph with above-level words pre-marked
  const HL = ['scrutinized', 'pragmatic', 'conceded', 'ambiguous', 'undermine'];
  const para1 = "Many people assume that all study time is equally productive, but recent research has scrutinized this view and reached a more pragmatic conclusion. In a 2024 trial, students who studied with content they personally enjoyed retained 38% more vocabulary than those following a fixed syllabus.";
  const para2 = "The researchers conceded that motivation alone cannot replace structure — but they argued that overly rigid programs can undermine engagement, leaving learners disengaged and ambiguous about their own goals.";

  function renderText(text) {
    const words = text.split(/(\s+)/);
    return words.map((w, i) => {
      const clean = w.replace(/[^a-z]/gi, '').toLowerCase();
      const isHL = HL.includes(clean);
      const isClickable = /[a-z]/i.test(w);
      if (!isClickable) return w;
      return (
        <span key={i}
          onClick={(e) => setPopup({ word: clean, rect: e.currentTarget.getBoundingClientRect() })}
          style={isHL ? readerStyles.highlight : readerStyles.clickable}>
          {w}
        </span>
      );
    });
  }

  return (
    <div style={readerStyles.wrap}>
      {/* URL bar */}
      <Card padding={14} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon name="link" size={18} style={{ color: 'var(--lm-fg-muted)' }} />
        <input style={readerStyles.urlInput} defaultValue="https://www.ted.com/talks/why-do-we-get-bored" />
        <Button variant="primary" size="sm" icon="sparkle">Trích xuất</Button>
      </Card>

      {/* Video + transcript layout */}
      <div style={readerStyles.grid}>
        <div style={readerStyles.player}>
          <div style={readerStyles.playerSurface}>
            <div style={readerStyles.playOverlay}>
              <button style={readerStyles.playBtn}><Icon name="play" size={28} fill="currentColor" /></button>
            </div>
            <div style={readerStyles.playerMeta}>
              <Chip color="info" style={{ background: 'rgba(255,255,255,.15)', color: '#FBF9F5' }}>TED-Ed</Chip>
              <span style={{ color: '#FBF9F5', fontSize: 14, fontWeight: 600 }}>Why do we get bored?</span>
            </div>
            <div style={readerStyles.timeline}>
              <div style={readerStyles.timelineProgress} />
            </div>
            <div style={readerStyles.playerControls}>
              <Icon name="play" size={16} style={{ color: '#FBF9F5' }} />
              <span style={{ color: '#FBF9F5', fontFamily: 'var(--lm-font-mono)', fontSize: 12 }}>1:23 / 5:42</span>
              <div style={{ flex: 1 }} />
              <Icon name="volume" size={16} style={{ color: '#FBF9F5' }} />
            </div>
          </div>

          {/* Stats below player */}
          <div style={readerStyles.statsRow}>
            <ReaderStat label="TỪ TRÊN MỨC CỦA BẠN" value="14" />
            <ReaderStat label="ĐÃ LƯU" value="3" />
            <ReaderStat label="ĐỘ DÀI" value="5:42" mono />
          </div>

          <Button variant="secondary" icon="sparkle" style={{ width: '100%' }}>
            Tạo quiz từ bài này
          </Button>
        </div>

        {/* Transcript */}
        <Card padding={24} style={{ overflowY: 'auto', maxHeight: 560 }}>
          <div style={readerStyles.transcriptHead}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Transcript</h3>
            <Chip mono>CEFR B1 · auto</Chip>
          </div>
          <div style={readerStyles.transcript}>
            <div style={readerStyles.segActive}>
              <span style={readerStyles.segTime}>0:00</span>
              <p style={readerStyles.segText}>{renderText(para1)}</p>
            </div>
            <div style={readerStyles.seg}>
              <span style={readerStyles.segTime}>0:24</span>
              <p style={readerStyles.segText}>{renderText(para2)}</p>
            </div>
          </div>
        </Card>
      </div>

      {popup && <WordPopup word={popup.word} rect={popup.rect} onClose={() => setPopup(null)} />}
    </div>
  );
}

function ReaderStat({ label, value, mono }) {
  return (
    <Card padding={14} style={{ flex: 1 }}>
      <div style={{ fontSize: 10, letterSpacing: '0.08em', fontWeight: 700,
                    color: 'var(--lm-fg-subtle)' }}>{label}</div>
      <div style={{ fontFamily: mono ? 'var(--lm-font-mono)' : 'var(--lm-font-sans)',
                    fontWeight: 600, fontSize: 22, color: 'var(--lm-fg)', marginTop: 4 }}>{value}</div>
    </Card>
  );
}

function WordPopup({ word, rect, onClose }) {
  const data = {
    scrutinized: { lemma: 'scrutinize', pos: 'v.', ipa: '/ˈskruːtɪnaɪz/',
                   def: 'to examine something carefully and in great detail.',
                   vi: 'xem xét, kiểm tra kỹ lưỡng.',
                   ex: 'The committee scrutinized the report before voting.' },
    pragmatic: { lemma: 'pragmatic', pos: 'adj.', ipa: '/præɡˈmætɪk/',
                   def: 'dealing with things sensibly and realistically.',
                   vi: 'thực dụng, thiết thực.',
                   ex: 'We need a pragmatic approach to this problem.' },
    conceded: { lemma: 'concede', pos: 'v.', ipa: '/kənˈsiːd/',
                   def: 'to admit something is true after first denying or doubting it.',
                   vi: 'thừa nhận, nhượng bộ.',
                   ex: 'She finally conceded that I was right.' },
    ambiguous: { lemma: 'ambiguous', pos: 'adj.', ipa: '/æmˈbɪɡjuəs/',
                   def: 'having more than one possible meaning.',
                   vi: 'mơ hồ, đa nghĩa.',
                   ex: 'His answer was deliberately ambiguous.' },
    undermine: { lemma: 'undermine', pos: 'v.', ipa: '/ˌʌndərˈmaɪn/',
                   def: 'to weaken or damage something, especially gradually.',
                   vi: 'làm suy yếu dần dần.',
                   ex: 'Constant criticism can undermine confidence.' },
  }[word] || {
    lemma: word, pos: '–', ipa: '–',
    def: 'Definition not loaded in demo.', vi: '–',
    ex: '–',
  };

  // position near the clicked word, but clamped within viewport
  const top = Math.min(rect.bottom + 8 + window.scrollY, window.innerHeight - 360);
  const left = Math.max(16, Math.min(rect.left + window.scrollX, window.innerWidth - 360));
  const [saved, setSaved] = useState(false);

  return (
    <>
      <div style={readerStyles.popupBackdrop} onClick={onClose} />
      <div style={{ ...readerStyles.popup, top, left }}>
        <div style={readerStyles.popupHead}>
          <span style={readerStyles.lemma}>{data.lemma}</span>
          <Chip mono>{data.pos.toUpperCase()}</Chip>
          <span style={readerStyles.ipa}>{data.ipa}</span>
          <button style={readerStyles.iconBtnGhost}><Icon name="volume" size={14} /></button>
          <button style={readerStyles.iconBtnGhost} onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
        <div style={{ padding: '6px 18px 14px' }}>
          <div style={readerStyles.def}>{data.def}</div>
          <div style={readerStyles.vi}>{data.vi}</div>
          <div style={readerStyles.ex}>“{data.ex}”</div>
        </div>
        <div style={readerStyles.popupActions}>
          <Button variant={saved ? 'secondary' : 'primary'} size="sm"
                  icon={saved ? 'check' : 'bookmark'} onClick={() => setSaved(true)}>
            {saved ? 'Đã lưu vào sổ từ' : 'Lưu vào sổ từ'}
          </Button>
          <Button variant="ghost" size="sm">Thêm ví dụ</Button>
        </div>
      </div>
    </>
  );
}

const readerStyles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1080, margin: '0 auto' },
  urlInput: { flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontFamily: 'var(--lm-font-sans)', fontSize: 14, color: 'var(--lm-fg)' },
  grid: { display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 },
  player: { display: 'flex', flexDirection: 'column', gap: 12 },
  playerSurface: { position: 'relative', background: '#0E1A2B',
                   borderRadius: 'var(--lm-radius-lg)', overflow: 'hidden',
                   aspectRatio: '16 / 9', display: 'flex', flexDirection: 'column' },
  playOverlay: { position: 'absolute', inset: 0, display: 'flex',
                 alignItems: 'center', justifyContent: 'center' },
  playBtn: { width: 64, height: 64, borderRadius: '50%',
             background: 'rgba(255,255,255,.18)', border: '1px solid rgba(255,255,255,.3)',
             color: '#FBF9F5', cursor: 'pointer', display: 'inline-flex',
             alignItems: 'center', justifyContent: 'center',
             backdropFilter: 'blur(8px)' },
  playerMeta: { display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px', zIndex: 1 },
  timeline: { height: 3, background: 'rgba(255,255,255,.15)', position: 'relative', margin: '0 16px' },
  timelineProgress: { width: '24%', height: '100%', background: 'var(--lm-primary)' },
  playerControls: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px 14px' },
  statsRow: { display: 'flex', gap: 10 },
  transcriptHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid var(--lm-border)' },
  transcript: { display: 'flex', flexDirection: 'column', gap: 12 },
  seg: { display: 'grid', gridTemplateColumns: '44px 1fr', gap: 12,
         padding: 10, borderRadius: 10, cursor: 'pointer' },
  segActive: { display: 'grid', gridTemplateColumns: '44px 1fr', gap: 12,
               padding: 10, borderRadius: 10, background: 'var(--lm-primary-soft)' },
  segTime: { fontFamily: 'var(--lm-font-mono)', fontSize: 11, color: 'var(--lm-fg-muted)',
             paddingTop: 4 },
  segText: { margin: 0, fontFamily: 'var(--lm-font-serif)', fontSize: 16,
             lineHeight: 1.72, color: 'var(--lm-fg)' },
  clickable: { cursor: 'pointer', transition: 'background var(--lm-dur-fast) var(--lm-ease)',
               borderRadius: 2 },
  highlight: { cursor: 'pointer', background: 'rgba(232,163,61,0.12)',
               borderBottom: '2px dotted var(--lm-primary)', padding: '0 1px' },

  popupBackdrop: { position: 'fixed', inset: 0, zIndex: 100 },
  popup: { position: 'absolute', width: 340, zIndex: 101,
           background: 'color-mix(in srgb, var(--lm-bg-elev-1) 92%, transparent)',
           backdropFilter: 'blur(20px)',
           WebkitBackdropFilter: 'blur(20px)',
           border: '1px solid var(--lm-border)', borderRadius: 16,
           boxShadow: 'var(--lm-shadow-pop)', overflow: 'hidden' },
  popupHead: { display: 'flex', alignItems: 'center', gap: 8, padding: '14px 18px 6px' },
  lemma: { fontSize: 22, fontWeight: 700, color: 'var(--lm-fg)', letterSpacing: '-0.01em' },
  ipa: { marginLeft: 'auto', fontFamily: 'var(--lm-font-mono)', fontSize: 12,
         color: 'var(--lm-fg-muted)' },
  iconBtnGhost: { background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'var(--lm-fg-muted)', padding: 4, display: 'inline-flex' },
  def: { fontSize: 14, color: 'var(--lm-fg)', lineHeight: 1.5 },
  vi: { fontSize: 13, color: 'var(--lm-fg-muted)', marginTop: 4, lineHeight: 1.5 },
  ex: { fontFamily: 'var(--lm-font-serif)', fontStyle: 'italic',
        color: 'var(--lm-fg-muted)', fontSize: 13, padding: '10px 12px',
        background: 'var(--lm-bg-muted)', borderRadius: 8, marginTop: 10 },
  popupActions: { display: 'flex', gap: 8, padding: '10px 12px',
                  borderTop: '1px solid var(--lm-border)' },
};

Object.assign(window, { Reader });
