<?php

namespace App\Support;

use App\Models\Document;
use App\Models\DocumentFormField;
use Illuminate\Support\Collection;

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

        return $attributes;
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
                    'users'          => '/api/v1/users',
                    'roles'          => '/api/v1/roles',
                    default          => null,
                }]
                : ($f->options ?: null),
        ])->values()->all();
    }
}
