import type { Attendee } from './csv';

export type ContentBlockType = 'heading' | 'paragraph' | 'button' | 'divider';

export type ContentBlock = {
	id: string;
	type: ContentBlockType;
	text?: string;
	url?: string;
};

function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

export function personalizeText(template: string, attendee: Attendee): string {
	return template.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_match, key: string) => attendee[key] ?? '');
}

export function renderBlocks(blocks: ContentBlock[], attendee: Attendee): string {
	return blocks
		.map((block) => {
			const text = escapeHtml(personalizeText(block.text ?? '', attendee));
			const url = escapeHtml(personalizeText(block.url ?? '', attendee));

			switch (block.type) {
				case 'heading':
					return `<h2 style=\"margin:0 0 16px;color:#0f2f44;font-size:30px;line-height:1.2;font-family:Arial,sans-serif;\">${text}</h2>`;
				case 'paragraph':
					return `<p style=\"margin:0 0 16px;color:#244559;font-size:16px;line-height:1.6;font-family:Arial,sans-serif;\">${text}</p>`;
				case 'button':
					return `<p style=\"margin:24px 0;\"><a href=\"${url}\" style=\"display:inline-block;background:#1e8f68;color:#ffffff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:700;font-family:Arial,sans-serif;\">${text}</a></p>`;
				case 'divider':
					return '<hr style="margin:24px 0;border:0;border-top:1px solid #d7e4e7;" />';
				default:
					return '';
			}
		})
		.join('');
}

export function buildEmailHtml(contentHtml: string): string {
	return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f5faf7;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:14px;border:1px solid #d7e4e7;overflow:hidden;">
      <tr>
        <td style="background:#0f2f44;padding:18px 24px;">
          <div style="font-family:Arial,sans-serif;font-size:14px;letter-spacing:1px;color:#9fdcc7;text-transform:uppercase;">Haven Brisbane</div>
        </td>
      </tr>
      <tr>
        <td style="padding:24px;">${contentHtml}</td>
      </tr>
      <tr>
        <td style="padding:16px 24px;background:#f0f7f3;color:#4e6b6f;font-size:12px;font-family:Arial,sans-serif;">This email was sent by Haven Brisbane.</td>
      </tr>
    </table>
  </body>
</html>`;
}
