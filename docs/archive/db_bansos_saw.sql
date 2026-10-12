-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 09, 2026 at 10:25 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_bansos_saw`
--

-- --------------------------------------------------------

--
-- Table structure for table `activity_logs`
--

CREATE TABLE `activity_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_name` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL,
  `aksi` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `activity_logs`
--

INSERT INTO `activity_logs` (`id`, `user_name`, `role`, `aksi`, `created_at`, `updated_at`) VALUES
(1, 'Administrator Sistem', 'admin', 'Update akun: Wildan Humaidi (role: warga)', '2026-05-27 11:28:49', '2026-05-27 11:28:49'),
(2, 'Administrator Sistem', 'admin', 'Update akun: afriza (role: warga)', '2026-05-27 11:29:13', '2026-05-27 11:29:13'),
(3, 'Administrator Sistem', 'admin', 'Update akun: Wildan Humaidi (role: warga)', '2026-05-27 11:29:30', '2026-05-27 11:29:30'),
(4, 'Administrator Sistem', 'admin', 'Update kriteria C1: Jumlah KK dalam 1 Rumah, bobot=20, tipe=benefit', '2026-06-05 06:50:14', '2026-06-05 06:50:14'),
(5, 'Administrator Sistem', 'admin', 'Update kriteria C9: Penerangan Rumah, bobot=5, tipe=cost', '2026-06-05 06:50:25', '2026-06-05 06:50:25'),
(6, 'Administrator Sistem', 'admin', 'Update kriteria C8: Sumber Air Bersih, bobot=5, tipe=cost', '2026-06-05 06:50:37', '2026-06-05 06:50:37'),
(7, 'Ketua RT 003', 'rt', 'Ubah status pengajuan #283 menjadi: ditolak', '2026-06-05 07:27:35', '2026-06-05 07:27:35'),
(8, 'Ketua RT 003', 'rt', 'Ubah status pengajuan #277 menjadi: disetujui', '2026-06-05 07:27:40', '2026-06-05 07:27:40'),
(9, 'Ketua RT 003', 'rt', 'Ubah status pengajuan #277 menjadi: disetujui', '2026-06-05 07:27:42', '2026-06-05 07:27:42'),
(10, 'Ketua RT 003', 'rt', 'Ubah status pengajuan #277 menjadi: ditolak', '2026-06-05 07:27:45', '2026-06-05 07:27:45'),
(11, 'Administrator Sistem', 'admin', 'Update kriteria C1: Jumlah KK dalam 1 Rumah, bobot=10, tipe=benefit', '2026-06-06 12:36:14', '2026-06-06 12:36:14'),
(12, 'Administrator Sistem', 'admin', 'Update kriteria C8: Sumber Air Bersih, bobot=10, tipe=cost', '2026-06-06 12:36:23', '2026-06-06 12:36:23'),
(13, 'Administrator Sistem', 'admin', 'Update kriteria C9: Penerangan Rumah, bobot=10, tipe=cost', '2026-06-06 12:36:37', '2026-06-06 12:36:37');

-- --------------------------------------------------------

--
-- Table structure for table `kriteria`
--

CREATE TABLE `kriteria` (
  `id_kriteria` bigint(20) UNSIGNED NOT NULL,
  `nama_kriteria` varchar(255) NOT NULL,
  `tipe` enum('benefit','cost') NOT NULL,
  `bobot` double NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `kriteria`
--

INSERT INTO `kriteria` (`id_kriteria`, `nama_kriteria`, `tipe`, `bobot`, `created_at`, `updated_at`) VALUES
(1, 'Jumlah KK dalam 1 Rumah', 'benefit', 10, '2026-04-29 19:03:02', '2026-06-06 12:36:14'),
(2, 'Jumlah Anggota Keluarga dalam 1 Rumah', 'benefit', 10, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(3, 'Pendidikan Kepala Keluarga (KK)', 'cost', 10, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(4, 'Jumlah Anggota Keluarga Masih Sekolah', 'benefit', 10, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(5, 'Pengeluaran Satu Jiwa dalam Keluarga Perbulan', 'cost', 10, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(6, 'Penghasilan Satu Jiwa dalam Keluarga Perbulan', 'cost', 10, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(7, 'Status Kepemilikan Rumah', 'cost', 10, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(8, 'Sumber Air Bersih', 'cost', 10, '2026-04-29 19:03:02', '2026-06-06 12:36:23'),
(9, 'Penerangan Rumah', 'cost', 10, '2026-04-29 19:03:02', '2026-06-06 12:36:37'),
(10, 'Transportasi', 'cost', 10, '2026-04-29 19:03:03', '2026-04-29 19:03:03');

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '2026_04_29_051351_create_kriteria_table', 1),
(3, '2026_04_29_051359_create_sub_kriteria_table', 1),
(4, '2026_04_29_051359_create_warga_table', 1),
(5, '2026_04_29_051400_create_pengajuan_table', 1),
(6, '2026_04_29_051401_create_penilaian_table', 1),
(7, '2026_04_29_051401_create_pesan_chat_table', 1),
(8, '2026_04_29_062911_create_personal_access_tokens_table', 1),
(9, '2026_04_30_025406_create_activity_logs_table', 2);

-- --------------------------------------------------------

--
-- Table structure for table `pengajuan`
--

CREATE TABLE `pengajuan` (
  `id_pengajuan` bigint(20) UNSIGNED NOT NULL,
  `id_warga` bigint(20) UNSIGNED NOT NULL,
  `status` enum('menunggu','disetujui','ditolak') DEFAULT 'menunggu',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `jawaban_mentah` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `pengajuan`
--

INSERT INTO `pengajuan` (`id_pengajuan`, `id_warga`, `status`, `created_at`, `updated_at`, `jawaban_mentah`) VALUES
(188, 188, 'disetujui', '2026-05-04 11:07:37', '2026-05-09 22:46:50', '{\"q1\":\"1 KK\",\"q2\":\"5 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"1 ORANG\",\"q5\":\"> RP. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK  > 900 WATT\",\"q10\":\"SEPEDA MOTOR LEBIH DARI 1 UNIT DALAM KONDISI BAIK\"}'),
(189, 189, 'disetujui', '2026-05-04 11:07:37', '2026-05-09 22:46:50', '{\"q1\":\"2 KK\",\"q2\":\">= 6 ORANG\",\"q3\":\"SEKOLAH MENENGAH PERTAMA (SMP)\",\"q4\":\"2 ORANG\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q7\":\"MILIK ORANG TUA\\/ SAUDARA \\/KELUARGA\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK 900 WATT\",\"q10\":\"JALAN KAKI \\/ SEPEDA \\/ SEPEDA MOTOR SEADANYA \\/ TRANSPORTASI UMUM\"}'),
(190, 190, 'disetujui', '2026-05-04 11:07:38', '2026-05-09 22:46:50', '{\"q1\":\"1 KK\",\"q2\":\"5 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"1 ORANG\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"RP. 1.500.000 - Rp. 3.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK 900 WATT\",\"q10\":\"SEPEDA MOTOR 1 UNIT DALAM KONDISI BAIK\"}'),
(191, 191, 'disetujui', '2026-05-04 11:07:39', '2026-05-09 22:46:50', '{\"q1\":\"3 KK\",\"q2\":\"1 - 3 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"1 ORANG\",\"q5\":\"Rp. 1.500.000 - Rp. 3.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK  > 900 WATT\",\"q10\":\"SEPEDA MOTOR 1 UNIT DALAM KONDISI BAIK\"}'),
(192, 192, 'disetujui', '2026-05-04 11:07:39', '2026-05-09 22:46:50', '{\"q1\":\"2 KK\",\"q2\":\"1 - 3 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"1 ORANG\",\"q5\":\"> RP. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK  > 900 WATT\",\"q10\":\"SEPEDA MOTOR 1 UNIT DALAM KONDISI BAIK\"}'),
(193, 193, 'disetujui', '2026-05-04 11:07:40', '2026-05-09 22:46:50', '{\"q1\":\"1 KK\",\"q2\":\">= 6 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"1 ORANG\",\"q5\":\"Rp. 1.500.000 - Rp. 3.000.000\",\"q6\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK 900 WATT\",\"q10\":\"SEPEDA MOTOR 1 UNIT DALAM KONDISI BAIK\"}'),
(194, 194, 'disetujui', '2026-05-04 11:07:40', '2026-05-09 22:46:50', '{\"q1\":\"1 KK\",\"q2\":\"1 - 3 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"1 ORANG\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK 900 WATT\",\"q10\":\"SEPEDA MOTOR 1 UNIT DALAM KONDISI BAIK\"}'),
(195, 195, 'disetujui', '2026-05-04 11:07:41', '2026-05-09 22:46:50', '{\"q1\":\"1 KK\",\"q2\":\"5 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"2 ORANG\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q7\":\"SEWA \\/ KONTRAK\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK 900 WATT\",\"q10\":\"SEPEDA MOTOR LEBIH DARI 1 UNIT DALAM KONDISI BAIK\"}'),
(196, 196, 'disetujui', '2026-05-04 11:07:42', '2026-05-09 22:46:50', '{\"q1\":\"1 KK\",\"q2\":\"4 ORANG\",\"q3\":\"SEKOLAH MENENGAH PERTAMA (SMP)\",\"q4\":\"1 ORANG\",\"q5\":\"< RP. 1.500.000\",\"q6\":\"< Rp. 1.500.000\",\"q7\":\"SEWA \\/ KONTRAK\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"SEPEDA MOTOR 1 UNIT DALAM KONDISI BAIK\"}'),
(197, 197, 'disetujui', '2026-05-04 11:07:42', '2026-05-09 22:46:50', '{\"q1\":\"2 KK\",\"q2\":\"5 ORANG\",\"q3\":\"TIDAK SEKOLAH \\/ TIDAK TAMAT SEKOLAH DASAR (SD)\",\"q4\":\"2 ORANG\",\"q5\":\"Rp. 1.500.000 - Rp. 3.000.000\",\"q6\":\"RP. 1.500.000 - Rp. 3.000.000\",\"q7\":\"MENUMPANG \\/ TIDAK MEMILIKI TEMPAT TINGGAL\",\"q8\":\"MENUMPANG\\/ TIDAK MELIKI SUMBER AIR\",\"q9\":\"LISTRIK NUMPANG\",\"q10\":\"JALAN KAKI \\/ SEPEDA \\/ SEPEDA MOTOR SEADANYA \\/ TRANSPORTASI UMUM\"}'),
(198, 198, 'disetujui', '2026-05-04 11:07:43', '2026-05-09 22:46:50', '{\"q1\":\"2 KK\",\"q2\":\"5 ORANG\",\"q3\":\"SEKOLAH DASAR (SD)\",\"q4\":\"2 ORANG\",\"q5\":\"Rp. 1.500.000 - Rp. 3.000.000\",\"q6\":\"RP. 1.500.000 - Rp. 3.000.000\",\"q7\":\"MILIK ORANG TUA\\/ SAUDARA \\/KELUARGA\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK 900 WATT\",\"q10\":\"SEPEDA MOTOR 1 UNIT DALAM KONDISI BAIK\"}'),
(199, 199, 'disetujui', '2026-05-04 11:07:43', '2026-05-09 22:46:50', '{\"q1\":\"2 KK\",\"q2\":\"5 ORANG\",\"q3\":\"TIDAK SEKOLAH \\/ TIDAK TAMAT SEKOLAH DASAR (SD)\",\"q4\":\"2 ORANG\",\"q5\":\"Rp. 1.500.000 - Rp. 3.000.000\",\"q6\":\"RP. 1.500.000 - Rp. 3.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK 900 WATT\",\"q10\":\"SEPEDA MOTOR 1 UNIT DALAM KONDISI BAIK\"}'),
(200, 200, 'disetujui', '2026-05-04 11:07:44', '2026-05-09 22:46:50', '{\"q1\":\"2 KK\",\"q2\":\"5 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"2 ORANG\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q7\":\"MILIK ORANG TUA\\/ SAUDARA \\/KELUARGA\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK 900 WATT\",\"q10\":\"SEPEDA MOTOR LEBIH DARI 1 UNIT DALAM KONDISI BAIK\"}'),
(201, 201, 'disetujui', '2026-05-04 11:07:45', '2026-05-09 22:46:50', '{\"q1\":\"1 KK\",\"q2\":\"1 - 3 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"1 ORANG\",\"q5\":\"Rp. 1.500.000 - Rp. 3.000.000\",\"q6\":\"RP. 1.500.000 - Rp. 3.000.000\",\"q7\":\"SEWA \\/ KONTRAK\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"JALAN KAKI \\/ SEPEDA \\/ SEPEDA MOTOR SEADANYA \\/ TRANSPORTASI UMUM\"}'),
(202, 202, 'disetujui', '2026-05-04 11:07:45', '2026-05-09 22:46:50', '{\"q1\":\"1 KK\",\"q2\":\"5 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"2 ORANG\",\"q5\":\"Rp. 1.500.000 - Rp. 3.000.000\",\"q6\":\"RP. 1.500.000 - Rp. 3.000.000\",\"q7\":\"SEWA \\/ KONTRAK\",\"q8\":\"MENUMPANG\\/ TIDAK MELIKI SUMBER AIR\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"SEPEDA MOTOR 1 UNIT DALAM KONDISI BAIK\"}'),
(203, 203, 'disetujui', '2026-05-04 11:07:46', '2026-05-09 22:46:50', '{\"q1\":\"2 KK\",\"q2\":\">= 6 ORANG\",\"q3\":\"TIDAK SEKOLAH \\/ TIDAK TAMAT SEKOLAH DASAR (SD)\",\"q4\":\"2 ORANG\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"RP. 1.500.000 - Rp. 3.000.000\",\"q7\":\"MILIK ORANG TUA\\/ SAUDARA \\/KELUARGA\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK 900 WATT\",\"q10\":\"SEPEDA MOTOR LEBIH DARI 1 UNIT DALAM KONDISI BAIK\"}'),
(204, 204, 'disetujui', '2026-05-04 11:07:47', '2026-05-09 22:46:50', '{\"q1\":\"2 KK\",\"q2\":\"5 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"1 ORANG\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"SEPEDA MOTOR LEBIH DARI 1 UNIT DALAM KONDISI BAIK\"}'),
(205, 205, 'disetujui', '2026-05-04 11:07:47', '2026-05-09 22:46:50', '{\"q1\":\"1 KK\",\"q2\":\"1 - 3 ORANG\",\"q3\":\"SEKOLAH MENENGAH PERTAMA (SMP)\",\"q4\":\"1 ORANG\",\"q5\":\"Rp. 1.500.000 - Rp. 3.000.000\",\"q6\":\"RP. 1.500.000 - Rp. 3.000.000\",\"q7\":\"SEWA \\/ KONTRAK\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"JALAN KAKI \\/ SEPEDA \\/ SEPEDA MOTOR SEADANYA \\/ TRANSPORTASI UMUM\"}'),
(206, 206, 'disetujui', '2026-05-04 11:07:48', '2026-05-09 22:46:50', '{\"q1\":\"2 KK\",\"q2\":\"4 ORANG\",\"q3\":\"TIDAK SEKOLAH \\/ TIDAK TAMAT SEKOLAH DASAR (SD)\",\"q4\":\"1 ORANG\",\"q5\":\"< RP. 1.500.000\",\"q6\":\"< Rp. 1.500.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"JALAN KAKI \\/ SEPEDA \\/ SEPEDA MOTOR SEADANYA \\/ TRANSPORTASI UMUM\"}'),
(207, 207, 'disetujui', '2026-05-04 11:07:48', '2026-05-09 22:46:50', '{\"q1\":\"3 KK\",\"q2\":\">= 6 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"2 ORANG\",\"q5\":\"> RP. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK 900 WATT\",\"q10\":\"MOBIL\"}'),
(208, 208, 'disetujui', '2026-05-04 11:07:49', '2026-05-09 22:46:50', '{\"q1\":\"2 KK\",\"q2\":\"5 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"2 ORANG\",\"q5\":\"> RP. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"MILIK ORANG TUA\\/ SAUDARA \\/KELUARGA\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"SEPEDA MOTOR LEBIH DARI 1 UNIT DALAM KONDISI BAIK\"}'),
(209, 209, 'disetujui', '2026-05-04 11:07:50', '2026-05-09 22:46:50', '{\"q1\":\"2 KK\",\"q2\":\"5 ORANG\",\"q3\":\"TIDAK SEKOLAH \\/ TIDAK TAMAT SEKOLAH DASAR (SD)\",\"q4\":\"2 ORANG\",\"q5\":\"Rp. 1.500.000 - Rp. 3.000.000\",\"q6\":\"RP. 1.500.000 - Rp. 3.000.000\",\"q7\":\"MILIK ORANG TUA\\/ SAUDARA \\/KELUARGA\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"JALAN KAKI \\/ SEPEDA \\/ SEPEDA MOTOR SEADANYA \\/ TRANSPORTASI UMUM\"}'),
(210, 210, 'disetujui', '2026-05-04 11:07:50', '2026-05-09 22:46:50', '{\"q1\":\"2 KK\",\"q2\":\">= 6 ORANG\",\"q3\":\"TIDAK SEKOLAH \\/ TIDAK TAMAT SEKOLAH DASAR (SD)\",\"q4\":\"2 ORANG\",\"q5\":\"Rp. 1.500.000 - Rp. 3.000.000\",\"q6\":\"RP. 1.500.000 - Rp. 3.000.000\",\"q7\":\"MILIK ORANG TUA\\/ SAUDARA \\/KELUARGA\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK 900 WATT\",\"q10\":\"SEPEDA MOTOR 1 UNIT DALAM KONDISI BAIK\"}'),
(211, 211, 'disetujui', '2026-05-04 11:07:51', '2026-05-09 22:46:50', '{\"q1\":\"1 KK\",\"q2\":\"1 - 3 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"1 ORANG\",\"q5\":\"Rp. 1.500.000 - Rp. 3.000.000\",\"q6\":\"RP. 1.500.000 - Rp. 3.000.000\",\"q7\":\"SEWA \\/ KONTRAK\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"JALAN KAKI \\/ SEPEDA \\/ SEPEDA MOTOR SEADANYA \\/ TRANSPORTASI UMUM\"}'),
(212, 212, 'disetujui', '2026-05-04 11:07:51', '2026-05-09 22:46:50', '{\"q1\":\"1 KK\",\"q2\":\"5 ORANG\",\"q3\":\"TIDAK SEKOLAH \\/ TIDAK TAMAT SEKOLAH DASAR (SD)\",\"q4\":\"1 ORANG\",\"q5\":\"Rp. 1.500.000 - Rp. 3.000.000\",\"q6\":\"RP. 1.500.000 - Rp. 3.000.000\",\"q7\":\"SEWA \\/ KONTRAK\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"JALAN KAKI \\/ SEPEDA \\/ SEPEDA MOTOR SEADANYA \\/ TRANSPORTASI UMUM\"}'),
(213, 213, 'disetujui', '2026-05-04 11:07:52', '2026-05-09 22:46:50', '{\"q1\":\"2 KK\",\"q2\":\"5 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"1 ORANG\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK 900 WATT\",\"q10\":\"MOBIL\"}'),
(214, 214, 'disetujui', '2026-05-04 11:07:53', '2026-05-09 22:46:50', '{\"q1\":\"1 KK\",\"q2\":\"1 - 3 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"TIDAK ADA\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q7\":\"MILIK ORANG TUA\\/ SAUDARA \\/KELUARGA\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"SEPEDA MOTOR LEBIH DARI 1 UNIT DALAM KONDISI BAIK\"}'),
(215, 215, 'disetujui', '2026-05-04 11:07:53', '2026-05-09 22:46:50', '{\"q1\":\"1 KK\",\"q2\":\"5 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"2 ORANG\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q7\":\"SEWA \\/ KONTRAK\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"JALAN KAKI \\/ SEPEDA \\/ SEPEDA MOTOR SEADANYA \\/ TRANSPORTASI UMUM\"}'),
(216, 216, 'disetujui', '2026-05-04 11:07:54', '2026-05-09 22:46:50', '{\"q1\":\"1 KK\",\"q2\":\"4 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"2 ORANG\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q7\":\"SEWA \\/ KONTRAK\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"SEPEDA MOTOR 1 UNIT DALAM KONDISI BAIK\"}'),
(217, 217, 'disetujui', '2026-05-04 11:07:55', '2026-05-09 22:46:50', '{\"q1\":\"> 3 KK\",\"q2\":\">= 6 ORANG\",\"q3\":\"SEKOLAH DASAR (SD)\",\"q4\":\">= 3 ORANG\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK 900 WATT\",\"q10\":\"SEPEDA MOTOR LEBIH DARI 1 UNIT DALAM KONDISI BAIK\"}'),
(218, 218, 'disetujui', '2026-05-04 11:07:55', '2026-05-09 22:46:50', '{\"q1\":\"1 KK\",\"q2\":\"5 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"2 ORANG\",\"q5\":\"Rp. 1.500.000 - Rp. 3.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"SEWA \\/ KONTRAK\",\"q8\":\"MENUMPANG\\/ TIDAK MELIKI SUMBER AIR\",\"q9\":\"LISTRIK NUMPANG\",\"q10\":\"SEPEDA MOTOR 1 UNIT DALAM KONDISI BAIK\"}'),
(219, 219, 'disetujui', '2026-05-04 11:07:56', '2026-05-09 22:46:50', '{\"q1\":\"2 KK\",\"q2\":\"5 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"2 ORANG\",\"q5\":\"> RP. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK 900 WATT\",\"q10\":\"MOBIL\"}'),
(220, 220, 'disetujui', '2026-05-04 11:07:56', '2026-05-09 22:46:50', '{\"q1\":\"2 KK\",\"q2\":\">= 6 ORANG\",\"q3\":\"SEKOLAH MENENGAH PERTAMA (SMP)\",\"q4\":\"TIDAK ADA\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"RP. 1.500.000 - Rp. 3.000.000\",\"q7\":\"MILIK ORANG TUA\\/ SAUDARA \\/KELUARGA\",\"q8\":\"MENUMPANG\\/ TIDAK MELIKI SUMBER AIR\",\"q9\":\"LISTRIK 900 WATT\",\"q10\":\"JALAN KAKI \\/ SEPEDA \\/ SEPEDA MOTOR SEADANYA \\/ TRANSPORTASI UMUM\"}'),
(221, 221, 'disetujui', '2026-05-04 11:07:57', '2026-05-09 22:46:50', '{\"q1\":\"2 KK\",\"q2\":\"5 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"2 ORANG\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q7\":\"MILIK ORANG TUA\\/ SAUDARA \\/KELUARGA\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"JALAN KAKI \\/ SEPEDA \\/ SEPEDA MOTOR SEADANYA \\/ TRANSPORTASI UMUM\"}'),
(222, 222, 'disetujui', '2026-05-04 11:07:58', '2026-05-09 22:46:50', '{\"q1\":\"1 KK\",\"q2\":\"1 - 3 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"1 ORANG\",\"q5\":\"Rp. 1.500.000 - Rp. 3.000.000\",\"q6\":\"RP. 1.500.000 - Rp. 3.000.000\",\"q7\":\"SEWA \\/ KONTRAK\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"JALAN KAKI \\/ SEPEDA \\/ SEPEDA MOTOR SEADANYA \\/ TRANSPORTASI UMUM\"}'),
(223, 223, 'disetujui', '2026-05-04 11:07:58', '2026-05-09 22:46:50', '{\"q1\":\"1 KK\",\"q2\":\"4 ORANG\",\"q3\":\"SEKOLAH MENENGAH PERTAMA (SMP)\",\"q4\":\"2 ORANG\",\"q5\":\"Rp. 1.500.000 - Rp. 3.000.000\",\"q6\":\"RP. 1.500.000 - Rp. 3.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK 900 WATT\",\"q10\":\"MOBIL\"}'),
(224, 224, 'disetujui', '2026-05-04 11:07:59', '2026-05-09 22:46:50', '{\"q1\":\"1 KK\",\"q2\":\"4 ORANG\",\"q3\":\"SEKOLAH DASAR (SD)\",\"q4\":\"TIDAK ADA\",\"q5\":\"< RP. 1.500.000\",\"q6\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q7\":\"MENUMPANG \\/ TIDAK MEMILIKI TEMPAT TINGGAL\",\"q8\":\"MENUMPANG\\/ TIDAK MELIKI SUMBER AIR\",\"q9\":\"LISTRIK NUMPANG\",\"q10\":\"JALAN KAKI \\/ SEPEDA \\/ SEPEDA MOTOR SEADANYA \\/ TRANSPORTASI UMUM\"}'),
(225, 225, 'disetujui', '2026-05-04 11:07:59', '2026-05-09 22:46:50', '{\"q1\":\"> 3 KK\",\"q2\":\"5 ORANG\",\"q3\":\"SEKOLAH DASAR (SD)\",\"q4\":\">= 3 ORANG\",\"q5\":\"Rp. 1.500.000 - Rp. 3.000.000\",\"q6\":\"RP. 1.500.000 - Rp. 3.000.000\",\"q7\":\"SEWA \\/ KONTRAK\",\"q8\":\"MENUMPANG\\/ TIDAK MELIKI SUMBER AIR\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"JALAN KAKI \\/ SEPEDA \\/ SEPEDA MOTOR SEADANYA \\/ TRANSPORTASI UMUM\"}'),
(226, 226, 'disetujui', '2026-05-04 11:08:00', '2026-05-09 22:46:50', '{\"q1\":\"1 KK\",\"q2\":\"1 - 3 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"1 ORANG\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q7\":\"SEWA \\/ KONTRAK\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"SEPEDA MOTOR 1 UNIT DALAM KONDISI BAIK\"}'),
(227, 227, 'disetujui', '2026-05-04 11:08:01', '2026-05-09 22:46:50', '{\"q1\":\"1 KK\",\"q2\":\"1 - 3 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"TIDAK ADA\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"AIR KEMASAN \\/ AIR GALON\",\"q9\":\"LISTRIK  > 900 WATT\",\"q10\":\"MOBIL\"}'),
(228, 228, 'disetujui', '2026-05-04 11:08:01', '2026-05-09 22:46:50', '{\"q1\":\"> 3 KK\",\"q2\":\">= 6 ORANG\",\"q3\":\"TIDAK SEKOLAH \\/ TIDAK TAMAT SEKOLAH DASAR (SD)\",\"q4\":\"TIDAK ADA\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q7\":\"MILIK ORANG TUA\\/ SAUDARA \\/KELUARGA\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK NUMPANG\",\"q10\":\"SEPEDA MOTOR 1 UNIT DALAM KONDISI BAIK\"}'),
(229, 229, 'disetujui', '2026-05-04 11:08:02', '2026-05-09 22:46:50', '{\"q1\":\"3 KK\",\"q2\":\">= 6 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\">= 3 ORANG\",\"q5\":\"> RP. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK 900 WATT\",\"q10\":\"MOBIL\"}'),
(230, 230, 'disetujui', '2026-05-04 11:08:03', '2026-05-09 22:46:50', '{\"q1\":\"1 KK\",\"q2\":\"4 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"2 ORANG\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q7\":\"SEWA \\/ KONTRAK\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"SEPEDA MOTOR 1 UNIT DALAM KONDISI BAIK\"}'),
(231, 231, 'disetujui', '2026-05-04 11:08:03', '2026-05-09 22:46:50', '{\"q1\":\"2 KK\",\"q2\":\"4 ORANG\",\"q3\":\"SEKOLAH MENENGAH PERTAMA (SMP)\",\"q4\":\"1 ORANG\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK 900 WATT\",\"q10\":\"SEPEDA MOTOR LEBIH DARI 1 UNIT DALAM KONDISI BAIK\"}'),
(232, 232, 'disetujui', '2026-05-04 11:08:04', '2026-05-09 22:46:50', '{\"q1\":\"1 KK\",\"q2\":\"4 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"1 ORANG\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"SEPEDA MOTOR LEBIH DARI 1 UNIT DALAM KONDISI BAIK\"}'),
(233, 233, 'disetujui', '2026-05-04 11:08:04', '2026-05-09 22:46:50', '{\"q1\":\"3 KK\",\"q2\":\">= 6 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\">= 3 ORANG\",\"q5\":\"> RP. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"SEPEDA MOTOR LEBIH DARI 1 UNIT DALAM KONDISI BAIK\"}'),
(234, 234, 'disetujui', '2026-05-04 11:08:05', '2026-05-09 22:46:50', '{\"q1\":\"1 KK\",\"q2\":\"5 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\">= 3 ORANG\",\"q5\":\"> RP. 5.000.000\",\"q6\":\"< Rp. 1.500.000\",\"q7\":\"SEWA \\/ KONTRAK\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK  > 900 WATT\",\"q10\":\"SEPEDA MOTOR LEBIH DARI 1 UNIT DALAM KONDISI BAIK\"}'),
(235, 235, 'disetujui', '2026-05-04 11:08:06', '2026-05-09 22:46:50', '{\"q1\":\"1 KK\",\"q2\":\">= 6 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"2 ORANG\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"AIR KEMASAN \\/ AIR GALON\",\"q9\":\"LISTRIK  > 900 WATT\",\"q10\":\"MOBIL\"}'),
(236, 236, 'disetujui', '2026-05-04 11:08:07', '2026-05-09 22:46:50', '{\"q1\":\"1 KK\",\"q2\":\"1 - 3 ORANG\",\"q3\":\"TIDAK SEKOLAH \\/ TIDAK TAMAT SEKOLAH DASAR (SD)\",\"q4\":\"TIDAK ADA\",\"q5\":\"< RP. 1.500.000\",\"q6\":\"< Rp. 1.500.000\",\"q7\":\"MILIK ORANG TUA\\/ SAUDARA \\/KELUARGA\",\"q8\":\"MENUMPANG\\/ TIDAK MELIKI SUMBER AIR\",\"q9\":\"LISTRIK NUMPANG\",\"q10\":\"JALAN KAKI \\/ SEPEDA \\/ SEPEDA MOTOR SEADANYA \\/ TRANSPORTASI UMUM\"}'),
(237, 237, 'disetujui', '2026-05-04 11:08:08', '2026-05-09 22:46:50', '{\"q1\":\"1 KK\",\"q2\":\"1 - 3 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"1 ORANG\",\"q5\":\"> RP. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"MILIK ORANG TUA\\/ SAUDARA \\/KELUARGA\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK 900 WATT\",\"q10\":\"MOBIL\"}'),
(238, 238, 'disetujui', '2026-05-04 11:08:08', '2026-05-09 22:46:50', '{\"q1\":\"2 KK\",\"q2\":\"1 - 3 ORANG\",\"q3\":\"SEKOLAH MENENGAH PERTAMA (SMP)\",\"q4\":\"2 ORANG\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"RP. 1.500.000 - Rp. 3.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"AIR KEMASAN \\/ AIR GALON\",\"q9\":\"LISTRIK NUMPANG\",\"q10\":\"JALAN KAKI \\/ SEPEDA \\/ SEPEDA MOTOR SEADANYA \\/ TRANSPORTASI UMUM\"}'),
(239, 239, 'disetujui', '2026-05-04 11:08:09', '2026-05-09 22:46:50', '{\"q1\":\"1 KK\",\"q2\":\"5 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\">= 3 ORANG\",\"q5\":\"> RP. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK 900 WATT\",\"q10\":\"MOBIL\"}'),
(240, 240, 'disetujui', '2026-05-04 11:08:10', '2026-05-09 22:46:50', '{\"q1\":\"2 KK\",\"q2\":\"4 ORANG\",\"q3\":\"SEKOLAH MENENGAH PERTAMA (SMP)\",\"q4\":\"2 ORANG\",\"q5\":\"Rp. 1.500.000 - Rp. 3.000.000\",\"q6\":\"RP. 1.500.000 - Rp. 3.000.000\",\"q7\":\"MENUMPANG \\/ TIDAK MEMILIKI TEMPAT TINGGAL\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK NUMPANG\",\"q10\":\"JALAN KAKI \\/ SEPEDA \\/ SEPEDA MOTOR SEADANYA \\/ TRANSPORTASI UMUM\"}'),
(241, 241, 'disetujui', '2026-05-04 11:08:10', '2026-05-09 22:46:50', '{\"q1\":\"> 3 KK\",\"q2\":\"4 ORANG\",\"q3\":\"SEKOLAH MENENGAH PERTAMA (SMP)\",\"q4\":\">= 3 ORANG\",\"q5\":\"< RP. 1.500.000\",\"q6\":\"RP. 1.500.000 - Rp. 3.000.000\",\"q7\":\"MILIK ORANG TUA\\/ SAUDARA \\/KELUARGA\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK NUMPANG\",\"q10\":\"SEPEDA MOTOR 1 UNIT DALAM KONDISI BAIK\"}'),
(242, 242, 'disetujui', '2026-05-04 11:08:11', '2026-05-09 22:46:50', '{\"q1\":\"3 KK\",\"q2\":\">= 6 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\">= 3 ORANG\",\"q5\":\"> RP. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK 900 WATT\",\"q10\":\"MOBIL\"}'),
(243, 243, 'disetujui', '2026-05-04 11:08:11', '2026-05-09 22:46:50', '{\"q1\":\"2 KK\",\"q2\":\">= 6 ORANG\",\"q3\":\"SEKOLAH DASAR (SD)\",\"q4\":\"2 ORANG\",\"q5\":\"> RP. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"SEWA \\/ KONTRAK\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"JALAN KAKI \\/ SEPEDA \\/ SEPEDA MOTOR SEADANYA \\/ TRANSPORTASI UMUM\"}'),
(244, 244, 'disetujui', '2026-05-04 11:08:12', '2026-05-09 22:46:50', '{\"q1\":\"3 KK\",\"q2\":\"4 ORANG\",\"q3\":\"SEKOLAH MENENGAH PERTAMA (SMP)\",\"q4\":\"TIDAK ADA\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"RP. 1.500.000 - Rp. 3.000.000\",\"q7\":\"MILIK ORANG TUA\\/ SAUDARA \\/KELUARGA\",\"q8\":\"MENUMPANG\\/ TIDAK MELIKI SUMBER AIR\",\"q9\":\"LISTRIK NUMPANG\",\"q10\":\"SEPEDA MOTOR LEBIH DARI 1 UNIT DALAM KONDISI BAIK\"}'),
(245, 245, 'disetujui', '2026-05-04 11:08:13', '2026-05-09 22:46:50', '{\"q1\":\"1 KK\",\"q2\":\"5 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"1 ORANG\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q7\":\"MILIK ORANG TUA\\/ SAUDARA \\/KELUARGA\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK 900 WATT\",\"q10\":\"SEPEDA MOTOR LEBIH DARI 1 UNIT DALAM KONDISI BAIK\"}'),
(246, 246, 'disetujui', '2026-05-04 11:08:13', '2026-05-09 22:46:51', '{\"q1\":\"1 KK\",\"q2\":\"1 - 3 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"1 ORANG\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q7\":\"SEWA \\/ KONTRAK\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"SEPEDA MOTOR 1 UNIT DALAM KONDISI BAIK\"}'),
(247, 247, 'disetujui', '2026-05-04 11:08:14', '2026-05-09 22:46:51', '{\"q1\":\"1 KK\",\"q2\":\">= 6 ORANG\",\"q3\":\"SEKOLAH DASAR (SD)\",\"q4\":\"2 ORANG\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q7\":\"MILIK ORANG TUA\\/ SAUDARA \\/KELUARGA\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"JALAN KAKI \\/ SEPEDA \\/ SEPEDA MOTOR SEADANYA \\/ TRANSPORTASI UMUM\"}'),
(248, 248, 'disetujui', '2026-05-04 11:08:14', '2026-05-09 22:46:51', '{\"q1\":\"> 3 KK\",\"q2\":\"1 - 3 ORANG\",\"q3\":\"SEKOLAH MENENGAH PERTAMA (SMP)\",\"q4\":\"2 ORANG\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK  > 900 WATT\",\"q10\":\"SEPEDA MOTOR 1 UNIT DALAM KONDISI BAIK\"}'),
(249, 249, 'disetujui', '2026-05-04 11:08:15', '2026-05-09 22:46:51', '{\"q1\":\"1 KK\",\"q2\":\"4 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"1 ORANG\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK 900 WATT\",\"q10\":\"SEPEDA MOTOR LEBIH DARI 1 UNIT DALAM KONDISI BAIK\"}'),
(250, 250, 'disetujui', '2026-05-04 11:08:16', '2026-05-09 22:46:51', '{\"q1\":\"1 KK\",\"q2\":\"1 - 3 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"1 ORANG\",\"q5\":\"Rp. 1.500.000 - Rp. 3.000.000\",\"q6\":\"RP. 1.500.000 - Rp. 3.000.000\",\"q7\":\"SEWA \\/ KONTRAK\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"JALAN KAKI \\/ SEPEDA \\/ SEPEDA MOTOR SEADANYA \\/ TRANSPORTASI UMUM\"}'),
(251, 251, 'disetujui', '2026-05-04 11:08:16', '2026-05-09 22:46:51', '{\"q1\":\"2 KK\",\"q2\":\"5 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\">= 3 ORANG\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"MENUMPANG \\/ TIDAK MEMILIKI TEMPAT TINGGAL\",\"q8\":\"MENUMPANG\\/ TIDAK MELIKI SUMBER AIR\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"SEPEDA MOTOR 1 UNIT DALAM KONDISI BAIK\"}'),
(252, 252, 'disetujui', '2026-05-04 11:08:17', '2026-05-09 22:46:51', '{\"q1\":\"3 KK\",\"q2\":\"4 ORANG\",\"q3\":\"SEKOLAH MENENGAH PERTAMA (SMP)\",\"q4\":\"2 ORANG\",\"q5\":\"Rp. 1.500.000 - Rp. 3.000.000\",\"q6\":\"< Rp. 1.500.000\",\"q7\":\"SEWA \\/ KONTRAK\",\"q8\":\"AIR KEMASAN \\/ AIR GALON\",\"q9\":\"LISTRIK 900 WATT\",\"q10\":\"SEPEDA MOTOR 1 UNIT DALAM KONDISI BAIK\"}'),
(253, 253, 'disetujui', '2026-05-04 11:08:17', '2026-05-09 22:46:51', '{\"q1\":\"1 KK\",\"q2\":\"4 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\">= 3 ORANG\",\"q5\":\"> RP. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"AIR KEMASAN \\/ AIR GALON\",\"q9\":\"LISTRIK  > 900 WATT\",\"q10\":\"MOBIL\"}'),
(254, 254, 'disetujui', '2026-05-04 11:08:18', '2026-05-09 22:46:51', '{\"q1\":\"1 KK\",\"q2\":\"1 - 3 ORANG\",\"q3\":\"TIDAK SEKOLAH \\/ TIDAK TAMAT SEKOLAH DASAR (SD)\",\"q4\":\"TIDAK ADA\",\"q5\":\"Rp. 1.500.000 - Rp. 3.000.000\",\"q6\":\"RP. 1.500.000 - Rp. 3.000.000\",\"q7\":\"SEWA \\/ KONTRAK\",\"q8\":\"MENUMPANG\\/ TIDAK MELIKI SUMBER AIR\",\"q9\":\"LISTRIK NUMPANG\",\"q10\":\"SEPEDA MOTOR 1 UNIT DALAM KONDISI BAIK\"}'),
(255, 255, 'disetujui', '2026-05-04 11:08:19', '2026-05-09 22:46:51', '{\"q1\":\"1 KK\",\"q2\":\"1 - 3 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"1 ORANG\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q7\":\"SEWA \\/ KONTRAK\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"JALAN KAKI \\/ SEPEDA \\/ SEPEDA MOTOR SEADANYA \\/ TRANSPORTASI UMUM\"}'),
(256, 256, 'disetujui', '2026-05-04 11:08:19', '2026-05-09 22:46:51', '{\"q1\":\"1 KK\",\"q2\":\"1 - 3 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"1 ORANG\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q7\":\"SEWA \\/ KONTRAK\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"SEPEDA MOTOR 1 UNIT DALAM KONDISI BAIK\"}'),
(257, 257, 'disetujui', '2026-05-04 11:08:20', '2026-05-09 22:46:51', '{\"q1\":\"1 KK\",\"q2\":\"4 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\">= 3 ORANG\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"RP. 1.500.000 - Rp. 3.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"MENUMPANG\\/ TIDAK MELIKI SUMBER AIR\",\"q9\":\"LISTRIK NUMPANG\",\"q10\":\"SEPEDA MOTOR LEBIH DARI 1 UNIT DALAM KONDISI BAIK\"}'),
(258, 258, 'disetujui', '2026-05-04 11:08:20', '2026-05-09 22:46:51', '{\"q1\":\"1 KK\",\"q2\":\"1 - 3 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"1 ORANG\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q7\":\"MILIK ORANG TUA\\/ SAUDARA \\/KELUARGA\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"JALAN KAKI \\/ SEPEDA \\/ SEPEDA MOTOR SEADANYA \\/ TRANSPORTASI UMUM\"}'),
(259, 259, 'disetujui', '2026-05-04 11:08:21', '2026-05-09 22:46:51', '{\"q1\":\"2 KK\",\"q2\":\">= 6 ORANG\",\"q3\":\"TIDAK SEKOLAH \\/ TIDAK TAMAT SEKOLAH DASAR (SD)\",\"q4\":\">= 3 ORANG\",\"q5\":\"> RP. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"SEWA \\/ KONTRAK\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK NUMPANG\",\"q10\":\"MOBIL\"}'),
(260, 260, 'disetujui', '2026-05-04 11:08:22', '2026-05-09 22:46:51', '{\"q1\":\"1 KK\",\"q2\":\">= 6 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\">= 3 ORANG\",\"q5\":\"< RP. 1.500.000\",\"q6\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q7\":\"MILIK ORANG TUA\\/ SAUDARA \\/KELUARGA\",\"q8\":\"MENUMPANG\\/ TIDAK MELIKI SUMBER AIR\",\"q9\":\"LISTRIK  > 900 WATT\",\"q10\":\"SEPEDA MOTOR LEBIH DARI 1 UNIT DALAM KONDISI BAIK\"}'),
(261, 261, 'disetujui', '2026-05-04 11:08:22', '2026-05-09 22:46:51', '{\"q1\":\"2 KK\",\"q2\":\"4 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"1 ORANG\",\"q5\":\"< RP. 1.500.000\",\"q6\":\"RP. 1.500.000 - Rp. 3.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK  > 900 WATT\",\"q10\":\"JALAN KAKI \\/ SEPEDA \\/ SEPEDA MOTOR SEADANYA \\/ TRANSPORTASI UMUM\"}'),
(262, 262, 'disetujui', '2026-05-04 11:08:23', '2026-05-09 22:46:51', '{\"q1\":\"1 KK\",\"q2\":\"1 - 3 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"1 ORANG\",\"q5\":\"> RP. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"MILIK ORANG TUA\\/ SAUDARA \\/KELUARGA\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"SEPEDA MOTOR 1 UNIT DALAM KONDISI BAIK\"}'),
(263, 263, 'disetujui', '2026-05-04 11:08:23', '2026-05-09 22:46:51', '{\"q1\":\"1 KK\",\"q2\":\"5 ORANG\",\"q3\":\"SEKOLAH MENENGAH PERTAMA (SMP)\",\"q4\":\">= 3 ORANG\",\"q5\":\"> RP. 5.000.000\",\"q6\":\"< Rp. 1.500.000\",\"q7\":\"SEWA \\/ KONTRAK\",\"q8\":\"MENUMPANG\\/ TIDAK MELIKI SUMBER AIR\",\"q9\":\"LISTRIK  > 900 WATT\",\"q10\":\"SEPEDA MOTOR LEBIH DARI 1 UNIT DALAM KONDISI BAIK\"}'),
(264, 264, 'disetujui', '2026-05-04 11:08:24', '2026-05-09 22:46:51', '{\"q1\":\"1 KK\",\"q2\":\">= 6 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\">= 3 ORANG\",\"q5\":\"> RP. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"MILIK ORANG TUA\\/ SAUDARA \\/KELUARGA\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK  > 900 WATT\",\"q10\":\"MOBIL\"}'),
(265, 265, 'disetujui', '2026-05-04 11:08:25', '2026-05-09 22:46:51', '{\"q1\":\"2 KK\",\"q2\":\"5 ORANG\",\"q3\":\"SEKOLAH DASAR (SD)\",\"q4\":\">= 3 ORANG\",\"q5\":\"Rp. 1.500.000 - Rp. 3.000.000\",\"q6\":\"< Rp. 1.500.000\",\"q7\":\"MILIK ORANG TUA\\/ SAUDARA \\/KELUARGA\",\"q8\":\"MENUMPANG\\/ TIDAK MELIKI SUMBER AIR\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"SEPEDA MOTOR 1 UNIT DALAM KONDISI BAIK\"}'),
(266, 266, 'disetujui', '2026-05-04 11:08:25', '2026-05-09 22:46:51', '{\"q1\":\"2 KK\",\"q2\":\"5 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"TIDAK ADA\",\"q5\":\"< RP. 1.500.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"SEWA \\/ KONTRAK\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK  > 900 WATT\",\"q10\":\"SEPEDA MOTOR LEBIH DARI 1 UNIT DALAM KONDISI BAIK\"}'),
(267, 267, 'disetujui', '2026-05-04 11:08:26', '2026-05-09 22:46:51', '{\"q1\":\"1 KK\",\"q2\":\"5 ORANG\",\"q3\":\"SEKOLAH MENENGAH PERTAMA (SMP)\",\"q4\":\"2 ORANG\",\"q5\":\"> RP. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK 900 WATT\",\"q10\":\"MOBIL\"}'),
(268, 268, 'disetujui', '2026-05-04 11:08:27', '2026-05-09 22:46:51', '{\"q1\":\"1 KK\",\"q2\":\"1 - 3 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"TIDAK ADA\",\"q5\":\"> RP. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"AIR KEMASAN \\/ AIR GALON\",\"q9\":\"LISTRIK  > 900 WATT\",\"q10\":\"MOBIL\"}'),
(269, 269, 'disetujui', '2026-05-04 11:08:27', '2026-05-09 22:46:51', '{\"q1\":\"2 KK\",\"q2\":\"4 ORANG\",\"q3\":\"SEKOLAH MENENGAH PERTAMA (SMP)\",\"q4\":\"1 ORANG\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q7\":\"MILIK ORANG TUA\\/ SAUDARA \\/KELUARGA\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK 900 WATT\",\"q10\":\"SEPEDA MOTOR LEBIH DARI 1 UNIT DALAM KONDISI BAIK\"}'),
(270, 270, 'disetujui', '2026-05-04 11:08:28', '2026-05-09 22:46:51', '{\"q1\":\"3 KK\",\"q2\":\"5 ORANG\",\"q3\":\"SEKOLAH DASAR (SD)\",\"q4\":\"2 ORANG\",\"q5\":\"Rp. 1.500.000 - Rp. 3.000.000\",\"q6\":\"RP. 1.500.000 - Rp. 3.000.000\",\"q7\":\"SEWA \\/ KONTRAK\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"SEPEDA MOTOR 1 UNIT DALAM KONDISI BAIK\"}'),
(271, 271, 'disetujui', '2026-05-04 11:08:28', '2026-05-09 22:46:51', '{\"q1\":\"2 KK\",\"q2\":\"4 ORANG\",\"q3\":\"SEKOLAH MENENGAH PERTAMA (SMP)\",\"q4\":\"TIDAK ADA\",\"q5\":\"> RP. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"MILIK ORANG TUA\\/ SAUDARA \\/KELUARGA\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK 900 WATT\",\"q10\":\"SEPEDA MOTOR 1 UNIT DALAM KONDISI BAIK\"}'),
(272, 272, 'disetujui', '2026-05-04 11:08:29', '2026-05-09 22:46:51', '{\"q1\":\"1 KK\",\"q2\":\"5 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"TIDAK ADA\",\"q5\":\"> RP. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"PDAM\",\"q9\":\"LISTRIK 900 WATT\",\"q10\":\"MOBIL\"}'),
(273, 273, 'disetujui', '2026-05-04 11:08:30', '2026-05-09 22:46:51', '{\"q1\":\"1 KK\",\"q2\":\"1 - 3 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"1 ORANG\",\"q5\":\"> RP. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"SEWA \\/ KONTRAK\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"SEPEDA MOTOR LEBIH DARI 1 UNIT DALAM KONDISI BAIK\"}'),
(274, 274, 'disetujui', '2026-05-04 11:08:30', '2026-05-09 22:46:51', '{\"q1\":\"1 KK\",\"q2\":\"4 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"TIDAK ADA\",\"q5\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q6\":\"RP. 3.000.000 - Rp. 5.000.000\",\"q7\":\"MILIK ORANG TUA\\/ SAUDARA \\/KELUARGA\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"SEPEDA MOTOR LEBIH DARI 1 UNIT DALAM KONDISI BAIK\"}'),
(275, 275, 'disetujui', '2026-05-04 11:08:31', '2026-05-09 22:46:51', '{\"q1\":\"2 KK\",\"q2\":\"4 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"1 ORANG\",\"q5\":\"> RP. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"MILIK ORANG TUA\\/ SAUDARA \\/KELUARGA\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK 900 WATT\",\"q10\":\"SEPEDA MOTOR LEBIH DARI 1 UNIT DALAM KONDISI BAIK\"}'),
(276, 276, 'disetujui', '2026-05-04 11:08:32', '2026-05-09 22:46:51', '{\"q1\":\"1 KK\",\"q2\":\"4 ORANG\",\"q3\":\"SMA \\/ SMK \\/ S1\",\"q4\":\"1 ORANG\",\"q5\":\"> RP. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK 900 WATT\",\"q10\":\"SEPEDA MOTOR LEBIH DARI 1 UNIT DALAM KONDISI BAIK\"}'),
(277, 277, 'ditolak', '2026-05-04 23:23:19', '2026-06-05 07:32:53', '{\"q1\":\"1 KK\",\"q2\":\"<= 3 ORANG\",\"q3\":\"SMA \\/ SARJANA\",\"q4\":\"TIDAK ADA\",\"q5\":\"> RP. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"KEMASAN \\/ ISI ULANG\",\"q9\":\"LISTRIK  > 900 WATT\",\"q10\":\"MOBIL\"}'),
(278, 278, 'ditolak', '2026-05-06 22:44:38', '2026-05-13 07:10:00', '{\"q1\":\"1 KK\",\"q2\":\"4 ORANG\",\"q3\":\"SMA \\/ SARJANA\",\"q4\":\"2 ORANG\",\"q5\":\"> RP. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK 900 WATT\",\"q10\":\"MOBIL\"}'),
(279, 279, 'ditolak', '2026-05-07 23:10:20', '2026-05-18 02:31:19', '\"{\\\"q1\\\":\\\"> 3 KK\\\",\\\"q2\\\":\\\"> 6 Orang\\\",\\\"q3\\\":\\\"Tidak Sekolah \\\\\\/ Tidak Tamat SD\\\",\\\"q4\\\":\\\"> 3 Orang\\\",\\\"q5\\\":\\\"< 400 Ribu\\\",\\\"q6\\\":\\\"< 400 Ribu\\\",\\\"q7\\\":\\\"Magersari \\\\\\/ Pakai Gratis\\\",\\\"q8\\\":\\\"Sumur Milik Tetangga\\\",\\\"q9\\\":\\\"Listrik Numpang\\\",\\\"q10\\\":\\\"Jalan Kaki \\\\\\/ Sepeda \\\\\\/ Motor Seadanya\\\"}\"'),
(280, 280, 'disetujui', '2026-05-07 23:19:31', '2026-05-18 02:31:35', '{\"q1\":\"1 KK\",\"q2\":\"<= 3 ORANG\",\"q3\":\"SMA \\/ SARJANA\",\"q4\":\"TIDAK ADA\",\"q5\":\"> RP. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"KEMASAN \\/ ISI ULANG\",\"q9\":\"LISTRIK  > 900 WATT\",\"q10\":\"MOBIL\"}'),
(281, 281, 'ditolak', '2026-05-07 23:52:11', '2026-05-13 07:09:54', '{\"q1\":\"1 KK\",\"q2\":\"<= 3 ORANG\",\"q3\":\"SMA \\/ SARJANA\",\"q4\":\"TIDAK ADA\",\"q5\":\"> RP. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"KEMASAN \\/ ISI ULANG\",\"q9\":\"LISTRIK  > 900 WATT\",\"q10\":\"MOBIL\"}'),
(282, 282, 'ditolak', '2026-05-09 13:22:14', '2026-05-09 13:22:34', '{\"q1\":\"3 KK\",\"q2\":\"5 ORANG\",\"q3\":\"SEKOLAH DASAR (SD)\",\"q4\":\"2 ORANG\",\"q5\":\"Rp. 1.500.000 - Rp. 3.000.000\",\"q6\":\"Rp. 1.500.000 - Rp. 3.000.000\",\"q7\":\"SEWA \\/ KONTRAK\",\"q8\":\"SUMUR (BOR\\/GALI)\",\"q9\":\"LISTRIK 450 WATT\",\"q10\":\"SEPEDA MOTOR 1 UNIT KONDISI BAIK\"}'),
(283, 283, 'ditolak', '2026-05-15 06:01:54', '2026-05-15 06:02:18', '{\"q1\":\"1 KK\",\"q2\":\"<= 3 ORANG\",\"q3\":\"SMA \\/ SARJANA\",\"q4\":\"TIDAK ADA\",\"q5\":\"> RP. 5.000.000\",\"q6\":\"> RP. 5.000.000\",\"q7\":\"MILIK SENDIRI\",\"q8\":\"KEMASAN \\/ ISI ULANG\",\"q9\":\"LISTRIK  > 900 WATT\",\"q10\":\"MOBIL\"}');

-- --------------------------------------------------------

--
-- Table structure for table `penilaian`
--

CREATE TABLE `penilaian` (
  `id_penilaian` bigint(20) UNSIGNED NOT NULL,
  `id_pengajuan` bigint(20) UNSIGNED NOT NULL,
  `id_kriteria` bigint(20) UNSIGNED NOT NULL,
  `id_subkriteria` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `penilaian`
--

INSERT INTO `penilaian` (`id_penilaian`, `id_pengajuan`, `id_kriteria`, `id_subkriteria`, `created_at`, `updated_at`) VALUES
(15211, 188, 1, 4, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15212, 188, 2, 6, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15213, 188, 3, 11, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15214, 188, 4, 15, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15215, 188, 5, 20, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15216, 188, 6, 24, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15217, 188, 7, 25, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15218, 188, 8, 29, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15219, 188, 9, 33, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15220, 188, 10, 37, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15221, 189, 1, 3, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15222, 189, 2, 7, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15223, 189, 3, 11, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15224, 189, 4, 14, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15225, 189, 5, 20, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15226, 189, 6, 24, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15227, 189, 7, 25, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15228, 189, 8, 29, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15229, 189, 9, 33, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15230, 189, 10, 37, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15231, 190, 1, 4, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15232, 190, 2, 6, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15233, 190, 3, 11, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15234, 190, 4, 15, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15235, 190, 5, 20, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15236, 190, 6, 24, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15237, 190, 7, 25, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15238, 190, 8, 29, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15239, 190, 9, 33, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15240, 190, 10, 37, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15241, 191, 1, 1, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15242, 191, 2, 7, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15243, 191, 3, 11, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15244, 191, 4, 15, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15245, 191, 5, 20, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15246, 191, 6, 24, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15247, 191, 7, 25, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15248, 191, 8, 29, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15249, 191, 9, 33, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15250, 191, 10, 37, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15251, 192, 1, 3, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15252, 192, 2, 7, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15253, 192, 3, 11, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15254, 192, 4, 15, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15255, 192, 5, 20, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15256, 192, 6, 24, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15257, 192, 7, 25, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15258, 192, 8, 29, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15259, 192, 9, 33, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15260, 192, 10, 37, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15261, 193, 1, 4, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15262, 193, 2, 7, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15263, 193, 3, 11, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15264, 193, 4, 15, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15265, 193, 5, 20, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15266, 193, 6, 24, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15267, 193, 7, 25, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15268, 193, 8, 29, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15269, 193, 9, 33, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15270, 193, 10, 37, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15271, 194, 1, 4, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15272, 194, 2, 7, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15273, 194, 3, 11, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15274, 194, 4, 15, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15275, 194, 5, 20, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15276, 194, 6, 24, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15277, 194, 7, 25, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15278, 194, 8, 29, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15279, 194, 9, 33, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15280, 194, 10, 37, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15281, 195, 1, 4, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15282, 195, 2, 6, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15283, 195, 3, 11, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15284, 195, 4, 14, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15285, 195, 5, 20, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15286, 195, 6, 24, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15287, 195, 7, 25, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15288, 195, 8, 29, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15289, 195, 9, 33, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15290, 195, 10, 37, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15291, 196, 1, 4, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15292, 196, 2, 7, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15293, 196, 3, 11, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15294, 196, 4, 15, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15295, 196, 5, 20, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15296, 196, 6, 24, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15297, 196, 7, 25, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15298, 196, 8, 29, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15299, 196, 9, 33, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15300, 196, 10, 37, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15301, 197, 1, 3, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15302, 197, 2, 6, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15303, 197, 3, 11, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15304, 197, 4, 14, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15305, 197, 5, 20, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15306, 197, 6, 24, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15307, 197, 7, 25, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15308, 197, 8, 29, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15309, 197, 9, 33, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15310, 197, 10, 37, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15311, 198, 1, 3, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15312, 198, 2, 6, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15313, 198, 3, 11, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15314, 198, 4, 14, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15315, 198, 5, 20, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15316, 198, 6, 24, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15317, 198, 7, 25, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15318, 198, 8, 29, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15319, 198, 9, 33, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15320, 198, 10, 37, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15321, 199, 1, 3, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15322, 199, 2, 6, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15323, 199, 3, 11, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15324, 199, 4, 14, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15325, 199, 5, 20, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15326, 199, 6, 24, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15327, 199, 7, 25, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15328, 199, 8, 29, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15329, 199, 9, 33, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15330, 199, 10, 37, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15331, 200, 1, 3, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15332, 200, 2, 6, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15333, 200, 3, 11, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15334, 200, 4, 14, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15335, 200, 5, 20, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15336, 200, 6, 24, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15337, 200, 7, 25, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15338, 200, 8, 29, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15339, 200, 9, 33, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15340, 200, 10, 37, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15341, 201, 1, 4, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15342, 201, 2, 7, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15343, 201, 3, 11, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15344, 201, 4, 15, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15345, 201, 5, 20, '2026-05-05 00:32:59', '2026-05-05 00:32:59'),
(15346, 201, 6, 24, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15347, 201, 7, 25, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15348, 201, 8, 29, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15349, 201, 9, 33, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15350, 201, 10, 37, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15351, 202, 1, 4, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15352, 202, 2, 6, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15353, 202, 3, 11, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15354, 202, 4, 14, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15355, 202, 5, 20, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15356, 202, 6, 24, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15357, 202, 7, 25, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15358, 202, 8, 29, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15359, 202, 9, 33, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15360, 202, 10, 37, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15361, 203, 1, 3, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15362, 203, 2, 7, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15363, 203, 3, 11, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15364, 203, 4, 14, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15365, 203, 5, 20, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15366, 203, 6, 24, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15367, 203, 7, 25, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15368, 203, 8, 29, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15369, 203, 9, 33, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15370, 203, 10, 37, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15371, 204, 1, 3, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15372, 204, 2, 6, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15373, 204, 3, 11, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15374, 204, 4, 15, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15375, 204, 5, 20, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15376, 204, 6, 24, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15377, 204, 7, 25, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15378, 204, 8, 29, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15379, 204, 9, 33, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15380, 204, 10, 37, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15381, 205, 1, 4, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15382, 205, 2, 7, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15383, 205, 3, 11, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15384, 205, 4, 15, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15385, 205, 5, 20, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15386, 205, 6, 24, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15387, 205, 7, 25, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15388, 205, 8, 29, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15389, 205, 9, 33, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15390, 205, 10, 37, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15391, 206, 1, 3, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15392, 206, 2, 7, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15393, 206, 3, 11, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15394, 206, 4, 15, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15395, 206, 5, 20, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15396, 206, 6, 24, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15397, 206, 7, 25, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15398, 206, 8, 29, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15399, 206, 9, 33, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15400, 206, 10, 37, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15401, 207, 1, 1, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15402, 207, 2, 7, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15403, 207, 3, 11, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15404, 207, 4, 14, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15405, 207, 5, 20, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15406, 207, 6, 24, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15407, 207, 7, 25, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15408, 207, 8, 29, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15409, 207, 9, 33, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15410, 207, 10, 37, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15411, 208, 1, 3, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15412, 208, 2, 6, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15413, 208, 3, 11, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15414, 208, 4, 14, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15415, 208, 5, 20, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15416, 208, 6, 24, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15417, 208, 7, 25, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15418, 208, 8, 29, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15419, 208, 9, 33, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15420, 208, 10, 37, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15421, 209, 1, 3, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15422, 209, 2, 6, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15423, 209, 3, 11, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15424, 209, 4, 14, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15425, 209, 5, 20, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15426, 209, 6, 24, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15427, 209, 7, 25, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15428, 209, 8, 29, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15429, 209, 9, 33, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15430, 209, 10, 37, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15431, 210, 1, 3, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15432, 210, 2, 7, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15433, 210, 3, 11, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15434, 210, 4, 14, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15435, 210, 5, 20, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15436, 210, 6, 24, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15437, 210, 7, 25, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15438, 210, 8, 29, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15439, 210, 9, 33, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15440, 210, 10, 37, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15441, 211, 1, 4, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15442, 211, 2, 7, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15443, 211, 3, 11, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15444, 211, 4, 15, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15445, 211, 5, 20, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15446, 211, 6, 24, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15447, 211, 7, 25, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15448, 211, 8, 29, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15449, 211, 9, 33, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15450, 211, 10, 37, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15451, 212, 1, 4, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15452, 212, 2, 6, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15453, 212, 3, 11, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15454, 212, 4, 15, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15455, 212, 5, 20, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15456, 212, 6, 24, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15457, 212, 7, 25, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15458, 212, 8, 29, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15459, 212, 9, 33, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15460, 212, 10, 37, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15461, 213, 1, 3, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15462, 213, 2, 6, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15463, 213, 3, 11, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15464, 213, 4, 15, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15465, 213, 5, 20, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15466, 213, 6, 24, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15467, 213, 7, 25, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15468, 213, 8, 29, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15469, 213, 9, 33, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15470, 213, 10, 37, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15471, 214, 1, 4, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15472, 214, 2, 7, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15473, 214, 3, 11, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15474, 214, 4, 15, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15475, 214, 5, 20, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15476, 214, 6, 24, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15477, 214, 7, 25, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15478, 214, 8, 29, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15479, 214, 9, 33, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15480, 214, 10, 37, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15481, 215, 1, 4, '2026-05-05 00:33:00', '2026-05-05 00:33:00'),
(15482, 215, 2, 6, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15483, 215, 3, 11, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15484, 215, 4, 14, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15485, 215, 5, 20, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15486, 215, 6, 24, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15487, 215, 7, 25, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15488, 215, 8, 29, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15489, 215, 9, 33, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15490, 215, 10, 37, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15491, 216, 1, 4, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15492, 216, 2, 7, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15493, 216, 3, 11, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15494, 216, 4, 14, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15495, 216, 5, 20, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15496, 216, 6, 24, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15497, 216, 7, 25, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15498, 216, 8, 29, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15499, 216, 9, 33, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15500, 216, 10, 37, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15501, 217, 1, 1, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15502, 217, 2, 7, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15503, 217, 3, 11, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15504, 217, 4, 15, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15505, 217, 5, 20, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15506, 217, 6, 24, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15507, 217, 7, 25, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15508, 217, 8, 29, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15509, 217, 9, 33, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15510, 217, 10, 37, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15511, 218, 1, 4, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15512, 218, 2, 6, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15513, 218, 3, 11, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15514, 218, 4, 14, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15515, 218, 5, 20, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15516, 218, 6, 24, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15517, 218, 7, 25, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15518, 218, 8, 29, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15519, 218, 9, 33, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15520, 218, 10, 37, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15521, 219, 1, 3, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15522, 219, 2, 6, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15523, 219, 3, 11, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15524, 219, 4, 14, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15525, 219, 5, 20, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15526, 219, 6, 24, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15527, 219, 7, 25, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15528, 219, 8, 29, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15529, 219, 9, 33, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15530, 219, 10, 37, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15531, 220, 1, 3, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15532, 220, 2, 7, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15533, 220, 3, 11, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15534, 220, 4, 15, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15535, 220, 5, 20, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15536, 220, 6, 24, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15537, 220, 7, 25, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15538, 220, 8, 29, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15539, 220, 9, 33, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15540, 220, 10, 37, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15541, 221, 1, 3, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15542, 221, 2, 6, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15543, 221, 3, 11, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15544, 221, 4, 14, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15545, 221, 5, 20, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15546, 221, 6, 24, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15547, 221, 7, 25, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15548, 221, 8, 29, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15549, 221, 9, 33, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15550, 221, 10, 37, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15551, 222, 1, 4, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15552, 222, 2, 7, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15553, 222, 3, 11, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15554, 222, 4, 15, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15555, 222, 5, 20, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15556, 222, 6, 24, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15557, 222, 7, 25, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15558, 222, 8, 29, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15559, 222, 9, 33, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15560, 222, 10, 37, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15561, 223, 1, 4, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15562, 223, 2, 7, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15563, 223, 3, 11, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15564, 223, 4, 14, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15565, 223, 5, 20, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15566, 223, 6, 24, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15567, 223, 7, 25, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15568, 223, 8, 29, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15569, 223, 9, 33, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15570, 223, 10, 37, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15571, 224, 1, 4, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15572, 224, 2, 7, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15573, 224, 3, 11, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15574, 224, 4, 15, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15575, 224, 5, 20, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15576, 224, 6, 24, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15577, 224, 7, 25, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15578, 224, 8, 29, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15579, 224, 9, 33, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15580, 224, 10, 37, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15581, 225, 1, 1, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15582, 225, 2, 6, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15583, 225, 3, 11, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15584, 225, 4, 15, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15585, 225, 5, 20, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15586, 225, 6, 24, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15587, 225, 7, 25, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15588, 225, 8, 29, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15589, 225, 9, 33, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15590, 225, 10, 37, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15591, 226, 1, 4, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15592, 226, 2, 7, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15593, 226, 3, 11, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15594, 226, 4, 15, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15595, 226, 5, 20, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15596, 226, 6, 24, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15597, 226, 7, 25, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15598, 226, 8, 29, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15599, 226, 9, 33, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15600, 226, 10, 37, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15601, 227, 1, 4, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15602, 227, 2, 7, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15603, 227, 3, 11, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15604, 227, 4, 15, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15605, 227, 5, 20, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15606, 227, 6, 24, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15607, 227, 7, 25, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15608, 227, 8, 29, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15609, 227, 9, 33, '2026-05-05 00:33:01', '2026-05-05 00:33:01'),
(15610, 227, 10, 37, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15611, 228, 1, 1, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15612, 228, 2, 7, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15613, 228, 3, 11, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15614, 228, 4, 15, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15615, 228, 5, 20, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15616, 228, 6, 24, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15617, 228, 7, 25, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15618, 228, 8, 29, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15619, 228, 9, 33, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15620, 228, 10, 37, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15621, 229, 1, 1, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15622, 229, 2, 7, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15623, 229, 3, 11, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15624, 229, 4, 15, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15625, 229, 5, 20, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15626, 229, 6, 24, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15627, 229, 7, 25, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15628, 229, 8, 29, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15629, 229, 9, 33, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15630, 229, 10, 37, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15631, 230, 1, 4, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15632, 230, 2, 7, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15633, 230, 3, 11, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15634, 230, 4, 14, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15635, 230, 5, 20, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15636, 230, 6, 24, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15637, 230, 7, 25, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15638, 230, 8, 29, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15639, 230, 9, 33, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15640, 230, 10, 37, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15641, 231, 1, 3, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15642, 231, 2, 7, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15643, 231, 3, 11, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15644, 231, 4, 15, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15645, 231, 5, 20, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15646, 231, 6, 24, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15647, 231, 7, 25, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15648, 231, 8, 29, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15649, 231, 9, 33, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15650, 231, 10, 37, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15651, 232, 1, 4, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15652, 232, 2, 7, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15653, 232, 3, 11, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15654, 232, 4, 15, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15655, 232, 5, 20, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15656, 232, 6, 24, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15657, 232, 7, 25, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15658, 232, 8, 29, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15659, 232, 9, 33, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15660, 232, 10, 37, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15661, 233, 1, 1, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15662, 233, 2, 7, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15663, 233, 3, 11, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15664, 233, 4, 15, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15665, 233, 5, 20, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15666, 233, 6, 24, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15667, 233, 7, 25, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15668, 233, 8, 29, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15669, 233, 9, 33, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15670, 233, 10, 37, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15671, 234, 1, 4, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15672, 234, 2, 6, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15673, 234, 3, 11, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15674, 234, 4, 15, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15675, 234, 5, 20, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15676, 234, 6, 24, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15677, 234, 7, 25, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15678, 234, 8, 29, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15679, 234, 9, 33, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15680, 234, 10, 37, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15681, 235, 1, 4, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15682, 235, 2, 7, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15683, 235, 3, 11, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15684, 235, 4, 14, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15685, 235, 5, 20, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15686, 235, 6, 24, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15687, 235, 7, 25, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15688, 235, 8, 29, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15689, 235, 9, 33, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15690, 235, 10, 37, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15691, 236, 1, 4, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15692, 236, 2, 7, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15693, 236, 3, 11, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15694, 236, 4, 15, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15695, 236, 5, 20, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15696, 236, 6, 24, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15697, 236, 7, 25, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15698, 236, 8, 29, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15699, 236, 9, 33, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15700, 236, 10, 37, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15701, 237, 1, 4, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15702, 237, 2, 7, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15703, 237, 3, 11, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15704, 237, 4, 15, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15705, 237, 5, 20, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15706, 237, 6, 24, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15707, 237, 7, 25, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15708, 237, 8, 29, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15709, 237, 9, 33, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15710, 237, 10, 37, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15711, 238, 1, 3, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15712, 238, 2, 7, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15713, 238, 3, 11, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15714, 238, 4, 14, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15715, 238, 5, 20, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15716, 238, 6, 24, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15717, 238, 7, 25, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15718, 238, 8, 29, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15719, 238, 9, 33, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15720, 238, 10, 37, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15721, 239, 1, 4, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15722, 239, 2, 6, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15723, 239, 3, 11, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15724, 239, 4, 15, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15725, 239, 5, 20, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15726, 239, 6, 24, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15727, 239, 7, 25, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15728, 239, 8, 29, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15729, 239, 9, 33, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15730, 239, 10, 37, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15731, 240, 1, 3, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15732, 240, 2, 7, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15733, 240, 3, 11, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15734, 240, 4, 14, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15735, 240, 5, 20, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15736, 240, 6, 24, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15737, 240, 7, 25, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15738, 240, 8, 29, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15739, 240, 9, 33, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15740, 240, 10, 37, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15741, 241, 1, 1, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15742, 241, 2, 7, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15743, 241, 3, 11, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15744, 241, 4, 15, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15745, 241, 5, 20, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15746, 241, 6, 24, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15747, 241, 7, 25, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15748, 241, 8, 29, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15749, 241, 9, 33, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15750, 241, 10, 37, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15751, 242, 1, 1, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15752, 242, 2, 7, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15753, 242, 3, 11, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15754, 242, 4, 15, '2026-05-05 00:33:02', '2026-05-05 00:33:02'),
(15755, 242, 5, 20, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15756, 242, 6, 24, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15757, 242, 7, 25, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15758, 242, 8, 29, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15759, 242, 9, 33, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15760, 242, 10, 37, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15761, 243, 1, 3, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15762, 243, 2, 7, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15763, 243, 3, 11, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15764, 243, 4, 14, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15765, 243, 5, 20, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15766, 243, 6, 24, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15767, 243, 7, 25, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15768, 243, 8, 29, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15769, 243, 9, 33, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15770, 243, 10, 37, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15771, 244, 1, 1, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15772, 244, 2, 7, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15773, 244, 3, 11, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15774, 244, 4, 15, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15775, 244, 5, 20, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15776, 244, 6, 24, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15777, 244, 7, 25, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15778, 244, 8, 29, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15779, 244, 9, 33, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15780, 244, 10, 37, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15781, 245, 1, 4, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15782, 245, 2, 6, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15783, 245, 3, 11, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15784, 245, 4, 15, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15785, 245, 5, 20, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15786, 245, 6, 24, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15787, 245, 7, 25, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15788, 245, 8, 29, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15789, 245, 9, 33, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15790, 245, 10, 37, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15791, 246, 1, 4, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15792, 246, 2, 7, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15793, 246, 3, 11, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15794, 246, 4, 15, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15795, 246, 5, 20, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15796, 246, 6, 24, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15797, 246, 7, 25, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15798, 246, 8, 29, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15799, 246, 9, 33, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15800, 246, 10, 37, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15801, 247, 1, 4, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15802, 247, 2, 7, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15803, 247, 3, 11, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15804, 247, 4, 14, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15805, 247, 5, 20, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15806, 247, 6, 24, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15807, 247, 7, 25, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15808, 247, 8, 29, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15809, 247, 9, 33, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15810, 247, 10, 37, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15811, 248, 1, 1, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15812, 248, 2, 7, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15813, 248, 3, 11, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15814, 248, 4, 14, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15815, 248, 5, 20, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15816, 248, 6, 24, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15817, 248, 7, 25, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15818, 248, 8, 29, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15819, 248, 9, 33, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15820, 248, 10, 37, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15821, 249, 1, 4, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15822, 249, 2, 7, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15823, 249, 3, 11, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15824, 249, 4, 15, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15825, 249, 5, 20, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15826, 249, 6, 24, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15827, 249, 7, 25, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15828, 249, 8, 29, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15829, 249, 9, 33, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15830, 249, 10, 37, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15831, 250, 1, 4, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15832, 250, 2, 7, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15833, 250, 3, 11, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15834, 250, 4, 15, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15835, 250, 5, 20, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15836, 250, 6, 24, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15837, 250, 7, 25, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15838, 250, 8, 29, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15839, 250, 9, 33, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15840, 250, 10, 37, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15841, 251, 1, 3, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15842, 251, 2, 6, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15843, 251, 3, 11, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15844, 251, 4, 15, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15845, 251, 5, 20, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15846, 251, 6, 24, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15847, 251, 7, 25, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15848, 251, 8, 29, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15849, 251, 9, 33, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15850, 251, 10, 37, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15851, 252, 1, 1, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15852, 252, 2, 7, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15853, 252, 3, 11, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15854, 252, 4, 14, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15855, 252, 5, 20, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15856, 252, 6, 24, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15857, 252, 7, 25, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15858, 252, 8, 29, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15859, 252, 9, 33, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15860, 252, 10, 37, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15861, 253, 1, 4, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15862, 253, 2, 7, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15863, 253, 3, 11, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15864, 253, 4, 15, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15865, 253, 5, 20, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15866, 253, 6, 24, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15867, 253, 7, 25, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15868, 253, 8, 29, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15869, 253, 9, 33, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15870, 253, 10, 37, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15871, 254, 1, 4, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15872, 254, 2, 7, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15873, 254, 3, 11, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15874, 254, 4, 15, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15875, 254, 5, 20, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15876, 254, 6, 24, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15877, 254, 7, 25, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15878, 254, 8, 29, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15879, 254, 9, 33, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15880, 254, 10, 37, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15881, 255, 1, 4, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15882, 255, 2, 7, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15883, 255, 3, 11, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15884, 255, 4, 15, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15885, 255, 5, 20, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15886, 255, 6, 24, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15887, 255, 7, 25, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15888, 255, 8, 29, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15889, 255, 9, 33, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15890, 255, 10, 37, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15891, 256, 1, 4, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15892, 256, 2, 7, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15893, 256, 3, 11, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15894, 256, 4, 15, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15895, 256, 5, 20, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15896, 256, 6, 24, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15897, 256, 7, 25, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15898, 256, 8, 29, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15899, 256, 9, 33, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15900, 256, 10, 37, '2026-05-05 00:33:03', '2026-05-05 00:33:03'),
(15901, 257, 1, 4, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15902, 257, 2, 7, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15903, 257, 3, 11, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15904, 257, 4, 15, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15905, 257, 5, 20, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15906, 257, 6, 24, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15907, 257, 7, 25, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15908, 257, 8, 29, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15909, 257, 9, 33, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15910, 257, 10, 37, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15911, 258, 1, 4, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15912, 258, 2, 7, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15913, 258, 3, 11, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15914, 258, 4, 15, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15915, 258, 5, 20, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15916, 258, 6, 24, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15917, 258, 7, 25, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15918, 258, 8, 29, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15919, 258, 9, 33, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15920, 258, 10, 37, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15921, 259, 1, 3, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15922, 259, 2, 7, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15923, 259, 3, 11, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15924, 259, 4, 15, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15925, 259, 5, 20, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15926, 259, 6, 24, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15927, 259, 7, 25, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15928, 259, 8, 29, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15929, 259, 9, 33, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15930, 259, 10, 37, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15931, 260, 1, 4, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15932, 260, 2, 7, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15933, 260, 3, 11, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15934, 260, 4, 15, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15935, 260, 5, 20, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15936, 260, 6, 24, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15937, 260, 7, 25, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15938, 260, 8, 29, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15939, 260, 9, 33, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15940, 260, 10, 37, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15941, 261, 1, 3, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15942, 261, 2, 7, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15943, 261, 3, 11, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15944, 261, 4, 15, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15945, 261, 5, 20, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15946, 261, 6, 24, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15947, 261, 7, 25, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15948, 261, 8, 29, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15949, 261, 9, 33, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15950, 261, 10, 37, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15951, 262, 1, 4, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15952, 262, 2, 7, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15953, 262, 3, 11, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15954, 262, 4, 15, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15955, 262, 5, 20, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15956, 262, 6, 24, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15957, 262, 7, 25, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15958, 262, 8, 29, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15959, 262, 9, 33, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15960, 262, 10, 37, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15961, 263, 1, 4, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15962, 263, 2, 6, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15963, 263, 3, 11, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15964, 263, 4, 15, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15965, 263, 5, 20, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15966, 263, 6, 24, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15967, 263, 7, 25, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15968, 263, 8, 29, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15969, 263, 9, 33, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15970, 263, 10, 37, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15971, 264, 1, 4, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15972, 264, 2, 7, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15973, 264, 3, 11, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15974, 264, 4, 15, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15975, 264, 5, 20, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15976, 264, 6, 24, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15977, 264, 7, 25, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15978, 264, 8, 29, '2026-05-05 00:33:04', '2026-05-05 00:33:04');
INSERT INTO `penilaian` (`id_penilaian`, `id_pengajuan`, `id_kriteria`, `id_subkriteria`, `created_at`, `updated_at`) VALUES
(15979, 264, 9, 33, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15980, 264, 10, 37, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15981, 265, 1, 3, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15982, 265, 2, 6, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15983, 265, 3, 11, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15984, 265, 4, 15, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15985, 265, 5, 20, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15986, 265, 6, 24, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15987, 265, 7, 25, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15988, 265, 8, 29, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15989, 265, 9, 33, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15990, 265, 10, 37, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15991, 266, 1, 3, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15992, 266, 2, 6, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15993, 266, 3, 11, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15994, 266, 4, 15, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15995, 266, 5, 20, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15996, 266, 6, 24, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15997, 266, 7, 25, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15998, 266, 8, 29, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(15999, 266, 9, 33, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16000, 266, 10, 37, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16001, 267, 1, 4, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16002, 267, 2, 6, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16003, 267, 3, 11, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16004, 267, 4, 14, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16005, 267, 5, 20, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16006, 267, 6, 24, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16007, 267, 7, 25, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16008, 267, 8, 29, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16009, 267, 9, 33, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16010, 267, 10, 37, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16011, 268, 1, 4, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16012, 268, 2, 7, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16013, 268, 3, 11, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16014, 268, 4, 15, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16015, 268, 5, 20, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16016, 268, 6, 24, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16017, 268, 7, 25, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16018, 268, 8, 29, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16019, 268, 9, 33, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16020, 268, 10, 37, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16021, 269, 1, 3, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16022, 269, 2, 7, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16023, 269, 3, 11, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16024, 269, 4, 15, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16025, 269, 5, 20, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16026, 269, 6, 24, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16027, 269, 7, 25, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16028, 269, 8, 29, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16029, 269, 9, 33, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16030, 269, 10, 37, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16031, 270, 1, 1, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16032, 270, 2, 6, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16033, 270, 3, 11, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16034, 270, 4, 14, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16035, 270, 5, 20, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16036, 270, 6, 24, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16037, 270, 7, 25, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16038, 270, 8, 29, '2026-05-05 00:33:04', '2026-05-05 00:33:04'),
(16039, 270, 9, 33, '2026-05-05 00:33:05', '2026-05-05 00:33:05'),
(16040, 270, 10, 37, '2026-05-05 00:33:05', '2026-05-05 00:33:05'),
(16041, 271, 1, 3, '2026-05-05 00:33:05', '2026-05-05 00:33:05'),
(16042, 271, 2, 7, '2026-05-05 00:33:05', '2026-05-05 00:33:05'),
(16043, 271, 3, 11, '2026-05-05 00:33:05', '2026-05-05 00:33:05'),
(16044, 271, 4, 15, '2026-05-05 00:33:05', '2026-05-05 00:33:05'),
(16045, 271, 5, 20, '2026-05-05 00:33:05', '2026-05-05 00:33:05'),
(16046, 271, 6, 24, '2026-05-05 00:33:05', '2026-05-05 00:33:05'),
(16047, 271, 7, 25, '2026-05-05 00:33:05', '2026-05-05 00:33:05'),
(16048, 271, 8, 29, '2026-05-05 00:33:05', '2026-05-05 00:33:05'),
(16049, 271, 9, 33, '2026-05-05 00:33:05', '2026-05-05 00:33:05'),
(16050, 271, 10, 37, '2026-05-05 00:33:05', '2026-05-05 00:33:05'),
(16051, 272, 1, 4, '2026-05-05 00:33:05', '2026-05-05 00:33:05'),
(16052, 272, 2, 6, '2026-05-05 00:33:05', '2026-05-05 00:33:05'),
(16053, 272, 3, 11, '2026-05-05 00:33:05', '2026-05-05 00:33:05'),
(16054, 272, 4, 15, '2026-05-05 00:33:05', '2026-05-05 00:33:05'),
(16055, 272, 5, 20, '2026-05-05 00:33:05', '2026-05-05 00:33:05'),
(16056, 272, 6, 24, '2026-05-05 00:33:05', '2026-05-05 00:33:05'),
(16057, 272, 7, 25, '2026-05-05 00:33:05', '2026-05-05 00:33:05'),
(16058, 272, 8, 29, '2026-05-05 00:33:05', '2026-05-05 00:33:05'),
(16059, 272, 9, 33, '2026-05-05 00:33:05', '2026-05-05 00:33:05'),
(16060, 272, 10, 37, '2026-05-05 00:33:05', '2026-05-05 00:33:05'),
(16071, 274, 1, 1, '2026-05-05 00:33:05', '2026-05-05 00:33:05'),
(16072, 274, 2, 5, '2026-05-05 00:33:05', '2026-05-05 00:33:05'),
(16073, 274, 3, 11, '2026-05-05 00:33:05', '2026-05-05 00:33:05'),
(16074, 274, 4, 13, '2026-05-05 00:33:05', '2026-05-05 00:33:05'),
(16075, 274, 5, 17, '2026-05-05 00:33:05', '2026-05-05 00:33:05'),
(16076, 274, 6, 21, '2026-05-05 00:33:05', '2026-05-05 00:33:05'),
(16077, 274, 7, 25, '2026-05-05 00:33:05', '2026-05-05 00:33:05'),
(16078, 274, 8, 29, '2026-05-05 00:33:05', '2026-05-05 00:33:05'),
(16079, 274, 9, 33, '2026-05-05 00:33:05', '2026-05-05 00:33:05'),
(16080, 274, 10, 37, '2026-05-05 00:33:05', '2026-05-05 00:33:05'),
(16121, 276, 1, 3, '2026-05-05 00:33:54', '2026-05-05 00:33:54'),
(16122, 276, 2, 7, '2026-05-05 00:33:54', '2026-05-05 00:33:54'),
(16123, 276, 3, 11, '2026-05-05 00:33:54', '2026-05-05 00:33:54'),
(16124, 276, 4, 15, '2026-05-05 00:33:54', '2026-05-05 00:33:54'),
(16125, 276, 5, 19, '2026-05-05 00:33:54', '2026-05-05 00:33:54'),
(16126, 276, 6, 23, '2026-05-05 00:33:54', '2026-05-05 00:33:54'),
(16127, 276, 7, 27, '2026-05-05 00:33:54', '2026-05-05 00:33:54'),
(16128, 276, 8, 31, '2026-05-05 00:33:54', '2026-05-05 00:33:54'),
(16129, 276, 9, 35, '2026-05-05 00:33:54', '2026-05-05 00:33:54'),
(16130, 276, 10, 39, '2026-05-05 00:33:54', '2026-05-05 00:33:54'),
(16131, 275, 1, 2, '2026-05-05 00:34:12', '2026-05-05 00:34:12'),
(16132, 275, 2, 6, '2026-05-05 00:34:12', '2026-05-05 00:34:12'),
(16133, 275, 3, 10, '2026-05-05 00:34:12', '2026-05-05 00:34:12'),
(16134, 275, 4, 14, '2026-05-05 00:34:12', '2026-05-05 00:34:12'),
(16135, 275, 5, 18, '2026-05-05 00:34:12', '2026-05-05 00:34:12'),
(16136, 275, 6, 22, '2026-05-05 00:34:12', '2026-05-05 00:34:12'),
(16137, 275, 7, 26, '2026-05-05 00:34:12', '2026-05-05 00:34:12'),
(16138, 275, 8, 30, '2026-05-05 00:34:12', '2026-05-05 00:34:12'),
(16139, 275, 9, 34, '2026-05-05 00:34:12', '2026-05-05 00:34:12'),
(16140, 275, 10, 38, '2026-05-05 00:34:12', '2026-05-05 00:34:12'),
(16141, 273, 1, 1, '2026-05-05 00:34:30', '2026-05-05 00:34:30'),
(16142, 273, 2, 5, '2026-05-05 00:34:30', '2026-05-05 00:34:30'),
(16143, 273, 3, 9, '2026-05-05 00:34:30', '2026-05-05 00:34:30'),
(16144, 273, 4, 13, '2026-05-05 00:34:30', '2026-05-05 00:34:30'),
(16145, 273, 5, 17, '2026-05-05 00:34:30', '2026-05-05 00:34:30'),
(16146, 273, 6, 21, '2026-05-05 00:34:30', '2026-05-05 00:34:30'),
(16147, 273, 7, 25, '2026-05-05 00:34:30', '2026-05-05 00:34:30'),
(16148, 273, 8, 29, '2026-05-05 00:34:30', '2026-05-05 00:34:30'),
(16149, 273, 9, 33, '2026-05-05 00:34:30', '2026-05-05 00:34:30'),
(16150, 273, 10, 37, '2026-05-05 00:34:30', '2026-05-05 00:34:30'),
(16161, 278, 1, 4, '2026-05-07 23:07:53', '2026-05-07 23:07:53'),
(16162, 278, 2, 7, '2026-05-07 23:07:53', '2026-05-07 23:07:53'),
(16163, 278, 3, 12, '2026-05-07 23:07:53', '2026-05-07 23:07:53'),
(16164, 278, 4, 14, '2026-05-07 23:07:53', '2026-05-07 23:07:53'),
(16165, 278, 5, 20, '2026-05-07 23:07:53', '2026-05-07 23:07:53'),
(16166, 278, 6, 24, '2026-05-07 23:07:53', '2026-05-07 23:07:53'),
(16167, 278, 7, 28, '2026-05-07 23:07:53', '2026-05-07 23:07:53'),
(16168, 278, 8, 30, '2026-05-07 23:07:53', '2026-05-07 23:07:53'),
(16169, 278, 9, 35, '2026-05-07 23:07:53', '2026-05-07 23:07:53'),
(16170, 278, 10, 40, '2026-05-07 23:07:53', '2026-05-07 23:07:53'),
(16201, 281, 1, 4, '2026-05-07 23:52:29', '2026-05-07 23:52:29'),
(16202, 281, 2, 8, '2026-05-07 23:52:29', '2026-05-07 23:52:29'),
(16203, 281, 3, 12, '2026-05-07 23:52:29', '2026-05-07 23:52:29'),
(16204, 281, 4, 16, '2026-05-07 23:52:29', '2026-05-07 23:52:29'),
(16205, 281, 5, 20, '2026-05-07 23:52:29', '2026-05-07 23:52:29'),
(16206, 281, 6, 24, '2026-05-07 23:52:29', '2026-05-07 23:52:29'),
(16207, 281, 7, 28, '2026-05-07 23:52:29', '2026-05-07 23:52:29'),
(16208, 281, 8, 32, '2026-05-07 23:52:29', '2026-05-07 23:52:29'),
(16209, 281, 9, 36, '2026-05-07 23:52:29', '2026-05-07 23:52:29'),
(16210, 281, 10, 40, '2026-05-07 23:52:29', '2026-05-07 23:52:29'),
(16211, 279, 1, 1, '2026-05-18 02:30:55', '2026-05-18 02:30:55'),
(16212, 279, 2, 5, '2026-05-18 02:30:55', '2026-05-18 02:30:55'),
(16213, 279, 3, 9, '2026-05-18 02:30:55', '2026-05-18 02:30:55'),
(16214, 279, 4, 13, '2026-05-18 02:30:55', '2026-05-18 02:30:55'),
(16215, 279, 5, 17, '2026-05-18 02:30:55', '2026-05-18 02:30:55'),
(16216, 279, 6, 21, '2026-05-18 02:30:55', '2026-05-18 02:30:55'),
(16217, 279, 7, 25, '2026-05-18 02:30:55', '2026-05-18 02:30:55'),
(16218, 279, 8, 29, '2026-05-18 02:30:55', '2026-05-18 02:30:55'),
(16219, 279, 9, 33, '2026-05-18 02:30:55', '2026-05-18 02:30:55'),
(16220, 279, 10, 37, '2026-05-18 02:30:55', '2026-05-18 02:30:55'),
(16221, 280, 1, 4, '2026-05-18 02:31:36', '2026-05-18 02:31:36'),
(16222, 280, 2, 8, '2026-05-18 02:31:36', '2026-05-18 02:31:36'),
(16223, 280, 3, 12, '2026-05-18 02:31:36', '2026-05-18 02:31:36'),
(16224, 280, 4, 16, '2026-05-18 02:31:36', '2026-05-18 02:31:36'),
(16225, 280, 5, 20, '2026-05-18 02:31:36', '2026-05-18 02:31:36'),
(16226, 280, 6, 24, '2026-05-18 02:31:36', '2026-05-18 02:31:36'),
(16227, 280, 7, 28, '2026-05-18 02:31:36', '2026-05-18 02:31:36'),
(16228, 280, 8, 32, '2026-05-18 02:31:36', '2026-05-18 02:31:36'),
(16229, 280, 9, 36, '2026-05-18 02:31:36', '2026-05-18 02:31:36'),
(16230, 280, 10, 40, '2026-05-18 02:31:36', '2026-05-18 02:31:36'),
(16241, 277, 1, 4, '2026-06-05 07:27:43', '2026-06-05 07:27:43'),
(16242, 277, 2, 8, '2026-06-05 07:27:43', '2026-06-05 07:27:43'),
(16243, 277, 3, 12, '2026-06-05 07:27:43', '2026-06-05 07:27:43'),
(16244, 277, 4, 16, '2026-06-05 07:27:43', '2026-06-05 07:27:43'),
(16245, 277, 5, 20, '2026-06-05 07:27:43', '2026-06-05 07:27:43'),
(16246, 277, 6, 24, '2026-06-05 07:27:43', '2026-06-05 07:27:43'),
(16247, 277, 7, 28, '2026-06-05 07:27:43', '2026-06-05 07:27:43'),
(16248, 277, 8, 32, '2026-06-05 07:27:43', '2026-06-05 07:27:43'),
(16249, 277, 9, 36, '2026-06-05 07:27:43', '2026-06-05 07:27:43'),
(16250, 277, 10, 40, '2026-06-05 07:27:43', '2026-06-05 07:27:43');

-- --------------------------------------------------------

--
-- Table structure for table `personal_access_tokens`
--

CREATE TABLE `personal_access_tokens` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `tokenable_type` varchar(255) NOT NULL,
  `tokenable_id` bigint(20) UNSIGNED NOT NULL,
  `name` text NOT NULL,
  `token` varchar(64) NOT NULL,
  `abilities` text DEFAULT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `personal_access_tokens`
--

-- Dumping data for table `personal_access_tokens`: empty for security

-- --------------------------------------------------------

--
-- Table structure for table `pesan_chat`
--

CREATE TABLE `pesan_chat` (
  `id_pesan` bigint(20) UNSIGNED NOT NULL,
  `id_pengajuan` bigint(20) UNSIGNED NOT NULL,
  `pengirim_role` enum('warga','rt') NOT NULL,
  `isi_pesan` text NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `pesan_chat`
--

INSERT INTO `pesan_chat` (`id_pesan`, `id_pengajuan`, `pengirim_role`, `isi_pesan`, `created_at`, `updated_at`) VALUES
(1, 278, 'warga', 'makasih pak', '2026-05-09 13:42:22', '2026-05-09 13:42:22'),
(2, 278, 'rt', 'selamat ya kamu terpilih', '2026-05-09 14:03:14', '2026-05-09 14:03:14'),
(3, 277, 'rt', 'maaf dek kamu masih tertolak', '2026-05-09 14:03:39', '2026-05-09 14:03:39'),
(4, 277, 'warga', 'yaampun pak', '2026-05-09 14:04:15', '2026-05-09 14:04:15'),
(5, 277, 'warga', 'kenapa ya pak alasannya?', '2026-05-09 14:04:27', '2026-05-09 14:04:27'),
(6, 277, 'rt', 'kamu tidak layak', '2026-05-09 21:16:04', '2026-05-09 21:16:04'),
(7, 278, 'rt', 'tapi boong', '2026-05-14 16:13:43', '2026-05-14 16:13:43');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sub_kriteria`
--

CREATE TABLE `sub_kriteria` (
  `id_subkriteria` bigint(20) UNSIGNED NOT NULL,
  `id_kriteria` bigint(20) UNSIGNED NOT NULL,
  `keterangan` varchar(255) NOT NULL,
  `nilai` double NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sub_kriteria`
--

INSERT INTO `sub_kriteria` (`id_subkriteria`, `id_kriteria`, `keterangan`, `nilai`, `created_at`, `updated_at`) VALUES
(1, 1, '> 3 KK', 10, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(2, 1, '3 KK', 7.5, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(3, 1, '2 KK', 5, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(4, 1, '1 KK', 2.5, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(5, 2, '> 6 Orang', 10, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(6, 2, '5 Orang', 7.5, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(7, 2, '4 Orang', 5, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(8, 2, '1 - 3 Orang', 2.5, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(9, 3, 'Tidak Sekolah / Tidak Tamat SD', 2.5, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(10, 3, 'SD', 5, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(11, 3, 'SMP', 7.5, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(12, 3, 'SMA / SMK / PT', 10, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(13, 4, '> 3 Orang', 10, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(14, 4, '2 Orang', 7.5, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(15, 4, '1 Orang', 5, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(16, 4, 'Tidak Ada', 2.5, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(17, 5, '< 400 Ribu', 2.5, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(18, 5, '400 - 700 Ribu', 5, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(19, 5, '700 Ribu - 1 Juta', 7.5, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(20, 5, '> 1 Juta', 10, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(21, 6, '< 400 Ribu', 2.5, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(22, 6, '400 - 700 Ribu', 5, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(23, 6, '700 Ribu - 1 Juta', 7.5, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(24, 6, '> 1 Juta', 10, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(25, 7, 'Magersari / Pakai Gratis', 2.5, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(26, 7, 'Sewa < 1 Juta', 5, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(27, 7, 'Milik Orang Tua / Warisan', 7.5, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(28, 7, 'Milik Sendiri / Sewa', 10, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(29, 8, 'Sumur Milik Tetangga', 2.5, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(30, 8, 'Sumur Milik Sendiri', 5, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(31, 8, 'PDAM Terbatas', 7.5, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(32, 8, 'PDAM Bebas / Air Kemasan', 10, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(33, 9, 'Listrik Numpang', 2.5, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(34, 9, 'Listrik 450 watt', 5, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(35, 9, 'Listrik 900 watt', 7.5, '2026-04-29 19:03:02', '2026-04-29 19:03:02'),
(36, 9, 'Listrik > 900 watt', 10, '2026-04-29 19:03:03', '2026-04-29 19:03:03'),
(37, 10, 'Jalan Kaki / Sepeda / Motor Seadanya', 2.5, '2026-04-29 19:03:03', '2026-04-29 19:03:03'),
(38, 10, 'Sepeda Motor 1 Buah, dalam Kondisi Baik', 5, '2026-04-29 19:03:03', '2026-04-29 19:03:03'),
(39, 10, 'Sepeda Motor > 1 Buah, dalam Kondisi Baik', 7.5, '2026-04-29 19:03:03', '2026-04-29 19:03:03'),
(40, 10, 'Mobil', 10, '2026-04-29 19:03:03', '2026-04-29 19:03:03');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','rw','rt','warga') NOT NULL,
  `rt` varchar(5) DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `alamat` text NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `username`, `password`, `role`, `rt`, `remember_token`, `created_at`, `updated_at`, `alamat`) VALUES
(1, 'Administrator Sistem', 'admin', '$2y$12$tXledQTTuC1evBNONYh.BuNmi3NvvARs0ybdaFL3dZdEKIgX2/6Lm', 'admin', NULL, NULL, '2026-04-29 19:03:00', '2026-04-29 19:03:00', ''),
(2, 'Bapak Ketua RW 08', 'rw08', '$2y$12$oG3rgcXmC4EEZHRQPsI.6u1/U9g0eBwUXgqaet0tWduZO0DTEdHHa', 'rw', '002', NULL, '2026-04-29 19:03:01', '2026-05-09 22:17:45', ''),
(3, 'Ketua RT 001', 'rt001', '$2y$12$E2B9WugFC/MSiRExDqwD9uUMFO3nJQ4HPY3JvAP.b29CSNKZT/c6y', 'rt', '001', NULL, '2026-04-29 19:03:01', '2026-05-10 06:24:39', ''),
(4, 'Ketua RT 002', 'rt002', '$2y$12$xyt5GjDZGtumjKOXr.uaMOWxDVyZdLDt0gAMYFw6b0eXESFHCxEMi', 'rt', '002', NULL, '2026-04-29 19:03:02', '2026-05-10 06:24:17', ''),
(5, 'Ketua RT 003', 'rt003', '$2y$12$22ueo1wYrTMVqhWv5jcrj.RXS68cwJxNlK0ebKrFSh/bUkqVdSxx.', 'rt', '003', NULL, '2026-04-29 19:03:02', '2026-05-10 06:24:29', ''),
(7, 'Wildan Humaidi', 'wildan', '$2y$12$yBI3ttE2Dz4v3I8B3b10Qe.N0IL3M6R0G9tQvdoOD18Bjf3XGK4xa', 'warga', '3', NULL, '2026-05-03 20:40:58', '2026-05-27 11:29:30', 'jl amir marsiah'),
(102, 'Dwi purnomo', 'dwipurnomo11', '$2y$12$Np2DA9MMtZExHXWwv.BVU.9.tlOwBbclOTJjw7HI0nb3LQkrpdL8K', 'warga', '3', NULL, '2026-05-04 11:07:36', '2026-05-09 22:46:50', 'Jl.amir marsiah'),
(103, 'Iwan gunawan', 'iwangunawan35', '$2y$12$7qvNysUUEFhzeqiXTexwRuzEZjpz4LrV0sV9rTYUgn2H82WZC8T.e', 'warga', '1', NULL, '2026-05-04 11:07:37', '2026-05-09 22:46:50', 'Jln meruyung raya no 33'),
(104, 'Sutrisno', 'sutrisno11', '$2y$12$D8DyxbwZfRRB6rIBiC48/ewzodt2TMrkotE9iRKPd14cOjf.Yb076', 'warga', '3', NULL, '2026-05-04 11:07:37', '2026-05-09 22:46:50', 'Jl Hj Amir Marsiah'),
(105, 'Didin', 'didin75', '$2y$12$rJXugxzthJaZd8k64rUNEe6IEtU60TReGDT1g0EBGS/N/ekz664xm', 'warga', '3', NULL, '2026-05-04 11:07:38', '2026-05-09 22:46:50', 'H marsiah'),
(106, 'M.Alinafiah sari', 'malinafiahsari30', '$2y$12$YAiMp6PJAB8uAjH5YbPKCuslDk0DIGs9ayQt9UIuAj/fnJP2ssFT6', 'warga', '3', NULL, '2026-05-04 11:07:39', '2026-05-09 22:46:50', 'Jl.Amirmarsiah'),
(107, 'Kuat', 'kuat81', '$2y$12$t1VO9MlNoxFHz/qMqcPkXus0TDwilHUh2BhOW.zU7EFpr3X5q2CVS', 'warga', '3', NULL, '2026-05-04 11:07:40', '2026-05-09 22:46:50', 'Jln H Amir Marsiah'),
(108, 'Kasidin', 'kasidin96', '$2y$12$ZG7dYF9UMK3pBKyPK5Cs1.YcxO1eX9dBKmZzrP4eFvsvRCaALQWH2', 'warga', '3', NULL, '2026-05-04 11:07:40', '2026-05-09 22:46:50', 'Jl.H. Amir Marsiah'),
(109, 'adi gojali', 'adigojali74', '$2y$12$0XUFrGtiAC5iLWSqSGV7kuaGP43R7MsjRSw8/C0fWCaeu9z.Hw5Ii', 'warga', '3', NULL, '2026-05-04 11:07:41', '2026-05-09 22:46:50', 'jalan amir marsiah'),
(110, 'Siti Laeli Musarofah', 'sitilaelimusarofah65', '$2y$12$Sf51kt11hInbcR.I6mNm0.6SAUh6/InUuFAiT/aObQAioRRrCSBmy', 'warga', '1', NULL, '2026-05-04 11:07:41', '2026-05-09 22:46:50', 'jl.Meruyung Raya'),
(111, 'basuki', 'basuki65', '$2y$12$wGG/7HB5.k7C3FfIxp236u6aUT8cGLwFtztMbUVLjkaRbhvV08MZK', 'warga', '3', NULL, '2026-05-04 11:07:42', '2026-05-09 22:46:50', 'jl amir marsiah'),
(112, 'Cikal Tanjung', 'cikaltanjung25', '$2y$12$4JP8EYYCsuWirujm2RUXpOKBuLWiBg2DeX9FoHtUnY0yPrgpCOdKe', 'warga', '1', NULL, '2026-05-04 11:07:43', '2026-05-09 22:46:50', 'JL.Meruyung'),
(113, 'Ismulyati', 'ismulyati61', '$2y$12$o3C3bSImg.AlsdWd1QCZZuYejvsJw93/jV4bmemMsHBWB3uFS3hyi', 'warga', '1', NULL, '2026-05-04 11:07:43', '2026-05-09 22:46:50', 'KP Bojong'),
(114, 'ARIF HIDAYAT', 'arifhidayat18', '$2y$12$e9UPI4Ex8DpSj683Qh3OwePDI11/c074eEyIUW4PjfiNDXrPIPKpy', 'warga', '2', NULL, '2026-05-04 11:07:44', '2026-05-09 22:46:50', 'JL MUSHOLAH AL MARDOTILAH'),
(115, 'MISLENA', 'mislena83', '$2y$12$9Aa4FBGhk.L25Ukh0M2lWOCDx1.oO7YkvE.Cvyulp8ISpv9e6Tlem', 'warga', '2', NULL, '2026-05-04 11:07:44', '2026-05-09 22:46:50', 'JL H. MAHMUD'),
(116, 'EDI GOZALI', 'edigozali49', '$2y$12$bJQWCiCX5BOLKqBREWUa0u8mEd/DBkMQMR7RGSYVSLvQLQxMjXY7K', 'warga', '3', NULL, '2026-05-04 11:07:45', '2026-05-09 22:46:50', 'AMIR MARSIAH'),
(117, 'Ismaini Sitindaon', 'ismainisitindaon54', '$2y$12$qVHiYiWsRwKOGek2gKN1g.BT16XMmtqvlW.UfII/KuRX0euZyHV2K', 'warga', '1', NULL, '2026-05-04 11:07:46', '2026-05-09 22:46:50', 'jln.bakti 1'),
(118, 'ENAH SUTIANAH', 'enahsutianah36', '$2y$12$SvrUVVdJFZARMAeS5yyV0etaHar4ymyhgBI2iwkGwtaFR6y9pkDgq', 'warga', '2', NULL, '2026-05-04 11:07:46', '2026-05-09 22:46:50', 'JL H. AMIR MARSIAH'),
(119, 'NURYATI', 'nuryati26', '$2y$12$XisNGEQqrSwyf0vyZ5a8qO7B8PGkidOYuNGhfivrM5jlbhnBh57.e', 'warga', '2', NULL, '2026-05-04 11:07:47', '2026-05-09 22:46:50', 'JL H MAHMUD'),
(120, 'MINAH', 'minah28', '$2y$12$/384PYqM9IaM8f81/6a/E.qZfeVtzHoVUPb4AnYRg6QWOp/BBI1q.', 'warga', '3', NULL, '2026-05-04 11:07:47', '2026-05-09 22:46:50', 'JALAN H AMIR MARSIAH'),
(121, 'SITI MULYANI', 'sitimulyani69', '$2y$12$fCoZN2S2AkNTZZ69h/7lF.AaSHigIv2Zg/I4iFo.2l8/s.QRsFIpu', 'warga', '2', NULL, '2026-05-04 11:07:48', '2026-05-09 22:46:50', 'JL HAMENGKUBUWONO 10'),
(122, 'MUANIH', 'muanih35', '$2y$12$OLo5BLn5ex2ThL.qaMosVu03EaztI3IyC9KetuHHSDP6M0fM.lbl2', 'warga', '2', NULL, '2026-05-04 11:07:49', '2026-05-09 22:46:50', 'JL H AMIR MARSIAH'),
(123, 'GEDE NUR ALAM', 'gedenuralam61', '$2y$12$eIH.uyAuqf094k67E8xemO0P2Vbjl0wvM7ZDmREFohDtKQqufuqIW', 'warga', '3', NULL, '2026-05-04 11:07:49', '2026-05-09 22:46:50', 'JL H ROTO'),
(124, 'ISNAWATI', 'isnawati56', '$2y$12$m.MZYtkfdDddm70UlvRnk.kSDzdn2mRNjFy4QhDB6N.UWnspnJYf6', 'warga', '1', NULL, '2026-05-04 11:07:50', '2026-05-09 22:46:50', 'JLN. MERUYUNG'),
(125, 'ROYANAH', 'royanah17', '$2y$12$OCBdHXMoNLG6EmBRqkpuheBgA8RVOVUWNz79zSQLvKsDVJD.f6Y2q', 'warga', '2', NULL, '2026-05-04 11:07:51', '2026-05-09 22:46:50', 'JL MERUYUNG RAYA'),
(126, 'TARIGAN', 'tarigan34', '$2y$12$/oZTMT2mvyCyFlXWasERmeqdBR5/qkgSBPiE8MNL1Gog0EiNAEkH6', 'warga', '3', NULL, '2026-05-04 11:07:51', '2026-05-09 22:46:50', 'AMIR MARSIAH'),
(127, 'SURAYA', 'suraya44', '$2y$12$sT0HvvP6ILzCgO5cFS0tguR3rubWkaQDBKnnkcEWlc662f7L4FInO', 'warga', '2', NULL, '2026-05-04 11:07:52', '2026-05-09 22:46:50', 'JL H AMIR MARSIAH'),
(128, 'WANIH', 'wanih96', '$2y$12$AXaU9UjRmhObwh4dobk0aOKgDlUzMI6vjHEuJJYv7LderS6f4x6FK', 'warga', '2', NULL, '2026-05-04 11:07:52', '2026-05-09 22:46:50', 'JL H MAHMUD'),
(129, 'TRISNO', 'trisno13', '$2y$12$aDpeEtZ7L3WrPL4uFtzMK.CUy.YwjWYewPV5C8QG00oZsqj2EFEUG', 'warga', '3', NULL, '2026-05-04 11:07:53', '2026-05-09 22:46:50', 'JL AMIR MARSIAH'),
(130, 'ARIF RAKHMAN', 'arifrakhman52', '$2y$12$cdoHLBeZBL77VwChLYW1ZOUBM.6opZwHnEh0UP.mR.fntnj8.qyP.', 'warga', '2', NULL, '2026-05-04 11:07:54', '2026-05-09 22:46:50', 'JL H. AMIR MARSIAH'),
(131, 'MARIYAM', 'mariyam72', '$2y$12$FzcsfYh4jjHRmUzUcRj7ke5sXlM21HlosCLWj7AehutZigiU2jY5y', 'warga', '1', NULL, '2026-05-04 11:07:54', '2026-05-09 22:46:50', 'JL. Meruyung raya'),
(132, 'Nami', 'nami50', '$2y$12$ptBInh0zZyCZGUO4LBNZFejsbxAaLnewNvYTurXUGHzbJnOvyn3Mu', 'warga', '1', NULL, '2026-05-04 11:07:55', '2026-05-09 22:46:50', 'Jl. meruyung limo'),
(133, 'SADIYAH', 'sadiyah88', '$2y$12$UM0g52z1nyTwIU0pUE3NT.unjPoY/oEhUacsnKOsyL1sdIGLoJI7K', 'warga', '2', NULL, '2026-05-04 11:07:55', '2026-05-09 22:46:50', 'JL H. AMIR MARSIAH'),
(134, 'Cikal Monita', 'cikalmonita53', '$2y$12$IAz4vq39sSK/4WVrazZfB.dSC.Z4VT2DBUzvm.7p.vEuGp..KiSVK', 'warga', '1', NULL, '2026-05-04 11:07:56', '2026-05-09 22:46:50', 'Jl. meruyung limo'),
(135, 'NURYATI', 'nuryati33', '$2y$12$Bj4ld8JsxZwrFqKwLXJ9ouWmG5e4DjJTMax7iZuIhUSDp8cOZMZk2', 'warga', '3', NULL, '2026-05-04 11:07:57', '2026-05-09 22:46:50', 'jalan amir marsiyah'),
(136, 'RINA', 'rina84', '$2y$12$AJdx.U30EgVI3Am7TncMJel7b.g5.mpnWb6qdKGjz.wCqcbWl0kA6', 'warga', '2', NULL, '2026-05-04 11:07:57', '2026-05-09 22:46:50', 'JL H. AMIR MARSIAH'),
(137, 'Rohaya', 'rohaya17', '$2y$12$3AJGVo27dJxNKutwi7QM2OG94jdVYCZQIFqwFHmHVrgI.zJ2FNTyq', 'warga', '1', NULL, '2026-05-04 11:07:58', '2026-05-09 22:46:50', 'jl Meruyung'),
(138, 'Saroh', 'saroh14', '$2y$12$3mCh5axSyYVZSLs3Vla8AeaevjRiiaWABS5RuXoV2ZBMpO.DD.0.i', 'warga', '1', NULL, '2026-05-04 11:07:59', '2026-05-09 22:46:50', 'Jl. meruyung limo'),
(139, 'Suci Rahmadia', 'sucirahmadia51', '$2y$12$EzWDkIAksMrdwFnG.FSfAOPfELA2nbf1EWaoP3XcXh.MSVPM8Hy2C', 'warga', '1', NULL, '2026-05-04 11:07:59', '2026-05-09 22:46:50', 'Jl. meruyung limo no 87'),
(140, 'YUSUF', 'yusuf44', '$2y$12$G5SbpD/tP6uJlYePBhGeeeT/Ali5Muu6r6u49VMp.Le3vm058KAIe', 'warga', '2', NULL, '2026-05-04 11:08:00', '2026-05-09 22:46:50', 'JL MUSHOLAH AL MAR'),
(141, 'Windiyani', 'windiyani96', '$2y$12$nDkqVVSmjoC4gkYrEQspTO/CgG3VUtmCyRGcaqIMqwCdZnuYDVHhe', 'warga', '1', NULL, '2026-05-04 11:08:00', '2026-05-09 22:46:50', 'jl.Bakti II'),
(142, 'Endang Sri Hartini', 'endangsrihartini70', '$2y$12$c9iVR07ozGZbNyemzhHN0OAdOao23iSYbHesoNaUzwMfklpNwaMC.', 'warga', '1', NULL, '2026-05-04 11:08:01', '2026-05-09 22:46:50', 'Jl. meruyung limo'),
(143, 'THE LONG ALYUNUS', 'thelongalyunus24', '$2y$12$2.e9pnXVqi/1i4xRfyP1qOBqXDgwyvGesYP.7LFAWkl5NP1Jpwe72', 'warga', '2', NULL, '2026-05-04 11:08:02', '2026-05-09 22:46:50', 'JL MUSHOLAH AL MAR'),
(144, 'RYAN FAUZI', 'ryanfauzi26', '$2y$12$C6B1CQ3By06tGxyinaxpLeCu0dlnR03Rp2QaTsyLwIQUKLpDPlGue', 'warga', '2', NULL, '2026-05-04 11:08:02', '2026-05-09 22:46:50', 'JL HAMENGKUBUWONO 10'),
(145, 'Nasim A', 'nasima88', '$2y$12$tys0bptMWM1WzububbTwpuU1U3OTM3OrwkjDOwzUoerK.l5IG/.Ja', 'warga', '1', NULL, '2026-05-04 11:08:03', '2026-05-09 22:46:50', 'jl. mushollah an ni\'m'),
(146, 'TINI KARTINI', 'tinikartini24', '$2y$12$ZwQUpV40KdBizkMlGGgy1.KYGVTi/JwHsrqfkMxeJLAPSFJlKkckK', 'warga', '2', NULL, '2026-05-04 11:08:03', '2026-05-09 22:46:50', 'JL MUSHOLAH AL MAR'),
(147, 'KOKOM KOMARIYAH', 'kokomkomariyah17', '$2y$12$AAc1euac6lyTUjq3Ez84tu5TlOogv5o7e4PNAgXLSNHWsh4GusD/a', 'warga', '2', NULL, '2026-05-04 11:08:04', '2026-05-09 22:46:50', 'JL MERUYUNG RAYA'),
(148, 'Rusnaningsih', 'rusnaningsih54', '$2y$12$WON02Oikg.JK.E4mfUOJpOfaMFyNdy.8SbXSzUcL9FVjaUtyCO9xm', 'warga', '1', NULL, '2026-05-04 11:08:05', '2026-05-09 22:46:50', 'Jl. meruyung limo no 65'),
(149, 'Sanudin', 'sanudin86', '$2y$12$D9OFEEuCIWpiTYr5RkmXXOhOjH1dPptzTMLEI2zmAaSWr9jTlTtru', 'warga', '1', NULL, '2026-05-04 11:08:06', '2026-05-09 22:46:50', 'Meruyung depok'),
(150, 'Nur Umy Faridah', 'nurumyfaridah44', '$2y$12$yoBVGFO7dczit9LsMoUkeeE281cAFaujGlyP9Za3YtpTGOtWyU2Bq', 'warga', '1', NULL, '2026-05-04 11:08:07', '2026-05-09 22:46:50', 'Jl. meruyung limo no 10'),
(151, 'WAWAN SETIAWAN', 'wawansetiawan92', '$2y$12$y9jwEg0PN9Arzz68Y/ez8Oc9DXeI29AugYfOATeuUx4Y/BFM4O8li', 'warga', '2', NULL, '2026-05-04 11:08:07', '2026-05-09 22:46:50', 'JL H MAHMUD'),
(152, 'Saripah', 'saripah92', '$2y$12$Ziny4qGyYWA5Qb8grFdd0OL69dd5g8ZGLUKA3.VW3PGZ5owJjbPsO', 'warga', '1', NULL, '2026-05-04 11:08:08', '2026-05-09 22:46:50', 'Jl. meruyung limo no 99'),
(153, 'JELFRED NENO', 'jelfredneno94', '$2y$12$JQd3bXcBoK0YtLUSY2aoeeZ8tyg5r8uGFDx484FJFUdsWUc7IMM.q', 'warga', '2', NULL, '2026-05-04 11:08:09', '2026-05-09 22:46:50', 'JL H. AMIR MARSIAH'),
(154, 'Putri Eliyanto', 'putrieliyanto29', '$2y$12$DE6epMaFKQBA5ivd4iuth.ht5Nek.B5TdhTtL/HTDSm5/K9tiARy2', 'warga', '1', NULL, '2026-05-04 11:08:09', '2026-05-09 22:46:50', 'Jl. meruyung limo'),
(155, 'Nurhayati Tampubolon', 'nurhayatitampubolon97', '$2y$12$1d5oD6.5QQLyVLo0xM89F.WpEYc7jW.BnLySYWSDT./yzOOwPsjGW', 'warga', '1', NULL, '2026-05-04 11:08:10', '2026-05-09 22:46:50', 'Jl. meruyung limo'),
(156, 'MAISAROH', 'maisaroh42', '$2y$12$OrL.8F9O3R9Nlz3/C/.IhO40c6RbUu6xIdybYq3YXFCjarOnwoTCy', 'warga', '2', NULL, '2026-05-04 11:08:11', '2026-05-09 22:46:50', 'JL H MAHMUD'),
(157, 'sujiman', 'sujiman45', '$2y$12$EuHHqovX2hKXUE04KmfGk.nGc8jPXZJFQhqeY9A552MUiac6620GS', 'warga', '3', NULL, '2026-05-04 11:08:11', '2026-05-09 22:46:50', 'jalan meruyung raya'),
(158, 'Iwan Syah', 'iwansyah89', '$2y$12$SEXmTGtWH5OqTQk0etZFEOhd9oMESa/Sm5CI18cp7i3G9VmsWKzmS', 'warga', '1', NULL, '2026-05-04 11:08:12', '2026-05-09 22:46:50', 'Jl. Bhakti 2'),
(159, 'ABDUL SOLEH', 'abdulsoleh85', '$2y$12$bQOL1dTr/wZouREqdkKSY.yuLd8jy7JThOaNjv2K959uTa587Es8O', 'warga', '2', NULL, '2026-05-04 11:08:12', '2026-05-09 22:46:50', 'JL HAMENGKUBUWONO 10'),
(160, 'SAIFUL ANWAR', 'saifulanwar90', '$2y$12$wEf3bzgxREpZmEvUKOfX8.xpxOiJjAmqve7QCsHDJodapxo1c4xO2', 'warga', '2', NULL, '2026-05-04 11:08:13', '2026-05-09 22:46:51', 'JL H AMIR MARSIAH'),
(161, 'abdul rohim', 'abdulrohim99', '$2y$12$0K/aytmEULI1fw4EKVxnN.70B8MLIoEsEsInKRZAfMMbQun5qRiSO', 'warga', '3', NULL, '2026-05-04 11:08:13', '2026-05-09 22:46:51', 'jalan meruyung raya'),
(162, 'Jahidin', 'jahidin12', '$2y$12$oHsw3ColxFba7VUfOax57uK4yj3MrZp.y6cJiYyTNLZ7Jmt3KFVb2', 'warga', '1', NULL, '2026-05-04 11:08:14', '2026-05-09 22:46:51', 'Jl. Bhakti 2 no 33'),
(163, 'PUJI ASTUTI', 'pujiastuti46', '$2y$12$kR/RysA7W4iN3lCqyUlQkeb9f5CNUGcoQuSuuzNoVvv7lSjbXohxW', 'warga', '2', NULL, '2026-05-04 11:08:15', '2026-05-09 22:46:51', 'JL MERUYUNG RAYA'),
(164, 'LISA', 'lisa22', '$2y$12$RD8a1UmIZ88BwCHyRFCwAOK4RUU1WuAW1rJbY7K1GAh1z8eDRlkyG', 'warga', '3', NULL, '2026-05-04 11:08:15', '2026-05-09 22:46:51', 'MERUYUNG RAYA'),
(165, 'hayati asmara', 'hayatiasmara81', '$2y$12$alf.t1hwipKBCJKwS9uJYurg7MXLDZ.AdGg0SB46Xr4szysA8W/2u', 'warga', '1', NULL, '2026-05-04 11:08:16', '2026-05-09 22:46:51', 'Jl. meruyung limo no 56'),
(166, 'iwan saipudin', 'iwansaipudin83', '$2y$12$Ezs8xAZBPi/JTpY83c4Jp.4vIrs/0IxflaqEOCB83lVqt69wVzS4i', 'warga', '1', NULL, '2026-05-04 11:08:16', '2026-05-09 22:46:51', 'Jl. meruyung no12'),
(167, 'Mujiono', 'mujiono98', '$2y$12$ZmePMhKiKgfmcEryQpaV6ukVjTmbqSvLJpa5emZyhh7ocySE8dqpu', 'warga', '1', NULL, '2026-05-04 11:08:17', '2026-05-09 22:46:51', 'Jl. meruyung  no 77'),
(168, 'Sutriyanto', 'sutriyanto41', '$2y$12$5PK52C2IQxEEzexaow8NdeB8Zw9Ts7l1TKksjMIKCPLTv6tvMGrgi', 'warga', '1', NULL, '2026-05-04 11:08:18', '2026-05-09 22:46:51', 'Jl. Meruyung'),
(169, 'asnawi', 'asnawi75', '$2y$12$i6NxVVUhJfbqCX2TpCVsKuXaSwG6E2rX0WJCLvJ7ltRoDvHWBuNs6', 'warga', '3', NULL, '2026-05-04 11:08:18', '2026-05-09 22:46:51', 'jalan meruyung raya'),
(170, 'arif rahman', 'arifrahman88', '$2y$12$rji8sgmOUxo1D6pftNeX0OoS2mohr.a7xA7kuu2WCGT8rqkeD68C2', 'warga', '3', NULL, '2026-05-04 11:08:19', '2026-05-09 22:46:51', 'jalan meruyung raya'),
(171, 'Salijo', 'salijo89', '$2y$12$Iqum.jj1lEG06QoQyLtt1.e8AAaNKmPpqpayyYyqcrXGYeYXWG4lu', 'warga', '1', NULL, '2026-05-04 11:08:19', '2026-05-09 22:46:51', 'Jl. meruyung'),
(172, 'neneng nurhasanah', 'nenengnurhasanah70', '$2y$12$wVj6/8Jdrr9nrr1MC/zoWu3xAkeTNEAV.1U.rE822qrImH5z1AuZa', 'warga', '3', NULL, '2026-05-04 11:08:20', '2026-05-09 22:46:51', 'jalan musolah armadotilah'),
(173, 'Deni Roy Sartana', 'deniroysartana21', '$2y$12$POd7Skyr3uLFMSsd.EFJG.jdLVdVjJ9zD.Vkc9.JwyRCrkDpzqdcy', 'warga', '1', NULL, '2026-05-04 11:08:21', '2026-05-09 22:46:51', 'Jl. Bhakti'),
(174, 'Arif Hidayat', 'arifhidayat51', '$2y$12$oppBqjlIl.KL4EqQ4gHopuvX37c.vVKn.e3fJSRbUahz.BZ5cTy0q', 'warga', '1', NULL, '2026-05-04 11:08:21', '2026-05-09 22:46:51', 'Jl. meruyung limo'),
(175, 'Mislena', 'mislena31', '$2y$12$PMfpFgYf46Aw2eNo9d135uyUX2bcEgwXXrcWhPy3ZFffJZ7h88Ske', 'warga', '1', NULL, '2026-05-04 11:08:22', '2026-05-09 22:46:51', 'Jl. meruyung limo'),
(176, 'budi santoso', 'budisantoso89', '$2y$12$CXyoKMqDI8vCq2bWeuC87Oz0LIXX3LK96GzMQl5irJD60dXdGA/UC', 'warga', '3', NULL, '2026-05-04 11:08:23', '2026-05-09 22:46:51', 'jalan masjid al mujahidin'),
(177, 'Basuki', 'basuki22', '$2y$12$NRDLmiqcKTbcFm1tGylCweOhOmqnw7ymUx5vRcOCdx7rG8t9F4E3O', 'warga', '1', NULL, '2026-05-04 11:08:23', '2026-05-09 22:46:51', 'Jl. meruyung'),
(178, 'Suwarji', 'suwarji58', '$2y$12$9hl8xkL.DaFbV/CPr/5SveFHvR8St/S8oEDD9WLJG8S2vcusMIZF6', 'warga', '1', NULL, '2026-05-04 11:08:24', '2026-05-09 22:46:51', 'Jl. meruyung limo no 93'),
(179, 'Dodi Sutamsi', 'dodisutamsi18', '$2y$12$amrEcQa7f2E8DSGVLLJiBe3amiZ0GoorE2JPIDF6HM/fEeRAZrYtG', 'warga', '1', NULL, '2026-05-04 11:08:24', '2026-05-09 22:46:51', 'Jl. meruyung limo'),
(180, 'Lisa', 'lisa19', '$2y$12$CVg6xeq.aLllcHQ6pST4w.G4N.ZT4ypzKhyezpfDS5igueV9bq2iq', 'warga', '1', NULL, '2026-05-04 11:08:25', '2026-05-09 22:46:51', 'Jl. meruyung limo no 77'),
(181, 'Hermansyah', 'hermansyah42', '$2y$12$6C.1rZCL9geo/izsZ5ZG6.c/xewc/N5dsg693YmaZtw8ytUkbf1Ae', 'warga', '3', NULL, '2026-05-04 11:08:26', '2026-05-09 22:46:51', 'Jl.Amir Marsiah'),
(182, 'sumidi', 'sumidi32', '$2y$12$zt4ZEmqB5kOqpxYVlYXrHeQhlur10vWnlwZSCE2y4BpzsHU7GYCIO', 'warga', '3', NULL, '2026-05-04 11:08:26', '2026-05-09 22:46:51', 'jalan meruyung'),
(183, 'kipli', 'kipli23', '$2y$12$72HxdGlJDZv2bMUV62jKq.hOP4aNWDcubCHAEEdhhf0guFpDyWh/y', 'warga', '3', NULL, '2026-05-04 11:08:27', '2026-05-09 22:46:51', 'jalan musolah armadotilah'),
(184, 'yanti', 'yanti92', '$2y$12$scrCNlV0otE8hNItNLlrMe451O2XDymNvxJNqpBMwFKuKX64N7idC', 'warga', '3', NULL, '2026-05-04 11:08:28', '2026-05-09 22:46:51', 'jalan amir marsiah'),
(185, 'muhamad rizqi', 'muhamadrizqi67', '$2y$12$NrbVQ9uUU6p5XQRTH8kWEe94Uy25I.dyb0mxcWqduFR6xM1mQ3Gw2', 'warga', '3', NULL, '2026-05-04 11:08:28', '2026-05-09 22:46:51', 'jalan baru'),
(186, 'nunung', 'nunung36', '$2y$12$VqSDCzzS8Q/OMw6Ig2wYreHEIZd2gwCBYJ/xIzMlVRxhzH2ac0YHC', 'warga', '2', NULL, '2026-05-04 11:08:29', '2026-05-09 22:46:51', 'jl h roto'),
(187, 'komang nur alam', 'komangnuralam90', '$2y$12$S3VENBD.EjXHGrAmbBSKIu2/B50RGOmAWevfSJvtBWsUyUc16FRdS', 'warga', '3', NULL, '2026-05-04 11:08:29', '2026-05-09 22:46:51', 'jalan baru'),
(188, 'siti nuryanih', 'sitinuryanih86', '$2y$12$H7cHA3pc6k9kBU1lYzN9k.1lmasZKQy3XPi/nW/cg5HYKBt8McQ02', 'warga', '2', NULL, '2026-05-04 11:08:30', '2026-05-09 22:46:51', 'jalan musolah armadotilah'),
(189, 'wahyu', 'wahyu65', '$2y$12$0z/8QigZPOwuFmpoQOtYJ.8vkYhqPPd60Euy9b8Ol.uPHJAGkflJu', 'warga', '2', NULL, '2026-05-04 11:08:31', '2026-05-09 22:46:51', 'jalan amir marsiah'),
(190, 'Abdul Munir', 'abdulmunir64', '$2y$12$zpOVPnWYF4RGYsRuA4RBO.YEuAx8S8Hu07XDM0Gvlu7k.taDsHvce', 'warga', '3', NULL, '2026-05-04 11:08:31', '2026-05-09 22:46:51', 'JALAN AMIR MARSIAH'),
(191, 'Naya Nailah Yusril', 'naya', '$2y$12$JFFTW1RXtuTmGbJoawe42OWWaRRSuDA2wjLxwl.yLTaNChCHhfU2i', 'warga', '3', NULL, '2026-05-06 22:23:20', '2026-05-06 22:23:20', 'jalan baru meruyung'),
(192, 'Yudi Nurmansyah', 'yudi', '$2y$12$G4vnx.goE1QTod3AEXtY6O5WHV/WivztcVdX7Q1FS6GTfWydlPJd2', 'warga', '1', NULL, '2026-05-07 23:09:27', '2026-05-07 23:09:27', 'jl meruyung raya'),
(193, 'Devi Rahmawati', 'devi', '$2y$12$0eBezrtEpviOAgeRQ.BVg.utE1o/Seh0BV.8uVayeNAt5LiTIRq9S', 'warga', '2', NULL, '2026-05-07 23:15:03', '2026-05-07 23:15:03', 'jl limo raya'),
(194, 'Laelah Safitri', 'lala', '$2y$12$bKg3Kre1vKguhpkYsJaUUO/nG.Ldgx7ViAmHvROWjuYWAxfeL54em', 'warga', '1', NULL, '2026-05-07 23:49:35', '2026-05-07 23:49:35', 'jl krukut'),
(195, 'Haerul Anwar', 'arul', '$2y$12$V2Cf.jrhu7ma0Ty2Xv9QZOAQLDwJY8LFkdbM3DPQ1xSMQ1diN3qe6', 'warga', '2', NULL, '2026-05-09 13:21:28', '2026-05-09 13:21:28', 'jl limo raya'),
(196, 'gendhis putri', 'gendis', '$2y$12$U8HWvsLy1fv.iL/zLP6bMe194t6m3bl37stI6KzYswM8zfHK8iwlK', 'warga', '2', NULL, '2026-05-10 06:48:33', '2026-05-10 06:49:47', 'jl h roto'),
(197, 'Mora Fermillion', 'mora', '$2y$12$uiN/hyYGfP2uANW5v.sgaesgQ4GqOhVuTIfJBHzLBzmDVEaUGP25O', 'warga', '3', NULL, '2026-05-12 08:01:01', '2026-05-12 08:01:01', 'Jl meruyung raya'),
(199, 'dias', 'dias', '$2y$12$sYuBVo/UfASo7c5w4rJpBeWHj1kl3tZauVpUQqiSjOg2G4ZV9uDo6', 'warga', '3', NULL, '2026-05-13 07:25:58', '2026-05-13 07:25:58', 'jl meruyung raya no 87'),
(200, 'afriza', 'rija', '$2y$12$eG7QIJgFeBtCs.EF1ekLNeOOe17rkblpDiJ0OI/9.CiXEVhW7ONU.', 'warga', '3', NULL, '2026-05-15 04:38:14', '2026-05-27 11:29:13', 'Belum Mengisi Data'),
(201, 'tasya', 'tasya', '$2y$12$NjIxgC2w59YPyRRnSm3fL.U.puuknMWtQizMYqcSgZObpGQdB8A42', 'warga', '2', NULL, '2026-05-26 09:19:11', '2026-05-26 09:19:11', 'jl meruyung');

-- --------------------------------------------------------

--
-- Table structure for table `warga`
--

CREATE TABLE `warga` (
  `id_warga` bigint(20) UNSIGNED NOT NULL,
  `nama_lengkap` varchar(255) NOT NULL,
  `alamat` text DEFAULT NULL,
  `rt` varchar(5) NOT NULL,
  `rw` varchar(3) NOT NULL DEFAULT '008',
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `warga`
--

INSERT INTO `warga` (`id_warga`, `nama_lengkap`, `alamat`, `rt`, `rw`, `password`, `created_at`, `updated_at`) VALUES
(188, 'Dwi purnomo', 'Jl.amir marsiah', '3', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:37', '2026-05-09 22:46:50'),
(189, 'Iwan gunawan', 'Jln meruyung raya no 33', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:37', '2026-05-09 22:46:50'),
(190, 'Sutrisno', 'Jl Hj Amir Marsiah', '3', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:38', '2026-05-09 22:46:50'),
(191, 'Didin', 'H marsiah', '3', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:39', '2026-05-09 22:46:50'),
(192, 'M.Alinafiah sari', 'Jl.Amirmarsiah', '3', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:39', '2026-05-09 22:46:50'),
(193, 'Kuat', 'Jln H Amir Marsiah', '3', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:40', '2026-05-09 22:46:50'),
(194, 'Kasidin', 'Jl.H. Amir Marsiah', '3', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:40', '2026-05-09 22:46:50'),
(195, 'adi gojali', 'jalan amir marsiah', '3', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:41', '2026-05-09 22:46:50'),
(196, 'Siti Laeli Musarofah', 'jl.Meruyung Raya', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:42', '2026-05-09 22:46:50'),
(197, 'basuki', 'jl amir marsiah', '3', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:42', '2026-05-09 22:46:50'),
(198, 'Cikal Tanjung', 'JL.Meruyung', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:43', '2026-05-09 22:46:50'),
(199, 'Ismulyati', 'KP Bojong', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:43', '2026-05-09 22:46:50'),
(200, 'ARIF HIDAYAT', 'JL MUSHOLAH AL MARDOTILAH', '2', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:44', '2026-05-09 22:46:50'),
(201, 'MISLENA', 'JL H. MAHMUD', '2', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:45', '2026-05-09 22:46:50'),
(202, 'EDI GOZALI', 'AMIR MARSIAH', '3', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:45', '2026-05-09 22:46:50'),
(203, 'Ismaini Sitindaon', 'jln.bakti 1', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:46', '2026-05-09 22:46:50'),
(204, 'ENAH SUTIANAH', 'JL H. AMIR MARSIAH', '2', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:47', '2026-05-09 22:46:50'),
(205, 'NURYATI', 'JL H MAHMUD', '2', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:47', '2026-05-09 22:46:50'),
(206, 'MINAH', 'JALAN H AMIR MARSIAH', '3', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:48', '2026-05-09 22:46:50'),
(207, 'SITI MULYANI', 'JL HAMENGKUBUWONO 10', '2', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:48', '2026-05-09 22:46:50'),
(208, 'MUANIH', 'JL H AMIR MARSIAH', '2', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:49', '2026-05-09 22:46:50'),
(209, 'GEDE NUR ALAM', 'JL H ROTO', '3', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:50', '2026-05-09 22:46:50'),
(210, 'ISNAWATI', 'JLN. MERUYUNG', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:50', '2026-05-09 22:46:50'),
(211, 'ROYANAH', 'JL MERUYUNG RAYA', '2', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:51', '2026-05-09 22:46:50'),
(212, 'TARIGAN', 'AMIR MARSIAH', '3', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:51', '2026-05-09 22:46:50'),
(213, 'SURAYA', 'JL H AMIR MARSIAH', '2', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:52', '2026-05-09 22:46:50'),
(214, 'WANIH', 'JL H MAHMUD', '2', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:53', '2026-05-09 22:46:50'),
(215, 'TRISNO', 'JL AMIR MARSIAH', '3', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:53', '2026-05-09 22:46:50'),
(216, 'ARIF RAKHMAN', 'JL H. AMIR MARSIAH', '2', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:54', '2026-05-09 22:46:50'),
(217, 'MARIYAM', 'JL. Meruyung raya', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:55', '2026-05-09 22:46:50'),
(218, 'Nami', 'Jl. meruyung limo', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:55', '2026-05-09 22:46:50'),
(219, 'SADIYAH', 'JL H. AMIR MARSIAH', '2', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:56', '2026-05-09 22:46:50'),
(220, 'Cikal Monita', 'Jl. meruyung limo', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:56', '2026-05-09 22:46:50'),
(221, 'NURYATI', 'jalan amir marsiyah', '3', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:57', '2026-05-09 22:46:50'),
(222, 'RINA', 'JL H. AMIR MARSIAH', '2', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:58', '2026-05-09 22:46:50'),
(223, 'Rohaya', 'jl Meruyung', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:58', '2026-05-09 22:46:50'),
(224, 'Saroh', 'Jl. meruyung limo', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:59', '2026-05-09 22:46:50'),
(225, 'Suci Rahmadia', 'Jl. meruyung limo no 87', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:07:59', '2026-05-09 22:46:50'),
(226, 'YUSUF', 'JL MUSHOLAH AL MAR', '2', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:00', '2026-05-09 22:46:50'),
(227, 'Windiyani', 'jl.Bakti II', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:01', '2026-05-09 22:46:50'),
(228, 'Endang Sri Hartini', 'Jl. meruyung limo', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:01', '2026-05-09 22:46:50'),
(229, 'THE LONG ALYUNUS', 'JL MUSHOLAH AL MAR', '2', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:02', '2026-05-09 22:46:50'),
(230, 'RYAN FAUZI', 'JL HAMENGKUBUWONO 10', '2', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:03', '2026-05-09 22:46:50'),
(231, 'Nasim A', 'jl. mushollah an ni\'m', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:03', '2026-05-09 22:46:50'),
(232, 'TINI KARTINI', 'JL MUSHOLAH AL MAR', '2', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:04', '2026-05-09 22:46:50'),
(233, 'KOKOM KOMARIYAH', 'JL MERUYUNG RAYA', '2', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:04', '2026-05-09 22:46:50'),
(234, 'Rusnaningsih', 'Jl. meruyung limo no 65', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:05', '2026-05-09 22:46:50'),
(235, 'Sanudin', 'Meruyung depok', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:06', '2026-05-09 22:46:50'),
(236, 'Nur Umy Faridah', 'Jl. meruyung limo no 10', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:07', '2026-05-09 22:46:50'),
(237, 'WAWAN SETIAWAN', 'JL H MAHMUD', '2', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:08', '2026-05-09 22:46:50'),
(238, 'Saripah', 'Jl. meruyung limo no 99', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:08', '2026-05-09 22:46:50'),
(239, 'JELFRED NENO', 'JL H. AMIR MARSIAH', '2', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:09', '2026-05-09 22:46:50'),
(240, 'Putri Eliyanto', 'Jl. meruyung limo', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:10', '2026-05-09 22:46:50'),
(241, 'Nurhayati Tampubolon', 'Jl. meruyung limo', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:10', '2026-05-09 22:46:50'),
(242, 'MAISAROH', 'JL H MAHMUD', '2', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:11', '2026-05-09 22:46:50'),
(243, 'sujiman', 'jalan meruyung raya', '3', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:11', '2026-05-09 22:46:50'),
(244, 'Iwan Syah', 'Jl. Bhakti 2', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:12', '2026-05-09 22:46:50'),
(245, 'ABDUL SOLEH', 'JL HAMENGKUBUWONO 10', '2', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:13', '2026-05-09 22:46:50'),
(246, 'SAIFUL ANWAR', 'JL H AMIR MARSIAH', '2', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:13', '2026-05-09 22:46:51'),
(247, 'abdul rohim', 'jalan meruyung raya', '3', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:14', '2026-05-09 22:46:51'),
(248, 'Jahidin', 'Jl. Bhakti 2 no 33', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:14', '2026-05-09 22:46:51'),
(249, 'PUJI ASTUTI', 'JL MERUYUNG RAYA', '2', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:15', '2026-05-09 22:46:51'),
(250, 'LISA', 'MERUYUNG RAYA', '3', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:16', '2026-05-09 22:46:51'),
(251, 'hayati asmara', 'Jl. meruyung limo no 56', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:16', '2026-05-09 22:46:51'),
(252, 'iwan saipudin', 'Jl. meruyung no12', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:17', '2026-05-09 22:46:51'),
(253, 'Mujiono', 'Jl. meruyung  no 77', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:17', '2026-05-09 22:46:51'),
(254, 'Sutriyanto', 'Jl. Meruyung', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:18', '2026-05-09 22:46:51'),
(255, 'asnawi', 'jalan meruyung raya', '3', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:19', '2026-05-09 22:46:51'),
(256, 'arif rahman', 'jalan meruyung raya', '3', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:19', '2026-05-09 22:46:51'),
(257, 'Salijo', 'Jl. meruyung', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:20', '2026-05-09 22:46:51'),
(258, 'neneng nurhasanah', 'jalan musolah armadotilah', '3', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:20', '2026-05-09 22:46:51'),
(259, 'Deni Roy Sartana', 'Jl. Bhakti', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:21', '2026-05-09 22:46:51'),
(260, 'Arif Hidayat', 'Jl. meruyung limo', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:22', '2026-05-09 22:46:51'),
(261, 'Mislena', 'Jl. meruyung limo', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:22', '2026-05-09 22:46:51'),
(262, 'budi santoso', 'jalan masjid al mujahidin', '3', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:23', '2026-05-09 22:46:51'),
(263, 'Basuki', 'Jl. meruyung', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:23', '2026-05-09 22:46:51'),
(264, 'Suwarji', 'Jl. meruyung limo no 93', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:24', '2026-05-09 22:46:51'),
(265, 'Dodi Sutamsi', 'Jl. meruyung limo', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:25', '2026-05-09 22:46:51'),
(266, 'Lisa', 'Jl. meruyung limo no 77', '1', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:25', '2026-05-09 22:46:51'),
(267, 'Hermansyah', 'Jl.Amir Marsiah', '3', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:26', '2026-05-09 22:46:51'),
(268, 'sumidi', 'jalan meruyung', '3', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:27', '2026-05-09 22:46:51'),
(269, 'kipli', 'jalan musolah armadotilah', '3', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:27', '2026-05-09 22:46:51'),
(270, 'yanti', 'jalan amir marsiah', '3', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:28', '2026-05-09 22:46:51'),
(271, 'muhamad rizqi', 'jalan baru', '3', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:28', '2026-05-09 22:46:51'),
(272, 'nunung', 'jl h roto', '2', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:29', '2026-05-09 22:46:51'),
(273, 'komang nur alam', 'jalan baru', '3', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:30', '2026-05-09 22:46:51'),
(274, 'siti nuryanih', 'jalan musolah armadotilah', '2', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:30', '2026-05-09 22:46:51'),
(275, 'wahyu', 'jalan amir marsiah', '2', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:31', '2026-05-09 22:46:51'),
(276, 'Abdul Munir', 'JALAN AMIR MARSIAH', '3', '8', '$2y$12$iWlIvpc8RpT/Nrog/EV3f.qQ8Qj.pEizjAQCzbnUByftOjfPdB31C', '2026-05-04 11:08:32', '2026-05-09 22:46:51'),
(277, 'Wildan Humaidi', 'jl amir marsiah', '003', '08', '$2y$12$ZiF8vhIiGnByEjH5NwTUQubv8SLlgbuFMqq2GX//5EJUryiITo6I.', '2026-05-04 23:15:28', '2026-06-05 06:51:48'),
(278, 'Naya Nailah Yusril', 'jalan baru meruyung', '3', '08', '$2y$12$MebJBvymg3V4oMePnk/f9.JVYX9MQM45TmPg0R.qgTDnyHh/jxo4C', '2026-05-06 22:44:38', '2026-05-06 22:44:38'),
(279, 'Yudi Nurmansyah', 'jl meruyung raya', '1', '08', '$2y$12$/1x/8EBFyI3OEWdfQClxZuuF9CLBRsbkMIwfbn6FrxFv3RFAlL8Tq', '2026-05-07 23:10:20', '2026-05-07 23:10:20'),
(280, 'Devi Rahmawati', 'jl limo raya', '2', '08', '$2y$12$esprsEttcQRfP3uQFG3orOrXkREunr3rsGrSUXzNALdiLYxI2cIGW', '2026-05-07 23:19:31', '2026-05-07 23:19:31'),
(281, 'Laelah Safitri', 'jl krukut', '1', '08', '$2y$12$hYdo8M2lcHGc3/bvvTo/v.zcuz9nb1H63128etTMmqLpeH6Lvj3Yq', '2026-05-07 23:52:11', '2026-05-07 23:52:11'),
(282, 'Haerul Anwar', 'jl limo raya', '2', '08', '$2y$12$Sw2fOVl..UG7GYkM9FQwbO4puPE1ZQQ2EsWal3q2.atYSyrnZIcFC', '2026-05-09 13:22:14', '2026-05-09 13:22:14'),
(283, 'afriza', 'Belum Mengisi Data', '003', '08', '$2y$12$vZ282jiKXet6zyQyrqeDd.tdQbGu41mlqMVRGa9XAIGF0UweTSJz.', '2026-05-15 05:54:30', '2026-05-15 06:01:54');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `activity_logs`
--
ALTER TABLE `activity_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `kriteria`
--
ALTER TABLE `kriteria`
  ADD PRIMARY KEY (`id_kriteria`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `pengajuan`
--
ALTER TABLE `pengajuan`
  ADD PRIMARY KEY (`id_pengajuan`),
  ADD KEY `pengajuan_id_warga_foreign` (`id_warga`);

--
-- Indexes for table `penilaian`
--
ALTER TABLE `penilaian`
  ADD PRIMARY KEY (`id_penilaian`),
  ADD KEY `penilaian_id_pengajuan_foreign` (`id_pengajuan`),
  ADD KEY `penilaian_id_kriteria_foreign` (`id_kriteria`),
  ADD KEY `penilaian_id_subkriteria_foreign` (`id_subkriteria`);

--
-- Indexes for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  ADD KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  ADD KEY `personal_access_tokens_expires_at_index` (`expires_at`);

--
-- Indexes for table `pesan_chat`
--
ALTER TABLE `pesan_chat`
  ADD PRIMARY KEY (`id_pesan`),
  ADD KEY `pesan_chat_id_pengajuan_foreign` (`id_pengajuan`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `sub_kriteria`
--
ALTER TABLE `sub_kriteria`
  ADD PRIMARY KEY (`id_subkriteria`),
  ADD KEY `sub_kriteria_id_kriteria_foreign` (`id_kriteria`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_username_unique` (`username`);

--
-- Indexes for table `warga`
--
ALTER TABLE `warga`
  ADD PRIMARY KEY (`id_warga`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `activity_logs`
--
ALTER TABLE `activity_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `kriteria`
--
ALTER TABLE `kriteria`
  MODIFY `id_kriteria` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `pengajuan`
--
ALTER TABLE `pengajuan`
  MODIFY `id_pengajuan` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=284;

--
-- AUTO_INCREMENT for table `penilaian`
--
ALTER TABLE `penilaian`
  MODIFY `id_penilaian` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16251;

--
-- AUTO_INCREMENT for table `personal_access_tokens`
--
ALTER TABLE `personal_access_tokens`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=164;

--
-- AUTO_INCREMENT for table `pesan_chat`
--
ALTER TABLE `pesan_chat`
  MODIFY `id_pesan` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `sub_kriteria`
--
ALTER TABLE `sub_kriteria`
  MODIFY `id_subkriteria` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=202;

--
-- AUTO_INCREMENT for table `warga`
--
ALTER TABLE `warga`
  MODIFY `id_warga` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=284;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `pengajuan`
--
ALTER TABLE `pengajuan`
  ADD CONSTRAINT `pengajuan_id_warga_foreign` FOREIGN KEY (`id_warga`) REFERENCES `warga` (`id_warga`) ON DELETE CASCADE;

--
-- Constraints for table `penilaian`
--
ALTER TABLE `penilaian`
  ADD CONSTRAINT `penilaian_id_kriteria_foreign` FOREIGN KEY (`id_kriteria`) REFERENCES `kriteria` (`id_kriteria`) ON DELETE CASCADE,
  ADD CONSTRAINT `penilaian_id_pengajuan_foreign` FOREIGN KEY (`id_pengajuan`) REFERENCES `pengajuan` (`id_pengajuan`) ON DELETE CASCADE,
  ADD CONSTRAINT `penilaian_id_subkriteria_foreign` FOREIGN KEY (`id_subkriteria`) REFERENCES `sub_kriteria` (`id_subkriteria`) ON DELETE CASCADE;

--
-- Constraints for table `pesan_chat`
--
ALTER TABLE `pesan_chat`
  ADD CONSTRAINT `pesan_chat_id_pengajuan_foreign` FOREIGN KEY (`id_pengajuan`) REFERENCES `pengajuan` (`id_pengajuan`) ON DELETE CASCADE;

--
-- Constraints for table `sub_kriteria`
--
ALTER TABLE `sub_kriteria`
  ADD CONSTRAINT `sub_kriteria_id_kriteria_foreign` FOREIGN KEY (`id_kriteria`) REFERENCES `kriteria` (`id_kriteria`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
