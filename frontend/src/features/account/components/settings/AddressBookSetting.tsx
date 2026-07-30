// cspell:words Woreda Kebele Ashenafi Deresa Addis Ababa Bole
import React, { useEffect, useState } from "react";
import { MapPin, Plus, Trash2, Pencil, Star, Home, Briefcase, X, Check, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { addressService, AddressData } from "../../services/addressService";

type FormState = Omit<AddressData, "id" | "is_default">;

const emptyForm: FormState = {
  label: "home",
  full_name: "",
  phone_number: "",
  city: "",
  sub_city: "",
  woreda: "",
};

const LABEL_ICON = { home: Home, work: Briefcase, other: MapPin };

export const AddressBookSetting: React.FC = () => {
  const [addresses, setAddresses] = useState<AddressData[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState<"list" | "add" | "edit">("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  // UI Feedback Banner State
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // 1. Fetch addresses on mount
  useEffect(() => {
    let isMounted = true;

    addressService
      .getAddresses()
      .then((data) => {
        if (isMounted) setAddresses(data);
      })
      .catch((err) => {
        console.error("Failed to fetch addresses:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshAddresses = async () => {
    try {
      const data = await addressService.getAddresses();
      setAddresses(data);
    } catch (err) {
      console.error("Failed to refresh addresses:", err);
    }
  };

  const openAdd = () => {
    setForm(emptyForm);
    setErrors({});
    setMode("add");
  };

  const openEdit = (addr: AddressData) => {
    setForm({
      label: addr.label || "home",
      full_name: addr.full_name,
      phone_number: addr.phone_number,
      city: addr.city,
      sub_city: addr.sub_city || "",
      woreda: addr.woreda || "",
      region: addr.region || "",
      house_no: addr.house_no || "",
    });
    setErrors({});
    setEditingId(addr.id || null);
    setMode("edit");
  };

  const cancelForm = () => {
    setMode("list");
    setEditingId(null);
    setErrors({});
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.full_name.trim()) next.full_name = "Recipient name is required.";
    if (!/^\+?\d[\d\s]{7,}$/.test(form.phone_number.trim())) next.phone_number = "Enter a valid phone number.";
    if (!form.city.trim()) next.city = "City is required.";
    if (!form.sub_city?.trim()) next.sub_city = "Sub-city / zone is required.";
    if (!form.woreda?.trim()) next.woreda = "District / Woreda details are required.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // 2. Save / Update Address
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      if (mode === "edit" && editingId) {
        const updated = await addressService.updateAddress(editingId, form);
        setAddresses((prev) => prev.map((a) => (a.id === editingId ? updated : a)));
        showFeedback("success", "Address updated successfully.");
      } else {
        const created = await addressService.createAddress(form);
        setAddresses((prev) => [...prev, created]);
        showFeedback("success", "New address saved successfully.");
      }
      cancelForm();
    } catch (err) {
      console.error("Failed to save address:", err);
      showFeedback("error", "Failed to save address. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Delete Address
  const handleDelete = async (id: string) => {
    try {
      await addressService.deleteAddress(id);
      setConfirmDeleteId(null);
      await refreshAddresses();
      showFeedback("success", "Address deleted.");
    } catch (err) {
      console.error("Failed to delete address:", err);
      showFeedback("error", "Failed to delete address.");
    }
  };

  // 4. Set Default Address
  const setDefault = async (id: string) => {
    try {
      await addressService.updateAddress(id, { is_default: true });
      await refreshAddresses();
      showFeedback("success", "Default address updated.");
    } catch (err) {
      console.error("Failed to set default address:", err);
      showFeedback("error", "Failed to update default address.");
    }
  };

  const updateField = (key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-plum-600" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`mb-6 flex items-center justify-between gap-3 rounded-xl p-4 text-xs font-semibold ${
            feedback.type === "success" ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)}>
            <X className="h-3.5 w-3.5 opacity-60 hover:opacity-100" />
          </button>
        </div>
      )}

      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-plum-50 text-plum-600">
            <MapPin className="h-5 w-5" />
          </span>
          <div>
            <h3 className="display text-xl font-semibold text-ink">Shipping Addresses</h3>
            <p className="text-xs text-ink/45">Manage your delivery locations for faster checkout.</p>
          </div>
        </div>
        {mode === "list" && (
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-plum-600"
          >
            <Plus className="h-3.5 w-3.5" />
            Add New
          </button>
        )}
      </div>

      {mode === "add" || mode === "edit" ? (
        <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-ink/[0.06] bg-neutral-50/50 p-6">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink/50">Address Type</label>
            <div className="flex gap-2">
              {(["home", "work", "other"] as const).map((l) => {
                const Icon = LABEL_ICON[l];
                const active = form.label === l;
                return (
                  <button
                    key={l}
                    type="button"
                    onClick={() => updateField("label", l)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold capitalize transition-colors ${
                      active ? "border-plum-500 bg-white text-plum-600 ring-2 ring-plum-100" : "border-ink/10 bg-white text-ink/60 hover:border-ink/20"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {l}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Recipient Name" error={errors.full_name}>
              <input value={form.full_name} onChange={(e) => updateField("full_name", e.target.value)} type="text" className={inputClass(!!errors.full_name)} />
            </Field>
            <Field label="Phone Number" error={errors.phone_number}>
              <input value={form.phone_number} onChange={(e) => updateField("phone_number", e.target.value)} type="tel" placeholder="+251 9XX XXX XXX" className={inputClass(!!errors.phone_number)} />
            </Field>
            <Field label="City" error={errors.city}>
              <input value={form.city} onChange={(e) => updateField("city", e.target.value)} type="text" className={inputClass(!!errors.city)} />
            </Field>
            <Field label="Sub-City / Zone" error={errors.sub_city}>
              <input value={form.sub_city} onChange={(e) => updateField("sub_city", e.target.value)} type="text" className={inputClass(!!errors.sub_city)} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="District / Woreda / Specific Details" error={errors.woreda}>
                <input value={form.woreda} onChange={(e) => updateField("woreda", e.target.value)} type="text" className={inputClass(!!errors.woreda)} />
              </Field>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={cancelForm} disabled={submitting} className="rounded-full border border-ink/15 px-5 py-2.5 text-xs font-semibold text-ink/70 hover:bg-white disabled:opacity-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-xs font-semibold text-white hover:bg-plum-600 disabled:opacity-50">
              {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {mode === "edit" ? "Save Changes" : "Save Location"}
            </button>
          </div>
        </form>
      ) : addresses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/10 bg-neutral-50/60 px-5 py-12 text-center">
          <MapPin className="mx-auto mb-3 h-8 w-8 text-ink/20" />
          <p className="text-sm font-medium text-ink/50">No shipping addresses saved yet.</p>
          <button onClick={openAdd} className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-white hover:bg-plum-600">
            <Plus className="h-3.5 w-3.5" /> Add your first address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {addresses.map((addr) => {
            const Icon = LABEL_ICON[addr.label || "home"];
            const confirming = confirmDeleteId === addr.id;
            return (
              <div key={addr.id} className="relative rounded-2xl border border-ink/[0.06] bg-neutral-50/50 p-5 transition-colors hover:border-ink/10">
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-plum-50 text-plum-600">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="text-sm font-semibold text-ink">{addr.full_name}</p>
                        <span className="rounded bg-ink/[0.06] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-ink/50">{addr.label}</span>
                        {addr.is_default && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-plum-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-plum-700">
                            <Star className="h-2.5 w-2.5 fill-plum-700" /> Default
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-ink/70">
                        {addr.city}, {addr.sub_city}, {addr.woreda}
                      </p>
                      <p className="mt-1 font-mono text-xs text-ink/45">{addr.phone_number}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button onClick={() => openEdit(addr)} className="rounded-lg p-1.5 text-ink/30 transition-colors hover:bg-white hover:text-plum-600" type="button">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setConfirmDeleteId(addr.id || null)} className="rounded-lg p-1.5 text-ink/30 transition-colors hover:bg-white hover:text-rose-600" type="button">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {!addr.is_default && !confirming && addr.id && (
                  <button onClick={() => setDefault(addr.id!)} className="mt-3 text-[11px] font-semibold text-plum-600 hover:text-plum-700" type="button">
                    Set as default
                  </button>
                )}

                {confirming && addr.id && (
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-rose-50 px-3 py-2">
                    <span className="text-[11px] font-medium text-rose-700">Delete this address?</span>
                    <div className="flex gap-1">
                      <button onClick={() => handleDelete(addr.id!)} className="rounded-full bg-rose-600 p-1 text-white hover:bg-rose-700" type="button">
                        <Check className="h-3 w-3" />
                      </button>
                      <button onClick={() => setConfirmDeleteId(null)} className="rounded-full bg-white p-1 text-rose-600 hover:bg-rose-100" type="button">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const inputClass = (hasError?: boolean) =>
  `w-full rounded-xl border p-3 text-sm text-ink focus:outline-none focus:ring-2 ${
    hasError ? "border-rose-300 bg-rose-50/40 focus:ring-rose-100" : "border-ink/10 bg-white focus:border-plum-500 focus:ring-plum-100"
  }`;

const Field: React.FC<{ label: string; error?: string; children: React.ReactNode }> = ({ label, error, children }) => (
  <div>
    <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink/50">{label}</label>
    {children}
    {error && <p className="mt-1 text-[11px] font-medium text-rose-600">{error}</p>}
  </div>
);