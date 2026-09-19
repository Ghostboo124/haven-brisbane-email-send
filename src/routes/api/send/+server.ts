import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { buildEmailHtml, personalizeText, renderBlocks, type ContentBlock } from '$lib/email-template';
import { parseAttendees } from '$lib/csv';

function toBase64Url(value: string): string {
	const utf8Bytes = new TextEncoder().encode(value);
	let binary = '';

	for (const byte of utf8Bytes) {
		binary += String.fromCharCode(byte);
	}

	return btoa(binary)
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/g, '');
}

function buildRawMessage(
	to: string,
	subject: string,
	html: string,
	fromName?: string,
	fromEmail?: string
): string {
	const fromHeader = fromEmail
		? fromName
			? `\"${fromName}\" <${fromEmail}>`
			: fromEmail
		: fromName ?? 'Haven Brisbane';

	const raw = [
		`To: ${to}`,
		`From: ${fromHeader}`,
		`Subject: ${subject}`,
		'MIME-Version: 1.0',
		'Content-Type: text/html; charset=UTF-8',
		'',
		html
	].join('\r\n');

	return toBase64Url(raw);
}

type SendRequestBody = {
	csvText: string;
	subject: string;
	blocks: ContentBlock[];
	fromName?: string;
	fromEmail?: string;
};

export async function POST({ request }) {
	const apiKey = env.GMAIL_API_KEY;
	if (!apiKey) {
		return json({ error: 'GMAIL_API_KEY environment variable is missing.' }, { status: 500 });
	}

	const body = (await request.json()) as SendRequestBody;
	if (!body.csvText || !body.subject || !Array.isArray(body.blocks) || body.blocks.length === 0) {
		return json({ error: 'csvText, subject, and at least one content block are required.' }, { status: 400 });
	}

	const attendees = parseAttendees(body.csvText);
	const failures: { email: string; reason: string }[] = [];
	let sentCount = 0;

	for (const attendee of attendees) {
		const html = buildEmailHtml(renderBlocks(body.blocks, attendee));
		const subject = personalizeText(body.subject, attendee);
		const raw = buildRawMessage(attendee.email, subject, html, body.fromName, body.fromEmail);

		const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: 'Bearer ' + apiKey
			},
			body: JSON.stringify({ raw })
		});

		if (!response.ok) {
			const responseText = await response.text();
			failures.push({
				email: attendee.email,
				reason: responseText || `Failed with status ${response.status}`
			});
			continue;
		}

		sentCount += 1;
	}

	return json({
		sentCount,
		totalRecipients: attendees.length,
		failures
	});
}
