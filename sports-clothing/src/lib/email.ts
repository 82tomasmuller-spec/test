import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "localhost",
  port: parseInt(process.env.SMTP_PORT || "1025"),
  secure: false,
  // For production, configure real SMTP credentials:
  // auth: {
  //   user: process.env.SMTP_USER,
  //   pass: process.env.SMTP_PASS,
  // },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"SportObjednávky" <noreply@sportobjednavky.cz>',
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error("Failed to send email:", error);
  }
}

export function orderConfirmationEmail(order: {
  orderNumber: string;
  parentName: string;
  items: { productName: string; size: string; quantity: number; unitPrice: number }[];
  totalAmount: number;
  clubName: string;
}) {
  const itemsHtml = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #eee">${item.productName}</td>
          <td style="padding:8px;border-bottom:1px solid #eee">${item.size}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${(item.unitPrice * item.quantity).toLocaleString("cs-CZ")} Kč</td>
        </tr>`
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#1e40af">Potvrzení objednávky</h2>
      <p>Dobrý den, ${order.parentName},</p>
      <p>vaše objednávka <strong>${order.orderNumber}</strong> u klubu <strong>${order.clubName}</strong> byla úspěšně přijata.</p>

      <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <thead>
          <tr style="background:#f3f4f6">
            <th style="padding:8px;text-align:left">Produkt</th>
            <th style="padding:8px;text-align:left">Velikost</th>
            <th style="padding:8px;text-align:center">Počet</th>
            <th style="padding:8px;text-align:right">Cena</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="3" style="padding:8px;font-weight:bold;text-align:right">Celkem:</td>
            <td style="padding:8px;font-weight:bold;text-align:right">${order.totalAmount.toLocaleString("cs-CZ")} Kč</td>
          </tr>
        </tfoot>
      </table>

      <p style="color:#6b7280;font-size:14px">O dalším průběhu objednávky vás budeme informovat.</p>
      <p style="color:#6b7280;font-size:14px">S pozdravem,<br>${order.clubName}</p>
    </div>
  `;
}

export function invoiceEmail(invoice: {
  clubName: string;
  invoiceNumber: string;
  amount: number;
  variableSymbol: string;
  qrCodeDataUrl: string;
  bankAccount: string;
}) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#1e40af">Zálohová faktura - SportObjednávky</h2>
      <p>Dobrý den,</p>
      <p>děkujeme za registraci klubu <strong>${invoice.clubName}</strong>.</p>
      <p>Pro aktivaci vašeho účtu prosím uhraďte aktivační poplatek:</p>

      <div style="background:#f3f4f6;padding:20px;border-radius:8px;margin:20px 0">
        <p><strong>Číslo faktury:</strong> ${invoice.invoiceNumber}</p>
        <p><strong>Částka:</strong> ${invoice.amount.toLocaleString("cs-CZ")} Kč</p>
        <p><strong>Bankovní účet:</strong> ${invoice.bankAccount}</p>
        <p><strong>Variabilní symbol:</strong> ${invoice.variableSymbol}</p>
      </div>

      <div style="text-align:center;margin:20px 0">
        <p><strong>QR kód pro platbu:</strong></p>
        <img src="${invoice.qrCodeDataUrl}" alt="QR platba" style="width:200px;height:200px" />
      </div>

      <p style="color:#6b7280;font-size:14px">Po přijetí platby bude váš klub automaticky aktivován a budeme vás informovat emailem.</p>
      <p style="color:#6b7280;font-size:14px">S pozdravem,<br>Tým SportObjednávky</p>
    </div>
  `;
}
