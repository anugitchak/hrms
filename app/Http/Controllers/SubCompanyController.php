<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\SubCompany;
use App\Models\Country;
use Illuminate\Support\Facades\Validator;

class SubCompanyController extends Controller
{
    /**
     * Display a listing of all sub-companies.
     */
    public function index()
    {
        $subCompanies = SubCompany::with('country')->get();
        return response()->json($subCompanies);
    }

    /**
     * Get active sub-companies by country (for dropdown).
     */
    public function getByCountry($countryId)
    {
        $subCompanies = SubCompany::where('country_id', $countryId)
            ->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'country_id']);
        return response()->json($subCompanies);
    }

    /**
     * Get all active sub-companies (for dropdown).
     */
    public function getActive()
    {
        $subCompanies = SubCompany::where('is_active', true)
            ->with('country:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'code', 'country_id']);
        return response()->json($subCompanies);
    }

    /**
     * Store a newly created sub-company.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:sub_companies,name',
            'code' => 'required|string|max:20|unique:sub_companies,code',
            'country_id' => 'required|exists:countries,id',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $subCompany = SubCompany::create($request->all());

        return response()->json([
            'message' => 'Sub-company created successfully',
            'sub_company' => $subCompany->load('country')
        ], 201);
    }

    /**
     * Display the specified sub-company.
     */
    public function show($id)
    {
        $subCompany = SubCompany::with('country')->findOrFail($id);
        return response()->json($subCompany);
    }

    /**
     * Update the specified sub-company.
     */
    public function update(Request $request, $id)
    {
        $subCompany = SubCompany::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:sub_companies,name,' . $id,
            'code' => 'required|string|max:20|unique:sub_companies,code,' . $id,
            'country_id' => 'required|exists:countries,id',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $subCompany->update($request->all());

        return response()->json([
            'message' => 'Sub-company updated successfully',
            'sub_company' => $subCompany->load('country')
        ]);
    }

    /**
     * Remove the specified sub-company.
     */
    public function destroy($id)
    {
        $subCompany = SubCompany::findOrFail($id);
        
        // Check if there are any employees associated
        if ($subCompany->employees()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete sub-company with associated employees'
            ], 422);
        }

        $subCompany->delete();

        return response()->json([
            'message' => 'Sub-company deleted successfully'
        ]);
    }
}
