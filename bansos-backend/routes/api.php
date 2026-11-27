<?php

use App\Http\Controllers\Api\AdminRtController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChatController;
use App\Http\Controllers\Api\KriteriaController;
use App\Http\Controllers\Api\LogController;
use App\Http\Controllers\Api\PengaduanController;
use App\Http\Controllers\Api\SawController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WargaController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — disesuaikan persis dengan method yang ada di setiap controller
|--------------------------------------------------------------------------
*/

// ── PUBLIK ────────────────────────────────────────────────────────────────
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:10,1');

// ── WAJIB LOGIN ───────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // --- Auth Umum ---
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/ganti-password', [AuthController::class, 'gantiPassword'])->middleware('throttle:10,1');

    // ── Pengaduan (Warga / RT / RW / Admin) ────────────────────────────────
    Route::get('/pengaduan', [PengaduanController::class, 'index']);
    Route::post('/pengaduan', [PengaduanController::class, 'store']);
    Route::put('/pengaduan/{id}', [PengaduanController::class, 'update']);

    // ── Chat (Warga ↔ RT / Admin) ─────────────────────────────────────────
    Route::get('/chat/{id}', [ChatController::class, 'getPesan']);
    Route::post('/chat/{id}', [ChatController::class, 'storePesan'])->middleware('throttle:chat');
    Route::get('/chat/{id}/belum-dibaca', [ChatController::class, 'belumDibaca']);
    Route::put('/chat/{id}/baca', [ChatController::class, 'tandaiDibaca']);

    // ── Khusus Warga ──────────────────────────────────────────────────────
    Route::middleware('role:warga')->group(function () {
        Route::post('/warga/pengajuan', [WargaController::class, 'kirimPengajuan']);
        Route::get('/warga/status', [WargaController::class, 'getStatus']);
        Route::get('/warga/pengajuan/status', [WargaController::class, 'getStatus']);
    });

    // ── RT & Admin (Manajemen Pengajuan & Warga Wilayah) ───────────────────
    Route::middleware('role:admin,rt')->group(function () {
        Route::post('/warga/pengajuan-rt', [WargaController::class, 'store']);
        Route::get('/admin/pengajuan', [AdminRtController::class, 'getDaftarPengajuan']);
        Route::put('/admin/pengajuan/{id}/status', [AdminRtController::class, 'ubahStatusPengajuan']);
        Route::put('/admin/pengajuan/{id}/kuesioner', [AdminRtController::class, 'updateKuesioner']);
        Route::post('/admin/users', [AdminRtController::class, 'storeUser']);
        Route::put('/admin/users/{id}', [AdminRtController::class, 'updateUser']);
    });

    // ── Staff (Admin, RW, RT) — Monitoring & SPK ──────────────────────────
    Route::middleware('role:admin,rw,rt')->group(function () {
        Route::get('/admin/users', [AdminRtController::class, 'getUsers']);
        Route::get('/rt/warga', [AdminRtController::class, 'getWargaWilayah']);
        Route::get('/kriteria', [KriteriaController::class, 'index']);
        Route::get('/kriteria/{id}/subkriteria', [KriteriaController::class, 'getSubKriteria']);
        Route::get('/saw/hitung', [SawController::class, 'hitungRanking'])->middleware('throttle:saw');
        Route::get('/saw/report/export', [SawController::class, 'exportReport'])->middleware('throttle:saw');
    });

    // ── Admin & RW — Dataset Global ───────────────────────────────────────
    Route::middleware('role:admin,rw')->group(function () {
        Route::get('/saw/dataset', [SawController::class, 'getDataset']);
    });

    // ── Khusus Administrator Sistem ───────────────────────────────────────
    Route::middleware('role:admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
        Route::delete('/admin/users/{id}', [AdminRtController::class, 'deleteUser']);
        Route::delete('/admin/pengajuan/{id}', [AdminRtController::class, 'destroyPengajuan']);
        Route::put('/admin/users/{id}/taut-warga', [AdminRtController::class, 'tautkanWarga']);
        Route::post('/admin/pengajuan/import', [AdminRtController::class, 'importCsv'])->middleware('throttle:import');
        Route::put('/kriteria/{id}', [KriteriaController::class, 'update']);
        Route::put('/admin/subkriteria/{id}', [KriteriaController::class, 'updateSubKriteria']);
        Route::post('/admin/fix-data', [AdminRtController::class, 'fixDataMentah'])->middleware('throttle:import');
        Route::put('/admin/kriteria/bobot', [KriteriaController::class, 'updateBobotBulk']);
        Route::get('/logs', [LogController::class, 'index']);
    });
});
