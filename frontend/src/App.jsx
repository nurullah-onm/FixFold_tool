import { useEffect, useMemo, useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGauge,
  faNetworkWired,
  faUserGroup,
  faServer,
  faBrain,
  faRightFromBracket,
  faMoon,
  faSun,
  faSignIn,
  faBook,
  faWrench,
  faGaugeHigh,
  faBars,
  faXmark
} from '@fortawesome/free-solid-svg-icons';
import './App.css';
import DashboardPage from './pages/DashboardPage';
import InboundsPage from './pages/InboundsPage';
import ClientsPage from './pages/ClientsPage';
import ServersPage from './pages/ServersPage';
import AiPage from './pages/AiPage';
import DocsPage from './pages/DocsPage';
import SettingsPage from './pages/SettingsPage';
import SpeedTestPage from './pages/SpeedTestPage';
import { login, setAuthToken } from './services/api';

const strings = {
  en: {
    brand: 'FixFold',
    sub: 'Xray Control',
    dashboard: 'Dashboard',
    inbounds: 'Inbounds',
    clients: 'Clients',
    servers: 'Servers',
    ai: 'AI Anomalies',
    docs: 'Docs',
    settings: 'Settings',
    speed: 'Speed Test',
    login: 'Login',
    logout: 'Logout',
    username: 'Username',
    password: 'Password',
    tokenSet: 'Token stored.',
    loginSuccess: 'Login successful.',
    loginFail: 'Login failed',
    themeLight: 'Light Mode',
    themeDark: 'Dark Mode'
  },
  tr: {
    brand: 'FixFold',
    sub: 'Xray Kontrol',
    dashboard: 'Kontrol Paneli',
    inbounds: 'Giri?ler',
    clients: 'Kullan?c?lar',
    servers: 'Sunucular',
    ai: 'AI Anomalileri',
    docs: 'Dok?mantasyon',
    settings: 'Ayarlar',
    speed: 'H?z Testi',
    login: 'Giri?',
    logout: '??k??',
    username: 'Kullan?c? Ad?',
    password: '?ifre',
    tokenSet: 'Token kaydedildi.',
    loginSuccess: 'Giri? ba?ar?l?.',
    loginFail: 'Giri? ba?ar?s?z',
    themeLight: 'A??k Mod',
    themeDark: 'Koyu Mod'
  }
};

export default function App() {
  const [auth, setAuth] = useState({ username: 'admin', password: 'admin' });
  const [token, setToken] = useState('');
  const [message, setMessage] = useState('');
  const [theme, setTheme] = useState('dark');
  const [lang, setLang] = useState('tr');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedTheme = localStorage.getItem('theme');
    if (savedToken) {
      setToken(savedToken);
      setAuthToken(savedToken);
    }
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const t = (key) => strings[lang][key] || key;

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const { data } = await login(auth);
      const access = data?.data?.accessToken;
      setToken(access);
      setAuthToken(access);
      localStorage.setItem('token', access);
      setMessage(t('loginSuccess'));
      navigate('/');
    } catch (err) {
      setMessage(err.response?.data?.error || t('loginFail'));
    }
  };

  const handleLogout = () => {
    setToken('');
    setAuthToken(null);
    localStorage.removeItem('token');
  };

  const themeIcon = useMemo(() => (theme === 'dark' ? faSun : faMoon), [theme]);
  const themeLabel = theme === 'dark' ? t('themeLight') : t('themeDark');

  const navItems = useMemo(
    () => [
      { to: '/', label: t('dashboard'), icon: faGauge },
      { to: '/inbounds', label: t('inbounds'), icon: faNetworkWired },
      { to: '/clients', label: t('clients'), icon: faUserGroup },
      { to: '/servers', label: t('servers'), icon: faServer },
      { to: '/ai', label: t('ai'), icon: faBrain },
      { to: '/docs', label: t('docs'), icon: faBook },
      { to: '/speed', label: t('speed'), icon: faGaugeHigh },
      { to: '/settings', label: t('settings'), icon: faWrench }
    ],
    [lang]
  );

  return (
    <div className="layout">
      <aside className={`sidebar ${menuOpen ? 'open' : 'closed'}`}>
        <div className="brand-row">
          <div className="brand">
            <span className="logo-dot" />
            <div>
              <div className="brand-title">{t('brand')}</div>
              <div className="brand-sub">{t('sub')}</div>
            </div>
          </div>
          <button className="mobile-toggle btn-secondary" onClick={() => setMenuOpen((v) => !v)}>
            <FontAwesomeIcon icon={menuOpen ? faXmark : faBars} />
          </button>
        </div>

        <div className="sidebar-actions">
          <button className="btn-ghost" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
            <FontAwesomeIcon icon={themeIcon} /> {themeLabel}
          </button>
          <select value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="tr">Türkçe</option>
            <option value="en">English</option>
          </select>
        </div>

        <nav className={menuOpen ? 'nav-open' : 'nav-closed'}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
              onClick={() => setMenuOpen(false)}
            >
              <FontAwesomeIcon icon={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {!token ? (
            <form onSubmit={handleLogin} className="login-form">
              <div className="form-row">
                <label>{t('username')}</label>
                <input
                  placeholder={t('username')}
                  value={auth.username}
                  onChange={(e) => setAuth((p) => ({ ...p, username: e.target.value }))}
                  required
                />
              </div>
              <div className="form-row">
                <label>{t('password')}</label>
                <input
                  type="password"
                  placeholder="********"
                  value={auth.password}
                  onChange={(e) => setAuth((p) => ({ ...p, password: e.target.value }))}
                  required
                />
              </div>
              <button type="submit" className="btn">
                <FontAwesomeIcon icon={faSignIn} /> {t('login')}
              </button>
              {message && <p className="muted small">{message}</p>}
            </form>
          ) : (
            <div className="session">
              <p className="muted small">{t('tokenSet')}</p>
              <button onClick={handleLogout} className="btn-secondary">
                <FontAwesomeIcon icon={faRightFromBracket} /> {t('logout')}
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="content">
        <Routes>
          <Route path="/" element={<DashboardPage lang={lang} />} />
          <Route path="/inbounds" element={<InboundsPage lang={lang} />} />
          <Route path="/clients" element={<ClientsPage lang={lang} />} />
          <Route path="/servers" element={<ServersPage lang={lang} />} />
          <Route path="/ai" element={<AiPage lang={lang} />} />
          <Route path="/docs" element={<DocsPage lang={lang} />} />
          <Route path="/speed" element={<SpeedTestPage lang={lang} />} />
          <Route path="/settings" element={<SettingsPage lang={lang} />} />
        </Routes>
      </main>
    </div>
  );
}
