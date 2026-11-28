import { useEffect } from 'react';

/* ─── Pemasangan mesin scroll ────────────────────────────────────────────────
   scrollcraft.js menulis ke atribut data-sc-* dan menganimasikan elemen yang
   ada di DOM saat mount(). React membuat DOM setelah commit, jadi mesin hanya
   boleh dipasang di useEffect, dan wajib di-destroy saat unmount: tanpa itu
   setiap navigasi meninggalkan satu instance dengan dua loop rAF yang jalan
   terus selama tab hidup.

   Mesin ini dimuat sebagai script biasa dari /public/sc/scrollcraft.js (bukan
   ESM), jadi ia menempel ke window.ScrollCraft. Kalau file itu gagal dimuat,
   halaman tetap harus terbaca: semua elemen [data-sc-cue] akan tertinggal di
   opacity 0. Karena itu kegagalan pemuatan diperlakukan sebagai "gerak mati":
   kelas .ld-nomotion dipasang dan CSS mengembalikan semua elemen ke keadaan
   terlihat.
   ─────────────────────────────────────────────────────────────────────────── */
export default function useScrollCraft(rootRef, deps = []) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    let api = null;
    let cancelled = false;

    const mount = () => {
      if (cancelled || !rootRef.current) return;
      const SC = window.ScrollCraft;
      if (!SC || typeof SC.mount !== 'function') {
        // Skrip tidak ada atau tidak jalan: tampilkan semuanya tanpa gerak.
        rootRef.current.classList.add('ld-nomotion');
        return;
      }
      api = SC.mount(rootRef.current);
    };

    if (window.ScrollCraft) {
      mount();
    } else {
      // Muat sekali, tunggu selesai, lalu pasang. data-ld-engine menandai script
      // yang sudah disisipkan supaya mount kedua tidak menambah tag baru.
      let tag = document.querySelector('script[data-ld-engine]');
      if (!tag) {
        tag = document.createElement('script');
        tag.src = '/sc/scrollcraft.js';
        tag.async = true;
        tag.dataset.ldEngine = '1';
        document.head.appendChild(tag);
      }
      const onLoad = () => mount();
      const onError = () => {
        if (rootRef.current) rootRef.current.classList.add('ld-nomotion');
      };
      tag.addEventListener('load', onLoad, { once: true });
      tag.addEventListener('error', onError, { once: true });
    }

    return () => {
      cancelled = true;
      if (api && typeof api.destroy === 'function') api.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
