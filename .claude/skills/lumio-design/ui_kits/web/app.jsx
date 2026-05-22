// Lumio UI Kit — top-level <App>
const { useEffect } = React;

function App() {
  const [active, setActive] = useState('dashboard');
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const titles = {
    dashboard: { title: 'Tổng quan',        breadcrumb: 'HOME' },
    read:      { title: 'Đọc & học từ',     breadcrumb: 'CONTENT' },
    speak:     { title: 'Luyện nói với AI', breadcrumb: 'PRACTICE' },
    vocab:     { title: 'Sổ từ của bạn',    breadcrumb: 'VOCABULARY' },
    write:     { title: 'Luyện viết',       breadcrumb: 'WRITING' },
  };

  const screen = (() => {
    switch (active) {
      case 'dashboard': return <Dashboard go={setActive} />;
      case 'read':      return <Reader />;
      case 'speak':     return <Speak />;
      case 'vocab':     return <Vocab />;
      case 'write':     return <Write />;
      default: return null;
    }
  })();

  const meta = titles[active];

  return (
    <AppShell
      active={active}
      onNav={setActive}
      title={meta.title}
      breadcrumb={meta.breadcrumb}
      theme={theme}
      onTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
      {screen}
    </AppShell>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
