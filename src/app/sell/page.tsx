"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PhotoPicker } from "@/components/PhotoPicker";
import { useAuth } from "@/context/AuthContext";
import { CATEGORIES, SUBCATEGORIES } from "@/lib/categories";
import { createListing } from "@/lib/listings-store";
import { REGIONS } from "@/lib/regions";

const STEPS = ["Photos", "Details", "Place", "Contact"];

export default function SellPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("phones");
  const [subcategoryId, setSubcategoryId] = useState("mobile-phones");
  const [condition, setCondition] = useState<"new" | "used">("used");
  const [price, setPrice] = useState("");
  const [negotiable, setNegotiable] = useState(true);
  const [contactForPrice, setContactForPrice] = useState(false);
  const [regionId, setRegionId] = useState("greater-accra");
  const [city, setCity] = useState("Accra");
  const [phone, setPhone] = useState(user?.phone || "");

  const cities = useMemo(
    () => REGIONS.find((region) => region.id === regionId)?.cities || [],
    [regionId],
  );

  if (!user) {
    return (
      <Gate
        title="Sign in to sell"
        copy="Sign in to post an ad."
        action="Go to sign in"
        onClick={() => router.push("/login?next=/sell")}
      />
    );
  }

  function next() {
    if (step === 0 && photoUrls.length === 0) return;
    if (step < 3) setStep(step + 1);
    else void submit();
  }

  async function submit() {
    const listing = await createListing({
      title: title || "Untitled item",
      description,
      priceGhs: contactForPrice ? null : Number(price) || 0,
      negotiable,
      contactForPrice,
      categoryId,
      subcategoryId,
      condition,
      regionId,
      city,
      photoUrls,
      sellerId: user!.uid,
      seller: {
        id: user!.uid,
        name: user!.name,
        phone: phone || "0000000000",
        joinedYear: new Date().getFullYear(),
        rating: 5,
        reviewCount: 0,
        verified: false,
        city,
      },
    });
    router.push(`/my-ads?posted=${listing.id}`);
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
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
          <div className="space-y-2">
            <p className="text-sm font-medium">Photos</p>
            <PhotoPicker urls={photoUrls} onChange={setPhotoUrls} />
          </div>
        )}

        {step === 1 && (
          <>
            <Field label="Title">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="field"
                placeholder="iPhone 13, 128GB, blue"
              />
            </Field>
            <Field label="Category">
              <select
                value={categoryId}
                onChange={(event) => {
                  setCategoryId(event.target.value);
                  setSubcategoryId(SUBCATEGORIES[event.target.value][0].id);
                }}
                className="field"
              >
                {CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Subcategory">
              <select
                value={subcategoryId}
                onChange={(event) => setSubcategoryId(event.target.value)}
                className="field"
              >
                {(SUBCATEGORIES[categoryId] || []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Condition">
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
                onChange={(event) => setContactForPrice(event.target.checked)}
              />
              Contact for price
            </label>
            {!contactForPrice && (
              <Field label="Price (GHS)">
                <input
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
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
            <Field label="Description">
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="field min-h-28"
                placeholder="Condition, extras, where to meet."
              />
            </Field>
          </>
        )}

        {step === 2 && (
          <>
            <Field label="Region">
              <select
                value={regionId}
                onChange={(event) => {
                  setRegionId(event.target.value);
                  const next = REGIONS.find((item) => item.id === event.target.value);
                  setCity(next?.cities[0] || "");
                }}
                className="field"
              >
                {REGIONS.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="City">
              <select
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className="field"
              >
                {cities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}

        {step === 3 && (
          <Field label="Phone number">
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="field"
              placeholder="0240000000"
            />
            <p className="hint">Buyers will see this on the ad and can call you.</p>
          </Field>
        )}

        <div className="flex gap-2 pt-2">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="h-12 flex-1 rounded-full bg-canvas"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={next}
            disabled={step === 0 && photoUrls.length === 0}
            className="h-12 flex-1 rounded-full bg-ink text-paper disabled:opacity-40"
          >
            {step === 3 ? "Submit for review" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
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
