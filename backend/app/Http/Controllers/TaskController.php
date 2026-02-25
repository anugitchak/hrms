<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Employee;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TaskController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    public function index(Request $request)
    {
        $user = Auth::user();
        $query = Task::with(['assignee.user', 'creator', 'department', 'designation']);

        if ($user->role_id == 4) { // Employee
            if ($user->employee) {
                $employeeId = $user->employee->id;
                $departmentId = $user->employee->department_id;

                // Show tasks assigned to them OR unclaimed pool tasks matching their department
                $query->where(function ($q) use ($employeeId, $departmentId) {
                    $q->where('assigned_to', $employeeId)
                        // Or available in the pool for their department (or global pool)
                        ->orWhere(function ($sq) use ($departmentId) {
                            $sq->where('is_pool_task', true)
                                ->whereNull('assigned_to')
                                ->where('status', 'pending') // Pool tasks should be pending
                                ->where(function ($isq) use ($departmentId) {
                                    $isq->whereNull('department_id')
                                        ->orWhere('department_id', $departmentId);
                                });
                        });
                });
            } else {
                return response()->json([], 200);
            }
        }

        return response()->json($query->latest()->get(), 200);
    }

    public function store(Request $request)
    {
        if (Auth::user()->role_id !== 1 && !Auth::user()->can_assign_tasks) {
            return response()->json(['message' => 'Unauthorized to assign tasks'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'assigned_to' => 'nullable|exists:employees,id',
            'due_date' => 'nullable|date',
            'priority' => 'string|in:low,medium,high,urgent',
            'department_id' => 'nullable|exists:departments,id',
            'designation_id' => 'nullable|exists:designations,id',
            'is_pool_task' => 'boolean'
        ]);

        $validated['assigned_by'] = Auth::id();
        $validated['status'] = 'pending';

        if (empty($validated['assigned_to']) && empty($validated['is_pool_task'])) {
            return response()->json(['message' => 'Task must be assigned or set as a pool task'], 422);
        }

        $task = Task::create($validated);

        // Send notification to the assigned employee
        if ($task->assigned_to) {
            $employee = Employee::find($task->assigned_to);
            if ($employee && $employee->user_id) {
                $this->notificationService->sendToUser(
                    $employee->user_id,
                    "New Task Assigned",
                    "You have been assigned a new task: {$task->title}. Please accept it to start work.",
                    "task",
                    "/employee/tasks"
                );
            }
        }

        return response()->json($task->load(['assignee.user', 'creator', 'department', 'designation']), 201);
    }

    public function show($id)
    {
        $task = Task::with(['assignee.user', 'creator', 'department', 'designation'])->findOrFail($id);
        return response()->json($task, 200);
    }

    public function update(Request $request, $id)
    {
        if (Auth::user()->role_id !== 1 && !Auth::user()->can_assign_tasks) {
            return response()->json(['message' => 'Unauthorized to manage tasks'], 403);
        }

        $task = Task::findOrFail($id);

        $validated = $request->validate([
            'title' => 'string|max:255',
            'description' => 'nullable|string',
            'assigned_to' => 'nullable|exists:employees,id',
            'due_date' => 'nullable|date',
            'status' => 'string|in:pending,accepted,claimed,in_progress,pending_review,rejected,completed,cancelled',
            'priority' => 'string|in:low,medium,high,urgent',
            'department_id' => 'nullable|exists:departments,id',
            'designation_id' => 'nullable|exists:designations,id',
            'is_pool_task' => 'boolean'
        ]);

        $oldAssignedTo = $task->assigned_to;
        $task->update($validated);

        // If assignment changed and is no longer pool, notify new assignee
        if ($task->assigned_to && $task->assigned_to != $oldAssignedTo && !$task->is_pool_task) {
            $employee = Employee::find($task->assigned_to);
            if ($employee && $employee->user_id) {
                $this->notificationService->sendToUser(
                    $employee->user_id,
                    "Task Assignment Updated",
                    "A task has been updated and assigned to you: {$task->title}.",
                    "task",
                    "/employee/tasks"
                );
            }
        }

        return response()->json($task->load(['assignee.user', 'creator', 'department', 'designation']), 200);
    }

    public function destroy($id)
    {
        if (Auth::user()->role_id !== 1 && !Auth::user()->can_assign_tasks) {
            return response()->json(['message' => 'Unauthorized to delete tasks'], 403);
        }

        $task = Task::findOrFail($id);
        $task->delete();
        return response()->json(null, 204);
    }

    public function claim($id)
    {
        $task = Task::findOrFail($id);
        $user = Auth::user();

        if (!$task->is_pool_task || $task->assigned_to) {
            return response()->json(['message' => 'Task cannot be claimed'], 400);
        }

        if (!$user->employee) {
            return response()->json(['message' => 'User is not an employee'], 403);
        }

        // Optional: Check if department matches
        if ($task->department_id && $task->department_id !== $user->employee->department_id) {
            return response()->json(['message' => 'Task is restricted to another department'], 403);
        }

        $task->assigned_to = $user->employee->id;
        $task->status = 'claimed';
        $task->claimed_at = now();
        $task->save();

        // Notify the creator or relevant admins that task was claimed
        if ($task->assigned_by) {
            $this->notificationService->sendToUser(
                $task->assigned_by,
                "Task Claimed",
                "Employee {$user->name} has claimed the pool task: {$task->title}.",
                "task",
                "/admin/tasks"
            );
        }

        return response()->json($task->load(['assignee.user', 'creator', 'department', 'designation']), 200);
    }

    public function accept($id)
    {
        $task = Task::findOrFail($id);
        $user = Auth::user();

        if ($user->employee && $task->assigned_to !== $user->employee->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($task->status !== 'pending' && $task->status !== 'claimed') {
            return response()->json(['message' => 'Task already accepted or in progress'], 400);
        }

        $task->status = 'accepted';
        $task->save();

        // Notify the creator that the task was accepted
        if ($task->assigned_by) {
            $this->notificationService->sendToUser(
                $task->assigned_by,
                "Task Accepted",
                "Employee {$user->name} has accepted the task: {$task->title}.",
                "task",
                "/admin/tasks"
            );
        }

        return response()->json($task->load(['assignee.user', 'creator', 'department', 'designation']), 200);
    }

    public function start($id)
    {
        $task = Task::findOrFail($id);

        if ($task->status !== 'claimed' && $task->status !== 'pending' && $task->status !== 'accepted' && $task->status !== 'rejected') {
            return response()->json(['message' => 'Task cannot be started in current status'], 400);
        }

        $task->status = 'in_progress';
        $task->started_at = now();
        $task->save();

        return response()->json($task->load(['assignee.user', 'creator', 'department', 'designation']), 200);
    }

    public function submit(Request $request, $id)
    {
        $task = Task::findOrFail($id);

        $request->validate([
            'submission_notes' => 'nullable|string',
            'proof_attachment' => 'nullable|file|mimes:pdf,doc,docx,jpg,jpeg,png|max:5120',
        ]);

        if ($task->status !== 'in_progress') {
            if ($task->status === 'completed' || $task->status === 'pending_review') {
                return response()->json(['message' => 'Task already submitted'], 400);
            }
        }

        if ($request->hasFile('proof_attachment')) {
            $path = $request->file('proof_attachment')->store('task_proofs', 'public');
            $task->proof_attachment = $path;
        }

        $task->submission_notes = $request->submission_notes;
        $task->status = 'pending_review';

        if ($task->started_at) {
            $task->time_spent_minutes = now()->diffInMinutes($task->started_at);
        }

        $task->save();

        if ($task->assigned_by) {
            $this->notificationService->sendToUser(
                $task->assigned_by,
                "Task Submitted for Review",
                "Employee {$task->assignee->user->name} has submitted the task for review: {$task->title}.",
                "task",
                "/admin/tasks"
            );
        }

        return response()->json($task->load(['assignee.user', 'creator', 'department', 'designation']), 200);
    }

    public function approve(Request $request, $id)
    {
        $task = Task::findOrFail($id);
        $user = Auth::user();

        if ($user->role_id !== 1 && !$user->can_assign_tasks) {
            return response()->json(['message' => 'Unauthorized to approve tasks'], 403);
        }

        $request->validate([
            'admin_feedback' => 'nullable|string'
        ]);

        $task->status = 'completed';
        $task->admin_feedback = $request->admin_feedback;
        $task->completed_at = now();
        $task->save();

        // Notify the assignee that their task was approved/completed
        if ($task->assignee && $task->assignee->user_id) {
            $this->notificationService->sendToUser(
                $task->assignee->user_id,
                "Task Approved",
                "Your submission for the task: {$task->title} has been approved." . ($task->admin_feedback ? " Feedback: {$task->admin_feedback}" : ""),
                "task",
                "/employee/tasks"
            );
        }

        return response()->json($task->load(['assignee.user', 'creator', 'department', 'designation']), 200);
    }

    public function reject(Request $request, $id)
    {
        $task = Task::findOrFail($id);
        $user = Auth::user();

        if ($user->role_id !== 1 && !$user->can_assign_tasks) {
            return response()->json(['message' => 'Unauthorized to review tasks'], 403);
        }

        $request->validate([
            'admin_feedback' => 'required|string'
        ]);

        $task->status = 'rejected';
        $task->admin_feedback = $request->admin_feedback;
        $task->save();

        // Notify the assignee that their task was rejected
        if ($task->assignee && $task->assignee->user_id) {
            $this->notificationService->sendToUser(
                $task->assignee->user_id,
                "Task Revision Required",
                "Your submission for task: {$task->title} requires revision. Feedback: {$task->admin_feedback}",
                "task",
                "/employee/tasks"
            );
        }

        return response()->json($task->load(['assignee.user', 'creator', 'department', 'designation']), 200);
    }
    public function hold(Request $request, $id)
    {
        $task = Task::findOrFail($id);
        $user = Auth::user();

        // Only the assigned employee can hold their own task
        if (!$user->employee || $task->assigned_to !== $user->employee->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!in_array($task->status, ['in_progress', 'accepted'])) {
            return response()->json(['message' => 'Only active tasks can be put on hold'], 400);
        }

        $request->validate([
            'hold_reason' => 'required|string|max:500',
        ]);

        $task->status = 'on_hold';
        $task->hold_reason = $request->hold_reason;
        $task->held_at = now();
        $task->save();

        // Notify creator
        if ($task->assigned_by) {
            $this->notificationService->sendToUser(
                $task->assigned_by,
                "Task Put On Hold",
                "{$user->name} has put the task \"{$task->title}\" on hold. Reason: {$task->hold_reason}",
                "task",
                "/admin/tasks"
            );
        }

        return response()->json($task->load(['assignee.user', 'creator', 'department', 'designation']), 200);
    }

    public function resume(Request $request, $id)
    {
        $task = Task::findOrFail($id);
        $user = Auth::user();

        if (!$user->employee || $task->assigned_to !== $user->employee->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($task->status !== 'on_hold') {
            return response()->json(['message' => 'Task is not on hold'], 400);
        }

        $task->status = 'in_progress';
        $task->hold_reason = null;
        $task->held_at = null;
        // Restore started_at so time tracking continues from now
        $task->started_at = now();
        $task->save();

        // Notify creator
        if ($task->assigned_by) {
            $this->notificationService->sendToUser(
                $task->assigned_by,
                "Task Resumed",
                "{$user->name} has resumed the task \"{$task->title}\".",
                "task",
                "/admin/tasks"
            );
        }

        return response()->json($task->load(['assignee.user', 'creator', 'department', 'designation']), 200);
    }

    public function analytics()
    {
        $categoryBreakdown = Task::where('status', 'completed')
            ->with('department')
            ->selectRaw('department_id, count(*) as total')
            ->groupBy('department_id')
            ->get();

        $statusBreakdown = [
            ['status' => 'Completed', 'count' => Task::where('status', 'completed')->count()],
            ['status' => 'Pending', 'count' => Task::where('status', 'pending')->count()],
            ['status' => 'In Progress', 'count' => Task::where('status', 'in_progress')->count()],
            ['status' => 'Pending Review', 'count' => Task::where('status', 'pending_review')->count()],
            ['status' => 'Rejected', 'count' => Task::where('status', 'rejected')->count()],
        ];

        $totalTasks = Task::count();
        $totalCompleted = Task::where('status', 'completed')->count();
        $avgCompletionRate = $totalTasks > 0 ? round(($totalCompleted / $totalTasks) * 100) : 0;

        return response()->json([
            'categories' => $categoryBreakdown,
            'status_breakdown' => $statusBreakdown,
            'total_completed' => $totalCompleted,
            'total_pending' => Task::where('status', 'pending')->count(),
            'avg_completion_rate' => $avgCompletionRate,
        ], 200);
    }

    public function employeePerformance()
    {
        $employees = Employee::with(['user', 'department'])
            ->whereHas('user', fn($q) => $q->where('is_active', true))
            ->get()
            ->map(function ($emp) {
                $tasks = Task::where('assigned_to', $emp->id)->get();
                $completed = $tasks->where('status', 'completed')->count();
                $pending = $tasks->where('status', 'pending')->count();
                $inProgress = $tasks->filter(fn($t) => in_array($t->status, ['in_progress', 'accepted', 'claimed']))->count();
                $rejected = $tasks->where('status', 'rejected')->count();
                $review = $tasks->where('status', 'pending_review')->count();
                $total = $tasks->count();

                // Avg time spent (minutes -> hours) for completed tasks
                $avgTimeHrs = 0;
                $completedWithTime = $tasks->where('status', 'completed')->filter(fn($t) => $t->time_spent_minutes > 0);
                if ($completedWithTime->count() > 0) {
                    $avgTimeHrs = round($completedWithTime->avg('time_spent_minutes') / 60, 1);
                }

                return [
                    'id' => $emp->id,
                    'name' => $emp->user?->name ?? 'Unknown',
                    'department' => $emp->department?->name ?? 'N/A',
                    'completed' => $completed,
                    'pending' => $pending,
                    'in_progress' => $inProgress,
                    'rejected' => $rejected,
                    'pending_review' => $review,
                    'total' => $total,
                    'completion_rate' => $total > 0 ? round(($completed / $total) * 100) : 0,
                    'avg_time_hrs' => $avgTimeHrs,
                ];
            })
            ->sortByDesc('completion_rate')
            ->values();

        // Monthly trend for last 6 months
        $monthlyTrend = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $count = Task::where('status', 'completed')
                ->whereYear('completed_at', $month->year)
                ->whereMonth('completed_at', $month->month)
                ->count();
            $monthlyTrend[] = [
                'month' => $month->format('M Y'),
                'completed' => $count,
            ];
        }

        // Department-wise monthly trend
        $deptTrend = [];

        return response()->json([
            'employees' => $employees,
            'monthly_trend' => $monthlyTrend,
        ], 200);
    }
}