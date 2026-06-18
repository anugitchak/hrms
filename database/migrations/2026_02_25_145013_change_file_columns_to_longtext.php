<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Change columns to LONGTEXT to support base64 encoded files

        Schema::table('tasks', function (Blueprint $table) {
            $table->longText('proof_attachment')->nullable()->change();
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->longText('profile_photo')->nullable()->change();
        });

        Schema::table('employee_documents', function (Blueprint $table) {
            $table->longText('file_path')->nullable()->change();
        });

        Schema::table('announcements', function (Blueprint $table) {
            $table->longText('attachment_url')->nullable()->change();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->longText('face_data')->nullable()->change();
            // face_descriptor is already TEXT/JSON, but let's ensure it's big enough just in case
            $table->longText('face_descriptor')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverting back to original types

        Schema::table('tasks', function (Blueprint $table) {
            $table->string('proof_attachment', 255)->nullable()->change();
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->string('profile_photo', 255)->nullable()->change();
        });

        Schema::table('employee_documents', function (Blueprint $table) {
            $table->string('file_path', 255)->nullable()->change();
        });

        Schema::table('announcements', function (Blueprint $table) {
            $table->string('attachment_url', 255)->nullable()->change();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('face_data', 255)->nullable()->change();
            $table->text('face_descriptor')->nullable()->change();
        });
    }
};
