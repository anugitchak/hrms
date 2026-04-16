<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Config;

class SettingController extends Controller
{
    // ==========================================
    // GET SETTINGS (Admin + SuperAdmin)
    // ==========================================
    public function index()
    {
        $user = auth()->user();

        // Only SuperAdmin (1) and Admin (2)
        if (!$user->hasAnyRole([User::ROLE_SUPER_ADMIN, User::ROLE_ADMIN])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $keys = ['company_name', 'company_email', 'company_phone', 'company_address', 'logo'];
        $settings = [];
        foreach ($keys as $key) {
            $settings[$key] = Setting::where('key', $key)->value('value');
        }

        return response()->json($settings);
    }

    // ==========================================
    // UPDATE SETTINGS (SuperAdmin ONLY)
    // ==========================================
    public function update(Request $request)
    {
        $user = auth()->user();

        if (!$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'company_name' => 'sometimes|string|max:255',
            'company_email' => 'sometimes|email',
            'company_phone' => 'sometimes|string|max:20',
            'company_address' => 'sometimes|string|max:500',
        ]);

        $allowedKeys = ['company_name', 'company_email', 'company_phone', 'company_address'];
        $updated = [];
        foreach ($allowedKeys as $key) {
            if ($request->has($key)) {
                Setting::updateOrCreate(['key' => $key], ['value' => $request->input($key)]);
                $updated[$key] = $request->input($key);
            }
        }

        return response()->json([
            'message' => 'Settings updated successfully',
            'settings' => $updated
        ]);
    }

    // ==========================================
    // UPLOAD LOGO (SuperAdmin ONLY)
    // ==========================================
    public function uploadLogo(Request $request)
    {
        $user = auth()->user();

        if (!$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'logo' => 'required|image|mimes:png,jpg,jpeg|max:2048',
        ]);

        $logoSetting = Setting::where('key', 'logo')->first();

        // Delete old logo if exists
        if ($logoSetting && $logoSetting->value && Storage::disk('public')->exists($logoSetting->value)) {
            Storage::disk('public')->delete($logoSetting->value);
        }

        // Store new logo
        $path = $request->file('logo')->store('logos', 'public');

        Setting::updateOrCreate(['key' => 'logo'], ['value' => $path]);

        return response()->json([
            'message' => 'Logo uploaded successfully',
            'logo_url' => asset('storage/' . $path)
        ]);
    }

    // ==========================================
    // GET WELCOME EMAIL TEMPLATE (SuperAdmin)
    // ==========================================
    public function getEmailTemplate()
    {
        $user = auth()->user();
        if (!$user->isSuperAdmin() && !$user->can_manage_email_templates) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $defaultSubject = 'Welcome to the Team! - {CompanyName}';
        $defaultBody = "<p>Dear <strong>{EmployeeName}</strong>,</p>\n\n<p>Congratulations! We are thrilled to have you join our team. Your employee profile has been successfully created in the <strong>{CompanyName}</strong> portal.</p>\n\n<p>Here are your login details:</p>\n<ul>\n  <li><strong>Employee Code:</strong> {EmployeeCode}</li>\n  <li><strong>Login Email:</strong> {Email}</li>\n  <li><strong>Temporary Password:</strong> {Password}</li>\n  <li><strong>Department:</strong> {Department}</li>\n  <li><strong>Designation:</strong> {Designation}</li>\n  <li><strong>Joining Date:</strong> {JoiningDate}</li>\n</ul>\n\n<p>Please log in at <a href=\"{PortalURL}\">{PortalURL}</a> and update your password.</p>\n\n<p>Welcome aboard!</p>";

        return response()->json([
            'subject' => Setting::where('key', 'welcome_email_subject')->value('value') ?? $defaultSubject,
            'body'    => Setting::where('key', 'welcome_email_body')->value('value')    ?? $defaultBody,
            'is_active' => (bool) (Setting::where('key', 'welcome_email_active')->value('value') ?? true),
            'available_variables' => [
                '{EmployeeName}', '{Email}', '{Password}', '{EmployeeCode}',
                '{Department}', '{Designation}', '{JoiningDate}', '{CompanyName}', '{PortalURL}',
            ],
        ]);
    }

    // ==========================================
    // UPDATE WELCOME EMAIL TEMPLATE (SuperAdmin)
    // ==========================================
    public function updateEmailTemplate(Request $request)
    {
        $user = auth()->user();
        if (!$user->isSuperAdmin() && !$user->can_manage_email_templates) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'subject'   => 'required|string|max:255',
            'body'      => 'required|string',
            'is_active' => 'boolean',
        ]);

        Setting::updateOrCreate(['key' => 'welcome_email_subject'], ['value' => $request->subject]);
        Setting::updateOrCreate(['key' => 'welcome_email_body'],    ['value' => $request->body]);
        Setting::updateOrCreate(['key' => 'welcome_email_active'],  ['value' => $request->input('is_active', true) ? '1' : '0']);

        return response()->json(['message' => 'Email template saved successfully']);
    }

    // ==========================================
    // GET MAIL / SMTP SETTINGS (SuperAdmin)
    // ==========================================
    public function getMailSettings()
    {
        $user = auth()->user();
        if (!$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $keys = ['mail_mailer', 'mail_host', 'mail_port', 'mail_username',
                 'mail_password', 'mail_encryption', 'mail_from_address', 'mail_from_name'];

        $settings = [];
        foreach ($keys as $key) {
            $settings[$key] = Setting::where('key', $key)->value('value');
        }

        // Mask the password — only indicate if one is stored
        $settings['mail_password'] = $settings['mail_password'] ? '••••••••' : '';
        $settings['password_is_set'] = (bool) Setting::where('key', 'mail_password')->value('value');

        return response()->json($settings);
    }

    // ==========================================
    // UPDATE MAIL / SMTP SETTINGS (SuperAdmin)
    // ==========================================
    public function updateMailSettings(Request $request)
    {
        $user = auth()->user();
        if (!$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'mail_mailer'       => 'sometimes|string|in:smtp,sendmail,mailgun,ses,postmark,log,array',
            'mail_host'         => 'required|string|max:255',
            'mail_port'         => 'required|integer|min:1|max:65535',
            'mail_username'     => 'nullable|string|max:255',
            'mail_password'     => 'nullable|string|max:255',
            'mail_encryption'   => 'nullable|string|in:tls,ssl,starttls,',
            'mail_from_address' => 'required|email|max:255',
            'mail_from_name'    => 'required|string|max:255',
        ]);

        $plainFields = ['mail_mailer', 'mail_host', 'mail_port', 'mail_username',
                        'mail_encryption', 'mail_from_address', 'mail_from_name'];

        foreach ($plainFields as $key) {
            if ($request->has($key)) {
                Setting::updateOrCreate(['key' => $key], ['value' => $request->input($key) ?? '']);
            }
        }

        // Only update password if a new value was provided (not the masked placeholder)
        $newPassword = $request->input('mail_password');
        if ($newPassword && $newPassword !== '••••••••') {
            Setting::updateOrCreate(['key' => 'mail_password'], ['value' => encrypt($newPassword)]);
        }

        return response()->json(['message' => 'Mail settings saved successfully']);
    }

    // ==========================================
    // SEND TEST EMAIL (SuperAdmin)
    // ==========================================
    public function sendTestMail(Request $request)
    {
        $user = auth()->user();
        if (!$user->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'to_email'          => 'required|email',
            // Optional inline SMTP config (test without saving first)
            'mail_mailer'       => 'nullable|string',
            'mail_host'         => 'nullable|string',
            'mail_port'         => 'nullable|integer|min:1|max:65535',
            'mail_username'     => 'nullable|string',
            'mail_password'     => 'nullable|string',
            'mail_encryption'   => 'nullable|string',
            'mail_from_address' => 'nullable|email',
            'mail_from_name'    => 'nullable|string',
        ]);

        // If the request includes inline SMTP config (form values), use them directly.
        // This allows testing before saving.
        if ($request->filled('mail_host')) {
            $mailer     = $request->input('mail_mailer', 'smtp');
            $host       = $request->input('mail_host');
            $port       = (int) $request->input('mail_port', 587);
            $username   = $request->input('mail_username');
            $encryption = $request->input('mail_encryption') ?: null;
            $fromAddr   = $request->input('mail_from_address');
            $fromName   = $request->input('mail_from_name');

            // Use new password if provided and not the masked placeholder;
            // otherwise fall back to the saved (encrypted) password
            $rawPassword = $request->input('mail_password');
            if ($rawPassword && $rawPassword !== '••••••••') {
                $password = $rawPassword;
            } else {
                $enc = Setting::where('key', 'mail_password')->value('value');
                $password = $enc ? (function() use ($enc) {
                    try { return decrypt($enc); } catch (\Exception $e) { return null; }
                })() : null;
            }

            Config::set('mail.default', $mailer);
            Config::set("mail.mailers.{$mailer}.host",       $host);
            Config::set("mail.mailers.{$mailer}.port",       $port);
            Config::set("mail.mailers.{$mailer}.username",   $username ?: null);
            Config::set("mail.mailers.{$mailer}.password",   $password);
            Config::set("mail.mailers.{$mailer}.encryption", $encryption);
            if ($fromAddr) {
                Config::set('mail.from.address', $fromAddr);
                Config::set('mail.from.name',    $fromName ?: config('mail.from.name'));
            }
        } else {
            // Fall back to saved DB settings
            $this->applyMailConfig();
            $fromAddr = Setting::where('key', 'mail_from_address')->value('value') ?: config('mail.from.address');
            $fromName = Setting::where('key', 'mail_from_name')->value('value')    ?: config('mail.from.name');
        }

        $fromAddress = $fromAddr ?? config('mail.from.address');
        $senderName  = $fromName ?? config('mail.from.name');

        try {
            \Illuminate\Support\Facades\Mail::raw(
                'This is a test email from your HRMS system. If you received this, your mail configuration is working correctly.',
                function ($message) use ($request, $fromAddress, $senderName) {
                    $message->to($request->to_email)
                            ->from($fromAddress, $senderName)
                            ->subject('HRMS - Test Email');
                }
            );

            return response()->json(['message' => 'Test email sent successfully to ' . $request->to_email]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to send test email: ' . $e->getMessage()], 500);
        }
    }

    // ==========================================
    // HELPER: Apply mail config from settings
    // ==========================================
    public static function applyMailConfig()
    {
        $host = Setting::where('key', 'mail_host')->value('value');
        if (!$host) return; // No custom config stored — use .env defaults

        $port       = Setting::where('key', 'mail_port')->value('value');
        $username   = Setting::where('key', 'mail_username')->value('value');
        $enc_pass   = Setting::where('key', 'mail_password')->value('value');
        $encryption = Setting::where('key', 'mail_encryption')->value('value');
        $fromAddr   = Setting::where('key', 'mail_from_address')->value('value');
        $fromName   = Setting::where('key', 'mail_from_name')->value('value');
        $mailer     = Setting::where('key', 'mail_mailer')->value('value') ?: 'smtp';

        $password = null;
        if ($enc_pass) {
            try { $password = decrypt($enc_pass); } catch (\Exception $e) { $password = null; }
        }

        Config::set('mail.default', $mailer);
        Config::set("mail.mailers.{$mailer}.host",       $host);
        Config::set("mail.mailers.{$mailer}.port",       (int) $port);
        Config::set("mail.mailers.{$mailer}.username",   $username ?: null);
        Config::set("mail.mailers.{$mailer}.password",   $password);
        Config::set("mail.mailers.{$mailer}.encryption", $encryption ?: null);

        if ($fromAddr) {
            Config::set('mail.from.address', $fromAddr);
            Config::set('mail.from.name', $fromName ?: config('mail.from.name'));
        }
    }
}