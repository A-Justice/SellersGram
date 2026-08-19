import { listingAttributeRows } from "@/lib/category-fields";

type Props = {
  categoryId: string;
  subcategoryId: string;
  attributes?: Record<string, string> | null;
};

export function ListingAttributes({ categoryId, subcategoryId, attributes }: Props) {
  const rows = listingAttributeRows(categoryId, subcategoryId, attributes);
  if (!rows.length) return null;

  return (
    <div className="mt-3 grid gap-3 rounded-[22px] bg-canvas p-4 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.id}>
          <p className="text-xs uppercase tracking-[0.12em] text-muted">{row.label}</p>
          <p className="mt-1 text-sm font-medium">{row.value}</p>
        </div>
      ))}
    </div>
  );
}
