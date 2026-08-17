import { RENDERER_ID } from './config.js';

export function createUniversalContainer() {
	return { renderer: RENDERER_ID };
}

export function createUniversalDriver() {
	return {
		id: RENDERER_ID,
		capabilities: { text: 'ignore' },
		prepareBatch(_container, batch) {
			console.log('[universal] prepare', batch);
			return {
				apply() {
					console.log('[universal] apply', batch);
				},
				abort() {
					console.log('[universal] abort', batch);
				},
			};
		},
		getPublicInstance() {
			return null;
		},
	};
}
