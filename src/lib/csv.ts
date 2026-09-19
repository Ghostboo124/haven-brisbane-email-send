export type Attendee = {
	email: string;
	first_name: string;
	last_name: string;
	[key: string]: string;
};

function parseCsvRows(csvText: string): string[][] {
	const rows: string[][] = [];
	let currentRow: string[] = [];
	let currentCell = '';
	let inQuotes = false;

	for (let i = 0; i < csvText.length; i += 1) {
		const char = csvText[i];
		const nextChar = csvText[i + 1];

		if (char === '"') {
			if (inQuotes && nextChar === '"') {
				currentCell += '"';
				i += 1;
			} else {
				inQuotes = !inQuotes;
			}
			continue;
		}

		if (char === ',' && !inQuotes) {
			currentRow.push(currentCell.trim());
			currentCell = '';
			continue;
		}

		if ((char === '\n' || char === '\r') && !inQuotes) {
			if (char === '\r' && nextChar === '\n') {
				i += 1;
			}

			currentRow.push(currentCell.trim());
			if (currentRow.some((cell) => cell.length > 0)) {
				rows.push(currentRow);
			}
			currentRow = [];
			currentCell = '';
			continue;
		}

		currentCell += char;
	}

	if (currentCell.length > 0 || currentRow.length > 0) {
		currentRow.push(currentCell.trim());
		if (currentRow.some((cell) => cell.length > 0)) {
			rows.push(currentRow);
		}
	}

	return rows;
}

export function parseAttendees(csvText: string): Attendee[] {
	const rows = parseCsvRows(csvText.trim());
	if (rows.length < 2) {
		throw new Error('CSV must include a header row and at least one attendee row.');
	}

	const headers = rows[0].map((header) => header.replace(/^\uFEFF/, '').trim().toLowerCase());
	const requiredHeaders = ['email', 'first_name', 'last_name'];

	for (const requiredHeader of requiredHeaders) {
		if (!headers.includes(requiredHeader)) {
			throw new Error(`CSV is missing required header: ${requiredHeader}`);
		}
	}

	return rows.slice(1).map((row, index) => {
		const attendee: Record<string, string> = {};

		headers.forEach((header, headerIndex) => {
			attendee[header] = (row[headerIndex] ?? '').trim();
		});

		if (!attendee.email) {
			throw new Error(`Row ${index + 2} is missing an email address.`);
		}

		return attendee as Attendee;
	});
}
