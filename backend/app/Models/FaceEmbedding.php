<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FaceEmbedding extends Model
{
    protected $fillable = [
        'user_id',
        'descriptor',
        'device_type',
        'label',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
