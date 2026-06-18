<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Payslip</title>
    <style>
        @page {
            margin: 0;
        }
        body {
            margin: 0;
            padding: 0;
            font-family: DejaVu Sans, Arial, sans-serif;
            font-size: 12px;
            color: #111827;
        }
        .sheet {
            width: 794px;
            height: 1122px;
            position: relative;
            overflow: hidden;
            page-break-after: always;
        }
        .sheet:last-child {
            page-break-after: avoid;
        }
        .el {
            position: absolute;
            box-sizing: border-box;
            overflow: hidden;
            white-space: pre-wrap;
            word-wrap: break-word;
            user-select: none;
        }
        .el-shape {
            border: 0;
        }
        .el-image img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            display: block;
        }
        .qr-box {
            width: 100%;
            height: 100%;
            border: 2px solid #111827;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 12px;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
    </style>
</head>
<body>
@php
    $templateElements = (isset($activeTemplate) && is_array($activeTemplate->design_data)) ? $activeTemplate->design_data : [];
@endphp

@foreach($payslips as $payslip)
    @php
        $employee = $payslip->employee;
        $monthYear = \Carbon\Carbon::createFromDate($payslip->year, $payslip->month, 1)->format('F Y');

        $tokenMap = [
            '{{employee_name}}' => (string) ($employee->user->name ?? ''),
            '{{employee_code}}' => (string) ($employee->employee_code ?? ''),
            '{{designation}}' => (string) ($employee->designation->name ?? ''),
            '{{department}}' => (string) ($employee->department->name ?? ''),
            '{{month_year}}' => (string) $monthYear,
            '{{days_worked}}' => (string) ($payslip->days_worked ?? 0),
            '{{basic}}' => (string) number_format((float) ($payslip->basic ?? 0), 2),
            '{{hra}}' => (string) number_format((float) ($payslip->hra ?? 0), 2),
            '{{gross_salary}}' => (string) number_format((float) ($payslip->total_earnings ?? $payslip->gross_salary ?? 0), 2),
            '{{pf}}' => (string) number_format((float) ($payslip->pf ?? 0), 2),
            '{{esic}}' => (string) number_format((float) ($payslip->esic ?? 0), 2),
            '{{ptax}}' => (string) number_format((float) ($payslip->ptax ?? 0), 2),
            '{{total_deductions}}' => (string) number_format((float) ($payslip->total_deductions ?? 0), 2),
            '{{net_pay}}' => (string) number_format((float) ($payslip->net_pay ?? 0), 2),
            '{{bank_name}}' => (string) ($employee->bank_name ?? '-'),
            '{{account_number}}' => (string) ($employee->account_number ?? '-'),
            '{{ifsc_code}}' => (string) ($employee->ifsc_code ?? '-'),
            '{{total_leaves}}' => '-',
            '{{leaves_taken}}' => '-',
            '{{leave_balance}}' => '-',
            '{{present_days}}' => '-',
            '{{absent_days}}' => '-',
            '{{half_days}}' => '-',
            '{{company_name}}' => (string) ($signatureData['company'] ?? config('app.name', 'HRMS')),
        ];

        $pageBackground = isset($activeTemplate->background_color) ? (string) $activeTemplate->background_color : '#ffffff';
    @endphp

    <div class="sheet" style="background-color: {{ $pageBackground }};">
        @foreach($templateElements as $el)
            @php
                $type = (string) ($el['type'] ?? 'text');
                $x = (float) ($el['x'] ?? 0);
                $y = (float) ($el['y'] ?? 0);
                $w = max(1, (float) ($el['w'] ?? 100));
                $h = max(1, (float) ($el['h'] ?? 30));
                $style = is_array($el['style'] ?? null) ? $el['style'] : [];
                $contentRaw = (string) ($el['content'] ?? '');
                $content = str_replace(array_keys($tokenMap), array_values($tokenMap), $contentRaw);

                $fontSize = (float) ($style['fontSize'] ?? 12);
                $fontWeight = (string) ($style['fontWeight'] ?? 'normal');
                $fontStyle = (string) ($style['fontStyle'] ?? 'normal');
                $textAlign = (string) ($style['textAlign'] ?? 'left');
                $color = (string) ($style['color'] ?? '#111827');
                $background = (string) ($style['backgroundColor'] ?? 'transparent');
                $radius = isset($style['borderRadius']) ? (float) $style['borderRadius'] : (($type === 'badge_paid') ? 9999 : (($type === 'divider') ? 0 : 3));
                $isTextEl = !in_array($type, ['divider', 'rectangle', 'image', 'qr_code'], true);
                $isBadge = $type === 'badge_paid';
            @endphp

            <div
                class="el {{ in_array($type, ['divider', 'rectangle']) ? 'el-shape' : '' }} {{ $type === 'image' ? 'el-image' : '' }}"
                style="
                    left: {{ $x }}px;
                    top: {{ $y }}px;
                    width: {{ $w }}px;
                    height: {{ $h }}px;
                    font-size: {{ $fontSize }}px;
                    font-weight: {{ $fontWeight }};
                    font-style: {{ $fontStyle }};
                    text-align: {{ $textAlign }};
                    color: {{ $color }};
                    background-color: {{ $background }};
                    border-radius: {{ $radius }}px;
                    line-height: {{ $isBadge ? max(1, $h) . 'px' : '1.35' }};
                    padding: {{ in_array($type, ['divider', 'rectangle', 'image', 'qr_code', 'badge_paid']) ? '0' : '6px 8px' }};
                "
            >
                @if($type === 'image')
                    @if(str_starts_with($content, 'data:image/'))
                        <img src="{{ $content }}" alt="image" />
                    @else
                        <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:10px;font-weight:bold;text-transform:uppercase;">No Image</div>
                    @endif
                @elseif($type === 'qr_code')
                    <div class="qr-box">QR</div>
                @elseif($type === 'divider' || $type === 'rectangle')
                @elseif($isTextEl)
                    @if($isBadge)
                        <span style="display:block;text-align:center;white-space:nowrap;line-height:{{ max(1, $h) }}px;">{{ $content }}</span>
                    @else
                        {!! nl2br(e($content)) !!}
                    @endif
                @else
                    {!! nl2br(e($content)) !!}
                @endif
            </div>
        @endforeach
    </div>
@endforeach
</body>
</html>
