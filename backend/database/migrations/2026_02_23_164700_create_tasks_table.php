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
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();

            $table->foreignId('assigned_to')
                ->nullable()
                ->constrained('employees')
                ->onDelete('cascade');

            $table->foreignId('assigned_by')
                ->constrained('users')
                ->onDelete('cascade');

            $table->dateTime('due_date')->nullable();
            $table->string('status')->default('pending'); // pending, claimed, in_progress, pending_review, completed, cancelled
            $table->string('priority')->default('medium'); // low, medium, high, urgent
            $table->integer('points')->default(0);
            $table->string('category')->default('General');

            // Modern workflow fields
            $table->boolean('is_pool_task')->default(false);
            $table->dateTime('claimed_at')->nullable();
            $table->dateTime('started_at')->nullable();
            $table->integer('time_spent_minutes')->default(0);
            $table->string('proof_attachment')->nullable();
            $table->text('submission_notes')->nullable();
            $table->dateTime('completed_at')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
