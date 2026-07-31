const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const renderBadge = ({ label, value }) => `
  <div style="display:inline-block;margin:0 10px 10px 0;padding:12px 16px;border-radius:16px;background:#f8fafc;border:1px solid #e2e8f0;">
    <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#64748b;">${escapeHtml(label)}</div>
    <div style="margin-top:6px;font-size:15px;font-weight:700;color:#0f172a;">${escapeHtml(value)}</div>
  </div>
`;

export const renderEmailLayout = ({
  preheader,
  eyebrow,
  title,
  intro,
  badges = [],
  sections = [],
  footerNote,
}) => `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader || "")}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;background:#ffffff;border-radius:28px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:36px 36px 28px;background:linear-gradient(135deg,#020617 0%,#0f172a 100%);color:#ffffff;">
                <div style="font-size:12px;letter-spacing:.24em;text-transform:uppercase;color:#a5f3fc;">${escapeHtml(eyebrow || "CampusBasket Update")}</div>
                <h1 style="margin:14px 0 0;font-size:34px;line-height:1.15;font-weight:800;">${escapeHtml(title)}</h1>
                <p style="margin:16px 0 0;font-size:15px;line-height:1.8;color:#cbd5e1;">${escapeHtml(intro || "")}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 36px 20px;">
                ${badges.length > 0 ? `<div style="margin-bottom:12px;">${badges.map(renderBadge).join("")}</div>` : ""}
                ${sections
                  .map(
                    (section) => `
                  <div style="margin-top:24px;">
                    <div style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#64748b;">${escapeHtml(section.heading)}</div>
                    <div style="margin-top:10px;font-size:15px;line-height:1.9;color:#334155;">${section.content}</div>
                  </div>
                `,
                  )
                  .join("")}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 36px 36px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                <p style="margin:0;font-size:14px;line-height:1.8;color:#475569;">${escapeHtml(
                  footerNote || "You are receiving this update because of activity on your CampusBasket order.",
                )}</p>
                <p style="margin:16px 0 0;font-size:14px;font-weight:700;color:#0f172a;">Team CampusBasket</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

export const formatCurrency = (value) =>
  `Rs.${Number(value || 0).toLocaleString("en-IN")}`;

export const formatOrderMode = (value) =>
  String(value || "")
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

export const formatStatusLabel = (value) =>
  String(value || "")
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
