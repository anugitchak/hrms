<?php

namespace App\Http\Controllers;

use App\Models\EmployeeDocument;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class EmployeeDocumentController extends Controller
{
    /**
     * Display a listing of the documents.
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = EmployeeDocument::with([
            'employee.user:id,name,email',
            'uploader:id,name,role_id' // Eager load uploader
        ]);

        if ($user->isEmployee()) {
            // Employee: View own only
            if (!$user->employee) {
                return response()->json(['message' => 'Employee profile not found.'], 404);
            }
            $query->where('employee_id', $user->employee->id);
        } else {
            // Admin/HR/SuperAdmin
            // Filter by employee if provided
            if ($request->has('employee_id')) {
                $query->where('employee_id', $request->employee_id);
            }

            // Filter by document type if provided
            if ($request->has('document_type')) {
                $query->where('document_type', $request->document_type);
            }
        }

        return response()->json($query->orderByDesc('created_at')->get());
    }

    /**
     * Store a newly created document.
     */
    public function store(Request $request)
    {
        $user = auth()->user();

        if (!$user->isEmployee() && !$user->isSuperAdmin() && !$user->can_manage_documents) {
            return response()->json(['message' => 'Unauthorized to upload documents'], 403);
        }

        $request->validate([
            'document_type' => 'required|string|max:255',
            'document_title' => 'required|string|max:255',
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:2048', // 2MB Max
            // Admin/HR must provide employee_id, Employee uses own
            'employee_id' => (!$user->isEmployee()) ? 'required|exists:employees,id' : 'nullable',
        ]);

        $employeeId = null;

        if ($user->isEmployee()) {
            $employeeId = $user->employee->id;

            // Optional: Check if employee is allowed to upload this type? 
            // For now, allow all based on requirements.
        } else {
            // Admin/HR
            $employeeId = $request->employee_id;
        }

        if (!$employeeId) {
            return response()->json(['message' => 'Employee identifier missing.'], 400);
        }

        // Handle File Upload
        $file = $request->file('file');
        $base64 = 'data:' . $file->getMimeType() . ';base64,' . base64_encode(file_get_contents($file->getPathname()));
        $size = $file->getSize(); // in bytes
        $sizeKb = round($size / 1024);

        $document = EmployeeDocument::create([
            'employee_id' => $employeeId,
            'document_type' => $request->document_type,
            'document_title' => $request->document_title,
            'file_path' => $base64,
            'file_size' => $sizeKb,
            'uploaded_by' => $user->id,
        ]);

        return response()->json([
            'message' => 'Document uploaded successfully',
            'document' => $document
        ], 201);
    }

    /**
     * Remove the specified document.
     */
    public function destroy($id)
    {
        $user = auth()->user();

        if ($user->isEmployee()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!$user->isSuperAdmin() && !$user->can_manage_documents) {
            return response()->json(['message' => 'Unauthorized to delete documents'], 403);
        }

        $document = EmployeeDocument::findOrFail($id);

        // File is stored as base64 in DB, no local file to delete

        $document->delete();

        return response()->json(['message' => 'Document deleted successfully']);
    }

    /**
     * Download the specified document.
     */
    public function download($id)
    {
        $user = auth()->user();
        $document = EmployeeDocument::findOrFail($id);

        // Authorization Check
        if ($user->isEmployee()) {
            // Employee can only download own
            if ($document->employee_id != $user->employee->id) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }
        // Admin/HR can download any

        $fileData = $document->file_path; // This is the base64 data URI

        if (!$fileData || !str_starts_with($fileData, 'data:')) {
            return response()->json(['message' => 'Invalid file format or file not found'], 404);
        }

        // Parse base64
        // Example: data:image/png;base64,iVBORw0KGgo==
        list($type, $data) = explode(';', $fileData);
        list(, $data) = explode(',', $data);
        $fileContent = base64_decode($data);

        // Get mime type for extension
        $mime_type = str_replace('data:', '', $type);
        $extensions = [
            'image/jpeg' => 'jpg',
            'image/jpg' => 'jpg',
            'image/png' => 'png',
            'application/pdf' => 'pdf',
            'application/msword' => 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx'
        ];
        $ext = $extensions[$mime_type] ?? 'bin';

        return response($fileContent)
            ->header('Content-Type', $mime_type)
            ->header('Content-Disposition', 'attachment; filename="' . str_replace(' ', '_', $document->document_title) . '.' . $ext . '"');
    }
}
