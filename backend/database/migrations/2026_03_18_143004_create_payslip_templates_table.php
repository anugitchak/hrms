<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payslip_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->longText('template_content')->nullable();
            $table->longText('template_html')->nullable();
            $table->json('fields')->nullable();
            $table->boolean('default_template')->default(false);
            $table->boolean('is_active')->default(true);
            $table->json('design_data')->nullable();
            $table->json('motivational_quotes')->nullable();
            $table->string('background_color')->default('#ffffff');
            $table->string('text_color')->default('#333333');
            $table->string('header_color')->default('#000000');
            $table->string('footer_color')->default('#000000');
            $table->json('font_settings')->nullable();
            $table->json('layout_settings')->nullable();
            $table->json('company_branding')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payslip_templates');
    }
};
