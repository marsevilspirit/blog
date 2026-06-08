const mainContentAnimation = {
	old: {
		name: 'main-content-out',
		duration: '180ms',
		easing: 'cubic-bezier(0.4, 0, 1, 1)',
		fillMode: 'both',
	},
	new: {
		name: 'main-content-in',
		duration: '220ms',
		easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
		fillMode: 'both',
	},
} as const;

export const mainContentTransition = {
	forwards: mainContentAnimation,
	backwards: mainContentAnimation,
} as const;
