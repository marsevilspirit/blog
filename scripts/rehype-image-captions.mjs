// @ts-check

/** @typedef {Parameters<Exclude<ReturnType<import('@astrojs/markdown-remark').RehypePlugin>, void>>[0]} HastRoot */
/** @typedef {Extract<HastRoot['children'][number], {type: 'element'}>} HastElement */

export default function rehypeImageCaptions() {
	/** @param {HastRoot | HastRoot['children'][number]} node */
	function visit(node) {
		if (!('children' in node)) return;
		for (let index = node.children.length - 1; index >= 0; index--) {
			const child = node.children[index];
			visit(child);
			if (child.type !== 'element' || child.tagName !== 'p') continue;

			/** @type {HastElement[]} */
			const blocks = [];
			/** @type {HastElement['children']} */
			let inline = [];
			const flushParagraph = () => {
				if (inline.some((part) => part.type !== 'text' || part.value.trim())) {
					blocks.push({ ...child, children: inline });
				}
				inline = [];
			};

			for (const part of child.children) {
				if (
					part.type !== 'element' ||
					part.tagName !== 'img' ||
					typeof part.properties.title !== 'string' ||
					!part.properties.title.trim()
				) {
					inline.push(part);
					continue;
				}
				flushParagraph();
				const caption = part.properties.title;
				delete part.properties.title;
				blocks.push({
					type: 'element',
					tagName: 'figure',
					properties: {},
					children: [
						part,
						{
							type: 'element',
							tagName: 'figcaption',
							properties: {},
							children: [{ type: 'text', value: caption }],
						},
					],
				});
			}
			if (blocks.length) {
				flushParagraph();
				node.children.splice(index, 1, ...blocks);
			}
		}
	}
	return visit;
}
