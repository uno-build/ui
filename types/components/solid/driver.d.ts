import type { Renderer } from '@solidjs/universal'
import type { Component } from 'solid-js'
import type Node from '../../../src/core/Node'
import type UI from '../../../src/core/UI'

export const effect: Renderer<Node>['effect']
export const memo: Renderer<Node>['memo']
export const createComponent: Renderer<Node>['createComponent']
export const createElement: Renderer<Node>['createElement']
export const createTextNode: Renderer<Node>['createTextNode']
export const insert: Renderer<Node>['insert']
export const insertNode: Renderer<Node>['insertNode']
export const spread: Renderer<Node>['spread']
export const setProp: Renderer<Node>['setProp']
export const mergeProps: Renderer<Node>['mergeProps']
export const applyRef: Renderer<Node>['applyRef']
export const ref: Renderer<Node>['ref']

export function registerRootComponent<P extends Record<string, any>>(RootComponent: Component<P>, options: { ui: UI }): {
    render(props: P): void
    unmount(): void
}
