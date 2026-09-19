# Haven Brisbane Email Sender

SvelteKit web app for uploading attendee CSVs, building HTML email blocks, previewing personalized output, and sending via Gmail API.

## CSV format

```csv
email,first_name,last_name
test@example.org,Jane,Doe
example@example.com,John,Black
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Set your Gmail token/key (used as bearer token for Gmail API):

```bash
export GMAIL_API_KEY="your-gmail-api-token"
```

3. Run locally:

```bash
npm run dev
```

Open the app, upload a CSV, build email blocks, use placeholders like `{{first_name}}`, preview per attendee, and send emails.

## Validation

- Type-check: `npm run check`
- Unit tests: `npm test`
- Build: `npm run build`
