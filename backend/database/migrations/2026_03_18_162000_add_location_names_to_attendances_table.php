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
        Schema::table('attendances', function (Blueprint $table) {
            if (!Schema::hasColumn('attendances', 'check_in_location')) {
                $table->text('check_in_location')->nullable()->after('check_in_longitude');
            }
            if (!Schema::hasColumn('attendances', 'check_out_location')) {
                $table->text('check_out_location')->nullable()->after('check_out_longitude');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendances', function (Blueprint $table) {
            $table->dropColumn(['check_in_location', 'check_out_location']);
        });
    }
};
