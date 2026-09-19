import type { Attendee } from './csv';

export type ContentBlockType =
	| 'heading'
	| 'paragraph'
	| 'button'
	| 'divider';

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

function formatParagraphText(value: string): string {
	return escapeHtml(value).replace(/\r?\n/g, '<br />');
}

export function personalizeText(
	template: string,
	attendee: Attendee,
): string {
	return template.replace(
		/{{\s*([a-zA-Z0-9_]+)\s*}}/g,
		(_match, key: string) => attendee[key] ?? '',
	);
}

export function renderBlocks(
	blocks: ContentBlock[],
	attendee: Attendee,
): string {
	return blocks
    .map((block) => {
      const rawText = personalizeText(block.text ?? '', attendee);
      const text = escapeHtml(rawText);
      const paragraphText = formatParagraphText(rawText);

			//const text = escapeHtml(
			//	personalizeText(block.text ?? '', attendee),
			//);

			const url = escapeHtml(
				personalizeText(block.url ?? '', attendee),
			);

			switch (block.type) {
				case 'heading':
					return `
						<h2
							style="
								margin:0 0 20px;
								color:#171717;
								font-family:'Darumadrop One',Arial,sans-serif;
								font-size:32px;
								font-weight:400;
								line-height:1.05;
								letter-spacing:-0.3px;
							"
						>
							${text}
						</h2>
					`;

				case 'paragraph':
					return `
						<p
							style="
								margin:0 0 20px;
								color:#171717;
								font-family:'Jua',Arial,sans-serif;
								font-size:17px;
								font-weight:400;
								line-height:1.55;
							"
						>
							${paragraphText}
						</p>
					`;

				case 'button':
					return `
						<table
							role="presentation"
							cellspacing="0"
							cellpadding="0"
							border="0"
							style="margin:28px 0;"
						>
							<tr>
								<td
									style="
										border:2px solid #171717;
										border-radius:10px;
										background:#FC8616;
										box-shadow:0 4px 0 #171717;
									"
								>
									<a
										href="${url}"
										style="
											display:inline-block;
											padding:14px 24px;
											color:#171717;
											font-family:'Jua',Arial,sans-serif;
											font-size:18px;
											font-weight:400;
											line-height:1;
											text-decoration:none;
										"
									>
										${text}
									</a>
								</td>
							</tr>
						</table>
					`;

				case 'divider':
					return `
						<table
							role="presentation"
							width="100%"
							cellspacing="0"
							cellpadding="0"
							border="0"
							style="margin:30px 0;"
						>
							<tr>
								<td
									style="
										border-top:2px solid #171717;
										font-size:0;
										line-height:0;
									"
								>
									&nbsp;
								</td>
							</tr>
						</table>
					`;

				default:
					return '';
			}
		})
		.join('');
}

export function buildEmailHtml(contentHtml: string): string {
	return `<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="UTF-8" />
		<meta
			name="viewport"
			content="width=device-width, initial-scale=1.0"
		/>
		<meta name="x-apple-disable-message-reformatting" />

		<title>Haven Brisbane</title>

		<!--
			These fonts are used where the email client supports web fonts.
			Important content remains readable with the fallbacks.
		-->
		<link
			href="https://fonts.googleapis.com/css2?family=Darumadrop+One&family=Jua&display=swap"
			rel="stylesheet"
		/>

		<style>
			@media only screen and (max-width: 600px) {
				.email-shell {
					width: 100% !important;
				}

				.email-padding {
					padding-left: 22px !important;
					padding-right: 22px !important;
				}

				.hero-title {
					font-size: 42px !important;
				}
			}
		</style>
	</head>

	<body
		style="
			margin:0;
			padding:0;
			background:#DFA063;
		"
	>
		<table
			role="presentation"
			width="100%"
			cellspacing="0"
			cellpadding="0"
			border="0"
			style="
				width:100%;
				background:#DFA063;
			"
		>
			<tr>
				<td
					align="center"
					style="padding:28px 12px;"
				>

					<!-- Main email -->
					<table
						role="presentation"
						width="640"
						cellspacing="0"
						cellpadding="0"
						border="0"
						class="email-shell"
						style="
							width:100%;
							max-width:640px;
							background:#ffffff;
							border:3px solid #171717;
							border-radius:14px;
							box-shadow:0 7px 0 #171717;
							overflow:hidden;
						"
					>

						<!-- Header -->
						<tr>
							<td
								class="email-padding"
								style="
									padding:26px 30px;
									background:#B8C11F;
									border-bottom:3px solid #171717;
								"
							>
								<table
									role="presentation"
									width="100%"
									cellspacing="0"
									cellpadding="0"
									border="0"
								>
									<tr>
										<td
											style="
												color:#171717;
												font-family:'Jua',Arial,sans-serif;
												font-size:17px;
												line-height:1;
											"
										>
											Haven Brisbane
										</td>
									</tr>
								</table>
							</td>
						</tr>

						<!-- Content -->
						<tr>
							<td
								class="email-padding"
								style="
									padding:34px 30px 30px;
									background:#f9dd60;
								"
							>
								${contentHtml}
							</td>
						</tr>

						<!-- Footer -->
						<tr>
							<td
								class="email-padding"
								style="
									padding:24px 30px;
									background:#783D2B;
									border-top:3px solid #171717;
								"
							>
								<div
									style="
										color:#E0E0E0;
										font-family:'Darumadrop One',Arial,sans-serif;
										font-size:24px;
										line-height:1;
									"
								>
									Haven Brisbane
								</div>

								<div
									style="
										margin-top:10px;
										color:#E0E0E0;
										font-family:'Jua',Arial,sans-serif;
										font-size:13px;
										line-height:1.5;
									"
								>
									A Hack Club event for making,
									learning and hanging out.
								</div>
							</td>
						</tr>
					</table>
				</td>
			</tr>
		</table>
	</body>
</html>`;
}
