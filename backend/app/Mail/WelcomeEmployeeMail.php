<?php

namespace App\Mail;

use App\Models\Setting;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WelcomeEmployeeMail extends Mailable
{
    use Queueable, SerializesModels;

    public $employee;
    public $password;

    public function __construct($employee, $password)
    {
        $this->employee = $employee;
        $this->password = $password;
    }

    public function envelope(): Envelope
    {
        $customSubject = Setting::where('key', 'welcome_email_subject')->value('value');
        $subject = $customSubject
            ? $this->replacePlaceholders($customSubject)
            : 'Welcome to the Team! - ' . config('app.name');

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        $customBody = Setting::where('key', 'welcome_email_body')->value('value');

        if ($customBody) {
            return new Content(
                view: 'emails.welcome_employee_custom',
                with: ['emailBody' => $this->replacePlaceholders($customBody)],
            );
        }

        return new Content(
            view: 'emails.welcome_employee',
        );
    }

    public function attachments(): array
    {
        return [];
    }

    private function replacePlaceholders(string $text): string
    {
        $emp = $this->employee;

        return str_replace(
            [
                '{EmployeeName}', '{Email}', '{Password}', '{EmployeeCode}',
                '{Department}', '{Designation}', '{JoiningDate}',
                '{CompanyName}', '{PortalURL}',
            ],
            [
                $emp->user->name ?? '',
                $emp->user->email ?? '',
                $this->password,
                $emp->employee_code ?? '',
                $emp->department->name ?? 'N/A',
                ($emp->designation instanceof \App\Models\Designation ? $emp->designation->name : null) ?? 'N/A',
                $emp->date_of_joining ? $emp->date_of_joining->format('d M, Y') : 'N/A',
                config('app.name'),
                config('app.frontend_url'),
            ],
            $text
        );
    }
}
