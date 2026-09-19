import { strict as assert } from 'node:assert';
import { personalizeText, renderBlocks, type ContentBlock } from './email-template.ts';
import type { Attendee } from './csv.ts';

const attendee: Attendee = {
	email: 'test@example.org',
	first_name: 'Jane',
	last_name: 'Doe'
};

Deno.test('personalizeText replaces placeholders in plain text', () => {
	assert.equal(personalizeText('Hello {{first_name}} {{last_name}}', attendee), 'Hello Jane Doe');
});

Deno.test('renderBlocks renders personalized content blocks', () => {
	const blocks: ContentBlock[] = [
		{ id: '1', type: 'heading', text: 'Hi {{first_name}}' },
		{ id: '2', type: 'paragraph', text: 'Your email is {{email}}' }
	];

	const html = renderBlocks(blocks, attendee);
	assert.ok(html.includes('Hi Jane'));
	assert.ok(html.includes('Your email is test@example.org'));
});
