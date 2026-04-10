<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;

class PermissionController extends Controller
{
    public function update(Request $request, $id)
    {
        // Enforce SuperAdmin only (though route middleware handles this too)
        if (!$request->user()->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $user = User::findOrFail($id);

        // Validate payload
        $validated = $request->validate([
            'can_manage_employees'       => 'boolean',
            'can_view_employees'         => 'boolean',
            'can_manage_salaries'        => 'boolean',
            'can_view_salaries'          => 'boolean',
            'can_manage_attendance'      => 'boolean',
            'can_view_attendance'        => 'boolean',
            'can_manage_leaves'          => 'boolean',
            'can_view_leaves'            => 'boolean',
            'can_manage_departments'     => 'boolean',
            'can_manage_payslips'        => 'boolean',
            'can_manage_payroll_settings'=> 'boolean',
            'can_manage_payslip_designer'=> 'boolean',
            'can_force_checkout'         => 'boolean',
            'can_assign_tasks'           => 'boolean',
            'can_manage_announcements'   => 'boolean',
            'can_manage_meetings'        => 'boolean',
            'can_manage_documents'       => 'boolean',
        ]);

        $user->update($validated);

        return response()->json([
            'message' => 'Permissions updated successfully',
            'user' => $user
        ]);
    }
}
