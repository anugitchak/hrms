<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'assigned_to',
        'assigned_by',
        'due_date',
        'due_time',
        'status',
        'priority',
        'designation_id',
        'department_id',
        'is_pool_task',
        'claimed_at',
        'started_at',
        'time_spent_minutes',
        'proof_attachment',
        'submission_notes',
        'admin_feedback',
        'completed_at',
        'hold_reason',
        'held_at',
    ];

    protected $casts = [
        'due_date' => 'datetime',
        'claimed_at' => 'datetime',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'is_pool_task' => 'boolean',
    ];

    public function assignee()
    {
        return $this->belongsTo(Employee::class, 'assigned_to');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function designation()
    {
        return $this->belongsTo(Designation::class);
    }
}
