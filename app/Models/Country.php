<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Country extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get all sub-companies in this country
     */
    public function subCompanies()
    {
        return $this->hasMany(SubCompany::class);
    }

    /**
     * Get all employees in this country
     */
    public function employees()
    {
        return $this->hasMany(Employee::class);
    }
}
