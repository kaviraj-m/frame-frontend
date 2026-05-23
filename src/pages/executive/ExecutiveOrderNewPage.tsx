import { Link, useParams } from "react-router-dom";
import { useExecutiveOrderNew } from "@/hooks/useExecutiveOrderNew";
import { PageHeader } from "@/components/ui/PageHeader";
import { ExecutiveOrderNewForm } from "./ExecutiveOrderNewForm";
import { Card } from "@/components/common/Card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ExecutiveOrderNewPage() {
  const { queryId: rawQueryId } = useParams();
  const queryId = rawQueryId ? decodeURIComponent(rawQueryId) : "";
  const o = useExecutiveOrderNew(queryId);

  if (!queryId) {
    return (
      <Card>
        <p className="text-destructive">Missing query. Open Confirm order from a row on Queries.</p>
        <Link to="/executive/queries" className="text-sm text-primary hover:underline">
          ← Queries
        </Link>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6 min-w-0 w-full">
      <nav className="breadcrumb text-sm">
        <Link to="/executive/queries">Queries</Link>
        <span className="breadcrumb-sep">/</span>
        <span>Confirm order</span>
      </nav>
      <PageHeader
        kicker="From query"
        title="Confirm order"
        description="Select payment mode (cash or online), then frame size — full price comes from admin pricing for that mode. Advance cannot exceed that total."
      />
      {o.status && (
        <Alert variant="success" role="status">
          <AlertDescription>{o.status}</AlertDescription>
        </Alert>
      )}
      {o.error && (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{o.error}</AlertDescription>
        </Alert>
      )}

      <ExecutiveOrderNewForm
        query={o.query}
        pricingOptions={o.pricingOptions}
        pricingLoaded={o.pricingLoaded}
        catalogError={o.catalogError}
        frameSize={o.frameSize}
        setFrameSize={o.setFrameSize}
        addressDetails={o.addressDetails}
        setAddressDetails={o.setAddressDetails}
        advancePayment={o.advancePayment}
        setAdvancePayment={o.setAdvancePayment}
        paymentMode={o.paymentMode}
        setPaymentMode={o.setPaymentMode}
        framingImages={o.framingImages}
        setFramingImages={o.setFramingImages}
        paymentProofFile={o.paymentProofFile}
        setPaymentProofFile={o.setPaymentProofFile}
        submitting={o.submitting}
        fieldErrors={o.fieldErrors}
        clearFieldError={o.clearFieldError}
        onSubmit={o.createOrder}
      />
    </div>
  );
}
