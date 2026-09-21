<?php

namespace App\Support;

use App\Models\Document;
use App\Models\DocumentFormField;
use App\Models\DocumentType;
use App\Models\Folder;
use App\Models\SystemSetting;
use App\Models\User;
use Illuminate\Support\Collection;
use Spatie\Permission\Models\Role;

/**
 * The Add New Document form is admin-configurable (Settings → Document Form).
 * Both the web controller and the public API build their validation rules and
 * their storage payload from this single source so the two never drift apart.
 */
class DocumentSchema
{
    /** @return Collection<int, DocumentFormField> */
    public static function fields(): Collection
    {
        return DocumentFormField::active()->ordered()->get();
    }

    /**
     * Validation rules keyed by field key.
     *
     * @param  Collection<int, DocumentFormField>  $fields
     */
    public static function rules(Collection $fields): array
    {
        return $fields->mapWithKeys(fn (DocumentFormField $f) => [$f->key => $f->validationRules()])->all();
    }

    /**
     * Same rules, but nothing is required — used for partial updates.
     *
     * @param  Collection<int, DocumentFormField>  $fields
     */
    public static function optionalRules(Collection $fields): array
    {
        return collect(self::rules($fields))
            ->map(fn (array $rules) => array_values(array_map(
                fn ($rule) => $rule === 'required' || $rule === 'accepted' ? 'nullable' : $rule,
                $rules,
            )))
            ->all();
    }

    /**
     * Use the admin's labels in validation messages instead of raw keys.
     *
     * @param  Collection<int, DocumentFormField>  $fields
     */
    public static function attributes(Collection $fields): array
    {
        return $fields->mapWithKeys(fn (DocumentFormField $f) => [$f->key => strtolower($f->label)])->all();
    }

    /**
     * Split submitted values into real columns and the custom_fields JSON bag.
     *
     * @param  Collection<int, DocumentFormField>  $fields
     * @param  array<string, mixed>  $input
     * @param  bool  $onlySubmitted  Skip fields absent from $input (PATCH semantics).
     */
    public static function payload(Collection $fields, array $input, ?Document $document = null, bool $onlySubmitted = false): array
    {
        $attributes = [];
        $custom     = $document?->custom_fields ?? [];

        foreach ($fields as $field) {
            if ($onlySubmitted && ! array_key_exists($field->key, $input)) {
                continue;
            }

            $value = $field->castForStorage($input[$field->key] ?? null);

            if (! $field->column_name) {
                $custom[$field->key] = $value;
                continue;
            }

            // allowed_users / allowed_roles are string columns holding JSON.
            if ($field->isMulti() && in_array($field->column_name, ['allowed_users', 'allowed_roles'], true)) {
                $attributes[$field->column_name] = $value ? json_encode($value) : null;
                continue;
            }

            $attributes[$field->column_name] = $field->isMulti() ? json_encode($value) : $value;
        }

        $attributes['custom_fields'] = $custom ?: null;

        // A document's department is the folder of its document type. When the
        // Department field is hidden from the form, or left blank, fill it from
        // the type so folder-based reports and grants still cover the document.
        if (empty($attributes['folder_id']) && array_key_exists('document_type_id', $attributes)) {
            $attributes['folder_id'] = DocumentType::find($attributes['document_type_id'])?->folder_id;
        }

        // The Label field may be hidden or left blank; documents.name is NOT NULL,
        // so an unlabelled document is named after its document class instead.
        $nameSubmitted = array_key_exists('name', $attributes);
        if (($nameSubmitted && ! $attributes['name']) || (! $nameSubmitted && ! $document)) {
            $typeId = $attributes['document_type_id'] ?? $document?->document_type_id;
            $attributes['name'] = DocumentType::find($typeId)?->name ?? 'Untitled Document';
        }

        return $attributes;
    }

    /**
     * The "Additional Information" of a document as label => display text, in
     * form order — every active field beyond the fixed ones, with choice ids
     * resolved to names and blanks left out. Used where React is not available
     * to format them (the public scan page).
     *
     * @return array<string, string>
     */
    public static function displayRows(Document $document, array $skip = ['label', 'document_type_id', 'department']): array
    {
        $rows = [];

        foreach (self::fields()->reject(fn (DocumentFormField $f) => in_array($f->key, $skip, true)) as $field) {
            $raw = $field->column_name
                ? $document->{$field->column_name}
                : ($document->custom_fields[$field->key] ?? null);

            // allowed_users / allowed_roles are string columns holding JSON.
            if ($field->isMulti() && is_string($raw)) {
                $raw = json_decode($raw, true) ?? [];
            }

            $text = self::formatValue($field, $raw);

            if ($text !== null && $text !== '') {
                $rows[$field->label] = $text;
            }
        }

        return $rows;
    }

    private static function formatValue(DocumentFormField $field, mixed $value): ?string
    {
        if ($field->type === 'checkbox') {
            return $value ? 'Yes' : 'No';
        }

        if ($value === null || $value === '' || $value === []) {
            return null;
        }

        if (in_array($field->type, DocumentFormField::CHOICE_TYPES, true)) {
            $lookup = self::choiceLabels($field);
            $values = $field->isMulti() ? (array) $value : [$value];
            $labels = array_map(fn ($v) => $lookup[(string) $v] ?? (string) $v, $values);

            return implode(', ', $labels);
        }

        if ($field->type === 'date') {
            try {
                return SystemSetting::formatDate(\Carbon\Carbon::parse($value));
            } catch (\Throwable) {
                return (string) $value;
            }
        }

        return is_scalar($value) ? (string) $value : json_encode($value);
    }

    /** @return array<string, string> option value => label */
    private static function choiceLabels(DocumentFormField $field): array
    {
        $rows = match ($field->options_source) {
            'document_types' => DocumentType::pluck('name', 'id'),
            'folders'        => Folder::pluck('name', 'id'),
            'users'          => User::pluck('name', 'id'),
            'roles'          => Role::pluck('name', 'id'),
            default          => collect($field->options ?? [])->pluck('label', 'value'),
        };

        return $rows->mapWithKeys(fn ($label, $value) => [(string) $value => (string) $label])->all();
    }

    /**
     * Machine-readable description of the form, served at GET /api/v1/form-fields
     * so integrators can discover which keys this DMS currently expects.
     *
     * @param  Collection<int, DocumentFormField>  $fields
     */
    public static function describe(Collection $fields): array
    {
        return $fields->map(fn (DocumentFormField $f) => [
            'key'         => $f->key,
            'label'       => $f->label,
            'type'        => $f->type,
            'required'    => $f->is_required,
            'help_text'   => $f->help_text,
            'multiple'    => $f->isMulti(),
            'value_type'  => match (true) {
                $f->isMulti()           => 'array',
                $f->type === 'checkbox' => 'boolean',
                $f->type === 'number'   => 'number',
                // Sourced choices are referenced by the row id.
                (bool) $f->options_source => 'integer',
                default                 => 'string',
            },
            'options'     => $f->options_source
                ? ['source' => $f->options_source, 'endpoint' => match ($f->options_source) {
                    'document_types' => '/api/v1/document-types',
                    'folders'        => '/api/v1/folders',
                    'users'          => '/api/v1/users',
                    'roles'          => '/api/v1/roles',
                    default          => null,
                }]
                : ($f->options ?: null),
        ])->values()->all();
    }
}
