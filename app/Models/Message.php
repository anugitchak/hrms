<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    protected $fillable = [
        'sender_id', 'receiver_id', 'subject', 'body',
        'is_read', 'read_at', 'sender_deleted', 'receiver_deleted',
    ];

    protected $casts = [
        'is_read'          => 'boolean',
        'sender_deleted'   => 'boolean',
        'receiver_deleted' => 'boolean',
        'read_at'          => 'datetime',
    ];

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }
}
