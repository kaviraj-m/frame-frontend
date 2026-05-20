import { Link, useParams } from "react-router-dom";
import { useExecutiveOrderNew } from "../../hooks/useExecutiveOrderNew";
import { PageHeader } from "../../components/ui/PageHeader";
import { ExecutiveOrderNewForm } from "./ExecutiveOrderNewForm";

export function ExecutiveOrderNewPage() {
  const { queryId: rawQueryId } = useParams();
  const queryId = rawQueryId ? decodeURIComponent(rawQueryId) : "";
  const o = useExecutiveOrderNew(queryId);

  if (!queryId) {
    return (
      <div className="card">
        <p className="error">Missing query. Open Confirm order from a row on Queries.</p>
        <Link to="/executive/queries">← Queries</Link>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <nav className="breadcrumb">
        <Link to="/executive/queries">Queries</Link>
        <span className="breadcrumb-sep">/</span>
        <span>Confirm order</span>
      </nav>
      <PageHeader
        kicker="From query"
        title="Confirm order"
        description="Select payment mode (cash or online), then frame size — full price comes from admin pricing for that mode. Advance cannot exceed that total."
      />
      {o.status && <div className="flash flash--success" role="status">{o.status}</div>}
      {o.error && <div className="flash flash--error" role="alert">{o.error}</div>}

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
