import { useEffect, useMemo, useState } from "react";
import { Routes, Route, NavLink, useNavigate, Navigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faGauge,
  faNetworkWired,
  faUserGroup,
  faServer,
  faBrain,
  faRightFromBracket,
  faMoon,
  faSun,
  faBook,
  faWrench,
  faGaugeHigh,
  faBars,
  faXmark
} from "@fortawesome/free-solid-svg-icons";
import "./App.css";
import DashboardPage from "./pages/DashboardPage";
import InboundsPage from "./pages/InboundsPage";
import ClientsPage from "./pages/ClientsPage";
import ServersPage from "./pages/ServersPage";
import AiPage from "./pages/AiPage";
import DocsPage from "./pages/DocsPage";
import SettingsPage from "./pages/SettingsPage";
import SpeedTestPage from "./pages/SpeedTestPage";
import { setAuthToken } from "./services/api";
import LoginPage from "./pages/LoginPage";

const strings = {
  en: {
    brand: "FixFold",
    sub: "Xray Control",
    dashboard: "Overview",
    inbounds: "Inbounds",
    clients: "Clients",
    servers: "Servers",
    ai: "AI Anomalies",
    docs: "Docs",
    settings: "Settings",
    speed: "Speed Test",
    login: "Login",
    logout: "Logout",
    username: "Username",
    password: "Password",
    tokenSet: "Token stored.",
    loginSuccess: "Login successful.",
    loginFail: "Login failed",
    themeLight: "Light Mode",
    themeDark: "Dark Mode",
    loginHint: "Enter your credentials to continue."
  },
  tr: {
    brand: "FixFold",
    sub: "Xray Kontrol",
    dashboard: "Kontrol Paneli",
    inbounds: "Girişler",
    clients: "Kullanıcılar",
    servers: "Sunucular",
    ai: "AI Anomalileri",
    docs: "Dokümantasyon",
    settings: "Ayarlar",
    speed: "Hız Testi",
    login: "Giriş",
    logout: "Çıkış",
    username: "Kullanıcı Adı",
    password: "Şifre",
    tokenSet: "Token kaydedildi.",
    loginSuccess: "Giriş başarılı.",
    loginFail: "Giriş başarısız",
    themeLight: "Açık Mod",
    themeDark: "Koyu Mod",
    loginHint: "Devam etmek için kullanıcı adı ve şifre girin."
  }
};

export default function App() {
  const [token, setToken] = useState("");
  const [theme, setTheme] = useState("dark");
  const [lang, setLang] = useState("tr");
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedTheme = localStorage.getItem("theme");
    if (savedToken) {
      setToken(savedToken);
      setAuthToken(savedToken);
    }
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const t = (key) => strings[lang][key] || key;

  const handleLogout = () => {
    setToken("");
    setAuthToken(null);
    localStorage.removeItem("token");
    navigate("/login");
  };

  const themeIcon = useMemo(() => (theme === "dark" ? faSun : faMoon), [theme]);
  const themeLabel = theme === "dark" ? t("themeLight") : t("themeDark");

  const navItems = useMemo(
    () => [
      { to: "/", label: t("dashboard"), icon: faGauge },
      { to: "/inbounds", label: t("inbounds"), icon: faNetworkWired },
      { to: "/clients", label: t("clients"), icon: faUserGroup },
      { to: "/servers", label: t("servers"), icon: faServer },
      { to: "/ai", label: t("ai"), icon: faBrain },
      { to: "/docs", label: t("docs"), icon: faBook },
      { to: "/speed", label: t("speed"), icon: faGaugeHigh },
      { to: "/settings", label: t("settings"), icon: faWrench }
    ],
    [lang]
  );

  const layoutClass = token ? "layout" : "layout layout-auth";

  return (
    <div className={layoutClass}>
      {token && (
        <aside className={`sidebar ${menuOpen ? "open" : "closed"}`}>
          <div className="brand-row">
            <div className="brand">
              <span className="logo-dot" />
              <div>
                <div className="brand-title">{t("brand")}</div>
                <div className="brand-sub">{t("sub")}</div>
              </div>
            </div>
            <button className="mobile-toggle btn-secondary" onClick={() => setMenuOpen((v) => !v)}>
              <FontAwesomeIcon icon={menuOpen ? faXmark : faBars} />
            </button>
          </div>

          <div className="sidebar-actions">
            <button className="btn-ghost" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              <FontAwesomeIcon icon={themeIcon} /> {themeLabel}
            </button>
            <select value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="tr">Türkçe</option>
              <option value="en">English</option>
            </select>
          </div>

          <nav className={menuOpen ? "nav-open" : "nav-closed"}>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) => (isActive ? "nav-item active" : "nav-item")}
                onClick={() => setMenuOpen(false)}
              >
                <FontAwesomeIcon icon={item.icon} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="session">
              <p className="muted small">{t("tokenSet")}</p>
              <button onClick={handleLogout} className="btn-secondary">
                <FontAwesomeIcon icon={faRightFromBracket} /> {t("logout")}
              </button>
            </div>
          </div>
        </aside>
      )}

      <main className={`content ${!token ? "content-full" : ""}`}>
        <Routes>
          <Route
            path="/login"
            element={
              token ? (
                <Navigate to="/" replace />
              ) : (
                <LoginPage
                  lang={lang}
                  onSuccess={(access) => {
                    setToken(access);
                    setAuthToken(access);
                    localStorage.setItem("token", access);
                    navigate("/");
                  }}
                />
              )
            }
          />
          {token ? (
            <>
              <Route path="/" element={<DashboardPage lang={lang} />} />
              <Route path="/inbounds" element={<InboundsPage lang={lang} />} />
              <Route path="/clients" element={<ClientsPage lang={lang} />} />
              <Route path="/servers" element={<ServersPage lang={lang} />} />
              <Route path="/ai" element={<AiPage lang={lang} />} />
              <Route path="/docs" element={<DocsPage lang={lang} />} />
              <Route path="/speed" element={<SpeedTestPage lang={lang} />} />
              <Route path="/settings" element={<SettingsPage lang={lang} />} />
            </>
          ) : (
            <Route path="*" element={<Navigate to="/login" replace state={{ from: location }} />} />
          )}
        </Routes>
      </main>
    </div>
  );
}
