<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'company_name',
        'company_email',
        'company_phone',
        'company_address',
        'logo',
    ];
}