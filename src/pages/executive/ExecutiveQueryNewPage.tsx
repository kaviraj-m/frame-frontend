import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FormField } from "@/components/ui/FormField";
import { api } from "@/lib/api";
import { apiPaths } from "@/lib/apiPaths";
import {
  firstError,
  phoneDigits,
  validateEmailOptional,
  validatePhone10,
  validateRequired,
} from "@/lib/fieldValidation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/common/Card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ExecutiveQueryNewPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [remarks, setRemarks] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validateFields(): string | null {
    const errors: Record<string, string> = {};
    const nameErr = validateRequired(name, "Customer name");
    const phoneErr = validatePhone10(phone);
    const emailErr = validateEmailOptional(email);
    if (nameErr) errors.name = nameErr;
    if (phoneErr) errors.phone = phoneErr;
    if (emailErr) errors.email = emailErr;
    setFieldErrors(errors);
    return firstError(nameErr, phoneErr, emailErr);
  }

  async function createQuery(e: FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("");
    const validationError = validateFields();
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      await api(apiPaths.executiveQueries, {
        method: "POST",
        body: JSON.stringify({
          customerUsername: name.trim(),
          customerPhoneNumber: phoneDigits(phone),
          customerEmail: email.trim(),
          remarks,
        }),
      });
      setStatus("Query created successfully.");
      navigate("/executive/queries");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function onPhoneChange(value: string) {
    setPhone(phoneDigits(value).slice(0, 10));
    if (fieldErrors.phone) setFieldErrors((prev) => ({ ...prev, phone: "" }));
  }

  return (
    <div className="flex flex-col gap-6 min-w-0 w-full">
      <nav className="breadcrumb text-sm">
        <Link to="/executive/queries">Queries</Link>
        <span className="breadcrumb-sep">/</span>
        <span>New query</span>
      </nav>
      <PageHeader
        kicker="New lead"
        title="Log a query"
        description="Name, phone, email (optional), and a short note. You will get a stable ID to track until they pay and confirm."
      />
      {status && (
        <Alert variant="success" role="status">
          <AlertDescription>{status}</AlertDescription>
        </Alert>
      )}
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <Card>
        <form className="space-y-4" onSubmit={createQuery} noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField label="Customer name" required error={fieldErrors.name}>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
                }}
                placeholder="Username or display name"
                aria-invalid={!!fieldErrors.name}
              />
            </FormField>
            <FormField label="Phone" required error={fieldErrors.phone}>
              <Input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => onPhoneChange(e.target.value)}
                placeholder="10-digit mobile"
                aria-invalid={!!fieldErrors.phone}
              />
            </FormField>
            <FormField label="Email" error={fieldErrors.email} hint="Optional">
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
                }}
                placeholder="name@example.com"
                aria-invalid={!!fieldErrors.email}
              />
            </FormField>
          </div>
          <FormField label="Initial remarks">
            <Textarea
              rows={4}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Requirement notes, source, next step…"
            />
          </FormField>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit">Create query</Button>
            <Link to="/executive/queries" className="text-sm text-muted-foreground hover:text-foreground">
              Cancel
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
