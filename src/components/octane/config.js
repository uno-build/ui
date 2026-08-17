export const RENDERER_ID = 'uno';

export const universalRenderers = {
	registry: {
		[RENDERER_ID]: {
			module: 'octane/universal',
			target: 'universal',
			server: 'client-only',
			text: 'ignore',
		},
	},
	rules: [
		{
			include: ['**/*.tsrx', '**/*.tsx'],
			renderer: RENDERER_ID,
		},
	],
};
