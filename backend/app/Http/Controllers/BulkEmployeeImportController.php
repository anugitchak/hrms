<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Employee;
use App\Models\Salary;
use App\Models\SalaryHistory;
use App\Models\Department;
use App\Models\Designation;
use App\Models\Country;
use App\Models\SubCompany;
use App\Mail\WelcomeEmployeeMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Services\LeavePolicyService;

class BulkEmployeeImportController extends Controller
{
    protected $leavePolicyService;

    public function __construct(LeavePolicyService $leavePolicyService)
    {
        $this->leavePolicyService = $leavePolicyService;
    }

    public function import(Request $request)
    {
        // Only Super Admin
        if (!auth()->user()->isSuperAdmin()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'csv_file' => 'required|file|mimes:csv,txt|max:5120',
        ]);

        $file = $request->file('csv_file');
        $handle = fopen($file->getPathname(), 'r');

        // Read header row
        $headers = fgetcsv($handle);
        if (!$headers) {
            fclose($handle);
            return response()->json(['message' => 'CSV file is empty or invalid'], 422);
        }

        // Normalize headers (trim + lowercase)
        $headers = array_map(fn($h) => strtolower(trim($h)), $headers);

        $requiredColumns = ['name', 'email', 'department_name', 'designation_name', 'date_of_joining', 'dob', 'phone', 'country_name', 'sub_company_name'];
        $missing = array_diff($requiredColumns, $headers);
        if (!empty($missing)) {
            fclose($handle);
            return response()->json([
                'message' => 'CSV is missing required columns: ' . implode(', ', $missing)
            ], 422);
        }

        $results = [];
        $rowNumber = 1; // 1 = header, data starts at 2

        while (($row = fgetcsv($handle)) !== false) {
            $rowNumber++;
            // Skip blank rows
            if (empty(array_filter($row))) continue;

            $data = array_combine($headers, array_pad($row, count($headers), ''));
            $result = $this->importRow($rowNumber, $data);
            $results[] = $result;
        }

        fclose($handle);

        $succeeded = count(array_filter($results, fn($r) => $r['status'] === 'success'));
        $failed    = count($results) - $succeeded;

        return response()->json([
            'message'   => "Import complete: {$succeeded} succeeded, {$failed} failed.",
            'succeeded' => $succeeded,
            'failed'    => $failed,
            'results'   => $results,
        ]);
    }

    private function importRow(int $rowNumber, array $data): array
    {
        $base = ['row' => $rowNumber, 'name' => $data['name'] ?? '', 'email' => $data['email'] ?? ''];

        // ── Basic required field validation ──────────────────────────────────
        $requiredFields = ['name', 'email', 'department_name', 'designation_name', 'date_of_joining', 'dob', 'phone', 'country_name', 'sub_company_name', 'gross_salary', 'gender', 'joining_category'];
        foreach ($requiredFields as $field) {
            if (empty(trim($data[$field] ?? ''))) {
                return array_merge($base, ['status' => 'error', 'reason' => "Missing required field: {$field}"]);
            }
        }

        // Email uniqueness
        if (User::where('email', trim($data['email']))->exists()) {
            return array_merge($base, ['status' => 'error', 'reason' => 'Email already exists: ' . $data['email']]);
        }

        // Phone validation
        if (!preg_match('/^\d{10}$/', trim($data['phone'] ?? ''))) {
            return array_merge($base, ['status' => 'error', 'reason' => 'Phone must be exactly 10 digits']);
        }

        // Date validation
        foreach (['date_of_joining', 'dob'] as $dateField) {
            $val = trim($data[$dateField] ?? '');
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $val) || !strtotime($val)) {
                return array_merge($base, ['status' => 'error', 'reason' => "Invalid date format for {$dateField}. Use YYYY-MM-DD"]);
            }
        }

        // Resolve Department
        $department = Department::whereRaw('LOWER(name) = ?', [strtolower(trim($data['department_name']))])->first();
        if (!$department) {
            return array_merge($base, ['status' => 'error', 'reason' => 'Department not found: ' . $data['department_name']]);
        }

        // Resolve Country
        $country = Country::whereRaw('LOWER(name) = ?', [strtolower(trim($data['country_name']))])->first();
        if (!$country) {
            return array_merge($base, ['status' => 'error', 'reason' => 'Country not found: ' . $data['country_name']]);
        }

        // Resolve Sub-Company
        $subCompany = SubCompany::whereRaw('LOWER(name) = ?', [strtolower(trim($data['sub_company_name']))])
            ->where('country_id', $country->id)
            ->first();
        if (!$subCompany) {
            return array_merge($base, ['status' => 'error', 'reason' => "Sub-company '{$data['sub_company_name']}' not found under country '{$data['country_name']}'"]);
        }

        // Resolve/Create Designation
        $designation = Designation::firstOrCreate(
            ['name' => trim($data['designation_name'])],
            ['is_active' => true]
        );

        // ── Optional fields ───────────────────────────────────────────────────
        $grossSalary    = floatval($data['gross_salary']);
        if ($grossSalary <= 0) {
            return array_merge($base, ['status' => 'error', 'reason' => 'gross_salary must be a positive number']);
        }

        $gender = trim($data['gender']);
        if (!in_array($gender, ['Male', 'Female', 'Other'])) {
            return array_merge($base, ['status' => 'error', 'reason' => "Invalid gender '{$gender}'. Must be Male, Female, or Other"]);
        }

        $joiningCat = trim($data['joining_category']);
        if (!in_array($joiningCat, ['New Joinee', 'Intern', 'Permanent'])) {
            return array_merge($base, ['status' => 'error', 'reason' => "Invalid joining_category '{$joiningCat}'. Must be New Joinee, Intern, or Permanent"]);
        }

        $maritalStatus  = in_array($data['marital_status'] ?? '', ['Single', 'Married', 'Other']) ? $data['marital_status'] : null;
        $address        = trim($data['address'] ?? '') ?: null;
        $emergencyContact = preg_match('/^\d{10}$/', trim($data['emergency_contact'] ?? '')) ? trim($data['emergency_contact']) : null;
        $aadharNumber   = preg_match('/^\d{12}$/', trim($data['aadhar_number'] ?? ''))       ? trim($data['aadhar_number'])   : null;
        $panNumber      = preg_match('/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i', trim($data['pan_number'] ?? '')) ? strtoupper(trim($data['pan_number'])) : null;

        // ── Create records in a transaction ───────────────────────────────────
        DB::beginTransaction();
        try {
            // Auto-generate password
            $firstName    = explode(' ', trim($data['name']))[0] ?: 'User';
            $plainPassword = ucfirst(strtolower($firstName)) . '@HR' . random_int(100, 999);

            // Generate unique employee code
            $lastEmployee = Employee::orderByRaw('CAST(SUBSTRING(employee_code, 4) AS UNSIGNED) DESC')->first();
            if ($lastEmployee && preg_match('/EMP(\d+)/', $lastEmployee->employee_code, $matches)) {
                $nextNumber = intval($matches[1]) + 1;
            } else {
                $nextNumber = 1;
            }
            $employeeCode = 'EMP' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
            while (Employee::where('employee_code', $employeeCode)->exists()) {
                $nextNumber++;
                $employeeCode = 'EMP' . str_pad($nextNumber, 3, '0', STR_PAD_LEFT);
            }

            // Create User
            $user = User::create([
                'name'          => trim($data['name']),
                'email'         => trim($data['email']),
                'password'      => Hash::make($plainPassword),
                'temp_password' => $plainPassword,
                'role_id'       => User::ROLE_EMPLOYEE,
                'is_active'     => true,
            ]);

            // Calculate salary components
            $salaryData = ['basic' => 0, 'hra' => 0, 'da' => 0, 'allowances' => 0, 'deductions' => 0, 'gross_salary' => 0];
            if ($grossSalary > 0) {
                $basicPercent   = 70;
                $basic          = round($grossSalary * ($basicPercent / 100));
                $hra            = $grossSalary - $basic;
                $salaryData     = ['basic' => $basic, 'hra' => $hra, 'da' => 0, 'allowances' => 0, 'deductions' => 0, 'gross_salary' => $grossSalary];
            }

            // Create Employee
            $employee = Employee::create([
                'user_id'          => $user->id,
                'employee_code'    => $employeeCode,
                'department_id'    => $department->id,
                'designation_id'   => $designation->id,
                'country_id'       => $country->id,
                'sub_company_id'   => $subCompany->id,
                'date_of_joining'  => trim($data['date_of_joining']),
                'dob'              => trim($data['dob']),
                'phone'            => trim($data['phone']),
                'gender'           => $gender,
                'marital_status'   => $maritalStatus,
                'address'          => $address,
                'emergency_contact'=> $emergencyContact,
                'aadhar_number'    => $aadharNumber,
                'pan_number'       => $panNumber,
                'salary'           => $salaryData['gross_salary'],
                'joining_category' => $joiningCat,
                'payslip_access'   => false,
            ]);

            // Create Salary record
            Salary::create([
                'employee_id' => $employee->id,
                'basic'       => $salaryData['basic'],
                'hra'         => $salaryData['hra'],
                'da'          => $salaryData['da'],
                'allowances'  => $salaryData['allowances'],
                'deductions'  => $salaryData['deductions'],
                'gross_salary'=> $salaryData['gross_salary'],
            ]);

            // Create Salary History
            SalaryHistory::create([
                'employee_id' => $employee->id,
                'basic'       => $salaryData['basic'],
                'hra'         => $salaryData['hra'],
                'da'          => $salaryData['da'],
                'allowances'  => $salaryData['allowances'],
                'deductions'  => $salaryData['deductions'],
                'gross_salary'=> $salaryData['gross_salary'],
            ]);

            // Assign leave policy
            $this->leavePolicyService->assignPolicyToEmployee($employee);

            DB::commit();

            // Send welcome email (outside transaction — non-critical)
            try {
                $emailEnabled = \App\Models\Setting::where('key', 'welcome_email_active')->value('value');
                if ($emailEnabled === null || $emailEnabled === '1') {
                    \App\Http\Controllers\SettingController::applyMailConfig();
                    Mail::to($user->email)->send(new WelcomeEmployeeMail($employee->load('user', 'department', 'designation'), $plainPassword));
                }
            } catch (\Exception $e) {
                Log::error("Bulk import: failed to send welcome email to {$user->email}: " . $e->getMessage());
            }

            return array_merge($base, [
                'status'        => 'success',
                'employee_code' => $employeeCode,
                'email_sent'    => true,
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Bulk import row {$rowNumber} failed: " . $e->getMessage());
            return array_merge($base, ['status' => 'error', 'reason' => 'Server error: ' . $e->getMessage()]);
        }
    }
}
