<?php

namespace App\Http\Controllers;

use App\Models\Meeting;
use App\Models\Employee;
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
        $query = Meeting::with(['creator.employee', 'participants.user.employee', 'department', 'designation']);

        // Employees only see meetings they are invited to
        if (!$user->isSuperAdmin() && !$user->can_assign_tasks && !$user->can_manage_meetings) {
            $query->whereHas('participants', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }

        return response()->json($query->latest()->get(), 200);
    }

    public function show($id)
    {
        $user = Auth::user();
        $meeting = Meeting::with(['creator.employee', 'participants.user.employee', 'department', 'designation'])->findOrFail($id);

        $canManageMeetings = $user->isSuperAdmin() || $user->can_assign_tasks || $user->can_manage_meetings;

        if (!$canManageMeetings) {
            $employee = Employee::select('id')->where('user_id', $user->id)->first();
            if (!$employee || !$meeting->participants->contains('id', $employee->id)) {
                return response()->json(['message' => 'Unauthorized to view this meeting'], 403);
            }
        }

        return response()->json($meeting, 200);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        if (!$user->isSuperAdmin() && !$user->can_assign_tasks && !$user->can_manage_meetings) {
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

        return response()->json($meeting->load(['creator.employee', 'participants.user.employee', 'department', 'designation']), 201);
    }

    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $meeting = Meeting::findOrFail($id);

        $canManageMeetings = $user->isSuperAdmin() || $user->can_assign_tasks || $user->can_manage_meetings;

        if (!$canManageMeetings && (int) $meeting->created_by !== (int) $user->id) {
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

        return response()->json($meeting->load(['creator.employee', 'participants.user.employee', 'department', 'designation']), 200);
    }

    public function destroy($id)
    {
        $user = Auth::user();
        $meeting = Meeting::findOrFail($id);

        $canManageMeetings = $user->isSuperAdmin() || $user->can_assign_tasks || $user->can_manage_meetings;

        if (!$canManageMeetings && (int) $meeting->created_by !== (int) $user->id) {
            return response()->json(['message' => 'Unauthorized to delete this meeting'], 403);
        }

        $meeting->delete();
        return response()->json(null, 204);
    }

    public function respond(Request $request, $id)
    {
        $user = Auth::user();
        $meeting = Meeting::findOrFail($id);
        $employee = Employee::select('id')->where('user_id', $user->id)->first();

        if (!$employee) {
            return response()->json(['message' => 'Employee record not found'], 404);
        }

        $participant = $meeting->participants()->where('employees.id', $employee->id)->first();

        if (!$participant) {
            return response()->json(['message' => 'You are not invited to this meeting'], 403);
        }

        $currentStatus = $participant->pivot->attendance_status ?? 'pending';
        if (in_array($currentStatus, ['accepted', 'declined'], true)) {
            return response()->json(['message' => 'You have already responded to this meeting'], 409);
        }

        $request->validate([
            'status' => 'required|string|in:accepted,declined'
        ]);

        $meeting->participants()->updateExistingPivot($employee->id, [
            'attendance_status' => $request->status
        ]);

        $statusText = $request->status === 'accepted' ? 'accepted' : 'declined';
        $meetingTime = $meeting->start_time ? date('d M Y h:i A', strtotime($meeting->start_time)) : 'N/A';

        $this->notificationService->sendToRoles(
            [1, 2, 3],
            'Meeting Response Update',
            "{$user->name} has {$statusText} meeting '{$meeting->title}' scheduled on {$meetingTime}.",
            'meeting',
            null
        );

        return response()->json([
            'message' => 'Response recorded successfully',
            'status' => $request->status
        ], 200);
    }
}
