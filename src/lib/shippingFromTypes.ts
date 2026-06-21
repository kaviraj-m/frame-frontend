export type ShippingFromAddress = {
  name: string;
  phone: string;
  address: string;
  pincode: string;
  labelFooter?: string;
};

export function isShippingFromConfigured(from: ShippingFromAddress | null | undefined): boolean {
  if (!from) return false;
  return (
    from.name.trim() !== "" &&
    from.phone.trim() !== "" &&
    from.address.trim() !== "" &&
    from.pincode.trim() !== ""
  );
}

export type ShippingLabelParty = {
  name: string;
  phone: string;
  address: string;
  pincode: string;
};
