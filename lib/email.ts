import { Resend } from "resend";
import QRCode from "qrcode";
import { formatNaira } from "@/lib/utils";
import type { Order, OrderLineItem, MerchOrder } from "@/types";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_ADDRESS = process.env.EMAIL_FROM ?? "Nocturne Rave <tickets@nocturnerave.com>";

/**
 * Sends the ticket confirmation email with one QR code for the whole
 * order embedded inline. Scanning that QR at the gate checks in every
 * pass tied to this order at once (see app/api/admin/scan/route.ts).
 *
 * Failures here are logged but never thrown — a broken email send must
 * not roll back or interrupt the webhook, since the payment and stock
 * reservation have already succeeded by the time this runs.
 */
export async function sendTicketConfirmationEmail(order: Order, groupSize: number) {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set — skipping ticket confirmation email.");
    return;
  }

  try {
    const items = order.items as OrderLineItem[];
    const qrDataUrl = await QRCode.toDataURL(order.paystack_ref, {
      margin: 1,
      color: { dark: "#131313", light: "#f5f5f5" },
      width: 320,
    });

    const itemsHtml = items
      .map(
        (item) => `
          <tr>
            <td style="padding:8px 0;border-top:1px solid #2a2a2a;color:#e5e5e5;font-size:14px;">
              ${item.tier_name} × ${item.quantity}
            </td>
            <td style="padding:8px 0;border-top:1px solid #2a2a2a;color:#e5e5e5;font-size:14px;text-align:right;">
              ${formatNaira(item.unit_price * item.quantity)}
            </td>
          </tr>`
      )
      .join("");

    await resend.emails.send({
      from: FROM_ADDRESS,
      to: order.email,
      subject: `Your Nocturne Rave ticket${groupSize > 1 ? "s" : ""} 🎟️`,
      html: `
        <div style="background:#0a0a0a;padding:32px 16px;font-family:sans-serif;">
          <div style="max-width:420px;margin:0 auto;background:#141414;border:1px solid #2a2a2a;padding:24px;">
            <p style="color:#8b5cf6;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;">
              Transaction confirmed
            </p>
            <h1 style="color:#fff;font-size:22px;margin:0 0 20px;">You're in. See you there.</h1>

            <p style="color:#8a8a8a;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">
              Reference
            </p>
            <p style="color:#8b5cf6;font-size:14px;margin:0 0 16px;">${order.paystack_ref}</p>

            <table style="width:100%;border-collapse:collapse;">
              ${itemsHtml}
              <tr>
                <td style="padding:12px 0 0;color:#fff;font-weight:700;border-top:1px solid #2a2a2a;">Total</td>
                <td style="padding:12px 0 0;color:#8b5cf6;font-weight:700;text-align:right;border-top:1px solid #2a2a2a;">
                  ${formatNaira(order.amount)}
                </td>
              </tr>
            </table>

            <div style="margin-top:24px;text-align:center;background:#f5f5f5;padding:16px;">
              <img src="${qrDataUrl}" alt="Your ticket QR code" width="220" height="220" style="display:block;margin:0 auto;" />
              <p style="color:#131313;font-weight:700;font-size:14px;margin:12px 0 0;">
                ${groupSize} ${groupSize === 1 ? "ticket" : "tickets"} on this QR
              </p>
            </div>

            <p style="color:#8a8a8a;font-size:12px;margin-top:20px;line-height:1.6;">
              Save this email or screenshot it. One scan at the gate lets your
              whole group in${groupSize > 1 ? ` — all ${groupSize} of you` : ""}.
            </p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send ticket confirmation email:", err);
  }
}

export async function sendMerchConfirmationEmail(order: MerchOrder) {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set — skipping merch confirmation email.");
    return;
  }

  try {
    const itemsHtml = order.cart_items
      .map(
        (item, idx) => `
          <tr key="${idx}">
            <td style="padding:8px 0;border-top:1px solid #2a2a2a;color:#e5e5e5;font-size:14px;">
              ${item.name} × ${item.quantity}
            </td>
            <td style="padding:8px 0;border-top:1px solid #2a2a2a;color:#e5e5e5;font-size:14px;text-align:right;">
              ${formatNaira(item.price * item.quantity)}
            </td>
          </tr>`
      )
      .join("");

    await resend.emails.send({
      from: FROM_ADDRESS,
      to: order.email,
      subject: "Your Nocturne Rave gear is confirmed",
      html: `
        <div style="background:#0a0a0a;padding:32px 16px;font-family:sans-serif;">
          <div style="max-width:420px;margin:0 auto;background:#141414;border:1px solid #2a2a2a;padding:24px;">
            <p style="color:#8b5cf6;font-size:11px;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;">
              Transaction confirmed
            </p>
            <h1 style="color:#fff;font-size:22px;margin:0 0 20px;">Gear secured.</h1>

            <p style="color:#8a8a8a;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">
              Reference
            </p>
            <p style="color:#8b5cf6;font-size:14px;margin:0 0 16px;">${order.paystack_ref}</p>

            <table style="width:100%;border-collapse:collapse;">
              ${itemsHtml}
              <tr>
                <td style="padding:12px 0 0;color:#fff;font-weight:700;border-top:1px solid #2a2a2a;">Total</td>
                <td style="padding:12px 0 0;color:#8b5cf6;font-weight:700;text-align:right;border-top:1px solid #2a2a2a;">
                  ${formatNaira(order.amount)}
                </td>
              </tr>
            </table>

            <p style="color:#8a8a8a;font-size:12px;margin-top:20px;line-height:1.6;">
              Pick up your gear at the merch desk on the night.
            </p>
          </div>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send merch confirmation email:", err);
  }
}