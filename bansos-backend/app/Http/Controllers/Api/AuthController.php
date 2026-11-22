<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Warga;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
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
                'password' => 'required|min:6',
                'rt' => 'required',
                'alamat' => 'required|string',
            ]);

            $user = DB::transaction(function () use ($request) {
                // Registrasi membuat identitas warga milik akun ini sendiri, lalu
                // menautkannya lewat id_warga. Tidak mencocokkan nama, karena nama
                // bisa duplikat dan akan menimpa data warga lain.
                $warga = Warga::create([
                    'nama_lengkap' => trim($request->nama_lengkap),
                    'alamat' => $request->alamat,
                    'rt' => $request->rt,
                    'rw' => '008',
                    'password' => Hash::make(Str::random(32)),
                ]);

                return User::create([
                    'name' => trim($request->nama_lengkap),
                    'username' => $request->username,
                    'password' => Hash::make($request->password),
                    'role' => 'warga',
                    'rt' => $request->rt,
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

            if (! Auth::attempt($request->only('username', 'password'))) {
                return response()->json([
                    'success' => false,
                    'message' => 'Username atau Password salah!',
                ], 401);
            }

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
}
