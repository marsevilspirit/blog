const DEFAULT_EXCERPT_LENGTH = 165;

export function postExcerpt(
	body: string,
	fallback: string,
	maxLength = DEFAULT_EXCERPT_LENGTH,
): string {
	const excerptSource = markdownParagraphs(body).join(' ');
	const text = excerptSource || fallback;
	return truncateAtWord(text, maxLength);
}

function markdownParagraphs(body: string): string[] {
	return body
		.split(/\n\s*\n/)
		.map((paragraph) => paragraph.trim())
		.filter((paragraph) => paragraph && !paragraph.startsWith('![') && !paragraph.startsWith('#'))
		.map(cleanMarkdown)
		.filter(Boolean);
}

function cleanMarkdown(markdown: string): string {
	return markdown
		.replace(/!\[[^\]]*]\([^)]*\)/g, '')
		.replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
		.replace(/[*_`~]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

function truncateAtWord(text: string, maxLength: number): string {
	if (text.length <= maxLength) {
		return text;
	}

	const boundary = text.lastIndexOf(' ', maxLength);
	const cutAt = boundary > maxLength * 0.7 ? boundary : maxLength;
	return `${text.slice(0, cutAt).trimEnd()}...`;
}
