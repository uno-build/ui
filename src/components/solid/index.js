import { createRenderer } from '@solidjs/universal';
import { onSettled, runWithOwner } from 'solid-js';

const TEXT_NODE = '#text';
const pending_operations = [];
let update_scheduled = false;

export const viteConfigSolid = {
	include: ['**/*.tsx', '**/.jsx'],
	solid: {
		moduleName: '../src/components/solid/index.js',
		generate: 'universal',
	},
}

function enqueueOperation(name, ...args) {
	pending_operations.push([name, args]);

	if (update_scheduled) return;

	update_scheduled = true;
	runWithOwner(null, () => onSettled(flushOperations));
}

function flushOperations() {
	const operations = pending_operations.splice(0);
	update_scheduled = false;

	for (const [name, args] of operations) {
		console.log(`[solid] ${name}`, ...args);
	}

	console.log('[solid] ui.update()');
}

export function createSolidContainer(props) {
	console.log('[solid] createSolidContainer', props);

	return {
		type: 'root',
		props,
		children: [],
		parent: null,
	};
}

export const {
	render,
	effect,
	memo,
	createComponent,
	createElement,
	createTextNode,
	insertNode,
	insert,
	spread,
	setProp,
	mergeProps,
	applyRef,
	ref,
} = createRenderer({
	createElement(type, static_props) {
		enqueueOperation('createElement', type, static_props);

		return {
			type,
			props: { ...static_props },
			children: [],
			parent: null,
		};
	},
	createTextNode(value) {
		enqueueOperation('createTextNode', value);

		return {
			type: TEXT_NODE,
			value,
			children: [],
			parent: null,
		};
	},
	replaceText(text_node, value) {
		enqueueOperation('replaceText', text_node, value);
		text_node.value = value;
	},
	isTextNode(node) {
		return node.type === TEXT_NODE;
	},
	setProperty(node, name, value) {
		enqueueOperation('setProperty', node, name, value);
		node.props[name] = value;
	},
	insertNode(parent, node, anchor) {
		enqueueOperation('insertNode', parent, node, anchor);

		const index = anchor === undefined
			? parent.children.length
			: parent.children.indexOf(anchor);

		parent.children.splice(index, 0, node);
		node.parent = parent;
	},
	removeNode(parent, node) {
		enqueueOperation('removeNode', parent, node);

		parent.children.splice(parent.children.indexOf(node), 1);
		node.parent = null;
	},
	getParentNode(node) {
		return node.parent;
	},
	getFirstChild(node) {
		return node.children[0];
	},
	getNextSibling(node) {
		return node.parent.children[node.parent.children.indexOf(node) + 1];
	},
});

export {
	Errored,
	For,
	Loading,
	Match,
	Repeat,
	Reveal,
	Show,
	Switch,
} from 'solid-js';
