"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CategoryAttributesForm } from "@/components/CategoryAttributesForm";
import { PageSkeleton } from "@/components/PageSkeleton";
import { RemoteImage } from "@/components/RemoteImage";
import { Select } from "@/components/Select";
import { useAuth } from "@/context/AuthContext";
import { CATEGORIES, SUBCATEGORIES } from "@/lib/categories";
import { cleanAttributes } from "@/lib/category-fields";
import { formatGhs } from "@/lib/format";
import {
  firstErrorKey,
  LISTING_LIMITS,
  parseListingPriceGhs,
  validateListingDetails,
  validateListingPlace,
  type ListingFieldErrors,
} from "@/lib/listing-form";
import { updateListingDetails } from "@/lib/listings-store";
import { REGIONS } from "@/lib/regions";
import { normalizeVideoUrlInput, parseVideoUrl } from "@/lib/video-url";
import { useListings } from "@/lib/use-listings";

type FieldErrors = ListingFieldErrors;
type ConditionValue = "" | "new" | "used";

function focusField(id: string) {
  const root = document.getElementById(`edit-field-${id}`);
  root?.scrollIntoView({ behavior: "smooth", block: "center" });
  const focusable = root?.querySelector<HTMLElement>(
    "input:not([type=hidden]), textarea, select, button",
  );
  window.setTimeout(() => focusable?.focus(), 250);
}

export default function EditListingPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { listings, ready } = useListings();
  const router = useRouter();

  const listing = listings.find((item) => item.id === id);
  const ownsAd =
    Boolean(user) &&
    Boolean(listing) &&
    (listing!.sellerId === user!.uid || listing!.seller.id === user!.uid);

  const [hydrated, setHydrated] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("phones");
  const [subcategoryId, setSubcategoryId] = useState("mobile-phones");
  const [condition, setCondition] = useState<ConditionValue>("");
  const [price, setPrice] = useState("");
  const [negotiable, setNegotiable] = useState(true);
  const [contactForPrice, setContactForPrice] = useState(false);
  const [regionId, setRegionId] = useState("");
  const [city, setCity] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [focusErrorId, setFocusErrorId] = useState<string | null>(null);

  const cities = useMemo(
    () => REGIONS.find((region) => region.id === regionId)?.cities || [],
    [regionId],
  );

  useEffect(() => {
    if (!listing || hydrated) return;
    setTitle(listing.title);
    setDescription(listing.description);
    setCategoryId(listing.categoryId);
    setSubcategoryId(listing.subcategoryId);
    setCondition(listing.condition === "new" || listing.condition === "used" ? listing.condition : "");
    setPrice(
      listing.contactForPrice || listing.priceGhs == null
        ? ""
        : String(listing.priceGhs),
    );
    setNegotiable(listing.negotiable);
    setContactForPrice(listing.contactForPrice);
    setRegionId(listing.regionId);
    setCity(listing.city);
    setVideoUrl(listing.videoUrl || "");
    setAttributes(listing.attributes || {});
    setHydrated(true);
  }, [listing, hydrated]);

  useEffect(() => {
    if (!focusErrorId) return;
    const timer = window.setTimeout(() => {
      focusField(focusErrorId);
      setFocusErrorId(null);
    }, 50);
    return () => window.clearTimeout(timer);
  }, [focusErrorId, fieldErrors]);

  if (authLoading || !ready) return <PageSkeleton />;

  if (!user) {
    return (
      <Gate
        title="Sign in to edit"
        copy="Sign in to update your ad."
        action="Go to sign in"
        onClick={() => router.push(`/login?next=/sell/${id}`)}
      />
    );
  }

  if (!listing) {
    return (
      <Gate
        title="Ad not found"
        copy="This ad may have been deleted."
        action="My ads"
        onClick={() => router.push("/my-ads")}
      />
    );
  }

  if (!ownsAd) {
    return (
      <Gate
        title="Not your ad"
        copy="You can only edit ads you posted."
        action="My ads"
        onClick={() => router.push("/my-ads")}
      />
    );
  }

  function validate(): FieldErrors {
    return {
      ...validateListingDetails({
        title,
        description,
        categoryId,
        subcategoryId,
        condition,
        price,
        contactForPrice,
        videoUrl,
      }),
      ...validateListingPlace({ regionId, city }),
    };
  }

  async function save() {
    const errors = validate();
    setFieldErrors(errors);
    setSaveError("");
    const first = firstErrorKey(errors);
    if (first) {
      setFocusErrorId(first);
      return;
    }

    setSaving(true);
    try {
      await updateListingDetails(listings, listing!.id, {
        title: title.trim(),
        description: description.trim(),
        priceGhs: parseListingPriceGhs(price, contactForPrice),
        negotiable,
        contactForPrice,
        categoryId,
        subcategoryId,
        condition: condition as "new" | "used",
        regionId,
        city,
        videoUrl: normalizeVideoUrlInput(videoUrl),
        attributes: cleanAttributes(attributes, categoryId, subcategoryId),
      });
      router.push("/my-ads");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  function clearError(key: string) {
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-6 lg:px-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          Edit ad
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">Update listing</h1>
        <p className="mt-2 text-sm text-muted">
          Change price, condition, and details anytime. Photos stay the same.
        </p>
      </div>

      {listing.photoUrls[0] ? (
        <div className="flex items-center gap-3 rounded-[24px] bg-paper p-3 shadow-[0_0_0_1px_var(--color-line)]">
          <span className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-line">
            <RemoteImage
              src={listing.photoUrls[0]}
              alt=""
              className="object-cover"
            />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{listing.title}</p>
            <p className="text-xs text-muted">
              {listing.contactForPrice
                ? "Contact for price"
                : formatGhs(listing.priceGhs)}{" "}
              · {listing.condition}
            </p>
          </div>
        </div>
      ) : null}

      <div className="space-y-4 rounded-[28px] bg-paper p-5 shadow-[0_0_0_1px_var(--color-line)] sm:p-7">
        <Field
          id="title"
          label="Title"
          error={fieldErrors.title}
          hint={`${title.trim().length}/${LISTING_LIMITS.titleMax}`}
        >
          <input
            value={title}
            maxLength={LISTING_LIMITS.titleMax}
            onChange={(event) => {
              setTitle(event.target.value);
              if (event.target.value.trim().length >= LISTING_LIMITS.titleMin) {
                clearError("title");
              }
            }}
            className="field"
          />
        </Field>

        <Field id="categoryId" label="Category" error={fieldErrors.categoryId}>
          <Select
            value={categoryId}
            placeholder="Choose category"
            onChange={(value) => {
              setCategoryId(value);
              setSubcategoryId("");
              setAttributes({});
              clearError("categoryId");
              clearError("subcategoryId");
            }}
            options={CATEGORIES.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
          />
        </Field>

        <Field id="subcategoryId" label="Subcategory" error={fieldErrors.subcategoryId}>
          <Select
            value={subcategoryId}
            placeholder={
              categoryId ? "Choose subcategory" : "Choose a category first"
            }
            onChange={(value) => {
              setSubcategoryId(value);
              setAttributes({});
              clearError("subcategoryId");
            }}
            options={(SUBCATEGORIES[categoryId] || []).map((item) => ({
              value: item.id,
              label: item.name,
            }))}
          />
        </Field>

        <Field id="condition" label="Condition" error={fieldErrors.condition}>
          <div className="grid grid-cols-2 gap-2">
            {(["used", "new"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setCondition(value);
                  clearError("condition");
                }}
                className={`h-11 rounded-full capitalize ${
                  condition === value ? "bg-ink text-paper" : "bg-canvas"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={contactForPrice}
            onChange={(event) => {
              setContactForPrice(event.target.checked);
              if (event.target.checked) clearError("price");
            }}
          />
          Contact for price
        </label>

        {!contactForPrice ? (
          <Field id="price" label="Price (GHS)" error={fieldErrors.price}>
            <input
              value={price}
              onChange={(event) => {
                setPrice(event.target.value);
                if (event.target.value.trim()) clearError("price");
              }}
              className="field"
              inputMode="numeric"
              placeholder="1500"
            />
          </Field>
        ) : null}

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={negotiable}
            onChange={(event) => setNegotiable(event.target.checked)}
          />
          Negotiable
        </label>

        <Field
          id="description"
          label="Description"
          error={fieldErrors.description}
          hint={`${description.trim().length}/${LISTING_LIMITS.descriptionMax}`}
        >
          <textarea
            value={description}
            maxLength={LISTING_LIMITS.descriptionMax}
            onChange={(event) => {
              setDescription(event.target.value);
              if (
                event.target.value.trim().length >= LISTING_LIMITS.descriptionMin
              ) {
                clearError("description");
              }
            }}
            className="field min-h-28"
          />
        </Field>

        <CategoryAttributesForm
          categoryId={categoryId}
          subcategoryId={subcategoryId}
          value={attributes}
          onChange={setAttributes}
        />

        <Field id="videoUrl" label="Video link (optional)" error={fieldErrors.videoUrl}>
          <input
            value={videoUrl}
            onChange={(event) => {
              setVideoUrl(event.target.value);
              clearError("videoUrl");
            }}
            className="field"
            placeholder="https://youtube.com/watch?v=…"
            inputMode="url"
          />
          {videoUrl.trim() && parseVideoUrl(videoUrl)?.kind === "youtube" ? (
            <p className="text-xs text-accent">YouTube link detected.</p>
          ) : null}
        </Field>

        <Field id="regionId" label="Region" error={fieldErrors.regionId}>
          <Select
            value={regionId}
            onChange={(value) => {
              setRegionId(value);
              setCity("");
              clearError("regionId");
              clearError("city");
            }}
            options={REGIONS.map((region) => ({
              value: region.id,
              label: region.name,
            }))}
            placeholder="Choose region"
          />
        </Field>

        <Field id="city" label="City" error={fieldErrors.city}>
          <Select
            value={city}
            onChange={(value) => {
              setCity(value);
              clearError("city");
            }}
            options={cities.map((item) => ({ value: item, label: item }))}
            placeholder={regionId ? "Choose city" : "Choose a region first"}
          />
        </Field>
      </div>

      {saveError ? <p className="text-sm text-red-700">{saveError}</p> : null}

      <div className="flex gap-2 pb-8">
        <Link
          href="/my-ads"
          className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-paper text-sm font-medium shadow-[0_0_0_1px_var(--color-line)]"
        >
          Cancel
        </Link>
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="h-12 flex-1 rounded-full bg-ink text-sm font-medium text-paper disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div id={`edit-field-${id}`} className="block space-y-2">
      <label className="block space-y-2">
        <span className="flex items-baseline justify-between gap-3 text-sm font-medium">
          <span>{label}</span>
          {hint && !error ? (
            <span className="font-normal text-muted">{hint}</span>
          ) : null}
        </span>
        {children}
      </label>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

function Gate({
  title,
  copy,
  action,
  onClick,
}: {
  title: string;
  copy: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="font-display text-4xl">{title}</h1>
      <p className="mt-3 text-sm text-muted">{copy}</p>
      <button
        type="button"
        onClick={onClick}
        className="mt-6 h-12 rounded-full bg-ink px-6 text-paper"
      >
        {action}
      </button>
    </div>
  );
}
