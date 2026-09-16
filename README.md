# Edufyi Career Accelerator — Landing Page

A single, self-contained landing page: no build tools, no frameworks, no
`node_modules`. Three files do all the work:

```
index.html    structure + copy
styles.css    all styling (design tokens at the top of the file)
script.js     form validation + CRM submission logic
```

This keeps it fast (nothing to download but three small files and two
Google Fonts) and easy to hand to anyone — open `index.html` and it works.

---

## 1. Run it locally

You don't strictly need a server — double-clicking `index.html` works in
any browser. For a closer-to-production preview (recommended, since some
browsers restrict local files), run a tiny local server from this folder:

**Option A — Python (already on most machines)**
```bash
python3 -m http.server 8000
```
Then open `http://localhost:8000`.

**Option B — Node**
```bash
npx serve .
```

**Option C — VS Code**
Install the "Live Server" extension, right-click `index.html`, → *Open with
Live Server*.

---

## 2. What's covered from the brief

| Requirement | Where |
|---|---|
| Bold headline | `.hero-headline` |
| Sub-headline | `.hero-sub` |
| 3 punchy bullet points | `.hero-bullets` |
| Urgent CTA text | "Book My Free Career Audit" — every `.btn--cta` |
| Hero with headline + form + visual above the fold | `.hero-grid` |
| Bright CTA button | amber `--color-accent` against the navy page background |
| Trust elements | 2 testimonials with 5-star ratings + a trust-bar logo strip |
| Lead form: first name + email only | `#signup` |
| CRM / email integration | `script.js`, see below |

---

## 3. CRM / email integration

Open `script.js` and look at `CRM_CONFIG` at the top — it's the only part
of the code you need to touch. Set `provider` to one of:

### `"demo"` (default)
No setup. Logs the captured lead to the browser console and shows the
success message, so you can preview the flow before wiring a real CRM.

### `"mailchimp"`
1. In Mailchimp: **Audience → Signup forms → Embedded forms**.
2. Copy the `<form action="...">` URL (ends in `/post`).
3. Paste it into `CRM_CONFIG.mailchimpFormUrl`.
4. Set `CRM_CONFIG.provider = "mailchimp"`.
5. Turn on the audience's confirmation/welcome email in Mailchimp so new
   leads get an immediate confirmation email automatically.

No API key is ever exposed in the browser — the page submits the same way
Mailchimp's own embed snippet does.

### `"brevo"` (formerly Sendinblue)
1. In Brevo: **Contacts → Forms → Create a form** (double opt-in
   recommended so the confirmation email is automatic).
2. In the form's **Share** tab, copy the form's POST URL.
3. Paste it into `CRM_CONFIG.brevoFormUrl`.
4. Set `CRM_CONFIG.provider = "brevo"`.
5. In the same form, turn on the "confirmation email" template — that's
   what sends the immediate email after signup.

### `"custom"` — recommended for production
Point `CRM_CONFIG.customEndpoint` at your own serverless function (Vercel,
Netlify Functions, Cloudflare Workers, etc). That function receives
`{ first_name, email }` as JSON, and is where you call the Mailchimp,
Brevo, or HubSpot **API** with a secret key that never touches the
browser. Minimal example for a Netlify Function using Brevo's API:

```js
// netlify/functions/subscribe.js
exports.handler = async (event) => {
  const { first_name, email } = JSON.parse(event.body);

  const res = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY, // set in Netlify's dashboard, never in the code
    },
    body: JSON.stringify({
      email,
      attributes: { FIRSTNAME: first_name },
      listIds: [Number(process.env.BREVO_LIST_ID)],
      updateEnabled: true,
    }),
  });

  if (!res.ok) return { statusCode: 502, body: "CRM error" };
  return { statusCode: 200, body: "OK" };
};
```
Set `CRM_CONFIG.provider = "custom"` and `customEndpoint = "/.netlify/functions/subscribe"`.

---

## 4. Deploy

Any static host works. Two of the simplest:

### Netlify (drag-and-drop, no account setup beyond signing in)
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag the whole project folder onto the page.
3. Done — you get a live URL immediately. Add a custom domain under
   **Site settings → Domain management** if you have one.
4. If you're using the `"custom"` CRM provider, put your function in
   `netlify/functions/` (as shown above) — Netlify picks it up
   automatically, and `customEndpoint` should be `/.netlify/functions/subscribe`.

### Vercel
```bash
npm install -g vercel
vercel
```
Follow the prompts (any defaults are fine — it's a static site, no
framework to select). Every `vercel` run after the first deploys an
update; `vercel --prod` promotes it to your production URL.

### GitHub Pages (free, good for a simple public URL)
1. Push this folder to a GitHub repo.
2. Repo **Settings → Pages → Source**, pick the branch/`root`.
3. Your page is live at `https://<username>.github.io/<repo>/`.

---

## 5. Before you launch — swap the placeholders

- `.trust-bar__logos` in `index.html` currently lists placeholder company
  names. Replace with real client/employer logos (as `<img>` tags) once
  you have permission to display them.
- The two testimonials are written for this brief — replace with real
  learner quotes and, ideally, a name + photo once you have them.
- Update the `<title>` and `<meta name="description">` in `index.html` if
  the program name or one-line pitch changes.
