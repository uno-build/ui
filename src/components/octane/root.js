import { createUniversalRoot } from 'octane/universal';
import {
	createUniversalContainer,
	createUniversalDriver,
} from './driver.js';

export function createUniversalRendererRoot({ props }) {
	console.log('[universal] createUniversalRendererRoot', props);

	const host = createUniversalRoot(
		createUniversalContainer(),
		createUniversalDriver(),
	);

	return {
		render(component, props) {
			host.render(component, props);
		},
		unmount() {
			host.unmount();
		},
	};
}
