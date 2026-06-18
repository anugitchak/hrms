<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Only add columns that don't already exist
            if (!Schema::hasColumn('users', 'can_manage_announcements')) {
                $table->boolean('can_manage_announcements')->default(false)->after('can_assign_tasks');
            }
            if (!Schema::hasColumn('users', 'can_manage_meetings')) {
                $table->boolean('can_manage_meetings')->default(false)->after('can_manage_announcements');
            }
            if (!Schema::hasColumn('users', 'can_manage_documents')) {
                $table->boolean('can_manage_documents')->default(false)->after('can_manage_meetings');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['can_manage_announcements', 'can_manage_meetings', 'can_manage_documents']);
        });
    }
};
