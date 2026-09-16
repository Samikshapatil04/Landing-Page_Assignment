/* ==========================================================================
   Edufyi Career Accelerator — Landing Page Script
   No build step, no dependencies. Two things happen here:
     1. Footer year.
     2. Lead form: validate -> POST to your CRM/email endpoint -> show status.
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. CRM / EMAIL CONFIG — this is the only section you need to edit.

   Pick ONE integration and fill it in. See README.md "CRM / Email
   integration" section for step-by-step setup for Mailchimp and Brevo.
   -------------------------------------------------------------------------- */
const CRM_CONFIG = {
  // "brevo" | "mailchimp" | "custom" | "demo"
  // "demo" needs no setup and just simulates a successful signup so you can
  // preview the page. Switch it before you actually launch.
  provider: "brevo",

  // For provider: "custom" — your own serverless function / backend endpoint
  // that receives { first_name, email } as JSON and forwards it to your CRM.
  // This is the recommended approach because it keeps API keys off the
  // client. See README.md for a ready-to-deploy example.
  customEndpoint: "/api/subscribe",

  // For provider: "brevo" — a Brevo "Create Contact" doubleOptin form.
  // Get this from Brevo > Contacts > Forms > (your form) > Share > Form URL.
  brevoFormUrl: "https://415ddf09.sibforms.com/serve/MUIFAN4x01f-iVkypfxFxSm9QnVuIRmIyQXSUyBmXon4YD0tGfNRPbfUhX4biZKBI9mUVUHRiWlGAjOnXqoYoOF73FMplQHmGQZ34r-WeorFwPBw3OOAjZAqYBG4CP_NySIFpzBt8WcNGfPpciFeh0DyCS1nMPooPuEw87NH6ih8oEq2MAxpRSJZWZQWwvE7oEjVzNwdot6RwtvYag==",

  // For provider: "mailchimp" — your Mailchimp embedded-form POST URL.
  // Get this from Mailchimp > Audience > Signup forms > Embedded forms,
  // then change the "/post?" in the action URL to "/post-json?" is NOT
  // needed here — we submit it as a normal form post in a hidden iframe
  // so no API key ever touches the browser. See README.md.
  mailchimpFormUrl: "",
};

/* --------------------------------------------------------------------------
   2. Footer year
   -------------------------------------------------------------------------- */
document.getElementById("year").textContent = new Date().getFullYear();

/* --------------------------------------------------------------------------
   3. Lead form
   -------------------------------------------------------------------------- */
const form = document.getElementById("signup");
const statusEl = document.getElementById("form-status");
const submitBtn = form.querySelector(".btn--cta");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const firstName = form.first_name.value.trim();
  const email = form.email.value.trim();

  if (!firstName || !isValidEmail(email)) {
    showStatus("error", "Please enter your first name and a valid email address.");
    return;
  }

  setLoading(true);

  try {
    await submitLead({ first_name: firstName, email });
    showStatus("success", "You're in! Check your inbox for a confirmation email.");
    form.reset();
  } catch (err) {
    console.error("Lead submission failed:", err);
    showStatus("error", "Something went wrong. Please try again in a moment.");
  } finally {
    setLoading(false);
  }
});

/**
 * Sends { first_name, email } to whichever provider is configured above.
 * Swap providers by changing CRM_CONFIG.provider — nothing else in this
 * file needs to change for the common cases.
 */
async function submitLead(data) {
  switch (CRM_CONFIG.provider) {
    case "custom":
      return submitToCustomEndpoint(data);
    case "mailchimp":
      return submitToMailchimp(data);
    case "brevo":
      return submitToBrevo(data);
    case "demo":
    default:
      return simulateDemoSubmit(data);
  }
}

async function submitToCustomEndpoint({ first_name, email }) {
  const response = await fetch(CRM_CONFIG.customEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ first_name, email }),
  });
  if (!response.ok) throw new Error(`Endpoint responded with ${response.status}`);
  return response;
}

/**
 * Mailchimp embedded forms don't allow CORS, so a plain fetch() will fail
 * silently. The reliable no-backend approach is to submit the form into a
 * hidden iframe, the same way Mailchimp's own embed snippet works.
 */
function submitToMailchimp({ first_name, email }) {
  return new Promise((resolve, reject) => {
    if (!CRM_CONFIG.mailchimpFormUrl) {
      reject(new Error("Set CRM_CONFIG.mailchimpFormUrl first — see README.md"));
      return;
    }

    const iframeName = "mc-submit-frame";
    let iframe = document.getElementById(iframeName);
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.name = iframeName;
      iframe.id = iframeName;
      iframe.style.display = "none";
      document.body.appendChild(iframe);
    }

    const tempForm = document.createElement("form");
    tempForm.action = CRM_CONFIG.mailchimpFormUrl;
    tempForm.method = "POST";
    tempForm.target = iframeName;

    // Mailchimp's default embedded field names — adjust FNAME/EMAIL here if
    // your audience uses custom merge tags.
    tempForm.appendChild(hiddenInput("FNAME", first_name));
    tempForm.appendChild(hiddenInput("EMAIL", email));

    document.body.appendChild(tempForm);
    tempForm.submit();
    tempForm.remove();

    // Mailchimp's response can't be read cross-origin from the iframe, so
    // we optimistically resolve once the submit has fired.
    setTimeout(resolve, 400);
  });
}

/**
 * Brevo double opt-in forms accept a normal POST the same way. Field names
 * come from your form's exported HTML in Brevo — the two most common are
 * shown here.
 */
async function submitToBrevo({ first_name, email }) {
  if (!CRM_CONFIG.brevoFormUrl) {
    throw new Error("Set CRM_CONFIG.brevoFormUrl first — see README.md");
  }
  const body = new URLSearchParams({
    FIRSTNAME: first_name,
    EMAIL: email,
  });
  const response = await fetch(CRM_CONFIG.brevoFormUrl, {
    method: "POST",
    mode: "no-cors", // Brevo's form endpoint doesn't return CORS headers
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  // mode: "no-cors" means we can't inspect the response — treat the
  // absence of a network error as success, same as a standard HTML form post.
  return response;
}

function simulateDemoSubmit(data) {
  return new Promise((resolve) => {
    console.info("[demo mode] Lead captured (not sent anywhere):", data);
    setTimeout(resolve, 500);
  });
}

function hiddenInput(name, value) {
  const input = document.createElement("input");
  input.type = "hidden";
  input.name = name;
  input.value = value;
  return input;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle("is-loading", isLoading);
}

function showStatus(state, message) {
  statusEl.textContent = message;
  statusEl.dataset.state = state;
}
