import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getUser } from '../lib/api';
import useScrollCraft from '../landing/useScrollCraft';
import {
  IconArrow,
  IconCheck,
  IconChevron,
  IconHouse,
  IconInfo,
  IconLogin,
  IconUserPlus,
} from '../landing/Icons';
import '../landing/landing.css';

/* ─── Data ──────────────────────────────────────────────────────────────────
   Tidak ada satu angka pun di halaman ini yang dikarang. Sepuluh kriteria
   adalah isi asli tabel `kriteria`, tiga langkah adalah alur yang benar-benar
   dijalani warga, dan FAQ berisi pertanyaan yang benar-benar muncul saat
   pendampingan di lapangan.

   Arah penilaian (benefit/cost) SENGAJA tidak ditampilkan di halaman publik:
   kalau warga tahu kriteria mana yang makin besar makin untung, jawabannya bisa
   diatur supaya skornya maksimal. Arah itu tetap terlihat oleh staf di menu
   Kelola Kriteria, yang memang perlu tahu.
   ─────────────────────────────────────────────────────────────────────────── */
const KRITERIA = [
  'Jumlah KK dalam satu rumah',
  'Jumlah anggota keluarga dalam satu rumah',
  'Pendidikan kepala keluarga',
  'Jumlah anggota keluarga masih sekolah',
  'Pengeluaran satu jiwa per bulan',
  'Penghasilan satu jiwa per bulan',
  'Status kepemilikan rumah',
  'Sumber air bersih',
  'Penerangan rumah',
  'Transportasi yang digunakan',
];

const ALUR = [
  {
    t: 'Daftar dan isi data diri',
    d: 'Nama, alamat, dan RT sesuai KTP. Pendaftaran gratis, dan Ketua RT bisa membantu kalau kesulitan memakai HP.',
  },
  {
    t: 'Jawab sepuluh pertanyaan',
    d: 'Soal kondisi rumah tangga sehari-hari: anggota keluarga, pendidikan, penghasilan, pengeluaran, rumah, air, listrik, dan transportasi.',
  },
  {
    t: 'Ketua RT memeriksa',
    d: 'RT memverifikasi jawaban Anda di wilayahnya. Setelah disetujui, sistem menghitung prioritas dengan metode SAW.',
  },
];

const SYARAT = [
  'Berdomisili di wilayah RW 08, Depok.',
  'Belum punya akun di BansosHub.',
  'Mengisi data sesuai KTP dan kondisi rumah tangga sebenarnya.',
];

const FAQS = [
  {
    q: 'Apakah data saya aman?',
    a: 'Data hanya dipakai untuk penilaian bantuan sosial. Yang bisa melihat hanya petugas berwenang di wilayah Anda: Ketua RT, Ketua RW, dan Admin.',
  },
  {
    q: 'Berapa lama prosesnya?',
    a: 'Setelah kuesioner dikirim, Ketua RT memverifikasi. Anda bisa memantau statusnya kapan saja dari akun Anda tanpa perlu bertanya berulang kali.',
  },
  {
    q: 'Saya butuh bantuan mengisi form, bagaimana?',
    a: 'Hubungi Ketua RT di wilayah Anda. Petugas bisa membantu pendaftaran dan pengisian kuesioner.',
  },
  {
    q: 'Bagaimana kalau lupa kata sandi?',
    a: 'Minta bantuan Ketua RT. Beliau dapat mengatur ulang kata sandi akun Anda.',
  },
  {
    q: 'Apakah saya harus punya HP sendiri?',
    a: 'Tidak wajib. Kalau tidak punya HP atau kesulitan memakainya, Ketua RT bisa menginput data Anda langsung dari dashboard RT.',
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const user = getUser();
  const pageRef = useRef(null);
  const stepRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);

  useScrollCraft(pageRef);

  /* Nomor langkah di atas rail pan. Penghitung ini membaca posisi kartu yang
     sebenarnya, bukan menghitung sendiri dari progres scroll: pemetaan
     floor(p * 3) meleset karena kartu terakhir sudah dominan sebelum p mencapai
     2/3. Yang dihitung adalah kartu yang paling banyak terlihat di viewport. */
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = () => {
      const cards = pageRef.current ? pageRef.current.querySelectorAll('.ld-step') : [];
      if (cards.length && stepRef.current) {
        const mid = window.innerWidth / 2;
        let best = 0;
        let bestDist = Infinity;
        cards.forEach((c, i) => {
          const r = c.getBoundingClientRect();
          // Kartu yang paling dekat ke tengah viewport adalah yang sedang dibaca.
          // Memakai luas-terlihat membuat dua kartu seri saat keduanya pas
          // setengah layar, dan seri itu membuat penghitung diam di angka lama.
          const dist = Math.abs((r.left + r.right) / 2 - mid);
          if (dist < bestDist) {
            bestDist = dist;
            best = i + 1;
          }
        });
        if (best !== last) {
          last = best;
          stepRef.current.textContent = String(best).padStart(2, '0');
          // Penanda di bawah rail menyala mengikuti langkah yang sama. Dua
          // indikator yang dibaca dari satu sumber tidak bisa saling bertentangan.
          const ticks = pageRef.current.querySelectorAll('.ld-pan__tick');
          ticks.forEach((t, i) => {
            t.dataset.on = i < best ? '1' : '0';
          });
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* Navigasi baru memakai latar penuh setelah hero terlewati. Di atas gambar ia
     tetap tembus pandang supaya artwork tidak terpotong garis keras di layar
     pertama, satu-satunya layar yang dilihat semua orang. */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.72);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Reveal untuk bagian kertas. Elemen [data-ld-reveal] mulai transparan; kalau
     IntersectionObserver tidak ada, semuanya langsung ditampilkan supaya tidak
     ada isi yang tidak terbaca. */
  useEffect(() => {
    const root = pageRef.current;
    if (!root) return undefined;
    const nodes = root.querySelectorAll('[data-ld-reveal]');
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((n) => n.classList.add('is-in'));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -12% 0px' }
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  /* Sudah login? Langsung ke dashboard sesuai peran. */
  if (user) {
    const routes = { admin: '/dashboard', rt: '/rt', rw: '/rw', warga: '/warga' };
    return <Navigate to={routes[user.role] || '/warga'} replace />;
  }

  const goLogin = () => navigate('/login');
  const goRegister = () => navigate('/register');
  const toTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="ld-page" ref={pageRef}>
      {/* ── NAV ── */}
      <header className={`ld-nav no-print${scrolled ? ' ld-nav--solid' : ''}`}>
        <div className="ld-wrap">
          <div className="ld-nav__inner">
            <button className="ld-brand" onClick={toTop} type="button">
              <span className="ld-brand__mark" aria-hidden="true">
                <IconHouse width="19" height="19" />
              </span>
              <span>
                <span className="ld-brand__name">BansosHub</span>
                <br />
                <span className="ld-brand__sub">Portal Bantuan Sosial RW 08</span>
              </span>
            </button>

            <div className="ld-nav__actions">
              <button className="ld-btn ld-btn--ghost ld-btn--sm" onClick={goLogin} type="button">
                <IconLogin width="16" height="16" /> Masuk
              </button>
              <button className="ld-btn ld-btn--primary ld-btn--sm" onClick={goRegister} type="button">
                Daftar
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── HERO ──
          Tiga plane bergerak dengan laju berbeda dan teks berjalan 1x. Selisih
          antar-plane sengaja kecil: selisih besar berhenti terbaca sebagai jarak
          dan mulai terbaca sebagai gambar yang bergeser sendiri.

          Hero dibungkus data-sc-act="flow" karena mesin hanya memindai
          [data-sc-parallax] di dalam sebuah act. Tanpa pembungkus ini ketiga
          plane tetap diam: atribut parallax-nya dibaca sebagai hiasan. Progres
          act flow dihitung dari (y + vh - top) / (height + vh), jadi nilainya
          bergerak dari 1 ke 0 saat hero meninggalkan layar, dan plane bergeser
          mengikuti selisih lajunya. */}
      <section className="ld-hero" id="atas" data-sc-act="flow">
        <img
          className="ld-hero__plane ld-hero__plane--back"
          src="/sc/hero-back-day.svg"
          alt=""
          width="1600"
          height="900"
          decoding="async"
          fetchPriority="high"
          data-sc-parallax="2.2"
        />
        <img
          className="ld-hero__plane ld-hero__plane--mid"
          src="/sc/hero-mid-day.svg"
          alt=""
          width="1600"
          height="900"
          decoding="async"
          data-sc-parallax="1.1"
        />
        <div className="ld-hero__scrim" aria-hidden="true" />
        <img
          className="ld-hero__plane ld-hero__plane--front"
          src="/sc/hero-front-day.svg"
          alt=""
          width="1600"
          height="900"
          decoding="async"
          data-sc-parallax="-0.45"
        />
        <div className="ld-hero__floor" aria-hidden="true" />

        <div className="ld-wrap ld-hero__copy">
          <p className="ld-hero__eyebrow" data-sc-cue="0 1 0 0">
            RW 08, Depok
          </p>
          <h1 className="ld-display ld-display--xl ld-hero__title" data-sc-cue="0 1 0 0">
            Daftar bansos dari HP, <em>tanpa bolak-balik</em> ke Ketua RT
          </h1>
          <p className="ld-lede ld-hero__lede" data-sc-cue="0 1 0 0">
            Isi kuesioner sendiri, lihat statusnya kapan saja. Sepuluh kriteria yang sama dipakai
            untuk semua warga, dihitung dengan metode SAW.
          </p>
          <div className="ld-hero__actions" data-sc-cue="0 1 0 0">
            <button className="ld-btn ld-btn--primary" onClick={goRegister} type="button">
              <IconUserPlus width="18" height="18" /> Daftar sebagai warga
            </button>
            <button className="ld-btn ld-btn--ghost" onClick={goLogin} type="button">
              Saya sudah punya akun
            </button>
          </div>
          <p className="ld-hero__note">
            <IconInfo width="16" height="16" style={{ flexShrink: 0, marginTop: 2 }} />
            Gratis. Kalau kesulitan memakai HP, Ketua RT bisa membantu mengisi.
          </p>
        </div>
      </section>

      {/* ── KRITERIA ── */}
      <section className="ld-sheet" id="kriteria">
        <div className="ld-wrap">
          <div className="ld-head" data-ld-reveal>
            <h2 className="ld-display ld-display--lg ld-head__title">
              Sepuluh kriteria, satu bobot untuk semua
            </h2>
            <p className="ld-body">
              Setiap warga dinilai dengan kriteria yang sama. Tidak ada penilaian berdasarkan kesan
              petugas, dan tidak ada yang bisa mengubah bobot untuk satu orang saja.
            </p>
          </div>

          <div className="ld-krit">
            {KRITERIA.map((k, i) => (
              <div className="ld-krit__row" key={k}>
                <span className="ld-krit__no">{String(i + 1).padStart(2, '0')}</span>
                <span className="ld-krit__name">{k}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ALUR: rail horizontal ──
          Scroll vertikal menggerakkan isi ke samping karena tiga langkah ini
          adalah rangkaian, bukan hierarki. Satu-satunya bagian halaman yang
          bergerak ke arah selain ke atas.

          Tiga penanda arah, karena rail tanpa penanda terbaca sebagai teks yang
          terpotong, bukan sebagai urutan yang bergerak:
          - hitungan langkah di atas rail, diperbarui dari progres act;
          - tepi kanan diberi kabut tipis supaya kartu berikutnya terlihat
            "masih ada di samping", bukan terpotong;
          - di HP rail tetap bisa digeser jari walau gerak dimatikan. */}
      <section className="ld-pan" data-sc-act="pan" data-sc-span="1.8" id="alur">
        <div className="ld-pan__stage" data-sc-stage>
          <div className="ld-pan__head ld-wrap">
            <h2 className="ld-display ld-display--md">Tiga langkah setelah mendaftar</h2>
            <p className="ld-pan__count" aria-live="polite">
              <span ref={stepRef}>01</span>
              <span className="ld-pan__count-sep" aria-hidden="true">/</span>
              <span>03</span>
            </p>
          </div>
          <div className="ld-pan__rail" data-sc-pan="0.7">
            {ALUR.map((a, i) => (
              <article className="ld-step" key={a.t} data-step={i + 1}>
                <h3 className="ld-step__title">{a.t}</h3>
                <p className="ld-step__body">{a.d}</p>
              </article>
            ))}
          </div>
          <div className="ld-pan__edge" aria-hidden="true" />
          <div className="ld-pan__ticks ld-wrap" aria-hidden="true">
            {ALUR.map((a) => (
              <span className="ld-pan__tick" key={`t-${a.t}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ── SYARAT ── */}
      <section className="ld-sheet ld-sheet--tight" id="syarat">
        <div className="ld-wrap">
          <div className="ld-syarat">
            <div data-ld-reveal>
              <h2 className="ld-display ld-display--lg ld-head__title">Siapa yang bisa mendaftar</h2>
              <ul className="ld-list">
                {SYARAT.map((s) => (
                  <li key={s}>
                    <IconCheck width="18" height="18" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div data-ld-reveal>
              <h2 className="ld-display ld-display--md ld-head__title">Satu hal yang perlu diingat</h2>
              <p className="ld-body">
                Sistem membandingkan jawaban Anda dengan warga lain di wilayah yang sama. Jawaban
                yang dilebih-lebihkan tetap dibandingkan dengan tetangga sekitar, dan Ketua RT
                memeriksa kebenarannya sebelum disetujui. Isi sesuai kondisi sebenarnya.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ: <details> asli, jadi Escape dan keyboard sudah benar sendiri ── */}
      <section className="ld-sheet" id="tanya">
        <div className="ld-wrap">
          <div className="ld-head" data-ld-reveal>
            <h2 className="ld-display ld-display--lg ld-head__title">
              Hal yang sering ditanyakan warga
            </h2>
          </div>
          <div className="ld-faq">
            {FAQS.map((f) => (
              <details className="ld-faq__item" key={f.q}>
                <summary className="ld-faq__q">
                  <span>{f.q}</span>
                  <IconChevron className="ld-faq__chev" width="18" height="18" />
                </summary>
                <div className="ld-faq__a">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── PENUTUP ── */}
      <section className="ld-close">
        <div className="ld-wrap">
          <div className="ld-close__inner">
            <h2 className="ld-display ld-display--lg ld-close__title">Siap mendaftar sekarang?</h2>
            <button className="ld-btn ld-btn--ink" onClick={goRegister} type="button">
              Mulai daftar <IconArrow width="17" height="17" />
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="ld-foot">
        <div className="ld-wrap">
          <div className="ld-foot__inner">
            <div>
              <div className="ld-foot__brand">BansosHub · RW 08, Depok</div>
              <div className="ld-foot__text">
                Sistem pendukung keputusan penerima bantuan sosial dengan metode Simple Additive
                Weighting. Dikelola bersama oleh Ketua RT, Ketua RW, dan Admin wilayah.
              </div>
            </div>
            <button className="ld-btn ld-btn--ghost ld-btn--sm" onClick={goLogin} type="button">
              <IconLogin width="16" height="16" /> Masuk ke akun Anda
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
