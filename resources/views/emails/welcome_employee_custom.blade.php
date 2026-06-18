<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome Email</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.7;
            color: #333;
            background-color: #f4f7f6;
            margin: 0;
            padding: 0;
        }
        .wrapper {
            max-width: 640px;
            margin: 30px auto;
            background: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.07);
            overflow: hidden;
        }
        .header-bar {
            background: #008080;
            padding: 24px 40px;
        }
        .header-bar h1 {
            margin: 0;
            color: #ffffff;
            font-size: 22px;
            letter-spacing: 0.5px;
        }
        .body-content {
            padding: 36px 40px;
            font-size: 15px;
        }
        .body-content a {
            color: #008080;
        }
        .body-content ul {
            padding-left: 20px;
        }
        .body-content li {
            margin-bottom: 6px;
        }
        .footer {
            text-align: center;
            font-size: 11px;
            color: #aaa;
            padding: 20px 40px;
            border-top: 1px solid #eee;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header-bar">
            <h1>{{ $companyName ?? config('app.name') }}</h1>
        </div>
        <div class="body-content">
            {!! $emailBody !!}
        </div>
        <div class="footer">
            &copy; {{ date('Y') }} {{ $companyName ?? config('app.name') }}. This is an automated message — please do not reply.
        </div>
    </div>
</body>
</html>
