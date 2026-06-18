<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private function indexExists(string $table, string $indexName): bool
    {
        return DB::table('information_schema.statistics')
            ->where('table_schema', DB::getDatabaseName())
            ->where('table_name', $table)
            ->where('index_name', $indexName)
            ->exists();
    }

    public function up(): void
    {
        $indexExists = fn(string $table, string $index) => $this->indexExists($table, $index);

        Schema::table('users', function (Blueprint $table) {
            if (!$this->indexExists('users', 'users_role_active_idx')) {
                $table->index(['role_id', 'is_active'], 'users_role_active_idx');
            }
        });

        Schema::table('employees', function (Blueprint $table) use ($indexExists) {
            if (Schema::hasColumn('employees', 'department_id')) {
                if (!$indexExists('employees', 'employees_department_idx')) {
                    $table->index('department_id', 'employees_department_idx');
                }
            }
            if (Schema::hasColumn('employees', 'designation_id')) {
                if (!$indexExists('employees', 'employees_designation_idx')) {
                    $table->index('designation_id', 'employees_designation_idx');
                }
            }
            if (Schema::hasColumn('employees', 'country_id')) {
                if (!$indexExists('employees', 'employees_country_idx')) {
                    $table->index('country_id', 'employees_country_idx');
                }
            }
            if (Schema::hasColumn('employees', 'sub_company_id')) {
                if (!$indexExists('employees', 'employees_sub_company_idx')) {
                    $table->index('sub_company_id', 'employees_sub_company_idx');
                }
            }
        });

        Schema::table('attendances', function (Blueprint $table) {
            if (!$this->indexExists('attendances', 'attendances_employee_date_idx')) {
                $table->index(['employee_id', 'date'], 'attendances_employee_date_idx');
            }
            if (!$this->indexExists('attendances', 'attendances_status_date_idx')) {
                $table->index(['status', 'date'], 'attendances_status_date_idx');
            }
        });

        Schema::table('leaves', function (Blueprint $table) {
            if (!$this->indexExists('leaves', 'leaves_employee_status_idx')) {
                $table->index(['employee_id', 'status'], 'leaves_employee_status_idx');
            }
            if (!$this->indexExists('leaves', 'leaves_date_range_idx')) {
                $table->index(['start_date', 'end_date'], 'leaves_date_range_idx');
            }
        });

        Schema::table('tasks', function (Blueprint $table) {
            if (!$this->indexExists('tasks', 'tasks_assigned_status_idx')) {
                $table->index(['assigned_to', 'status'], 'tasks_assigned_status_idx');
            }
            if (!$this->indexExists('tasks', 'tasks_creator_status_idx')) {
                $table->index(['assigned_by', 'status'], 'tasks_creator_status_idx');
            }
            if (!$this->indexExists('tasks', 'tasks_due_date_idx')) {
                $table->index('due_date', 'tasks_due_date_idx');
            }
            // Avoid oversized composite key on older MySQL/MariaDB limits.
            if (!$this->indexExists('tasks', 'tasks_status_idx')) {
                $table->index('status', 'tasks_status_idx');
            }
            if (!$this->indexExists('tasks', 'tasks_priority_idx')) {
                $table->index('priority', 'tasks_priority_idx');
            }
        });
    }

    public function down(): void
    {
        $indexExists = fn(string $table, string $index) => $this->indexExists($table, $index);

        Schema::table('users', function (Blueprint $table) {
            if ($this->indexExists('users', 'users_role_active_idx')) {
                $table->dropIndex('users_role_active_idx');
            }
        });

        Schema::table('employees', function (Blueprint $table) use ($indexExists) {
            if (Schema::hasColumn('employees', 'department_id')) {
                if ($indexExists('employees', 'employees_department_idx')) {
                    $table->dropIndex('employees_department_idx');
                }
            }
            if (Schema::hasColumn('employees', 'designation_id')) {
                if ($indexExists('employees', 'employees_designation_idx')) {
                    $table->dropIndex('employees_designation_idx');
                }
            }
            if (Schema::hasColumn('employees', 'country_id')) {
                if ($indexExists('employees', 'employees_country_idx')) {
                    $table->dropIndex('employees_country_idx');
                }
            }
            if (Schema::hasColumn('employees', 'sub_company_id')) {
                if ($indexExists('employees', 'employees_sub_company_idx')) {
                    $table->dropIndex('employees_sub_company_idx');
                }
            }
        });

        Schema::table('attendances', function (Blueprint $table) {
            if ($this->indexExists('attendances', 'attendances_employee_date_idx')) {
                $table->dropIndex('attendances_employee_date_idx');
            }
            if ($this->indexExists('attendances', 'attendances_status_date_idx')) {
                $table->dropIndex('attendances_status_date_idx');
            }
        });

        Schema::table('leaves', function (Blueprint $table) {
            if ($this->indexExists('leaves', 'leaves_employee_status_idx')) {
                $table->dropIndex('leaves_employee_status_idx');
            }
            if ($this->indexExists('leaves', 'leaves_date_range_idx')) {
                $table->dropIndex('leaves_date_range_idx');
            }
        });

        Schema::table('tasks', function (Blueprint $table) {
            if ($this->indexExists('tasks', 'tasks_assigned_status_idx')) {
                $table->dropIndex('tasks_assigned_status_idx');
            }
            if ($this->indexExists('tasks', 'tasks_creator_status_idx')) {
                $table->dropIndex('tasks_creator_status_idx');
            }
            if ($this->indexExists('tasks', 'tasks_due_date_idx')) {
                $table->dropIndex('tasks_due_date_idx');
            }
            if ($this->indexExists('tasks', 'tasks_status_idx')) {
                $table->dropIndex('tasks_status_idx');
            }
            if ($this->indexExists('tasks', 'tasks_priority_idx')) {
                $table->dropIndex('tasks_priority_idx');
            }
        });
    }
};
