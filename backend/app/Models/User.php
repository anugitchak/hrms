<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    public const ROLE_SUPER_ADMIN = 1;
    public const ROLE_ADMIN = 2;
    public const ROLE_HR = 3;
    public const ROLE_EMPLOYEE = 4;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'temp_password',
        'face_data',
        'face_descriptor',
        'role_id',
        'is_active',
        // Permissions
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
        'can_manage_payslip_designer',
        'can_force_checkout',
        'can_assign_tasks',
        'can_manage_announcements',
        'can_manage_meetings',
        'can_manage_documents',
        'can_manage_email_templates',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['is_manager'];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at'           => 'datetime',
        'is_active'                   => 'boolean',
        'can_manage_employees'        => 'boolean',
        'can_view_employees'          => 'boolean',
        'can_manage_salaries'         => 'boolean',
        'can_view_salaries'           => 'boolean',
        'can_manage_attendance'       => 'boolean',
        'can_view_attendance'         => 'boolean',
        'can_manage_leaves'           => 'boolean',
        'can_view_leaves'             => 'boolean',
        'can_manage_departments'      => 'boolean',
        'can_manage_payslips'         => 'boolean',
        'can_manage_payroll_settings' => 'boolean',
        'can_manage_payslip_designer' => 'boolean',
        'can_force_checkout'          => 'boolean',
        'can_assign_tasks'            => 'boolean',
        'can_manage_announcements'    => 'boolean',
        'can_manage_meetings'         => 'boolean',
        'can_manage_documents'        => 'boolean',
        'can_manage_email_templates'  => 'boolean',
    ];

    // Relationships (optional)
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function employee()
    {
        return $this->hasOne(Employee::class, 'user_id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function createdTasks()
    {
        return $this->hasMany(Task::class, 'assigned_by');
    }

    // Accessor: Check if user is a manager (has direct reports)
    public function getIsManagerAttribute()
    {
        if (!$this->hasEmployeeProfile()) {
            return false;
        }

        // Avoid lazy-loading violations when this accessor runs during JSON serialization.
        // If relation is already eager loaded, reuse it; otherwise query by user_id.
        if ($this->relationLoaded('employee')) {
            $employee = $this->getRelation('employee');
            if (!$employee) {
                return false;
            }

            return Employee::where('reports_to', $employee->id)->exists();
        }

        $employeeId = Employee::where('user_id', $this->id)->value('id');
        if (!$employeeId) {
            return false;
        }

        return Employee::where('reports_to', $employeeId)->exists();
    }

    public function hasEmployeeProfile(): bool
    {
        if ($this->relationLoaded('employee')) {
            return $this->getRelation('employee') !== null;
        }

        return Employee::where('user_id', $this->id)->exists();
    }

    public function isSuperAdmin(): bool
    {
        return $this->role_id === self::ROLE_SUPER_ADMIN;
    }

    public function isAdmin(): bool
    {
        return $this->role_id === self::ROLE_ADMIN;
    }

    public function isHr(): bool
    {
        return $this->role_id === self::ROLE_HR;
    }

    public function isEmployee(): bool
    {
        return $this->role_id === self::ROLE_EMPLOYEE;
    }

    public function hasAnyRole(array $roleIds): bool
    {
        return in_array($this->role_id, $roleIds, true);
    }

    /**
     * Resolve DB-backed permission flags (can_*) consistently across the app.
     */
    public function hasPermission(string $permission): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        if (!str_starts_with($permission, 'can_')) {
            return false;
        }

        // Fall back to false when an unknown permission key is requested.
        if (!array_key_exists($permission, $this->getCasts()) && !array_key_exists($permission, $this->getAttributes())) {
            return false;
        }

        return (bool) $this->getAttribute($permission);
    }

    /**
     * Bridge Laravel ability checks to DB permission columns for can_* abilities.
     */
    public function can($abilities, $arguments = [])
    {
        if (is_string($abilities) && str_starts_with($abilities, 'can_')) {
            return $this->hasPermission($abilities);
        }

        return parent::can($abilities, $arguments);
    }
}