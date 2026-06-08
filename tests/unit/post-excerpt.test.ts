import { describe, expect, it } from 'vitest';
import { postExcerpt } from '../../src/post-excerpt';

describe('postExcerpt', () => {
	it('uses cleaned Markdown prose before the fallback description', () => {
		const body = [
			'# Heading',
			'![Hero image](/hero.png)',
			'First [link](https://example.com) with **bold** text.',
			'Second paragraph with `code` and ~tilde~.',
		].join('\n\n');

		expect(postExcerpt(body, 'Fallback description')).toBe(
			'First link with bold text. Second paragraph with code and tilde.',
		);
	});

	it('falls back when the body has no excerptable prose', () => {
		const body = '# Heading\n\n![Hero image](/hero.png)';

		expect(postExcerpt(body, 'Fallback description')).toBe('Fallback description');
	});

	it('truncates at a word boundary when one is close to the requested length', () => {
		const body = 'Alpha beta gamma delta epsilon';

		expect(postExcerpt(body, 'Fallback description', 19)).toBe('Alpha beta gamma...');
	});

	it('uses a hard cutoff when there is no useful word boundary', () => {
		const body = 'supercalifragilisticexpialidocious';

		expect(postExcerpt(body, 'Fallback description', 12)).toBe('supercalifra...');
	});
});
