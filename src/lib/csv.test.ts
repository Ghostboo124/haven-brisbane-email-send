import { describe, expect, it } from 'vitest';
import { parseAttendees } from './csv';

describe('parseAttendees', () => {
	it('parses expected attendee format', () => {
		const attendees = parseAttendees(`email,first_name,last_name\njane@example.org,Jane,Doe`);
		expect(attendees).toEqual([
			{ email: 'jane@example.org', first_name: 'Jane', last_name: 'Doe' }
		]);
	});

	it('supports quoted fields', () => {
		const attendees = parseAttendees(
			`email,first_name,last_name\n"john@example.org","John, Jr.","Black"`
		);
		expect(attendees[0].first_name).toBe('John, Jr.');
	});

	it('throws when required headers are missing', () => {
		expect(() => parseAttendees(`email,first_name\na@b.com,Jane`)).toThrow(
			'CSV is missing required header: last_name'
		);
	});
});
