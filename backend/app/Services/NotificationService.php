<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

class NotificationService
{
    /**
     * Create a notification for one user
     */
    public function sendToUser($userId, $title, $message, $type = "general", $link = null)
    {
        return Notification::create([
            'user_id' => $userId,
            'title'   => $title,
            'message' => $message,
            'type'    => $type,
            'link'    => $link,
        ]);
    }

    /**
     * Send notification to all Admins or HRs
     * @param array $roles example: [1,2,3]
     */
    public function sendToRoles(array $roles, $title, $message, $type = "system", $link = null)
    {
        $userIds = User::whereIn('role_id', $roles)->pluck('id')->unique()->values();

        if ($userIds->isEmpty()) {
            return 0;
        }

        $timestamp = now();
        $rows = $userIds->map(function ($userId) use ($title, $message, $type, $link, $timestamp) {
            return [
                'user_id' => $userId,
                'title' => $title,
                'message' => $message,
                'type' => $type,
                'link' => $link,
                'is_read' => false,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ];
        })->all();

        Notification::insert($rows);

        return count($rows);
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead($notificationId)
    {
        return Notification::where("id", $notificationId)->update([
            "is_read" => true
        ]);
    }

    /**
     * Mark all notifications for a user as read
     */
    public function markAllAsRead($userId)
    {
        return Notification::where("user_id", $userId)->update([
            "is_read" => true
        ]);
    }
}
