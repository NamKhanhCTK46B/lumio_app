// Lumio UI Kit — Dashboard + Vocab screens

function Dashboard({ go }) {
  return (
    <div style={dashStyles.wrap}>
      {/* Greeting row */}
      <div style={dashStyles.greeting}>
        <div>
          <div style={dashStyles.eyebrow}>THỨ TƯ, 13 THÁNG 5</div>
          <h2 style={dashStyles.hello}>Chào Hoa <span style={{ color: 'var(--lm-primary)' }}>·</span> sẵn sàng học chưa?</h2>
          <p style={dashStyles.sub}>Hôm nay có <b>8 từ cần ôn</b> và một bài viết IELTS đang chờ phản hồi.</p>
        </div>
        <Button variant="primary" size="lg" icon="play" onClick={() => go('vocab')}>
          Bắt đầu ôn từ
        </Button>
      </div>

      {/* Stat cards */}
      <div style={dashStyles.statGrid}>
        <Card padding={18}>
          <div style={dashStyles.statHead}><Icon name="flame" size={14} /> CHUỖI HỌC</div>
          <div style={dashStyles.statValue}>14 <span style={dashStyles.statUnit}>ngày</span></div>
          <div style={dashStyles.statFoot}>Mục tiêu hằng ngày: 15 phút</div>
        </Card>
        <Card padding={18}>
          <div style={dashStyles.statHead}><Icon name="layers" size={14} /> TỪ ĐÃ THUỘC</div>
          <div style={dashStyles.statValue}>142 <span style={dashStyles.statUnit}>/ 218</span></div>
          <ProgressBar value={142} max={218} />
        </Card>
        <Card padding={18}>
          <div style={dashStyles.statHead}><Icon name="clock" size={14} /> TUẦN NÀY</div>
          <div style={dashStyles.statValue}>1h 24m</div>
          <div style={dashStyles.miniChart}>
            {[40, 65, 50, 80, 45, 90, 30].map((h, i) => (
              <span key={i} style={{
                ...dashStyles.bar,
                height: h + '%',
                background: i === 6 ? 'var(--lm-primary)' : 'var(--lm-bg-active)',
              }} />
            ))}
          </div>
        </Card>
        <Card padding={18}>
          <div style={dashStyles.statHead}><Icon name="trending" size={14} /> BAND HIỆN TẠI</div>
          <div style={dashStyles.statValue}>6.5</div>
          <div style={{ ...dashStyles.statFoot, color: 'var(--lm-success)' }}>▲ 0.5 so với tháng trước</div>
        </Card>
      </div>

      {/* Two-col: today + suggestions */}
      <div style={dashStyles.twoCol}>
        <Card>
          <div style={dashStyles.cardHead}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Hôm nay</h3>
            <button style={dashStyles.linkBtn}>Xem tất cả <Icon name="chevronRight" size={14} /></button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            <ActivityRow icon="layers" title="Ôn 8 từ vựng đến hạn" sub="Travel English · Business meetings" cta="Bắt đầu" onClick={() => go('vocab')} />
            <ActivityRow icon="edit"   title="Phản hồi cho essay 'Online learning'" sub="Đã chấm · band 6.5" cta="Xem" onClick={() => go('write')} />
            <ActivityRow icon="mic"    title="Tiếp tục roleplay với Sophie" sub="Ordering coffee · turn 4/8" cta="Tiếp tục" onClick={() => go('speak')} />
          </div>
        </Card>
        <Card>
          <div style={dashStyles.cardHead}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Gợi ý cho bạn</h3>
            <Chip color="info">CEFR B1</Chip>
          </div>
          <p style={{ fontSize: 13, color: 'var(--lm-fg-muted)', margin: '8px 0 14px', lineHeight: 1.55 }}>
            AI gợi ý dựa trên các từ bạn đang học và mục tiêu IELTS 7.0.
          </p>
          <SuggestionRow type="youtube" title="TED-Ed · Why do we get bored?" meta="5:42 · 32 từ B1+" />
          <SuggestionRow type="article" title="The Guardian · Climate's quiet shift" meta="6 min read · 24 từ B2+" />
          <SuggestionRow type="podcast" title="BBC 6 Minute English" meta="6:30 · 18 từ B1+" />
        </Card>
      </div>
    </div>
  );
}

function ActivityRow({ icon, title, sub, cta, onClick }) {
  return (
    <div style={dashStyles.activity}>
      <span style={dashStyles.activityIco}><Icon name={icon} size={16} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--lm-fg)' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--lm-fg-muted)', marginTop: 1 }}>{sub}</div>
      </div>
      <Button variant="ghost" size="sm" onClick={onClick}>{cta} <Icon name="chevronRight" size={12} /></Button>
    </div>
  );
}

function SuggestionRow({ type, title, meta }) {
  const palette = { youtube: 'linear-gradient(135deg,#D85A5A,#B53C3C)',
                    article: 'linear-gradient(135deg,#3F7BD8,#2056A8)',
                    podcast: 'linear-gradient(135deg,#7B3DA0,#552876)' };
  const ico = { youtube: 'play', article: 'book', podcast: 'volume' };
  return (
    <div style={dashStyles.suggest}>
      <span style={{ ...dashStyles.suggestThumb, background: palette[type] }}>
        <Icon name={ico[type]} size={16} style={{ color: '#fff' }} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--lm-fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--lm-fg-muted)', marginTop: 1 }}>{meta}</div>
      </div>
      <Icon name="plus" size={16} style={{ color: 'var(--lm-fg-muted)' }} />
    </div>
  );
}

// ── Vocab screen ────────────────────────────────────────────────────────
function Vocab() {
  const [view, setView] = useState('list'); // list | review
  if (view === 'review') return <VocabReview onClose={() => setView('list')} />;

  const decks = [
    { name: 'Travel English',     level: 'A2', total: 32, mastered: 21, due: 4,  color: 'linear-gradient(135deg,#5FB283,#3D8E64)' },
    { name: 'Business meetings',  level: 'B2', total: 48, mastered: 14, due: 5,  color: 'linear-gradient(135deg,#D98A2B,#A6651A)' },
    { name: 'TED-Ed videos',      level: 'B1', total: 76, mastered: 52, due: 3,  color: 'linear-gradient(135deg,#E8A33D,#B97A20)' },
    { name: 'IELTS academic',     level: 'C1', total: 62, mastered: 18, due: 0,  color: 'linear-gradient(135deg,#BD5B85,#86406A)' },
  ];

  return (
    <div style={dashStyles.wrap}>
      <Card style={{ background: 'var(--lm-primary-soft)', borderColor: 'transparent' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={vocabStyles.dueBig}>8</span>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: 18, color: 'var(--lm-primary-ink)' }}>Từ cần ôn hôm nay</h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--lm-primary-ink)', opacity: 0.85 }}>
              Chỉ tốn ~3 phút để giữ chuỗi 14 ngày.
            </p>
          </div>
          <Button variant="primary" size="lg" icon="play" onClick={() => setView('review')}>Ôn ngay</Button>
        </div>
      </Card>

      <div style={vocabStyles.deckHead}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Sổ từ của bạn</h3>
        <Button variant="secondary" size="sm" icon="plus">Tạo sổ mới</Button>
      </div>

      <div style={vocabStyles.deckGrid}>
        {decks.map(d => (
          <Card key={d.name} padding={18}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ ...vocabStyles.cover, background: d.color }}>{d.name[0]}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--lm-fg)' }}>{d.name}</div>
                <div style={{ fontSize: 12, color: 'var(--lm-fg-muted)', marginTop: 2 }}>{d.total} từ</div>
              </div>
              <Chip color={d.level} mono>{d.level}</Chip>
            </div>
            <ProgressBar value={d.mastered} max={d.total} />
            <div style={vocabStyles.deckMeta}>
              <span><b style={{ color: 'var(--lm-fg)' }}>{d.mastered}</b> đã thuộc</span>
              <span style={{ color: d.due ? 'var(--lm-primary-press)' : 'var(--lm-fg-muted)' }}>
                <b>{d.due}</b> đến hạn
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function VocabReview({ onClose }) {
  const cards = [
    { lemma: 'scrutinize',  pos: 'v.',  ipa: '/ˈskruːtɪnaɪz/', def: 'to examine carefully and in detail',  vi: 'xem xét kỹ lưỡng' },
    { lemma: 'pragmatic',   pos: 'adj.', ipa: '/præɡˈmætɪk/',  def: 'dealing with things sensibly',         vi: 'thực dụng, thiết thực' },
    { lemma: 'concede',     pos: 'v.',  ipa: '/kənˈsiːd/',    def: 'to admit something is true',           vi: 'thừa nhận, nhượng bộ' },
  ];
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const card = cards[i];
  const next = () => { if (i < cards.length - 1) { setI(i + 1); setShown(false); } else onClose(); };

  return (
    <div style={vocabStyles.reviewWrap}>
      <div style={vocabStyles.reviewTop}>
        <button style={dashStyles.linkBtn} onClick={onClose}><Icon name="x" size={14} /> Thoát</button>
        <div style={{ fontFamily: 'var(--lm-font-mono)', fontSize: 12, color: 'var(--lm-fg-muted)' }}>
          {i + 1} / {cards.length}
        </div>
        <div style={{ width: 80 }} />
      </div>
      <Card padding={32} style={{ width: 520, maxWidth: '100%', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <Chip mono>{card.pos.toUpperCase()}</Chip>
        </div>
        <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--lm-fg)' }}>
          {card.lemma}
        </div>
        <div style={{ fontFamily: 'var(--lm-font-mono)', fontSize: 15, color: 'var(--lm-fg-muted)', marginTop: 6 }}>
          {card.ipa}
          <button style={{ background: 'transparent', border: 'none', color: 'var(--lm-primary-press)',
                          cursor: 'pointer', marginLeft: 8 }}>
            <Icon name="volume" size={16} />
          </button>
        </div>
        {shown ? (
          <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--lm-border)' }}>
            <div style={{ fontSize: 16, color: 'var(--lm-fg)' }}>{card.def}</div>
            <div style={{ fontSize: 14, color: 'var(--lm-fg-muted)', marginTop: 4 }}>{card.vi}</div>
          </div>
        ) : (
          <button onClick={() => setShown(true)} style={{
            marginTop: 28, padding: '12px 22px', borderRadius: 12,
            background: 'transparent', border: '1px dashed var(--lm-border-strong)',
            color: 'var(--lm-fg-muted)', fontFamily: 'var(--lm-font-sans)',
            fontSize: 13, cursor: 'pointer', width: '100%',
          }}>Hiện nghĩa</button>
        )}
      </Card>

      {shown && (
        <div style={vocabStyles.grades}>
          <GradeBtn variant="again" label="Lại" sub="< 1m" onClick={next} />
          <GradeBtn variant="hard"  label="Khó" sub="~ 1d" onClick={next} />
          <GradeBtn variant="good"  label="Tốt" sub="~ 3d" onClick={next} />
          <GradeBtn variant="easy"  label="Dễ"  sub="~ 7d" onClick={next} />
        </div>
      )}
    </div>
  );
}

function GradeBtn({ variant, label, sub, onClick }) {
  const styles = {
    again: { bg: 'var(--lm-danger-soft)',  fg: 'var(--lm-danger-ink)',  bd: 'var(--lm-danger-soft)' },
    hard:  { bg: '#FBEAD0',                fg: 'var(--lm-warning-ink)', bd: '#F5E2B8' },
    good:  { bg: 'var(--lm-bg-elev-1)',    fg: 'var(--lm-fg)',          bd: 'var(--lm-border)' },
    easy:  { bg: 'var(--lm-success-soft)', fg: 'var(--lm-success-ink)', bd: 'var(--lm-success-soft)' },
  }[variant];
  return (
    <button onClick={onClick} style={{
      flex: 1, padding: '14px 12px', borderRadius: 12,
      background: styles.bg, color: styles.fg, border: `1px solid ${styles.bd}`,
      fontFamily: 'var(--lm-font-sans)', cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    }}>
      <strong style={{ fontSize: 14, fontWeight: 600 }}>{label}</strong>
      <span style={{ fontFamily: 'var(--lm-font-mono)', fontSize: 11, opacity: 0.75 }}>{sub}</span>
    </button>
  );
}

const dashStyles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1080, margin: '0 auto' },
  greeting: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, padding: '8px 4px' },
  eyebrow: { fontSize: 11, letterSpacing: '0.1em', color: 'var(--lm-fg-subtle)', fontWeight: 700, marginBottom: 6 },
  hello: { margin: 0, fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' },
  sub: { margin: '6px 0 0', fontSize: 14, color: 'var(--lm-fg-muted)' },
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 },
  statHead: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 10,
              letterSpacing: '0.1em', fontWeight: 700, color: 'var(--lm-fg-subtle)', marginBottom: 10 },
  statValue: { fontFamily: 'var(--lm-font-mono)', fontWeight: 600, fontSize: 28,
               color: 'var(--lm-fg)', lineHeight: 1 },
  statUnit: { fontSize: 13, color: 'var(--lm-fg-muted)', fontWeight: 400 },
  statFoot: { fontSize: 11, color: 'var(--lm-fg-muted)', marginTop: 8 },
  miniChart: { display: 'flex', alignItems: 'flex-end', gap: 4, height: 28, marginTop: 8 },
  bar: { flex: 1, borderRadius: 2, minHeight: 4 },
  twoCol: { display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14 },
  cardHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  linkBtn: { background: 'transparent', border: 'none', cursor: 'pointer',
             display: 'inline-flex', alignItems: 'center', gap: 4,
             fontSize: 12, color: 'var(--lm-fg-muted)', fontFamily: 'var(--lm-font-sans)' },
  activity: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
              borderRadius: 10, background: 'var(--lm-bg-muted)' },
  activityIco: { width: 32, height: 32, borderRadius: 8, display: 'inline-flex',
                 alignItems: 'center', justifyContent: 'center',
                 background: 'var(--lm-bg-elev-1)', color: 'var(--lm-primary-press)',
                 border: '1px solid var(--lm-border)' },
  suggest: { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0',
             borderTop: '1px solid var(--lm-border)' },
  suggestThumb: { width: 36, height: 36, borderRadius: 8, display: 'inline-flex',
                  alignItems: 'center', justifyContent: 'center', flex: 'none' },
};

const vocabStyles = {
  dueBig: { fontFamily: 'var(--lm-font-mono)', fontWeight: 600, fontSize: 56,
            color: 'var(--lm-primary-press)', lineHeight: 1 },
  deckHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px' },
  deckGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 },
  cover: { width: 40, height: 40, borderRadius: 10, display: 'inline-flex',
           alignItems: 'center', justifyContent: 'center',
           color: '#1A1308', fontWeight: 700, fontSize: 18 },
  deckMeta: { display: 'flex', justifyContent: 'space-between', fontSize: 12,
              color: 'var(--lm-fg-muted)', marginTop: 10 },
  reviewWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
                paddingTop: 40, maxWidth: 720, margin: '0 auto' },
  reviewTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between',
               width: 520, maxWidth: '100%' },
  grades: { display: 'flex', gap: 10, width: 520, maxWidth: '100%' },
};

Object.assign(window, { Dashboard, Vocab });
