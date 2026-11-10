// Website-formulieren -> Wix Forms ("Website-aanvraag"). Inzendingen komen in het Wix-dashboard
// (Formulieren & inzendingen) en Wix stuurt per inzending een e-mailmelding.
// De formId en veldnamen (targets) zijn aangemaakt en getest op 10-11-2026; niet zelf wijzigen.
import { wixApiRequest } from "./wix-client.js";

export const WEBSITE_FORM = {
  formId: "770c0589-85c5-4023-b5a5-7e5537319633",
  targets: {
    formulier: "formulier_y7k2qd",
    naam: "naam_p3x8vm",
    email: "e_mail_r4n9tw",
    telefoon: "telefoon_h6c1zb",
    website: "website_m2v5ks",
    aanvraag: "aanvraag_q8w3jf",
    pagina: "pagina_t5b7ny",
  },
};

/** Verstuurt één aanvraag. Resolveert alleen als Wix de inzending heeft aangemaakt. */
export async function submitWebsiteForm(fields) {
  const t = WEBSITE_FORM.targets;
  const submissions = {};
  for (const key of Object.keys(t)) {
    const v = fields[key];
    if (v != null && String(v).trim() !== "") submissions[t[key]] = String(v).trim().slice(0, 9000);
  }
  const res = await wixApiRequest("/form-submission-service/v4/submissions", {
    method: "POST",
    body: { submission: { formId: WEBSITE_FORM.formId, submissions } },
  });
  if (!res || !res.submission || !res.submission.id) throw new Error("Inzending niet aangemaakt");
  return res.submission;
}
