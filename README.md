# Haven Brisbane Email Sender

SvelteKit web app for uploading attendee CSVs, building HTML email blocks, previewing personalized output, and sending via Gmail API.

## CSV format

```csv
email,first_name,last_name
test@example.org,Jane,Doe
example@example.com,John,Black
```

## Setup

1. Install Deno (v2+).

2. Create a .env with your Gmail token/key:

```.env
GMAIL_API_KEY="your-gmail-api-token"
```

3. Run locally:

```bash
deno task dev
```

Open the app, upload a CSV, build email blocks, use placeholders like `{{first_name}}`, preview per attendee, and send emails.

## Validation

- Type-check: `deno task check`
- Unit tests: `deno task test`
- Build: `deno task build`
