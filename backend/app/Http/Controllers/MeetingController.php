<?php

namespace App\Http\Controllers;

use App\Models\Meeting;
use App\Models\Employee;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class MeetingController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function index(Request $request)
    {
        $user = Auth::user();
        $query = Meeting::with(['creator', 'participants.user', 'department', 'designation']);

        // Employees only see meetings they are invited to
        if ($user->role_id !== 1 && !$user->can_assign_tasks) {
            $query->whereHas('participants', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }

        return response()->json($query->latest()->get(), 200);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        if ($user->role_id !== 1 && !$user->can_assign_tasks) {
            return response()->json(['message' => 'Unauthorized to schedule meetings'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_time' => 'required|date',
            'location' => 'nullable|string',
            'meeting_link' => 'nullable|string',
            'department_id' => 'nullable|exists:departments,id',
            'designation_id' => 'nullable|exists:designations,id',
            'participants' => 'required|array',
            'participants.*' => 'exists:employees,id'
        ]);

        $validated['created_by'] = $user->id;
        $meeting = Meeting::create($validated);
        $meeting->participants()->sync($validated['participants']);

        // Notify participants
        foreach ($validated['participants'] as $empId) {
            $employee = Employee::find($empId);
            if ($employee && $employee->user_id) {
                $this->notificationService->sendToUser(
                    $employee->user_id,
                    "New Meeting Invitation",
                    "You have been invited to a meeting: {$meeting->title} on {$meeting->start_time}.",
                    "meeting",
                    "/employee/meetings"
                );
            }
        }

        return response()->json($meeting->load(['creator', 'participants.user', 'department', 'designation']), 201);
    }

    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $meeting = Meeting::findOrFail($id);

        if ($user->role_id !== 1 && $meeting->created_by !== $user->id) {
            return response()->json(['message' => 'Unauthorized to update this meeting'], 403);
        }

        $validated = $request->validate([
            'title' => 'string|max:255',
            'description' => 'nullable|string',
            'start_time' => 'date',
            'location' => 'nullable|string',
            'meeting_link' => 'nullable|string',
            'department_id' => 'nullable|exists:departments,id',
            'designation_id' => 'nullable|exists:designations,id',
            'status' => 'string|in:scheduled,cancelled,completed',
            'participants' => 'array',
            'participants.*' => 'exists:employees,id'
        ]);

        $meeting->update($validated);

        if (isset($validated['participants'])) {
            $meeting->participants()->sync($validated['participants']);
        }

        return response()->json($meeting->load(['creator', 'participants.user', 'department', 'designation']), 200);
    }

    public function destroy($id)
    {
        $user = Auth::user();
        $meeting = Meeting::findOrFail($id);

        if ($user->role_id !== 1 && $meeting->created_by !== $user->id) {
            return response()->json(['message' => 'Unauthorized to delete this meeting'], 403);
        }

        $meeting->delete();
        return response()->json(null, 244);
    }

    public function respond(Request $request, $id)
    {
        $user = Auth::user();
        $meeting = Meeting::findOrFail($id);
        $employee = $user->employee;

        if (!$employee) {
            return response()->json(['message' => 'Employee record not found'], 404);
        }

        $request->validate([
            'status' => 'required|string|in:accepted,declined'
        ]);

        $meeting->participants()->updateExistingPivot($employee->id, [
            'attendance_status' => $request->status
        ]);

        return response()->json(['message' => 'Response recorded successfully'], 200);
    }
}
