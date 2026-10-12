/**
 * DiagnosaKoneksi.jsx
 *
 * Taruh di src/pages/DiagnosaKoneksi.jsx
 * Akses via: http://localhost:5173/diagnosa
 *
 * Gunakan halaman ini kalau data selalu 0 / tidak konek ke backend.
 * Cek setiap baris — hijau = OK, merah = ada masalah.
 */

import { useState } from 'react';
import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const tests = [
  {
    label: 'Backend hidup?',
    desc: 'GET /api/login (tanpa body) → harus balik 422 atau 405, bukan network error',
    run: () =>
      axios.post(`${BASE}/login`, {}).catch((e) => {
        if (e.response) return e.response; // 422 = backend hidup
        throw e;
      }),
    check: (res) => [200, 422, 405, 401].includes(res.status),
  },
  {
    label: 'CORS aktif?',
    desc: 'Request dari localhost:5173 ke 127.0.0.1:8000 tidak diblok browser',
    run: () =>
      axios.post(`${BASE}/login`, {}).catch((e) => {
        if (e.response) return e.response;
        throw e;
      }),
    check: (res) => !!res,
  },
  {
    label: 'Login bisa?',
    desc: 'POST /api/login dengan admin/password — harus dapat token',
    run: () => axios.post(`${BASE}/login`, { username: 'admin', password: 'password' }),
    check: (res) => res.data?.token,
  },
  {
    label: 'Auth token bekerja?',
    desc: 'GET /api/users dengan token dari localStorage',
    run: () => {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Tidak ada token di localStorage. Login dulu!');
      return axios.get(`${BASE}/users`, { headers: { Authorization: `Bearer ${token}` } });
    },
    check: (res) => res.data?.success,
  },
  {
    label: 'Data pengajuan?',
    desc: 'GET /api/admin/pengajuan',
    run: () => {
      const token = localStorage.getItem('token');
      return axios.get(`${BASE}/admin/pengajuan`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    },
    check: (res) => res.data?.success,
  },
  {
    label: 'SAW endpoint?',
    desc: 'GET /api/saw/hitung',
    run: () => {
      const token = localStorage.getItem('token');
      return axios.get(`${BASE}/saw/hitung`, { headers: { Authorization: `Bearer ${token}` } });
    },
    check: (res) => res.data?.success || res.status === 404,
  },
  {
    label: 'Activity Log?',
    desc: 'GET /api/logs',
    run: () => {
      const token = localStorage.getItem('token');
      return axios.get(`${BASE}/logs`, { headers: { Authorization: `Bearer ${token}` } });
    },
    check: (res) => res.data?.success,
  },
];

export default function DiagnosaKoneksi() {
  const [results, setResults] = useState([]);
  const [running, setRunning] = useState(false);

  const jalankan = async () => {
    setRunning(true);
    setResults([]);
    const out = [];
    for (const t of tests) {
      let status;
      let detail;
      let ok = false;
      try {
        const res = await t.run();
        ok = t.check(res);
        status = ok ? 'ok' : 'warn';
        detail = `HTTP ${res.status} — ${JSON.stringify(res.data).slice(0, 120)}`;
      } catch (e) {
        status = 'error';
        detail = e.message || String(e);
        if (e.code === 'ERR_NETWORK') {
          detail =
            '❌ Network Error — backend tidak jalan atau CORS diblok. Pastikan: php artisan serve sudah dijalankan.';
        }
      }
      out.push({ ...t, status, detail, ok });
      setResults([...out]);
    }
    setRunning(false);
  };

  const color = { ok: '#065f46', warn: '#d97706', error: '#ba1a1a', loading: '#45464d' };
  const bg = { ok: '#d1fae5', warn: '#fef3c7', error: '#ffdad6', loading: '#f1f5f9' };
  const icon = { ok: '✅', warn: '⚠️', error: '❌', loading: '⏳' };

  return (
    <div
      style={{
        fontFamily: 'Inter, sans-serif',
        maxWidth: 700,
        margin: '40px auto',
        padding: '0 20px',
      }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
        🔍 Diagnosa Koneksi Backend
      </h1>
      <p style={{ fontSize: 14, color: '#45464d', marginBottom: 24 }}>
        Jalankan test ini kalau dashboard tampil data 0 semua.
      </p>

      <button
        onClick={jalankan}
        disabled={running}
        style={{
          padding: '10px 24px',
          background: running ? '#c6c6cd' : '#0051d5',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          fontWeight: 700,
          cursor: running ? 'default' : 'pointer',
          marginBottom: 24,
        }}
      >
        {running ? 'Menjalankan test...' : 'Jalankan Semua Test'}
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {results.map((r, i) => (
          <div
            key={i}
            style={{
              padding: '14px 16px',
              borderRadius: 10,
              background: bg[r.status],
              border: `1px solid ${color[r.status]}30`,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>
                {icon[r.status]} {r.label}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: color[r.status],
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                {r.status}
              </span>
            </div>
            <p style={{ fontSize: 12, color: '#45464d', margin: '4px 0 2px' }}>{r.desc}</p>
            <code style={{ fontSize: 11, color: color[r.status], wordBreak: 'break-all' }}>
              {r.detail}
            </code>
          </div>
        ))}
      </div>

      {results.length > 0 && !running && (
        <div
          style={{
            marginTop: 24,
            padding: 16,
            borderRadius: 10,
            background: '#f8f9ff',
            border: '1px solid #c6c6cd',
          }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Solusi umum:</h3>
          <ul style={{ fontSize: 13, color: '#45464d', paddingLeft: 20, lineHeight: 2 }}>
            <li>
              <strong>ERR_NETWORK</strong> → jalankan <code>php artisan serve</code> di folder
              Laravel
            </li>
            <li>
              <strong>CORS error</strong> → tambah <code>localhost:5173</code> ke{' '}
              <code>config/cors.php → allowed_origins</code>
            </li>
            <li>
              <strong>401 Unauthorized</strong> → token expired, coba logout dan login ulang
            </li>
            <li>
              <strong>404 pada /logs</strong> → pastikan <code>api.php</code> terbaru sudah disimpan
            </li>
            <li>
              <strong>Data 0 tapi status OK</strong> → database kosong atau belum import data
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
