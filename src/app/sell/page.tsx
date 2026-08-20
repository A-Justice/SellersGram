"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CategoryAttributesForm } from "@/components/CategoryAttributesForm";
import { PhotoPicker, uploadListingPhotos } from "@/components/PhotoPicker";
import { PageSkeleton } from "@/components/PageSkeleton";
import { Select } from "@/components/Select";
import { useAuth } from "@/context/AuthContext";
import { CATEGORIES, SUBCATEGORIES } from "@/lib/categories";
import { cleanAttributes } from "@/lib/category-fields";
import { createListing } from "@/lib/listings-store";
import { formatPhoneDisplay } from "@/lib/phone";
import { REGIONS } from "@/lib/regions";
import { normalizeVideoUrlInput, parseVideoUrl } from "@/lib/video-url";

const STEPS = ["Photos", "Details", "Place", "Contact"];
const SELL_DRAFT_KEY = "vg-sell-draft";

type SellDraft = {
  step: number;
  title: string;
  description: string;
  categoryId: string;
  subcategoryId: string;
  condition: "new" | "used";
  price: string;
  negotiable: boolean;
  contactForPrice: boolean;
  regionId: string;
  city: string;
  videoUrl: string;
  attributes: Record<string, string>;
};

type FieldErrors = Partial<Record<string, string>>;

function readDraft(): SellDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SELL_DRAFT_KEY);
    return raw ? (JSON.parse(raw) as SellDraft) : null;
  } catch {
    return null;
  }
}

function writeDraft(draft: SellDraft) {
  try {
    sessionStorage.setItem(SELL_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // ignore quota / private mode
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(SELL_DRAFT_KEY);
  } catch {
    // ignore
  }
}

function focusField(id: string) {
  const root = document.getElementById(`sell-field-${id}`);
  root?.scrollIntoView({ behavior: "smooth", block: "center" });
  const focusable = root?.querySelector<HTMLElement>(
    "input:not([type=hidden]), textarea, select, button",
  );
  window.setTimeout(() => focusable?.focus(), 250);
}

export default function SellPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const draft = useMemo(() => readDraft(), []);
  const [step, setStep] = useState(draft?.step ?? 0);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [title, setTitle] = useState(draft?.title ?? "");
  const [description, setDescription] = useState(draft?.description ?? "");
  const [categoryId, setCategoryId] = useState(draft?.categoryId ?? "phones");
  const [subcategoryId, setSubcategoryId] = useState(
    draft?.subcategoryId ?? "mobile-phones",
  );
  const [condition, setCondition] = useState<"new" | "used">(draft?.condition ?? "used");
  const [price, setPrice] = useState(draft?.price ?? "");
  const [negotiable, setNegotiable] = useState(draft?.negotiable ?? true);
  const [contactForPrice, setContactForPrice] = useState(draft?.contactForPrice ?? false);
  const [regionId, setRegionId] = useState(draft?.regionId ?? "greater-accra");
  const [city, setCity] = useState(draft?.city ?? "Accra");
  const [videoUrl, setVideoUrl] = useState(draft?.videoUrl ?? "");
  const [attributes, setAttributes] = useState<Record<string, string>>(
    draft?.attributes ?? {},
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitPhase, setSubmitPhase] = useState<"idle" | "uploading" | "saving">("idle");
  const [submitError, setSubmitError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [postedId, setPostedId] = useState<string | null>(null);

  const profilePhone = (user?.phone || "").trim();
  const hasProfilePhone = Boolean(profilePhone);

  const cities = useMemo(
    () => REGIONS.find((region) => region.id === regionId)?.cities || [],
    [regionId],
  );

  useEffect(() => {
    writeDraft({
      step,
      title,
      description,
      categoryId,
      subcategoryId,
      condition,
      price,
      negotiable,
      contactForPrice,
      regionId,
      city,
      videoUrl,
      attributes,
    });
  }, [
    step,
    title,
    description,
    categoryId,
    subcategoryId,
    condition,
    price,
    negotiable,
    contactForPrice,
    regionId,
    city,
    videoUrl,
    attributes,
  ]);

  if (loading) return <PageSkeleton />;

  if (!user) {
    return (
      <div className="h-full overflow-y-auto px-4 py-6 lg:px-6">
        <Gate
          title="Sign in to sell"
          copy="Sign in to post an ad."
          action="Go to sign in"
          onClick={() => router.push("/login?next=/sell")}
        />
      </div>
    );
  }

  function validateStep(current: number): FieldErrors {
    const errors: FieldErrors = {};

    if (current === 0) {
      if (photoFiles.length === 0) {
        errors.photos = "Add at least one photo.";
      }
    }

    if (current === 1) {
      if (!title.trim()) errors.title = "Enter a title.";
      if (!categoryId) errors.categoryId = "Choose a category.";
      if (!subcategoryId) errors.subcategoryId = "Choose a subcategory.";
      if (!condition) errors.condition = "Choose condition.";
      if (!contactForPrice) {
        const amount = Number(price);
        if (!price.trim()) errors.price = "Enter a price, or choose contact for price.";
        else if (!Number.isFinite(amount) || amount <= 0) {
          errors.price = "Enter a valid price.";
        }
      }
      if (!description.trim()) errors.description = "Add a short description.";
      if (videoUrl.trim() && !normalizeVideoUrlInput(videoUrl)) {
        errors.videoUrl = "Enter a valid YouTube or video link.";
      }
    }

    if (current === 2) {
      if (!regionId) errors.regionId = "Choose a region.";
      if (!city.trim()) errors.city = "Choose a city.";
    }

    if (current === 3) {
      if (!hasProfilePhone) {
        errors.phone = "Add a phone number on your profile before submitting.";
      }
    }

    return errors;
  }

  function goNext() {
    const errors = validateStep(step);
    setFieldErrors(errors);
    setSubmitError("");

    const first = Object.keys(errors)[0];
    if (first) {
      focusField(first);
      return;
    }

    if (step < 3) {
      setFieldErrors({});
      setStep(step + 1);
      return;
    }
    void submit();
  }

  function goBack() {
    setFieldErrors({});
    setSubmitError("");
    if (step > 0) setStep(step - 1);
  }

  async function submit() {
    const photoCheck = validateStep(0);
    if (Object.keys(photoCheck).length) {
      setStep(0);
      setFieldErrors(photoCheck);
      focusField("photos");
      return;
    }
    const detailsCheck = validateStep(1);
    if (Object.keys(detailsCheck).length) {
      setStep(1);
      setFieldErrors(detailsCheck);
      focusField(Object.keys(detailsCheck)[0]);
      return;
    }
    const placeCheck = validateStep(2);
    if (Object.keys(placeCheck).length) {
      setStep(2);
      setFieldErrors(placeCheck);
      focusField(Object.keys(placeCheck)[0]);
      return;
    }
    const contactCheck = validateStep(3);
    if (Object.keys(contactCheck).length) {
      setStep(3);
      setFieldErrors(contactCheck);
      focusField("phone");
      return;
    }

    setSubmitting(true);
    setSubmitPhase("uploading");
    setSubmitError("");
    try {
      const photoUrls = await uploadListingPhotos(photoFiles);
      setSubmitPhase("saving");
      const listing = await createListing({
        title: title.trim(),
        description: description.trim(),
        priceGhs: contactForPrice ? null : Number(price) || 0,
        negotiable,
        contactForPrice,
        categoryId,
        subcategoryId,
        condition,
        regionId,
        city,
        photoUrls,
        videoUrl: normalizeVideoUrlInput(videoUrl),
        attributes: cleanAttributes(attributes, categoryId, subcategoryId),
        sellerId: user!.uid,
        seller: {
          id: user!.uid,
          name: user!.name,
          phone: profilePhone,
          joinedYear: new Date().getFullYear(),
          rating: 5,
          reviewCount: 0,
          verified: false,
          city,
        },
      });
      clearDraft();
      setPostedId(listing.id);
      setPhotoFiles([]);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not submit ad.");
    } finally {
      setSubmitting(false);
      setSubmitPhase("idle");
    }
  }

  function startAnother() {
    setPostedId(null);
    setStep(0);
    setPhotoFiles([]);
    setTitle("");
    setDescription("");
    setCategoryId("phones");
    setSubcategoryId("mobile-phones");
    setCondition("used");
    setPrice("");
    setNegotiable(true);
    setContactForPrice(false);
    setRegionId("greater-accra");
    setCity("Accra");
    setVideoUrl("");
    setAttributes({});
    setFieldErrors({});
    setSubmitError("");
    clearDraft();
  }

  if (postedId) {
    return (
      <div className="mx-auto flex h-full max-w-xl flex-col justify-center px-4 py-10 lg:px-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
          Ad submitted
        </p>
        <h1 className="mt-2 font-display text-4xl tracking-tight">Sent for review</h1>
        <p className="mt-3 text-sm text-muted">
          Thanks — your ad is with our team. You’ll see it live after it’s approved.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={startAnother}
            className="h-12 flex-1 rounded-full bg-ink text-sm font-medium text-paper"
          >
            Post another ad
          </button>
          <Link
            href={`/my-ads?posted=${postedId}`}
            className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-paper text-sm font-medium shadow-[0_0_0_1px_var(--color-line)]"
          >
            View my ads
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto py-4 lg:py-6">
        <div className="mx-auto max-w-xl space-y-6 px-4 lg:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
            New ad
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-tight">Sell something</h1>
          <p className="mt-2 text-sm text-muted">
            Four short steps. Your ad goes to review, then live.
          </p>
        </div>

        <ol className="grid grid-cols-4 gap-2 text-xs font-medium">
          {STEPS.map((label, index) => (
            <li
              key={label}
              className={`rounded-full px-2 py-2 text-center ${
                index === step
                  ? "bg-ink text-paper"
                  : index < step
                    ? "bg-accent text-paper"
                    : "bg-paper text-muted"
              }`}
            >
              {label}
            </li>
          ))}
        </ol>

        <div className="space-y-4 rounded-[28px] bg-paper p-5 shadow-[0_0_0_1px_var(--color-line)] sm:p-7">
          {step === 0 && (
            <div id="sell-field-photos" className="space-y-2">
              <p className="text-sm font-medium">Photos</p>
              <PhotoPicker
                files={photoFiles}
                onChange={(files) => {
                  setPhotoFiles(files);
                  if (files.length) {
                    setFieldErrors((current) => {
                      if (!current.photos) return current;
                      const next = { ...current };
                      delete next.photos;
                      return next;
                    });
                  }
                }}
              />
              {fieldErrors.photos ? (
                <p className="text-xs text-red-700">{fieldErrors.photos}</p>
              ) : null}
            </div>
          )}

          {step === 1 && (
            <>
              <Field
                id="title"
                label="Title"
                error={fieldErrors.title}
              >
                <input
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    if (event.target.value.trim()) {
                      setFieldErrors((current) => {
                        if (!current.title) return current;
                        const next = { ...current };
                        delete next.title;
                        return next;
                      });
                    }
                  }}
                  className="field"
                  placeholder="iPhone 13, 128GB, blue"
                />
              </Field>
              <Field id="categoryId" label="Category" error={fieldErrors.categoryId}>
                <Select
                  value={categoryId}
                  onChange={(value) => {
                    setCategoryId(value);
                    setSubcategoryId(SUBCATEGORIES[value][0].id);
                    setAttributes({});
                  }}
                  options={CATEGORIES.map((category) => ({
                    value: category.id,
                    label: category.name,
                  }))}
                />
              </Field>
              <Field
                id="subcategoryId"
                label="Subcategory"
                error={fieldErrors.subcategoryId}
              >
                <Select
                  value={subcategoryId}
                  onChange={(value) => {
                    setSubcategoryId(value);
                    setAttributes({});
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
                      onClick={() => setCondition(value)}
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
                    if (event.target.checked) {
                      setFieldErrors((current) => {
                        if (!current.price) return current;
                        const next = { ...current };
                        delete next.price;
                        return next;
                      });
                    }
                  }}
                />
                Contact for price
              </label>
              {!contactForPrice && (
                <Field id="price" label="Price (GHS)" error={fieldErrors.price}>
                  <input
                    value={price}
                    onChange={(event) => {
                      setPrice(event.target.value);
                      if (event.target.value.trim()) {
                        setFieldErrors((current) => {
                          if (!current.price) return current;
                          const next = { ...current };
                          delete next.price;
                          return next;
                        });
                      }
                    }}
                    className="field"
                    inputMode="numeric"
                    placeholder="1500"
                  />
                </Field>
              )}
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
              >
                <textarea
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value);
                    if (event.target.value.trim()) {
                      setFieldErrors((current) => {
                        if (!current.description) return current;
                        const next = { ...current };
                        delete next.description;
                        return next;
                      });
                    }
                  }}
                  className="field min-h-28"
                  placeholder="Condition, extras, where to meet."
                />
              </Field>
              <CategoryAttributesForm
                categoryId={categoryId}
                subcategoryId={subcategoryId}
                value={attributes}
                onChange={setAttributes}
              />
              <Field
                id="videoUrl"
                label="Video link (optional)"
                error={fieldErrors.videoUrl}
              >
                <input
                  value={videoUrl}
                  onChange={(event) => {
                    setVideoUrl(event.target.value);
                    setFieldErrors((current) => {
                      if (!current.videoUrl) return current;
                      const next = { ...current };
                      delete next.videoUrl;
                      return next;
                    });
                  }}
                  className="field"
                  placeholder="https://youtube.com/watch?v=… or any video link"
                  inputMode="url"
                />
                {!fieldErrors.videoUrl ? (
                  <p className="hint">
                    Paste a YouTube link or any public video URL. No file upload.
                  </p>
                ) : null}
                {videoUrl.trim() && parseVideoUrl(videoUrl)?.kind === "youtube" ? (
                  <p className="text-xs text-accent">
                    YouTube link detected — will embed on your ad.
                  </p>
                ) : null}
              </Field>
            </>
          )}

          {step === 2 && (
            <>
              <Field id="regionId" label="Region" error={fieldErrors.regionId}>
                <Select
                  value={regionId}
                  onChange={(value) => {
                    setRegionId(value);
                    const nextRegion = REGIONS.find((item) => item.id === value);
                    setCity(nextRegion?.cities[0] || "");
                  }}
                  options={REGIONS.map((region) => ({
                    value: region.id,
                    label: region.name,
                  }))}
                />
              </Field>
              <Field id="city" label="City" error={fieldErrors.city}>
                <Select
                  value={city}
                  onChange={setCity}
                  options={cities.map((item) => ({ value: item, label: item }))}
                />
              </Field>
            </>
          )}

          {step === 3 && (
            <div id="sell-field-phone" className="space-y-3">
              <p className="text-sm font-medium">Contact phone</p>
              {hasProfilePhone ? (
                <>
                  <p className="rounded-[20px] bg-canvas px-4 py-3 text-sm">
                    Buyers will call{" "}
                    <span className="font-medium">
                      {formatPhoneDisplay(profilePhone)}
                    </span>{" "}
                    from your profile.
                  </p>
                  <p className="text-sm text-muted">
                    Need a different number?{" "}
                    <Link href="/account?next=/sell" className="font-medium text-accent">
                      Update it on your profile
                    </Link>
                    .
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-muted">
                    Add a phone number on your profile so buyers can reach you. We
                    use that number on every ad — you don’t enter it here each time.
                  </p>
                  <Link
                    href="/account?next=/sell"
                    className="inline-flex h-12 w-full items-center justify-center rounded-full bg-ink text-sm font-medium text-paper"
                  >
                    Add phone on profile
                  </Link>
                  <p className="hint">
                    After you save your number, come back here to submit the ad.
                  </p>
                </>
              )}
              {fieldErrors.phone ? (
                <p className="text-xs text-red-700">{fieldErrors.phone}</p>
              ) : null}
            </div>
          )}
        </div>
        </div>
      </div>

      <div className="shrink-0 border-t border-line bg-canvas py-3">
        <div className="mx-auto max-w-xl px-4 lg:px-6">
          {submitError ? (
            <p className="mb-2 text-sm text-red-700">{submitError}</p>
          ) : null}
          <div className="flex gap-2">
            {step > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="h-12 flex-1 rounded-full bg-paper shadow-[0_0_0_1px_var(--color-line)]"
              >
                Back
              </button>
            ) : null}
            <button
              type="button"
              onClick={goNext}
              disabled={submitting}
              className="h-12 flex-1 rounded-full bg-ink text-paper disabled:opacity-40"
            >
            {step === 3
              ? submitting
                ? submitPhase === "uploading"
                  ? "Uploading photos…"
                  : "Saving ad…"
                : "Submit for review"
              : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id?: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id ? `sell-field-${id}` : undefined} className="block space-y-2">
      <label className="block space-y-2">
        <span className="text-sm font-medium">{label}</span>
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
    <div className="mx-auto max-w-md py-16 text-center">
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
