import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSignIn } from '@fortawesome/free-solid-svg-icons';
import { login } from '../services/api';

const strings = {
  en: {
    title: 'Login',
    username: 'Username',
    password: 'Password',
    btn: 'Login',
    hint: 'Enter your credentials to continue.',
    fail: 'Login failed'
  },
  tr: {
    title: 'Giriş',
    username: 'Kullanıcı Adı',
    password: 'Şifre',
    btn: 'Giriş',
    hint: 'Devam etmek için kullanıcı adı ve şifre girin.',
    fail: 'Giriş başarısız'
  }
};

export default function LoginPage({ lang = 'tr', onSuccess }) {
  const t = (k) => strings[lang]?.[k] || strings.tr[k] || k;
  const [auth, setAuth] = useState({ username: '', password: '' });
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('info');
  const handleLogin = async (e) => {
    e.preventDefault();
    setMsg('');
    setMsgType('info');
    if (!auth.username || auth.username.length < 3) {
      setMsg('Kullanıcı adı en az 3 karakter olmalı');
      setMsgType('error');
      return;
    }
    if (!auth.password || auth.password.length < 8) {
      setMsg('Şifre en az 8 karakter olmalı');
      setMsgType('error');
      return;
    }
    try {
      const { data } = await login(auth);
      const access = data?.data?.accessToken;
      if (access) {
        onSuccess(access);
      } else {
        setMsg(t('fail'));
        setMsgType('error');
      }
    } catch (err) {
      setMsg(err.response?.data?.error || t('fail'));
      setMsgType('error');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>{t('title')}</h1>
        <p className="muted small">{t('hint')}</p>
        <form onSubmit={handleLogin} className="grid">
          <label>
            {t('username')}
            <input
              value={auth.username}
              onChange={(e) => setAuth((p) => ({ ...p, username: e.target.value }))}
              placeholder={t('username')}
              required
            />
          </label>
          <label>
            {t('password')}
            <input
              type="password"
              value={auth.password}
              onChange={(e) => setAuth((p) => ({ ...p, password: e.target.value }))}
              placeholder="••••••••"
              required
            />
          </label>
          <button type="submit" className="btn">
            <FontAwesomeIcon icon={faSignIn} /> {t('btn')}
          </button>
          {msg && <p className={`muted small ${msgType === 'error' ? 'text-error' : 'text-success'}`}>{msg}</p>}
        </form>
      </div>
    </div>
  );
}
