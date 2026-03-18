<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class PayslipTemplate extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'slug',
        'template_content',
        'template_html',
        'fields',
        'default_template',
        'is_active',
        'design_data',       // JSON array of canvas elements (our drag-drop layout)
        'motivational_quotes',
        'background_color',
        'text_color',
        'header_color',
        'footer_color',
        'font_settings',
        'layout_settings',
        'company_branding',
    ];

    protected $casts = [
        'fields'              => 'array',
        'motivational_quotes' => 'array',
        'font_settings'       => 'array',
        'layout_settings'     => 'array',
        'company_branding'    => 'array',
        'design_data'         => 'array',   // Our canvas elements JSON
        'is_active'           => 'boolean',
        'default_template'    => 'boolean',
    ];

    /**
     * Auto-generate slug from name if not provided.
     */
    public static function generateSlug(string $name): string
    {
        $base  = Str::slug($name);
        $slug  = $base;
        $count = 1;
        while (static::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $base . '-' . $count++;
        }
        return $slug;
    }
}
