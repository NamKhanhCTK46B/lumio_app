// Lumio UI Kit — App shell: Sidebar + Topbar
const { useState } = React;

function Sidebar({ active, onNav }) {
  const items = [
    { id: 'dashboard', label: 'Tổng quan',     en: 'Dashboard',    icon: 'home' },
    { id: 'read',      label: 'Đọc & học từ',  en: 'Read & learn', icon: 'book' },
    { id: 'speak',     label: 'Luyện nói',     en: 'Speak',        icon: 'mic' },
    { id: 'vocab',     label: 'Sổ từ',         en: 'Vocab',        icon: 'layers' },
    { id: 'write',     label: 'Viết',          en: 'Write',        icon: 'edit' },
  ];
  return (
    <aside style={shellStyles.sidebar}>
      <div style={shellStyles.sidebarHead}><Logo size={28} /></div>
      <nav style={shellStyles.sidebarNav}>
        {items.map(it => {
          const isActive = active === it.id;
          return (
            <button key={it.id} onClick={() => onNav(it.id)}
              style={{
                ...shellStyles.navItem,
                background: isActive ? 'var(--lm-primary-soft)' : 'transparent',
                color: isActive ? 'var(--lm-primary-ink)' : 'var(--lm-fg)',
                fontWeight: isActive ? 600 : 500,
              }}>
              <Icon name={it.icon} size={18} />
              <span style={{ flex: 1, textAlign: 'left' }}>{it.label}</span>
              {it.id === 'vocab' && (
                <span style={shellStyles.badge}>8</span>
              )}
            </button>
          );
        })}
      </nav>
      <div style={shellStyles.sidebarFoot}>
        <div style={shellStyles.streak}>
          <Icon name="flame" size={18} style={{ color: 'var(--lm-primary)' }} />
          <div>
            <div style={{ fontFamily: 'var(--lm-font-mono)', fontWeight: 600, fontSize: 16, color: 'var(--lm-fg)' }}>14</div>
            <div style={{ fontSize: 11, color: 'var(--lm-fg-muted)' }}>ngày liên tiếp</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ title, theme, onTheme, breadcrumb }) {
  return (
    <header style={shellStyles.topbar}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {breadcrumb && (
          <div style={{ fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
                        color: 'var(--lm-fg-subtle)', fontWeight: 600 }}>{breadcrumb}</div>
        )}
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--lm-fg)', letterSpacing: '-0.01em' }}>
          {title}
        </h1>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
        <button style={shellStyles.iconBtn} onClick={onTheme} title="Toggle theme">
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
        </button>
        <button style={shellStyles.iconBtn}><Icon name="bell" size={18} /></button>
        <div style={{ width: 1, height: 24, background: 'var(--lm-border)', margin: '0 4px' }} />
        <Avatar name="Hoa" size={32} />
      </div>
    </header>
  );
}

function AppShell({ active, onNav, title, breadcrumb, theme, onTheme, children }) {
  return (
    <div style={shellStyles.app}>
      <Sidebar active={active} onNav={onNav} />
      <main style={shellStyles.main}>
        <Topbar title={title} breadcrumb={breadcrumb} theme={theme} onTheme={onTheme} />
        <div style={shellStyles.content}>{children}</div>
      </main>
    </div>
  );
}

const shellStyles = {
  app: { display: 'flex', height: '100vh', background: 'var(--lm-bg)', color: 'var(--lm-fg)',
         fontFamily: 'var(--lm-font-sans)' },
  sidebar: { width: 240, flex: 'none', background: 'var(--lm-bg)', borderRight: '1px solid var(--lm-border)',
             display: 'flex', flexDirection: 'column', padding: '20px 14px' },
  sidebarHead: { padding: '0 6px 18px', marginBottom: 8 },
  sidebarNav: { display: 'flex', flexDirection: 'column', gap: 2, flex: 1 },
  navItem: { display: 'flex', alignItems: 'center', gap: 12,
             padding: '10px 12px', borderRadius: 10,
             fontFamily: 'var(--lm-font-sans)', fontSize: 14, border: 'none', cursor: 'pointer',
             transition: 'background var(--lm-dur-base) var(--lm-ease)', textAlign: 'left' },
  badge: { background: 'var(--lm-primary)', color: 'var(--lm-fg-on-primary)',
           fontFamily: 'var(--lm-font-mono)', fontWeight: 600, fontSize: 10,
           padding: '2px 6px', borderRadius: 9999, minWidth: 18, textAlign: 'center' },
  sidebarFoot: { paddingTop: 12, borderTop: '1px solid var(--lm-border)' },
  streak: { display: 'flex', alignItems: 'center', gap: 10, padding: 10,
            background: 'var(--lm-bg-elev-1)', border: '1px solid var(--lm-border)',
            borderRadius: 'var(--lm-radius-md)' },
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topbar: { display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 28px', borderBottom: '1px solid var(--lm-border)', background: 'var(--lm-bg)',
            minHeight: 56, flex: 'none' },
  iconBtn: { background: 'transparent', border: '1px solid transparent', borderRadius: 10,
             padding: 8, cursor: 'pointer', color: 'var(--lm-fg-muted)',
             display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, overflow: 'auto', padding: '28px 28px 56px' },
};

Object.assign(window, { Sidebar, Topbar, AppShell });
