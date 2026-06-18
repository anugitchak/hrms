<!DOCTYPE html>
<html>
<head>
    <title>Welcome to the Team</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f7f6;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: #ffffff;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #008080; /* Teal matching the theme */
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #008080;
            margin: 0;
            font-size: 28px;
        }
        .welcome-msg {
            font-size: 18px;
            margin-bottom: 20px;
        }
        .details-box {
            background-color: #f9fbfa;
            border: 1px solid #e0eeed;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .details-row {
            display: flex;
            margin-bottom: 10px;
        }
        .details-label {
            font-weight: bold;
            width: 150px;
            color: #555;
        }
        .details-value {
            color: #000;
        }
        .cta-button {
            display: block;
            width: fit-content;
            margin: 30px auto;
            background-color: #008080;
            color: #ffffff !important;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 25px;
            font-weight: bold;
            text-align: center;
        }
        .footer {
            text-align: center;
            font-size: 12px;
            color: #999;
            margin-top: 40px;
            border-top: 1px solid #eee;
            padding-top: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to the Family!</h1>
        </div>

        <p class="welcome-msg">Dear <strong>{{ $employee->user->name }}</strong>,</p>
        
        <p>Congratulations! We are thrilled to have you join our team. Your employee profile has been successfully created in the <strong>{{ $companyName ?? config('app.name') }}</strong> portal.</p>

        <p>Here are your official account details for logging in:</p>

        <div class="details-box">
            <div class="details-row">
                <span class="details-label">Employee Code:</span>
                <span class="details-value">{{ $employee->employee_code }}</span>
            </div>
            <div class="details-row">
                <span class="details-label">Login Email:</span>
                <span class="details-value">{{ $employee->user->email }}</span>
            </div>
            <div class="details-row">
                <span class="details-label">Temporary Password:</span>
                <span class="details-value">{{ $password }}</span>
            </div>
            <div class="details-row">
                <span class="details-label">Department:</span>
                <span class="details-value">{{ $employee->department->name }}</span>
            </div>
            <div class="details-row">
                <span class="details-label">Designation:</span>
                <span class="details-value">{{ $employee->designation->name }}</span>
            </div>
            <div class="details-row">
                <span class="details-label">Joining Date:</span>
                <span class="details-value">{{ date('d M, Y', strtotime($employee->date_of_joining)) }}</span>
            </div>
        </div>

        <p>Please log in and update your password and complete your profile information.</p>

        <a href="{{ config('app.frontend_url') }}" class="cta-button">Go to Portal</a>

        <p>If you have any questions, please reach out to the HR department.</p>

        <p>Best regards,<br>
        <strong>The HR Team</strong><br>
        {{ $companyName ?? config('app.name') }}</p>

        <div class="footer">
            <p>This is an automated message, please do not reply to this email.</p>
        </div>
    </div>
</body>
</html>
