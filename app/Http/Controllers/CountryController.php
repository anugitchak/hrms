<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Country;
use Illuminate\Support\Facades\Validator;

class CountryController extends Controller
{
    /**
     * Display a listing of all countries.
     */
    public function index()
    {
        $countries = Country::with('subCompanies')->get();
        return response()->json($countries);
    }

    /**
     * Get all active countries (for dropdown).
     */
    public function getActive()
    {
        $countries = Country::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'code']);
        return response()->json($countries);
    }

    /**
     * Store a newly created country.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:countries,name',
            'code' => 'required|string|max:10|unique:countries,code',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $country = Country::create($request->all());

        return response()->json([
            'message' => 'Country created successfully',
            'country' => $country
        ], 201);
    }

    /**
     * Display the specified country.
     */
    public function show($id)
    {
        $country = Country::with('subCompanies')->findOrFail($id);
        return response()->json($country);
    }

    /**
     * Update the specified country.
     */
    public function update(Request $request, $id)
    {
        $country = Country::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:countries,name,' . $id,
            'code' => 'required|string|max:10|unique:countries,code,' . $id,
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $country->update($request->all());

        return response()->json([
            'message' => 'Country updated successfully',
            'country' => $country
        ]);
    }

    /**
     * Remove the specified country.
     */
    public function destroy($id)
    {
        $country = Country::findOrFail($id);
        
        // Check if there are any sub-companies associated
        if ($country->subCompanies()->count() > 0) {
            return response()->json([
                'message' => 'Cannot delete country with associated sub-companies'
            ], 422);
        }

        $country->delete();

        return response()->json([
            'message' => 'Country deleted successfully'
        ]);
    }
}
