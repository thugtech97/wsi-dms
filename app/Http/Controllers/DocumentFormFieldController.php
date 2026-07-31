<?php

namespace App\Http\Controllers;

use App\Models\DocumentFormField;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class DocumentFormFieldController extends Controller
{
    private function authorizeAdmin(): void
    {
        abort_if(! auth()->user()->hasRole('admin'), 403);
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin();

        $data = $this->validatePayload($request);

        $data['key']        = $this->uniqueKey($data['label']);
        $data['sort_order'] = (int) DocumentFormField::max('sort_order') + 1;
        $data['is_system']  = false;
        $data['is_locked']  = false;

        $field = DocumentFormField::create($data);

        // Dropped between existing fields rather than appended to the end.
        if ($request->filled('position')) {
            $this->moveTo($field, (int) $request->input('position'));
        }

        return back()->with('success', 'Field added to the document form.');
    }

    public function update(Request $request, DocumentFormField $documentFormField)
    {
        $this->authorizeAdmin();

        $data = $this->validatePayload($request, $documentFormField);

        // System fields keep their key, type and column mapping.
        if ($documentFormField->is_system) {
            unset($data['type'], $data['options'], $data['options_source']);
        }

        // Locked fields must stay on the form and stay required.
        if ($documentFormField->is_locked) {
            $data['is_active']   = true;
            $data['is_required'] = true;
        }

        $documentFormField->update($data);

        return back()->with('success', 'Field updated.');
    }

    public function destroy(DocumentFormField $documentFormField)
    {
        $this->authorizeAdmin();

        abort_if($documentFormField->is_system, 403, 'Built-in fields cannot be deleted — deactivate them instead.');

        $documentFormField->delete();

        return back()->with('success', 'Field removed from the document form.');
    }

    /**
     * Persist the drag-and-drop ordering.
     */
    public function reorder(Request $request)
    {
        $this->authorizeAdmin();

        $request->validate([
            'order'   => 'required|array',
            'order.*' => 'integer|exists:document_form_fields,id',
        ]);

        foreach ($request->input('order') as $index => $id) {
            DocumentFormField::whereKey($id)->update(['sort_order' => $index + 1]);
        }

        return back()->with('success', 'Field order saved.');
    }

    /**
     * Toggle a field on/off the form without opening the editor.
     */
    public function toggle(DocumentFormField $documentFormField)
    {
        $this->authorizeAdmin();

        abort_if($documentFormField->is_locked, 403, 'This field is required by the system and cannot be hidden.');

        $documentFormField->update(['is_active' => ! $documentFormField->is_active]);

        return back();
    }

    private function validatePayload(Request $request, ?DocumentFormField $field = null): array
    {
        $rules = [
            'label'       => 'required|string|max:100',
            'type'        => ['required', Rule::in(array_keys(DocumentFormField::TYPES))],
            'placeholder' => 'nullable|string|max:255',
            'help_text'   => 'nullable|string|max:255',
            'is_required' => 'boolean',
            'is_active'   => 'boolean',
            'position'    => 'nullable|integer|min:0',
        ];

        // A choice list is only relevant when the type needs one and the choices
        // aren't already sourced from another table (users, roles, document types).
        $needsChoices = in_array($request->input('type'), DocumentFormField::CHOICE_TYPES, true)
            && ! $field?->options_source;

        if ($needsChoices) {
            $rules['options']         = 'required|array|min:1';
            $rules['options.*.label'] = 'required|string|max:100';
            $rules['options.*.value'] = 'nullable|string|max:100';
        }

        $validated = $request->validate($rules, [
            'options.required'       => 'Add at least one choice for this field type.',
            'options.min'            => 'Add at least one choice for this field type.',
            'options.*.label.required' => 'Every choice needs a label.',
        ]);

        if ($needsChoices) {
            $options = collect($validated['options'])
                ->map(fn ($o) => [
                    'label' => trim($o['label']),
                    'value' => trim($o['value'] ?? '') ?: Str::slug($o['label'], '_'),
                ])
                ->unique('value')
                ->values()
                ->all();

            if (count($options) < 1) {
                throw ValidationException::withMessages([
                    'options' => 'Add at least one choice for this field type.',
                ]);
            }

            $validated['options'] = $options;
        } else {
            $validated['options'] = null;
        }

        $validated['is_required'] = $request->boolean('is_required');
        $validated['is_active']   = $request->boolean('is_active');

        // Drop position is handled separately, not stored on the model.
        unset($validated['position']);

        return $validated;
    }

    /**
     * Slot a field into a given index in the form order and renumber the rest.
     */
    private function moveTo(DocumentFormField $field, int $position): void
    {
        $ids = DocumentFormField::ordered()->pluck('id')->all();
        $ids = array_values(array_filter($ids, fn ($id) => $id !== $field->id));

        $position = max(0, min($position, count($ids)));
        array_splice($ids, $position, 0, [$field->id]);

        foreach ($ids as $index => $id) {
            DocumentFormField::whereKey($id)->update(['sort_order' => $index + 1]);
        }
    }

    private function uniqueKey(string $label): string
    {
        $base = Str::slug($label, '_') ?: 'field';
        $key  = $base;
        $i    = 2;

        while (DocumentFormField::where('key', $key)->exists()) {
            $key = "{$base}_{$i}";
            $i++;
        }

        return $key;
    }
}
