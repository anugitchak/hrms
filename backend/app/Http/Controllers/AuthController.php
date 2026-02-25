<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Models\Employee;
use App\Models\FaceEmbedding;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Services\NotificationService;

class AuthController extends Controller
{
    protected $notifications;

    // URL of the Python face recognition microservice
    const FACE_SERVICE_URL = 'http://127.0.0.1:8001';

    public function __construct(NotificationService $notifications)
    {
        $this->notifications = $notifications;
    }

    // ==============================
    // User Registration (Admin / Super Admin)
    // ==============================
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:4',
            'department_id' => 'nullable|exists:departments,id',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_id' => 4,
            'department_id' => $validated['department_id'] ?? null,
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'User registered successfully',
            'user' => $user
        ], 201);
    }

    // ==============================
    // Employee Temp User Creation (HR)
    // ==============================
    public function createEmployeeUser(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:4',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role_id' => 3,
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Employee temp account created',
            'user' => $user
        ], 201);
    }

    // ==============================
    // User Login
    // ==============================
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Your account is deactivated. Please contact support.'], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        if ($user->role_id == 4 && $user->temp_password !== null) {
            return response()->json([
                'message' => 'Password change required',
                'force_password_change' => true,
                'user_id' => $user->id,
                'token' => $token
            ], 200);
        }

        $permissions = [];
        $permissionFields = [
            'can_manage_employees',
            'can_view_employees',
            'can_manage_salaries',
            'can_view_salaries',
            'can_manage_attendance',
            'can_view_attendance',
            'can_manage_leaves',
            'can_view_leaves',
            'can_manage_departments',
            'can_manage_payslips',
            'can_manage_payroll_settings',
            'can_force_checkout'
        ];

        foreach ($permissionFields as $field) {
            if ($user->$field) {
                $permissions[] = $field;
            }
        }

        $userData = $user->toArray();
        $userData['permissions'] = $permissions;

        if ($user->role_id != 1) {
            $employee = Employee::with(['country', 'subCompany'])->where('user_id', $user->id)->first();
            if ($employee) {
                $userData['country'] = $employee->country;
                $userData['sub_company'] = $employee->subCompany;
                $userData['country_id'] = $employee->country_id;
                $userData['sub_company_id'] = $employee->sub_company_id;
            }
        }

        return response()->json([
            'message' => 'Login successful',
            'force_password_change' => false,
            'token' => $token,
            'user' => $userData
        ], 200);
    }

    // ==============================
    // Change Password
    // ==============================
    public function changePassword(Request $request)
    {
        $validated = $request->validate([
            'old_password' => 'required',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($validated['old_password'], $user->password) && $validated['old_password'] !== $user->temp_password) {
            return response()->json(['message' => 'Invalid old password'], 400);
        }

        $user->update([
            'password' => Hash::make($validated['new_password']),
            'temp_password' => null,
        ]);

        return response()->json(['message' => 'Password changed successfully']);
    }

    // ==============================
    // Authenticated User Info
    // ==============================
    public function profile(Request $request)
    {
        return response()->json($request->user()->fresh()->load(['employee.department', 'employee.designation', 'role']));
    }

    // ==============================
    // Enroll Face (via Python service)
    // ==============================
    public function enrollFace(Request $request)
    {
        $request->validate([
            'email' => 'nullable|email|exists:users,email',
            'face_image' => 'required|image|max:10240',
            'device_type' => 'nullable|string|in:web,mobile,tablet',
            'label' => 'nullable|string|max:50',
        ]);

        // Resolve user
        if ($request->has('email')) {
            $user = User::where('email', $request->email)->first();
            if (!$user)
                return response()->json(['message' => 'User not found'], 404);
        } else {
            $user = $request->user();
            if (!$user)
                return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Check if Python face service is reachable
        try {
            $healthCheck = Http::timeout(3)->get(self::FACE_SERVICE_URL . '/health');
            if (!$healthCheck->successful()) {
                throw new \Exception('Face service returned non-200');
            }
        } catch (\Exception $e) {
            Log::error('Face service health check failed: ' . $e->getMessage());
            return response()->json([
                'message' => 'Face recognition service is not available. Please ensure the Python face service is running on port 8001.',
                'hint' => 'Run: uvicorn main:app --host 127.0.0.1 --port 8001 (in the face_service directory)'
            ], 503);
        }

        // Send image to Python service for descriptor extraction
        try {
            $response = Http::timeout(30)->attach(
                'image',
                file_get_contents($request->file('face_image')->getPathname()),
                'face.jpg'
            )->post(self::FACE_SERVICE_URL . '/enroll');

            if (!$response->successful()) {
                $error = $response->json();
                return response()->json([
                    'message' => $error['detail']['message'] ?? 'Face extraction failed',
                    'error' => $error['detail']['error'] ?? 'unknown',
                ], 422);
            }

            $result = $response->json();
            $descriptors = $result['descriptors'] ?? [];

            if (empty($descriptors)) {
                return response()->json(['message' => 'No face detected in the image'], 422);
            }

        } catch (\Exception $e) {
            Log::error('Face enrollment Python call failed: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to communicate with face recognition service'], 500);
        }

        // Store the extracted descriptor(s) in the face_embeddings table
        $deviceType = $request->input('device_type', 'web');
        $label = $request->input('label', null);

        // Store each descriptor (usually just one, but may be multiple from one image)
        $stored = 0;
        foreach ($descriptors as $descriptor) {
            FaceEmbedding::create([
                'user_id' => $user->id,
                'descriptor' => json_encode($descriptor),
                'device_type' => $deviceType,
                'label' => $label,
            ]);
            $stored++;

            // Limit to 10 stored embeddings per user to prevent DB bloat
            // Remove oldest if exceeded
            $count = FaceEmbedding::where('user_id', $user->id)->count();
            if ($count > 10) {
                FaceEmbedding::where('user_id', $user->id)
                    ->orderBy('created_at', 'asc')
                    ->first()
                    ->delete();
            }
        }

        // Also keep legacy face_descriptor on users table for backward compatibility
        $user->update([
            'face_descriptor' => json_encode($descriptors[0])
        ]);

        return response()->json([
            'message' => "Face enrolled successfully ({$stored} descriptor(s) stored)",
            'embeddings_count' => FaceEmbedding::where('user_id', $user->id)->count(),
            'user' => $user->fresh()->load(['employee', 'role'])
        ], 200);
    }

    // ==============================
    // Login with Face (via Python service)
    // ==============================
    public function loginFace(Request $request)
    {
        $request->validate([
            'face_image' => 'required|image|max:10240',
        ]);

        // Check Python service health
        try {
            $healthCheck = Http::timeout(3)->get(self::FACE_SERVICE_URL . '/health');
            if (!$healthCheck->successful()) {
                throw new \Exception('Not healthy');
            }
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Face recognition service is offline. Please use email/password login.',
                'hint' => 'Run: uvicorn main:app --host 127.0.0.1 --port 8001 (in face_service directory)'
            ], 503);
        }

        // Build the stored_descriptors payload for the Python service
        // ONLY use face_embeddings table (SFace descriptors from new system)
        // Legacy face-api.js descriptors in users/employees tables are NOT compatible
        // with SFace and must NOT be mixed. Users must re-enroll.
        $embeddingRows = FaceEmbedding::all();
        $userIdMap = [];

        foreach ($embeddingRows as $row) {
            $descriptor = json_decode($row->descriptor, true);
            if (!$descriptor || count($descriptor) < 64)
                continue;

            if (!isset($userIdMap[$row->user_id])) {
                $userIdMap[$row->user_id] = [];
            }
            $userIdMap[$row->user_id][] = $descriptor;
        }

        // Format for Python service
        $usersData = [];
        foreach ($userIdMap as $uid => $descriptors) {
            $usersData[] = ['user_id' => $uid, 'descriptors' => $descriptors];
        }

        if (empty($usersData)) {
            return response()->json([
                'message' => 'No enrolled faces found. Please re-enroll your face — the face recognition system has been upgraded and requires a fresh enrollment.'
            ], 404);
        }


        // Call Python face recognition service
        try {
            $response = Http::timeout(30)->attach(
                'image',
                file_get_contents($request->file('face_image')->getPathname()),
                'face.jpg'
            )->post(self::FACE_SERVICE_URL . '/recognize', [
                        'stored_descriptors' => json_encode($usersData)
                    ]);

            if (!$response->successful()) {
                $error = $response->json();
                return response()->json([
                    'message' => $error['detail']['message'] ?? 'Face recognition failed',
                    'error' => $error['detail']['error'] ?? 'unknown',
                ], $response->status());
            }

            $result = $response->json();

        } catch (\Exception $e) {
            Log::error('Face recognition Python call failed: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to communicate with face recognition service'], 500);
        }

        if (!($result['matched'] ?? false)) {
            return response()->json([
                'message' => $result['message'] ?? 'Face not recognized. Please try again or use email/password login.',
                'confidence' => 0,
                'reason' => $result['reason'] ?? 'no_match',
            ], 401);
        }

        // Find the matched user
        $matchedUser = User::find($result['user_id']);
        if (!$matchedUser) {
            return response()->json(['message' => 'Recognized face but user account not found'], 404);
        }

        if (!$matchedUser->is_active) {
            return response()->json(['message' => 'Your account is deactivated. Please contact support.'], 403);
        }

        $token = $matchedUser->createToken('auth_token')->plainTextToken;

        if ($matchedUser->temp_password !== null) {
            return response()->json([
                'force_password_change' => true,
                'user_id' => $matchedUser->id,
                'token' => $token
            ], 200);
        }

        $permissions = [];
        foreach ([
            'can_manage_employees',
            'can_view_employees',
            'can_manage_salaries',
            'can_view_salaries',
            'can_manage_attendance',
            'can_view_attendance',
            'can_manage_leaves',
            'can_view_leaves',
            'can_manage_departments',
            'can_manage_payslips',
            'can_manage_payroll_settings',
            'can_force_checkout'
        ] as $field) {
            if ($matchedUser->$field)
                $permissions[] = $field;
        }

        $userData = $matchedUser->toArray();
        $userData['permissions'] = $permissions;

        // Enrich with employee country/sub_company (mirrors regular login)
        if ($matchedUser->role_id != 1) {
            $employee = Employee::with(['country', 'subCompany'])->where('user_id', $matchedUser->id)->first();
            if ($employee) {
                $userData['country'] = $employee->country;
                $userData['sub_company'] = $employee->subCompany;
                $userData['country_id'] = $employee->country_id;
                $userData['sub_company_id'] = $employee->sub_company_id;
            }
        }

        Log::info("Face login successful: user_id={$matchedUser->id}, confidence={$result['confidence']}%");

        return response()->json([
            'message' => 'Face login successful',
            'force_password_change' => false,
            'token' => $token,
            'user' => $userData,
            'confidence' => $result['confidence'],
        ], 200);
    }
}
