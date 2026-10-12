import { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const API = import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000/api';

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
    width: 100%; padding: 11px 14px;
    border-radius: 10px; border: 1.5px solid #e2e8f0;
    background: #f8fafc; font-family: 'Plus Jakarta Sans', sans-serif;
    font-size: 14px; color: #0f172a; outline: none; transition: .15s;
    -webkit-appearance: none;
  }
  .inp:focus { border-color: #0051d5; background: #fff; box-shadow: 0 0 0 3px rgba(0,81,213,.08); }
  .inp-icon { padding-left: 42px; }
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

const Label = ({ children, required: req }) => (
  <label
    style={{
      display: 'block',
      fontSize: 12,
      fontWeight: 700,
      color: '#475569',
      textTransform: 'uppercase',
      letterSpacing: '.07em',
      marginBottom: 7,
    }}
  >
    {children} {req && <span style={{ color: '#dc2626' }}>*</span>}
  </label>
);

export default function RegisterWarga() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    nama_lengkap: '',
    alamat: '',
    rt: '',
    password: '',
    password_confirmation: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleRegister = async (e) => {
    e.preventDefault();
    if (form.password !== form.password_confirmation) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    if (form.password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API}/register`, form);
      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2500);
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.username?.[0] ||
        'Pendaftaran gagal. Coba lagi.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Layar sukses
  if (success)
    return (
      <>
        <style>{GLOBAL_CSS}</style>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#F0F6FF',
          }}
        >
          <div style={{ textAlign: 'center', animation: 'fadeUp .3s ease', padding: 32 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <MI name="check_circle" fill size={36} style={{ color: '#16a34a' }} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
              Pendaftaran Berhasil
            </h2>
            <p style={{ fontSize: 14, color: '#64748b', marginBottom: 6 }}>
              Akun Anda telah dibuat. Mengalihkan ke halaman masuk...
            </p>
            <div
              style={{
                width: 32,
                height: 32,
                border: '3px solid #e2e8f0',
                borderTopColor: '#0051d5',
                borderRadius: '50%',
                margin: '16px auto 0',
                animation: 'spin .8s linear infinite',
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>
      </>
    );

  return (
    <>
      <style>{GLOBAL_CSS}</style>

      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'stretch' }}>
        {/* ── KIRI: Branding ── */}
        <div
          style={{
            width: 380,
            flexShrink: 0,
            background: 'linear-gradient(155deg, #0C2D6B 0%, #1A56DB 60%, #3B82F6 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '48px 44px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -60,
              right: -60,
              width: 280,
              height: 280,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,.06)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -80,
              left: -80,
              width: 360,
              height: 360,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,.04)',
              pointerEvents: 'none',
            }}
          />

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 11,
                background: '#D6E9FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MI name="hub" fill size={22} style={{ color: '#93c5fd' }} />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-.3px' }}>
                BANSOS<span style={{ color: '#1A56DB' }}>HUB</span>
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,.35)',
                  textTransform: 'uppercase',
                  letterSpacing: '.1em',
                }}
              >
                Portal Warga
              </div>
            </div>
          </div>

          {/* Konten */}
          <div>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: '#fff',
                lineHeight: 1.25,
                marginBottom: 16,
                letterSpacing: '-.4px',
              }}
            >
              Daftarkan Diri
              <br />
              Sebagai Warga
            </h2>
            <p
              style={{
                fontSize: 14,
                color: 'rgba(255,255,255,.55)',
                lineHeight: 1.75,
                marginBottom: 32,
              }}
            >
              Buat akun untuk mengisi kuesioner kelayakan bantuan sosial, memantau status pengajuan,
              dan berkomunikasi langsung dengan Ketua RT.
            </p>
            {/* Langkah */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                {
                  step: '01',
                  title: 'Lengkapi Data Akun',
                  desc: 'Isi identitas dan kredensial masuk',
                },
                { step: '02', title: 'Isi Kuesioner', desc: 'Jawab 10 pertanyaan kelayakan' },
                {
                  step: '03',
                  title: 'Proses Verifikasi',
                  desc: 'Ketua RT meninjau pengajuan Anda',
                },
              ].map(({ step, title, desc }) => (
                <div key={step} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: '#D6E9FF',
                      border: '1px solid rgba(255,255,255,.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#60a5fa',
                    }}
                  >
                    {step}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
                      {title}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,.4)' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 13,
              fontWeight: 600,
              color: 'rgba(255,255,255,.5)',
              textDecoration: 'none',
              transition: '.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#60a5fa')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,.5)')}
          >
            <MI name="arrow_back" size={16} /> Kembali ke halaman masuk
          </Link>
        </div>

        {/* ── KANAN: Form ── */}
        <div
          style={{
            flex: 1,
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 56px',
            overflowY: 'auto',
          }}
        >
          <div style={{ width: '100%', maxWidth: 520, animation: 'fadeUp .3s ease' }}>
            <div style={{ marginBottom: 32 }}>
              <h2
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: '#0f172a',
                  marginBottom: 8,
                  letterSpacing: '-.4px',
                }}
              >
                Buat Akun Baru
              </h2>
              <p style={{ fontSize: 14, color: '#64748b' }}>
                Semua kolom bertanda <span style={{ color: '#dc2626', fontWeight: 700 }}>*</span>{' '}
                wajib diisi.
              </p>
            </div>

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
                  size={17}
                  style={{ color: '#dc2626', flexShrink: 0, marginTop: 1 }}
                />
                <span style={{ fontSize: 13.5, color: '#dc2626', lineHeight: 1.5 }}>{error}</span>
              </div>
            )}

            <form
              onSubmit={handleRegister}
              style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
            >
              {/* Grid 2 kolom */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Nama Lengkap */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <Label required>Nama Lengkap Sesuai KTP</Label>
                  <div style={{ position: 'relative' }}>
                    <MI
                      name="badge"
                      size={17}
                      style={{
                        position: 'absolute',
                        left: 13,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#94a3b8',
                      }}
                    />
                    <input
                      className="inp inp-icon"
                      type="text"
                      required
                      autoComplete="name"
                      placeholder="Nama lengkap sesuai KTP"
                      value={form.nama_lengkap}
                      onChange={(e) => set('nama_lengkap', e.target.value)}
                    />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <Label required>Username</Label>
                  <div style={{ position: 'relative' }}>
                    <MI
                      name="alternate_email"
                      size={17}
                      style={{
                        position: 'absolute',
                        left: 13,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#94a3b8',
                      }}
                    />
                    <input
                      className="inp inp-icon"
                      type="text"
                      required
                      autoComplete="username"
                      placeholder="username_unik"
                      value={form.username}
                      onChange={(e) => set('username', e.target.value)}
                    />
                  </div>
                </div>

                {/* RT */}
                <div>
                  <Label required>Wilayah RT</Label>
                  <div style={{ position: 'relative' }}>
                    <MI
                      name="home_work"
                      size={17}
                      style={{
                        position: 'absolute',
                        left: 13,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#94a3b8',
                        zIndex: 1,
                      }}
                    />
                    <select
                      className="inp inp-icon"
                      required
                      value={form.rt}
                      onChange={(e) => set('rt', e.target.value)}
                      style={{ cursor: 'pointer', appearance: 'none' }}
                    >
                      <option value="" disabled>
                        Pilih RT
                      </option>
                      <option value="1">RT 01</option>
                      <option value="2">RT 02</option>
                      <option value="3">RT 03</option>
                    </select>
                    <MI
                      name="expand_more"
                      size={17}
                      style={{
                        position: 'absolute',
                        right: 13,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#94a3b8',
                        pointerEvents: 'none',
                      }}
                    />
                  </div>
                </div>

                {/* Alamat */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <Label required>Alamat Domisili</Label>
                  <textarea
                    className="inp"
                    required
                    rows={3}
                    placeholder="Jl. Nama Jalan No. 1, RT/RW, Kelurahan..."
                    value={form.alamat}
                    onChange={(e) => set('alamat', e.target.value)}
                    style={{ resize: 'none', paddingLeft: 14 }}
                  />
                </div>

                {/* Password */}
                <div>
                  <Label required>Kata Sandi</Label>
                  <div style={{ position: 'relative' }}>
                    <MI
                      name="lock"
                      size={17}
                      style={{
                        position: 'absolute',
                        left: 13,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#94a3b8',
                      }}
                    />
                    <input
                      className="inp inp-icon"
                      type={showPw ? 'text' : 'password'}
                      required
                      placeholder="Min. 6 karakter"
                      value={form.password}
                      onChange={(e) => set('password', e.target.value)}
                      style={{ paddingRight: 42 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      style={{
                        position: 'absolute',
                        right: 11,
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
                        size={16}
                        style={{ color: '#94a3b8' }}
                      />
                    </button>
                  </div>
                </div>

                {/* Konfirmasi Password */}
                <div>
                  <Label required>Konfirmasi Kata Sandi</Label>
                  <div style={{ position: 'relative' }}>
                    <MI
                      name="lock_reset"
                      size={17}
                      style={{
                        position: 'absolute',
                        left: 13,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#94a3b8',
                      }}
                    />
                    <input
                      className="inp inp-icon"
                      type={showPw2 ? 'text' : 'password'}
                      required
                      placeholder="Ulangi kata sandi"
                      value={form.password_confirmation}
                      onChange={(e) => set('password_confirmation', e.target.value)}
                      style={{
                        paddingRight: 42,
                        borderColor:
                          form.password_confirmation && form.password !== form.password_confirmation
                            ? '#fca5a5'
                            : undefined,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw2((v) => !v)}
                      style={{
                        position: 'absolute',
                        right: 11,
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
                        name={showPw2 ? 'visibility' : 'visibility_off'}
                        size={16}
                        style={{ color: '#94a3b8' }}
                      />
                    </button>
                  </div>
                  {form.password_confirmation && form.password !== form.password_confirmation && (
                    <p style={{ fontSize: 11.5, color: '#dc2626', marginTop: 5, fontWeight: 600 }}>
                      Kata sandi tidak cocok.
                    </p>
                  )}
                </div>
              </div>

              {/* Info */}
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 9,
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <MI
                  name="info"
                  fill
                  size={16}
                  style={{ color: '#0891b2', flexShrink: 0, marginTop: 1 }}
                />
                <p style={{ fontSize: 12.5, color: '#0369a1', lineHeight: 1.6 }}>
                  Akun Anda langsung aktif setelah pendaftaran. Login menggunakan username yang Anda
                  buat untuk mengakses portal warga.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '13px',
                  background: loading ? '#93c5fd' : '#0051d5',
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
                    <MI name="hourglass_empty" size={17} /> Mendaftarkan...
                  </>
                ) : (
                  <>
                    <MI name="how_to_reg" size={17} /> Buat Akun Sekarang
                  </>
                )}
              </button>

              <p style={{ textAlign: 'center', fontSize: 13.5, color: '#64748b' }}>
                Sudah punya akun?{' '}
                <Link
                  to="/login"
                  style={{ color: '#1A56DB', fontWeight: 700, textDecoration: 'none' }}
                >
                  Masuk di sini
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
