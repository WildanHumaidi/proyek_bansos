import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api';

const CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  .gp-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 28px 20px;
    background: #f1f5f9;
    font-family: 'Plus Jakarta Sans', sans-serif;
    color: #0f172a;
  }
  .gp-card {
    width: 100%;
    max-width: 460px;
    background: #fff;
    border: 1px solid #DBEAFE;
    border-radius: 18px;
    padding: 30px 30px 26px;
    box-shadow: 0 18px 50px rgba(15,23,42,.08);
    animation: gpUp .22s ease;
  }
  @keyframes gpUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .gp-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 22px; }
  .gp-logo {
    width: 40px; height: 40px; border-radius: 11px; flex-shrink: 0;
    background: linear-gradient(135deg,#0b3fa8 0%,#062b6e 100%);
    display: flex; align-items: center; justify-content: center;
  }
  .gp-brand-name { font-size: 16px; font-weight: 800; letter-spacing: -.3px; }
  .gp-brand-sub { font-size: 10.5px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: .07em; }
  .gp-title { font-size: 22px; font-weight: 800; margin: 0 0 6px; }
  .gp-sub { font-size: 13px; line-height: 1.6; color: #334155; margin: 0 0 22px; }
  .gp-label {
    display: block; font-size: 11px; font-weight: 700; color: #334155;
    text-transform: uppercase; letter-spacing: .07em; margin-bottom: 7px;
  }
  .gp-field { margin-bottom: 16px; }
  .gp-input-wrap { position: relative; }
  .gp-input {
    width: 100%; padding: 11px 44px 11px 42px;
    border-radius: 10px; border: 1.5px solid #cbd5e1;
    background: #f8fafc; font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px; color: #0f172a; outline: none; transition: .15s;
    -webkit-appearance: none;
  }
  .gp-input:focus { border-color: #0b3fa8; background: #fff; box-shadow: 0 0 0 3px rgba(0,81,213,.08); }
  .gp-eye {
    position: absolute; right: 4px; top: 50%; transform: translateY(-50%);
    width: 40px; height: 40px; border: none; background: transparent;
    color: #475569; cursor: pointer; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
  }
  .gp-eye:hover { background: #EBF3FF; color: #0b3fa8; }
  .gp-hint { font-size: 11.5px; color: #475569; margin-top: 6px; }
  .gp-error {
    display: flex; gap: 9px; align-items: flex-start;
    padding: 11px 13px; margin-bottom: 16px; border-radius: 10px;
    background: #fef2f2; border: 1px solid #fecaca; color: #991b1b;
    font-size: 12.5px; line-height: 1.5;
  }
  .gp-submit {
    width: 100%; min-height: 46px; margin-top: 4px;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    border: none; border-radius: 10px; cursor: pointer;
    background: linear-gradient(135deg,#0b3fa8 0%,#062b6e 100%);
    color: #fff; font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px; font-weight: 700; transition: .15s;
  }
  .gp-submit:hover { filter: brightness(1.06); }
  .gp-submit:disabled { opacity: .65; cursor: default; }
  .gp-back {
    width: 100%; min-height: 40px; margin-top: 14px; padding: 10px;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    border: none; background: transparent; color: #334155;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12.5px;
    font-weight: 600; cursor: pointer; border-radius: 9px;
  }
  .gp-back:hover { background: #EBF3FF; color: #0b3fa8; }
  .gp-success { text-align: center; padding: 8px 0 2px; }
  .gp-success-icon {
    width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 16px;
    background: #dcfce7; display: flex; align-items: center; justify-content: center;
  }
  .gp-note {
    margin-top: 18px; padding-top: 16px; border-top: 1px solid #EBF3FF;
    display: flex; gap: 8px; align-items: flex-start;
    font-size: 11.5px; color: #475569; line-height: 1.55;
  }
  @media (max-width: 480px) {
    .gp-page { padding: 16px 12px; align-items: flex-start; }
    .gp-card { padding: 22px 18px 20px; border-radius: 14px; }
    .gp-title { font-size: 20px; }
  }
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
      userSelect: 'none',
      ...s,
    }}
  >
    {name}
  </span>
);

export default function GantiPassword() {
  const navigate = useNavigate();

  const [user] = useState(() => {
    try {
      const s = localStorage.getItem('user');
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });

  const [form, setForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  });
  const [lihat, setLihat] = useState({ current: false, baru: false, ulang: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sukses, setSukses] = useState(false);

  const dashboard = { warga: '/warga', rt: '/rt', rw: '/rw', admin: '/dashboard' }[user?.role] || '/login';

  useEffect(() => {
    if (!localStorage.getItem('token') || !user) {
      navigate('/login', { replace: true });
    }
  }, [navigate, user]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const kirim = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError('Password baru minimal 8 karakter.');
      return;
    }
    if (form.password !== form.password_confirmation) {
      setError('Konfirmasi password baru tidak cocok.');
      return;
    }
    if (form.password === form.current_password) {
      setError('Password baru harus berbeda dari password saat ini.');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/ganti-password`, form, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setSukses(true);
      setForm({ current_password: '', password: '', password_confirmation: '' });
    } catch (err) {
      const data = err.response?.data;
      setError(
        data?.errors?.current_password?.[0] ||
          data?.errors?.password?.[0] ||
          data?.message ||
          'Gagal mengganti password. Coba lagi.'
      );
    } finally {
      setLoading(false);
    }
  };

  const kolom = [
    { key: 'current_password', label: 'Password Saat Ini', lihatKey: 'current', autoComplete: 'current-password' },
    { key: 'password', label: 'Password Baru', lihatKey: 'baru', autoComplete: 'new-password' },
    { key: 'password_confirmation', label: 'Ulangi Password Baru', lihatKey: 'ulang', autoComplete: 'new-password' },
  ];

  return (
    <div className="gp-page">
      <style>{CSS}</style>

      <div className="gp-card">
        <div className="gp-brand">
          <div className="gp-logo">
            <MI name="lock" fill size={20} style={{ color: '#fff' }} />
          </div>
          <div>
            <div className="gp-brand-name">
              BANSOS<span style={{ color: '#0b3fa8' }}>HUB</span>
            </div>
            <div className="gp-brand-sub">Keamanan Akun</div>
          </div>
        </div>

        {sukses ? (
          <div className="gp-success">
            <div className="gp-success-icon">
              <MI name="check_circle" fill size={34} style={{ color: '#166534' }} />
            </div>
            <h1 className="gp-title">Password berhasil diganti</h1>
            <p className="gp-sub" style={{ marginBottom: 18 }}>
              Mulai sekarang gunakan password baru saat login. Sesi di perangkat lain
              sudah otomatis dikeluarkan.
            </p>
            <button className="gp-submit" onClick={() => navigate(dashboard)}>
              <MI name="arrow_back" size={17} /> Kembali ke Dashboard
            </button>
          </div>
        ) : (
          <>
            <h1 className="gp-title">Ganti Password</h1>
            <p className="gp-sub">
              Masukkan password saat ini, lalu pilih password baru minimal 8 karakter.
            </p>

            {error && (
              <div className="gp-error">
                <MI name="error" fill size={16} style={{ marginTop: 1, flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={kirim}>
              {kolom.map(({ key, label, lihatKey, autoComplete }) => (
                <div className="gp-field" key={key}>
                  <label className="gp-label" htmlFor={key}>
                    {label}
                  </label>
                  <div className="gp-input-wrap">
                    <MI name="lock" size={17} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                    <input
                      id={key}
                      className="gp-input"
                      type={lihat[lihatKey] ? 'text' : 'password'}
                      autoComplete={autoComplete}
                      value={form[key]}
                      onChange={(e) => set(key, e.target.value)}
                      placeholder={key === 'current_password' ? 'Password yang dipakai sekarang' : 'Minimal 8 karakter'}
                      required
                      minLength={key === 'current_password' ? undefined : 8}
                    />
                    <button
                      type="button"
                      className="gp-eye"
                      aria-label={lihat[lihatKey] ? 'Sembunyikan password' : 'Tampilkan password'}
                      title={lihat[lihatKey] ? 'Sembunyikan password' : 'Tampilkan password'}
                      onClick={() => setLihat((l) => ({ ...l, [lihatKey]: !l[lihatKey] }))}
                    >
                      <MI name={lihat[lihatKey] ? 'visibility_off' : 'visibility'} size={18} />
                    </button>
                  </div>
                  {key === 'password' && <div className="gp-hint">Gunakan kombinasi yang tidak mudah ditebak.</div>}
                </div>
              ))}

              <button className="gp-submit" type="submit" disabled={loading}>
                <MI name={loading ? 'hourglass_empty' : 'lock'} size={17} />
                {loading ? 'Menyimpan...' : 'Simpan Password Baru'}
              </button>
            </form>
          </>
        )}

        {!sukses && (
          <button className="gp-back" onClick={() => navigate(dashboard)}>
            <MI name="arrow_back" size={15} /> Kembali ke Dashboard
          </button>
        )}

        {!sukses && (
          <div className="gp-note">
            <MI name="info" size={15} style={{ marginTop: 1, flexShrink: 0 }} />
            <span>
              Setelah password berubah, semua sesi di perangkat lain otomatis keluar.
              Perangkat yang sedang kamu pakai tetap masuk.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}