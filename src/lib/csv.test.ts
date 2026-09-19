import { strict as assert } from 'node:assert';
import { parseAttendees } from './csv.ts';

Deno.test('parseAttendees parses expected attendee format', () => {
	const attendees = parseAttendees(`email,first_name,last_name\njane@example.org,Jane,Doe`);
	assert.deepEqual(attendees, [{ email: 'jane@example.org', first_name: 'Jane', last_name: 'Doe' }]);
});

Deno.test('parseAttendees supports quoted fields', () => {
	const attendees = parseAttendees(`email,first_name,last_name\n"john@example.org","John, Jr.","Black"`);
	assert.equal(attendees[0].first_name, 'John, Jr.');
});

Deno.test('parseAttendees throws when required headers are missing', () => {
	assert.throws(
		() => parseAttendees(`email,first_name\na@b.com,Jane`),
		/CSV is missing required header: last_name/
	);
});
