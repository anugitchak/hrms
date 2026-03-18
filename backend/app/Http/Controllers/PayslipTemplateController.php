<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\PayslipTemplate;

class PayslipTemplateController extends Controller
{
    // ─────────────────────────────────────────────────────
    // GET ALL TEMPLATES
    // Roles 1 (SuperAdmin), 2 (Admin), 3 (HR)
    // ─────────────────────────────────────────────────────
    public function index()
    {
        if (!in_array(auth()->user()->role_id, [1, 2, 3])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $templates = PayslipTemplate::orderByDesc('id')->get([
            'id', 'name', 'slug', 'is_active', 'default_template', 'background_color', 'created_at',
        ]);

        return response()->json($templates);
    }

    // ─────────────────────────────────────────────────────
    // GET ACTIVE TEMPLATE
    // Roles 1, 2, 3
    // NOTE: This route MUST be registered BEFORE /{id}
    // ─────────────────────────────────────────────────────
    public function getActive()
    {
        if (!in_array(auth()->user()->role_id, [1, 2, 3])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $template = PayslipTemplate::where('is_active', true)->first();

        if (!$template) {
            return response()->json(['message' => 'No active template found'], 404);
        }

        return response()->json($template);
    }

    // ─────────────────────────────────────────────────────
    // GET SINGLE TEMPLATE
    // Roles 1, 2, 3
    // ─────────────────────────────────────────────────────
    public function show($id)
    {
        if (!in_array(auth()->user()->role_id, [1, 2, 3])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $template = PayslipTemplate::find($id);

        if (!$template) {
            return response()->json(['message' => 'Template not found'], 404);
        }

        return response()->json($template);
    }

    // ─────────────────────────────────────────────────────
    // CREATE TEMPLATE — SuperAdmin, Admin, HR
    // ─────────────────────────────────────────────────────
    public function store(Request $request)
    {
        if (!in_array(auth()->user()->role_id, [1, 2, 3])) {
            return response()->json(['message' => 'Unauthorized. Only SuperAdmin, Admin, and HR can create templates.'], 403);
        }

        $request->validate([
            'name'             => 'required|string|max:100',
            'design_data'      => 'nullable|array',
            'background_color' => 'nullable|string|max:32',
        ]);

        $slug = PayslipTemplate::generateSlug($request->name);

        $template = PayslipTemplate::create([
            'name'             => $request->name,
            'slug'             => $slug,
            'template_content' => $request->name, // placeholder — actual design is in design_data
            'design_data'      => $request->design_data ?? [],
            'background_color' => $request->background_color ?? '#ffffff',
            'is_active'        => false,
            'default_template' => false,
        ]);

        return response()->json([
            'message'  => 'Template created successfully',
            'template' => $template,
        ], 201);
    }

    // ─────────────────────────────────────────────────────
    // UPDATE TEMPLATE — SuperAdmin, Admin, HR
    // ─────────────────────────────────────────────────────
    public function update(Request $request, $id)
    {
        if (!in_array(auth()->user()->role_id, [1, 2, 3])) {
            return response()->json(['message' => 'Unauthorized. Only SuperAdmin, Admin, and HR can edit templates.'], 403);
        }

        $template = PayslipTemplate::find($id);

        if (!$template) {
            return response()->json(['message' => 'Template not found'], 404);
        }

        $request->validate([
            'name'             => 'sometimes|string|max:100',
            'design_data'      => 'nullable|array',
            'background_color' => 'nullable|string|max:32',
        ]);

        $updateData = [];
        if ($request->has('name')) {
            $updateData['name'] = $request->name;
            $updateData['template_content'] = $request->name;
            // Only regenerate slug if name changed
            if ($request->name !== $template->name) {
                $updateData['slug'] = PayslipTemplate::generateSlug($request->name);
            }
        }
        if ($request->has('design_data'))      $updateData['design_data']      = $request->design_data ?? [];
        if ($request->has('background_color')) $updateData['background_color'] = $request->background_color;

        $template->update($updateData);

        return response()->json([
            'message'  => 'Template updated successfully',
            'template' => $template->fresh(),
        ]);
    }

    // ─────────────────────────────────────────────────────
    // ACTIVATE TEMPLATE — SuperAdmin, Admin, HR
    // Sets exactly one template as active, deactivates all others
    // ─────────────────────────────────────────────────────
    public function activate($id)
    {
        if (!in_array(auth()->user()->role_id, [1, 2, 3])) {
            return response()->json(['message' => 'Unauthorized. Only SuperAdmin, Admin, and HR can activate templates.'], 403);
        }

        $template = PayslipTemplate::find($id);

        if (!$template) {
            return response()->json(['message' => 'Template not found'], 404);
        }

        // Deactivate all others
        PayslipTemplate::where('id', '!=', $id)->update(['is_active' => false]);

        // Activate this one
        $template->update(['is_active' => true]);

        return response()->json([
            'message'  => 'Template activated successfully',
            'template' => $template->fresh(),
        ]);
    }

    // ─────────────────────────────────────────────────────
    // DELETE TEMPLATE — SuperAdmin, Admin, HR
    // ─────────────────────────────────────────────────────
    public function destroy($id)
    {
        if (!in_array(auth()->user()->role_id, [1, 2, 3])) {
            return response()->json(['message' => 'Unauthorized. Only SuperAdmin, Admin, and HR can delete templates.'], 403);
        }

        $template = PayslipTemplate::find($id);

        if (!$template) {
            return response()->json(['message' => 'Template not found'], 404);
        }

        // Prevent deleting the only active template
        if ($template->is_active) {
            return response()->json([
                'message' => 'Cannot delete the active template. Please activate another template first.',
            ], 422);
        }

        $template->delete();

        return response()->json(['message' => 'Template deleted successfully']);
    }
}
