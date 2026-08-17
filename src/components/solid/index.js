import { createRenderer } from '@solidjs/universal';

const TEXT_NODE = '#text';

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
		console.log('[solid] createElement', type, static_props);

		return {
			type,
			props: { ...static_props },
			children: [],
			parent: null,
		};
	},
	createTextNode(value) {
		console.log('[solid] createTextNode', value);

		return {
			type: TEXT_NODE,
			value,
			children: [],
			parent: null,
		};
	},
	replaceText(text_node, value) {
		console.log('[solid] replaceText', text_node, value);
		text_node.value = value;
	},
	isTextNode(node) {
		return node.type === TEXT_NODE;
	},
	setProperty(node, name, value) {
		console.log('[solid] setProperty', node, name, value);
		node.props[name] = value;
	},
	insertNode(parent, node, anchor) {
		console.log('[solid] insertNode', parent, node, anchor);

		const index = anchor === undefined
			? parent.children.length
			: parent.children.indexOf(anchor);

		parent.children.splice(index, 0, node);
		node.parent = parent;
	},
	removeNode(parent, node) {
		console.log('[solid] removeNode', parent, node);

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
