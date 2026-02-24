<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
class Meeting extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'start_time',
        'location',
        'meeting_link',
        'created_by',
        'department_id',
        'designation_id',
        'status',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function designation()
    {
        return $this->belongsTo(Designation::class);
    }

    public function participants()
    {
        return $this->belongsToMany(Employee::class, 'meeting_participants')
            ->withPivot('attendance_status')
            ->withTimestamps();
    }
}
