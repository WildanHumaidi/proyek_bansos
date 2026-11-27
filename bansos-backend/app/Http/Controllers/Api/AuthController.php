<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Warga;
use App\Services\RtFormatter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // ==========================================
    // 1. REGISTRASI WARGA
    // ==========================================
    public function register(Request $request)
    {
        try {
            $request->validate([
                'nama_lengkap' => 'required|string|max:255',
                'username' => 'required|string|unique:users',
                'password' => 'required|min:8',
                'rt' => ['required', RtFormatter::rule()],
                'alamat' => 'required|string',
            ]);

            $rt = RtFormatter::formatRt($request->rt);

            $user = DB::transaction(function () use ($request, $rt) {
                // Registrasi membuat identitas warga milik akun ini sendiri, lalu
                // menautkannya lewat id_warga. Tidak mencocokkan nama, karena nama
                // bisa duplikat dan akan menimpa data warga lain.
                $warga = Warga::create([
                    'nama_lengkap' => trim($request->nama_lengkap),
                    'alamat' => $request->alamat,
                    'rt' => $rt,
                    'rw' => '008',
                ]);

                return User::create([
                    'name' => trim($request->nama_lengkap),
                    'username' => $request->username,
                    'password' => Hash::make($request->password),
                    'role' => 'warga',
                    'rt' => $rt,
                    'alamat' => $request->alamat,
                    'id_warga' => $warga->id_warga,
                ]);
            });

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Registrasi Berhasil',
                'user' => $user,
                'token' => $token,
            ], 201);

        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ==========================================
    // 2. LOGIN SISTEM
    // ==========================================
    public function login(Request $request)
    {
        try {
            $request->validate([
                'username' => 'required|string',
                'password' => 'required|string',
            ]);

            // Pembatas per akun. Semua klien masuk lewat edge provider dengan satu
            // IP, jadi throttle berbasis IP saja bisa dikunci satu penyerang untuk
            // semua orang. Kunci per username membatasi tebakan tanpa efek itu.
            $kunci = 'login:'.Str::lower((string) $request->username);

            if (RateLimiter::tooManyAttempts($kunci, 5)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Terlalu banyak percobaan masuk untuk akun ini. Coba lagi dalam 1 menit.',
                ], 429);
            }

            if (! Auth::attempt($request->only('username', 'password'))) {
                RateLimiter::hit($kunci, 60);

                return response()->json([
                    'success' => false,
                    'message' => 'Username atau Password salah!',
                ], 401);
            }

            RateLimiter::clear($kunci);

            $user = User::where('username', $request->username)->firstOrFail();
            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Login Berhasil',
                'user' => $user,
                'token' => $token,
            ]);

        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ==========================================
    // 3. LOGOUT
    // ==========================================
    public function logout(Request $request)
    {
        try {
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Logout berhasil',
            ]);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    // ==========================================
    // 4. GANTI PASSWORD SENDIRI
    // ==========================================
    public function gantiPassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ], [
            'current_password.required' => 'Password saat ini wajib diisi.',
            'password.required' => 'Password baru wajib diisi.',
            'password.min' => 'Password baru minimal 8 karakter.',
            'password.confirmed' => 'Konfirmasi password baru tidak cocok.',
        ]);

        $user = $request->user();

        if (! Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => 'Password saat ini salah.',
            ]);
        }

        if (Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'password' => 'Password baru harus berbeda dari password saat ini.',
            ]);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        // Cabut sesi/token lain; perangkat yang sedang dipakai tetap aktif.
        $token = $user->currentAccessToken();
        if ($token instanceof \Laravel\Sanctum\PersonalAccessToken) {
            $user->tokens()->where('id', '!=', $token->id)->delete();
        }

        LogController::catatLog($user->name, $user->role, 'Ganti password akun sendiri');

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil diganti.',
        ]);
    }
}
