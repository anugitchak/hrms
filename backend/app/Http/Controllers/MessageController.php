<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;

class MessageController extends Controller
{
    protected $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * List all users (excluding self) for recipient picker
     */
    public function getUsers()
    {
        $users = User::select('id', 'name', 'email')
            ->where('id', '!=', Auth::id())
            ->orderBy('name')
            ->get();

        return response()->json($users);
    }

    /**
     * Compose and send a message (real email + in-portal notification)
     */
    public function compose(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'subject'     => 'required|string|max:255',
            'body'        => 'required|string',
        ]);

        $sender   = Auth::user();
        $receiver = User::findOrFail($request->receiver_id);

        // Save the message to the database
        $message = Message::create([
            'sender_id'   => $sender->id,
            'receiver_id' => $receiver->id,
            'subject'     => $request->subject,
            'body'        => $request->body,
        ]);

        // Apply runtime SMTP config from DB settings and send real email
        try {
            SettingController::applyMailConfig();

            $senderName  = $sender->name;
            $subject     = $request->subject;
            $body        = $request->body;
            $senderEmail = $sender->email;

            Mail::send([], [], function ($mail) use ($receiver, $senderName, $senderEmail, $subject, $body) {
                $mail->from($senderEmail, $senderName)
                     ->to($receiver->email, $receiver->name)
                     ->replyTo($senderEmail, $senderName)
                     ->subject($subject)
                     ->html(
                         '<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px;">'
                         . '<h3 style="color:#00b9cd;margin-top:0;">New message from ' . htmlspecialchars($senderName) . '</h3>'
                         . '<p style="white-space:pre-line;color:#374151;">' . nl2br(htmlspecialchars($body)) . '</p>'
                         . '<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">'
                         . '<p style="font-size:12px;color:#9ca3af;">This message was sent via the HRMS internal messaging system.</p>'
                         . '</div>'
                     );
            });
        } catch (\Exception $e) {
            // Email failed but message is already saved — still create the in-app notification
            \Log::warning('MessageController: real email send failed: ' . $e->getMessage());
        }

        // Create in-portal notification for receiver
        $this->notificationService->sendToUser(
            $receiver->id,
            'New Message from ' . $sender->name,
            $request->subject,
            'message',
            '/employee/email-settings'
        );

        return response()->json([
            'message'  => 'Message sent successfully.',
            'data'     => $message->load(['sender:id,name,email', 'receiver:id,name,email']),
        ], 201);
    }

    /**
     * Inbox — messages received by the authenticated user
     */
    public function inbox()
    {
        $messages = Message::where('receiver_id', Auth::id())
            ->where('receiver_deleted', false)
            ->with('sender:id,name,email')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($messages);
    }

    /**
     * Sent — messages sent by the authenticated user
     */
    public function sent()
    {
        $messages = Message::where('sender_id', Auth::id())
            ->where('sender_deleted', false)
            ->with('receiver:id,name,email')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($messages);
    }

    /**
     * Show a single message and mark it as read if receiver is viewing
     */
    public function show($id)
    {
        $userId  = Auth::id();
        $message = Message::with(['sender:id,name,email', 'receiver:id,name,email'])->findOrFail($id);

        // Authorization: only sender or receiver can view
        if ($message->sender_id !== $userId && $message->receiver_id !== $userId) {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        // Mark as read when receiver opens the message
        if ($message->receiver_id === $userId && !$message->is_read) {
            $message->update([
                'is_read' => true,
                'read_at' => now(),
            ]);
        }

        return response()->json($message);
    }

    /**
     * Delete (soft-delete) a message for the current user's side
     */
    public function destroy($id)
    {
        $userId  = Auth::id();
        $message = Message::findOrFail($id);

        if ($message->sender_id === $userId) {
            $message->update(['sender_deleted' => true]);
        } elseif ($message->receiver_id === $userId) {
            $message->update(['receiver_deleted' => true]);
        } else {
            return response()->json(['error' => 'Unauthorized'], 403);
        }

        return response()->json(['message' => 'Message deleted.']);
    }
}
