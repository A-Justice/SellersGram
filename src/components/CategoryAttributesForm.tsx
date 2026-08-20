"use client";

import { useMemo } from "react";
import { Select } from "@/components/Select";
import {
  fieldsForCategory,
  yesNoOptions,
  type CategoryFieldDef,
} from "@/lib/category-fields";

type Props = {
  categoryId: string;
  subcategoryId: string;
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
};

export function CategoryAttributesForm({
  categoryId,
  subcategoryId,
  value,
  onChange,
}: Props) {
  const fields = useMemo(
    () => fieldsForCategory(categoryId, subcategoryId),
    [categoryId, subcategoryId],
  );

  if (!fields.length) return null;

  function setField(fieldId: string, next: string) {
    onChange({ ...value, [fieldId]: next });
  }

  return (
    <div className="space-y-4 border-t border-line pt-4">
      <div>
        <p className="text-sm font-medium">Category details</p>
        <p className="mt-1 text-xs text-muted">
          Optional — nothing here is required. Skip what does not apply.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <OptionalField
            key={field.id}
            field={field}
            value={value[field.id] || ""}
            onChange={(next) => setField(field.id, next)}
          />
        ))}
      </div>
    </div>
  );
}

function OptionalField({
  field,
  value,
  onChange,
}: {
  field: CategoryFieldDef;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-ink/90">
        {field.label}
        <span className="ml-1 font-normal text-muted">(optional)</span>
      </span>
      {field.type === "text" ? (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="field"
          placeholder={field.placeholder || "Optional"}
        />
      ) : null}
      {field.type === "select" ? (
        <Select
          value={value}
          onChange={onChange}
          placeholder="Optional"
          options={[{ value: "", label: "— Skip —" }, ...(field.options || [])]}
        />
      ) : null}
      {field.type === "yesno" ? (
        <Select
          value={value}
          onChange={onChange}
          placeholder="Optional"
          options={[{ value: "", label: "— Skip —" }, ...yesNoOptions]}
        />
      ) : null}
    </label>
  );
}
