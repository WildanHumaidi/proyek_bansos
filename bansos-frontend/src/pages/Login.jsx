import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const API =
  import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: #f1f5f9;
    color: #0f172a;
    -webkit-font-smoothing: antialiased;
    min-height: 100vh;
  }
  .material-symbols-outlined {
    font-family: 'Material Symbols Outlined';
    font-variation-settings: 'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24;
    font-style: normal; display: inline-block; line-height: 1;
    text-transform: none; white-space: nowrap; user-select: none;
  }
  .inp {
    width: 100%; padding: 12px 14px 12px 42px;
    border-radius: 10px; border: 1.5px solid #C6DCFF;
    background: #f8fafc; font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px; color: #0f172a; outline: none; transition: .15s;
  }
  .inp:focus { border-color: #1A56DB; background: #fff; box-shadow: 0 0 0 3px rgba(0,81,213,.08); }
  .inp-pw { padding-right: 44px; }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
`;

const MI = ({ name, fill = false, size = 20, style: s = {} }) => (
  <span
    className="material-symbols-outlined"
    style={{
      fontSize: size,
      fontVariationSettings: fill
        ? "'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24"
        : "'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24",
      lineHeight: 1,
      ...s,
    }}
  >
    {name}
  </span>
);

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const u = JSON.parse(userStr);
        const routes = { admin: '/dashboard', rt: '/rt', rw: '/rw', warga: '/warga' };
        navigate(routes[u.role] || '/warga', { replace: true });
      } catch {
        localStorage.clear();
      }
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/login`, form);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      const routes = { admin: '/dashboard', rt: '/rt', rw: '/rw', warga: '/warga' };
      navigate(routes[res.data.user.role] || '/warga');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Username atau password tidak sesuai. Periksa kembali.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      <div style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
        {/* ── KIRI: Branding Panel ── */}
        <div
          style={{
            background: 'linear-gradient(155deg, #0C2D6B 0%, #1A56DB 60%, #3B82F6 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '48px 56px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Dekorasi lingkaran */}
          <div
            style={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 320,
              height: 320,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,.07)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: 40,
              right: 40,
              width: 180,
              height: 180,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,.05)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -80,
              left: -80,
              width: 400,
              height: 400,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,.05)',
              pointerEvents: 'none',
            }}
          />

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(255,255,255,.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(8px)',
              }}
            >
              <MI name="hub" fill size={24} style={{ color: '#93c5fd' }} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', letterSpacing: '-.3px' }}>
                BANSOS<span style={{ color: '#93C5FD' }}>HUB</span>
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '.1em',
                }}
              >
                Sistem Terpadu
              </div>
            </div>
          </div>

          {/* Konten tengah */}
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#93C5FD',
                textTransform: 'uppercase',
                letterSpacing: '.1em',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                style={{ width: 24, height: 1, background: '#93C5FD', display: 'inline-block' }}
              />
              Portal Bantuan Sosial
            </div>
            <h1
              style={{
                fontSize: 38,
                fontWeight: 800,
                color: '#fff',
                lineHeight: 1.2,
                marginBottom: 20,
                letterSpacing: '-.5px',
              }}
            >
              Sistem Pendukung
              <br />
              Keputusan
              <br />
              Penerima Bansos
            </h1>
            <p
              style={{
                fontSize: 15,
                color: 'rgba(255,255,255,.6)',
                lineHeight: 1.75,
                maxWidth: 380,
              }}
            >
              Platform terpadu berbasis metode SAW untuk mengelola, memverifikasi, dan menentukan
              prioritas penerima bantuan sosial secara transparan dan terstruktur.
            </p>

            {/* Fitur chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 32 }}>
              {[
                'Kalkulasi SAW Otomatis',
                'Verifikasi Berjenjang',
                'Data Real-Time',
                'Laporan Cetak',
              ].map((f) => (
                <div
                  key={f}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 14px',
                    borderRadius: 20,
                    background: 'rgba(255,255,255,.08)',
                    border: '1px solid rgba(255,255,255,.25)',
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: '#93C5FD',
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,.75)' }}>
                    {f}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer kiri */}
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', fontWeight: 500 }}>
            &copy; {new Date().getFullYear()} BansosHub &mdash; Sistem Manajemen Bantuan Sosial
          </div>
        </div>

        {/* ── KANAN: Form Login ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 56px',
            background: '#fff',
          }}
        >
          <div style={{ width: '100%', maxWidth: 400, animation: 'fadeUp .3s ease' }}>
            {/* Heading */}
            <div style={{ marginBottom: 36 }}>
              <h2
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: '#0f172a',
                  marginBottom: 8,
                  letterSpacing: '-.4px',
                }}
              >
                Masuk ke Sistem
              </h2>
              <p style={{ fontSize: 14.5, color: '#64748b', lineHeight: 1.6 }}>
                Masukkan kredensial Anda untuk mengakses portal sesuai peran yang ditetapkan.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  padding: '13px 16px',
                  borderRadius: 10,
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  marginBottom: 24,
                }}
              >
                <MI
                  name="error"
                  fill
                  size={18}
                  style={{ color: '#dc2626', flexShrink: 0, marginTop: 1 }}
                />
                <span style={{ fontSize: 13.5, color: '#dc2626', lineHeight: 1.5 }}>{error}</span>
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={handleLogin}
              style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            >
              {/* Username */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#475569',
                    textTransform: 'uppercase',
                    letterSpacing: '.07em',
                    marginBottom: 8,
                  }}
                >
                  Username
                </label>
                <div style={{ position: 'relative' }}>
                  <MI
                    name="person"
                    size={18}
                    style={{
                      position: 'absolute',
                      left: 13,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                    }}
                  />
                  <input
                    className="inp"
                    type="text"
                    required
                    autoComplete="username"
                    placeholder="Masukkan username Anda"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#475569',
                    textTransform: 'uppercase',
                    letterSpacing: '.07em',
                    marginBottom: 8,
                  }}
                >
                  Kata Sandi
                </label>
                <div style={{ position: 'relative' }}>
                  <MI
                    name="lock"
                    size={18}
                    style={{
                      position: 'absolute',
                      left: 13,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#94a3b8',
                    }}
                  />
                  <input
                    className="inp inp-pw"
                    type={showPw ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="Masukkan kata sandi"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 4,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <MI
                      name={showPw ? 'visibility' : 'visibility_off'}
                      size={18}
                      style={{ color: '#94a3b8' }}
                    />
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '13px',
                  background: loading ? '#93c5fd' : '#1A56DB',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 14.5,
                  fontWeight: 700,
                  cursor: loading ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: '.15s',
                  marginTop: 4,
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.background = '#1649C4';
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.background = '#1A56DB';
                }}
              >
                {loading ? (
                  <>
                    <MI name="hourglass_empty" size={17} /> Memverifikasi...
                  </>
                ) : (
                  <>
                    <MI name="login" size={17} /> Masuk ke Sistem
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '28px 0' }}>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>ATAU</span>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            </div>

            {/* Register link */}
            <Link
              to="/register"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px',
                borderRadius: 10,
                border: '1.5px solid #e2e8f0',
                color: '#0f172a',
                fontSize: 14,
                fontWeight: 600,
                textDecoration: 'none',
                transition: '.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#0051d5';
                e.currentTarget.style.color = '#0051d5';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.color = '#0f172a';
              }}
            >
              <MI name="person_add" size={17} />
              Daftar sebagai Warga Baru
            </Link>

            {/* Role info */}
            <div
              style={{
                marginTop: 28,
                padding: '16px',
                borderRadius: 10,
                background: '#f8fafc',
                border: '1px solid #f1f5f9',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '.08em',
                  marginBottom: 10,
                }}
              >
                Akses Per Peran
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { role: 'Admin', icon: 'admin_panel_settings', color: '#0051d5', bg: '#eff6ff' },
                  { role: 'Ketua RW', icon: 'account_balance', color: '#7c3aed', bg: '#f5f3ff' },
                  { role: 'Ketua RT', icon: 'home_work', color: '#0891b2', bg: '#ecfeff' },
                  { role: 'Warga', icon: 'person', color: '#059669', bg: '#f0fdf4' },
                ].map(({ role, icon, color, bg }) => (
                  <div
                    key={role}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '7px 10px',
                      borderRadius: 8,
                      background: bg,
                    }}
                  >
                    <MI name={icon} fill size={15} style={{ color }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>{role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
