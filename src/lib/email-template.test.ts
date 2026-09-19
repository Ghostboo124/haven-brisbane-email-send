import { describe, expect, it } from 'vitest';
import { personalizeText, renderBlocks, type ContentBlock } from './email-template';
import type { Attendee } from './csv';

const attendee: Attendee = {
	email: 'test@example.org',
	first_name: 'Jane',
	last_name: 'Doe'
};

describe('email personalization', () => {
	it('replaces placeholders in plain text', () => {
		expect(personalizeText('Hello {{first_name}} {{last_name}}', attendee)).toBe('Hello Jane Doe');
	});

	it('renders personalized content blocks', () => {
		const blocks: ContentBlock[] = [
			{ id: '1', type: 'heading', text: 'Hi {{first_name}}' },
			{ id: '2', type: 'paragraph', text: 'Your email is {{email}}' }
		];

		const html = renderBlocks(blocks, attendee);
		expect(html).toContain('Hi Jane');
		expect(html).toContain('Your email is test@example.org');
	});
});
