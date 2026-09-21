<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use OwenIt\Auditing\Contracts\Auditable;

class DocumentFormField extends Model implements Auditable
{
    use \OwenIt\Auditing\Auditable;

    protected $table = 'document_form_fields';

    protected $fillable = [
        'key',
        'label',
        'type',
        'placeholder',
        'help_text',
        'options',
        'options_source',
        'column_name',
        'is_required',
        'is_active',
        'is_system',
        'is_locked',
        'sort_order',
    ];

    protected $casts = [
        'options'     => 'array',
        'is_required' => 'boolean',
        'is_active'   => 'boolean',
        'is_system'   => 'boolean',
        'is_locked'   => 'boolean',
        'sort_order'  => 'integer',
    ];

    /**
     * Field types an admin may pick from in Settings → Document Form.
     */
    public const TYPES = [
        'text'        => 'Text',
        'textarea'    => 'Text Area',
        'number'      => 'Number',
        'date'        => 'Date',
        'email'       => 'Email',
        'url'         => 'Link / URL',
        'select'      => 'Dropdown',
        'radio'       => 'Radio Buttons',
        'multiselect' => 'Checkbox List (multiple)',
        'checkbox'    => 'Yes / No Toggle',
    ];

    /** Types whose value is a list. */
    public const MULTI_TYPES = ['multiselect'];

    /** Types that need a list of choices. */
    public const CHOICE_TYPES = ['select', 'radio', 'multiselect'];

    public function scopeActive(Builder $q): Builder
    {
        return $q->where('is_active', true);
    }

    public function scopeOrdered(Builder $q): Builder
    {
        return $q->orderBy('sort_order')->orderBy('id');
    }

    public function isMulti(): bool
    {
        return in_array($this->type, self::MULTI_TYPES, true);
    }

    public function needsChoices(): bool
    {
        return in_array($this->type, self::CHOICE_TYPES, true) && ! $this->options_source;
    }

    /**
     * Validation rules for this field as it appears on the document form.
     */
    public function validationRules(): array
    {
        $rules = [$this->is_required ? 'required' : 'nullable'];

        // Fields backed by a real column are limited by that column's varchar(255).
        $maxLength = fn (int $free) => $this->column_name ? 255 : $free;

        switch ($this->type) {
            case 'text':
                $rules[] = 'string';
                $rules[] = 'max:255';
                break;
            case 'textarea':
                $rules[] = 'string';
                $rules[] = 'max:' . $maxLength(2000);
                break;
            case 'number':
                $rules[] = 'numeric';
                break;
            case 'date':
                $rules[] = 'date';
                break;
            case 'email':
                $rules[] = 'email';
                $rules[] = 'max:255';
                break;
            case 'url':
                $rules[] = 'string';
                $rules[] = 'max:' . $maxLength(2048);
                break;
            case 'checkbox':
                $rules = [$this->is_required ? 'accepted' : 'nullable', 'boolean'];
                break;
            case 'multiselect':
                $rules[] = 'array';
                break;
            case 'select':
            case 'radio':
                $rules[] = 'string';
                break;
        }

        // Keys that point at a real relation still get their integrity check.
        if ($this->key === 'document_type_id') {
            $rules = [$this->is_required ? 'required' : 'nullable', 'exists:document_types,id'];
        }

        if ($this->options_source === 'folders') {
            $rules = [$this->is_required ? 'required' : 'nullable', 'exists:folders,id'];
        }

        // Static choice fields must receive one of their own options.
        if (in_array($this->type, ['select', 'radio'], true) && $this->needsChoices()) {
            $values = collect($this->options ?? [])->pluck('value')->filter()->values()->all();
            if ($values) {
                $rules[] = 'in:' . implode(',', $values);
            }
        }

        return $rules;
    }

    /**
     * Normalise a submitted value for storage.
     */
    public function castForStorage(mixed $value): mixed
    {
        if ($this->isMulti()) {
            return array_values(array_filter((array) ($value ?? []), fn ($v) => $v !== null && $v !== ''));
        }

        if ($this->type === 'checkbox') {
            return (bool) $value;
        }

        return $value === '' ? null : $value;
    }

    /**
     * Shape sent to the front-end form renderer.
     */
    public function toFormArray(): array
    {
        return [
            'id'             => $this->id,
            'key'            => $this->key,
            'label'          => $this->label,
            'type'           => $this->type,
            'placeholder'    => $this->placeholder,
            'help_text'      => $this->help_text,
            'options'        => $this->options ?? [],
            'options_source' => $this->options_source,
            'column_name'    => $this->column_name,
            'is_required'    => $this->is_required,
            'is_active'      => $this->is_active,
            'is_system'      => $this->is_system,
            'is_locked'      => $this->is_locked,
            'sort_order'     => $this->sort_order,
        ];
    }

    /**
     * Empty form value for this field type.
     */
    public function emptyValue(): mixed
    {
        return match (true) {
            $this->isMulti()          => [],
            $this->type === 'checkbox' => false,
            default                    => '',
        };
    }
}
