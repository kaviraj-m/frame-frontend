import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { apiPaths } from "@/lib/apiPaths";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/FormField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { validateRequired } from "@/lib/fieldValidation";
import type { ShippingFromAddress } from "@/lib/shippingFromTypes";

export function AdminShippingFromPage() {
  const [form, setForm] = useState<ShippingFromAddress>({
    name: "",
    phone: "",
    address: "",
    pincode: "",
  });
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError("");
      try {
        const cfg = await api<ShippingFromAddress>(apiPaths.adminShippingFrom);
        if (!cancelled) {
          setForm(cfg);
          setLoaded(true);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(e: FormEvent) {
    e.preventDefault();
    setError("");
    setMsg("");
    const errors: Record<string, string> = {};
    const nameErr = validateRequired(form.name, "Name");
    const phoneErr = validateRequired(form.phone, "Phone");
    const addressErr = validateRequired(form.address, "Address");
    const pincodeErr = validateRequired(form.pincode, "Pincode");
    if (nameErr) errors.name = nameErr;
    if (phoneErr) errors.phone = phoneErr;
    if (addressErr) errors.address = addressErr;
    if (pincodeErr) errors.pincode = pincodeErr;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setError("Fill in all fields.");
      return;
    }
    setSaving(true);
    try {
      const cfg = await api<ShippingFromAddress>(apiPaths.adminShippingFrom, {
        method: "PUT",
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          pincode: form.pincode.trim(),
        }),
      });
      setForm(cfg);
      setMsg("From address saved. Production & dispatch labels will use these details.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 min-w-0 w-full">
      <PageHeader
        kicker="Admin"
        title="From address"
        description="Sender details for courier shipping labels printed from Production & dispatch."
      />

      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {msg ? (
        <Alert role="status">
          <AlertDescription>{msg}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="max-w-xl">
        <form onSubmit={save} className="flex flex-col gap-4">
          <FormField label="Name" required error={fieldErrors.name}>
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              disabled={!loaded || saving}
              aria-invalid={!!fieldErrors.name}
            />
          </FormField>
          <FormField label="Phone" required error={fieldErrors.phone}>
            <Input
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              disabled={!loaded || saving}
              aria-invalid={!!fieldErrors.phone}
            />
          </FormField>
          <FormField label="Address" required error={fieldErrors.address}>
            <Textarea
              rows={4}
              value={form.address}
              onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
              disabled={!loaded || saving}
              aria-invalid={!!fieldErrors.address}
            />
          </FormField>
          <FormField label="Pincode" required error={fieldErrors.pincode}>
            <Input
              value={form.pincode}
              onChange={(e) => setForm((p) => ({ ...p, pincode: e.target.value }))}
              disabled={!loaded || saving}
              aria-invalid={!!fieldErrors.pincode}
            />
          </FormField>
          <Button type="submit" disabled={!loaded || saving}>
            {saving ? "Saving…" : "Save from address"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
