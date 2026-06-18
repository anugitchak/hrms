<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Check or create India country
$india = App\Models\Country::firstOrCreate(
    ['name' => 'India'],
    ['code' => 'IN', 'is_active' => true]
);

echo $india->wasRecentlyCreated 
    ? "✓ Created Country: India (ID: {$india->id})\n" 
    : "✓ Found existing Country: India (ID: {$india->id})\n";

// Check or create WOWL edtech sub-company
$wowl = App\Models\SubCompany::firstOrCreate(
    ['name' => 'WOWL edtech'],
    ['code' => 'WOWL-IN', 'country_id' => $india->id, 'is_active' => true]
);

echo $wowl->wasRecentlyCreated 
    ? "✓ Created Sub-Company: WOWL edtech (ID: {$wowl->id})\n" 
    : "✓ Found existing Sub-Company: WOWL edtech (ID: {$wowl->id})\n";

echo "\n=== All Countries ===\n";
$countries = App\Models\Country::all();
foreach ($countries as $country) {
    echo "- {$country->name} (Code: {$country->code}, ID: {$country->id})\n";
}

echo "\n=== All Sub-Companies ===\n";
$subCompanies = App\Models\SubCompany::with('country')->get();
foreach ($subCompanies as $subCompany) {
    echo "- {$subCompany->name} (Code: {$subCompany->code}, Country: {$subCompany->country->name}, ID: {$subCompany->id})\n";
}

echo "\n✓ Setup complete! You can now log in with:\n";
echo "  Country: India (ID: {$india->id})\n";
echo "  Sub-Company: WOWL edtech (ID: {$wowl->id})\n";
