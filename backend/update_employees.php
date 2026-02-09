<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Updating Employees with Country and Sub-Company ===\n\n";

// Get the India country and WOWL sub-company
$india = App\Models\Country::where('name', 'India')->first();
$wowl = App\Models\SubCompany::where('name', 'WOWL edtech')->first();

// Get all employees
$employees = App\Models\Employee::with('user')->get();

echo "Found {$employees->count()} employee(s)\n\n";

foreach ($employees as $employee) {
    $wasUpdated = false;
    
    if (!$employee->country_id) {
        $employee->country_id = $india->id;
        $wasUpdated = true;
    }
    
    if (!$employee->sub_company_id) {
        $employee->sub_company_id = $wowl->id;
        $wasUpdated = true;
    }
    
    if ($wasUpdated) {
        $employee->save();
        echo "✓ Updated: {$employee->user->name} ({$employee->user->email})\n";
        echo "  - Country: India\n";
        echo "  - Sub-Company: WOWL edtech\n\n";
    } else {
        echo "- Already set: {$employee->user->name} ({$employee->user->email})\n";
        echo "  - Country ID: {$employee->country_id}\n";
        echo "  - Sub-Company ID: {$employee->sub_company_id}\n\n";
    }
}

echo "\n✓ All employees updated! They can now log in with:\n";
echo "  Country: India\n";
echo "  Sub-Company: WOWL edtech\n";
