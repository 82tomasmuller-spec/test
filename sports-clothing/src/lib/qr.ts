import QRCode from "qrcode";

// Czech QR Payment standard (SPD - Short Payment Descriptor)
export function generateCzechQRPaymentString(params: {
  iban: string;
  amount: number;
  currency?: string;
  variableSymbol: string;
  message?: string;
  recipientName?: string;
}) {
  const parts = [
    `SPD*1.0`,
    `ACC:${params.iban}`,
    `AM:${params.amount.toFixed(2)}`,
    `CC:${params.currency || "CZK"}`,
    `X-VS:${params.variableSymbol}`,
  ];

  if (params.message) {
    parts.push(`MSG:${params.message}`);
  }
  if (params.recipientName) {
    parts.push(`RN:${params.recipientName}`);
  }

  return parts.join("*");
}

export async function generateQRCodeDataUrl(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    width: 300,
    margin: 2,
    errorCorrectionLevel: "M",
  });
}

export async function generatePaymentQR(params: {
  iban: string;
  amount: number;
  variableSymbol: string;
  message?: string;
  recipientName?: string;
}): Promise<string> {
  const spdString = generateCzechQRPaymentString(params);
  return generateQRCodeDataUrl(spdString);
}
