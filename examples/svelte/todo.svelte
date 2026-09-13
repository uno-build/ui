<script module lang="ts">
import type ResourcesDom from 'uno-ui/ResourcesDom'
import type ResourcesWebGPU from 'uno-ui/ResourcesWebGPU'
import { loadImage, loadJson } from '../../tests/utils/load-assets'

const TITLE_FONT_FAMILY = 'ChangaOne-Regular'
const TEXT_FONT_FAMILY = 'Poppins-Regular'
const COIN_SRC = 'assets/images/coin.png'

export async function loadResources(resources: ResourcesDom | ResourcesWebGPU) {
    const [coin, text_font_image, text_font_json, title_font_image, title_font_json] = await Promise.all([
        loadImage(`/${COIN_SRC}`),
        loadImage(`/assets/fonts/${TEXT_FONT_FAMILY}.mtsdf.png`),
        loadJson(`/assets/fonts/${TEXT_FONT_FAMILY}.mtsdf.json`),
        loadImage(`/assets/fonts/${TITLE_FONT_FAMILY}.mtsdf.png`),
        loadJson(`/assets/fonts/${TITLE_FONT_FAMILY}.mtsdf.json`),
    ])
    resources.registerImage(COIN_SRC, coin)
    resources.registerFont(TEXT_FONT_FAMILY, text_font_image, text_font_json)
    resources.registerFont(TITLE_FONT_FAMILY, title_font_image, title_font_json)
}
</script>

<script lang="ts">
import { onMount, untrack } from 'svelte'
import { Image, Input, ScrollView, Text, View } from 'uno-ui/svelte'
import type { InputHandle } from 'uno-ui/svelte'
import type { NodeEventMap } from 'uno-ui/events'

const MAX_TITLE_LENGTH = 48
const DOUBLE_CLICK_DELAY = 320
const LIST_HEIGHT = 268
const LIST_BORDER = 1
const LIST_PADDING = 12

const INITIAL_TODOS = [
    { id: 1, title: 'Render a todo list on the GPU', completed: true },
    { id: 2, title: 'Hover the buttons to see them react', completed: false },
    { id: 3, title: 'Double click a row to rename it', completed: false },
    { id: 4, title: 'Add a new todo item', completed: false },
    { id: 5, title: 'Try out the new features', completed: true },
    { id: 6, title: 'Delete completed todos', completed: false },
]

type Todo = { id: number; title: string; completed: boolean }

const FILTER_PREDICATES = {
    all: () => true,
    active: (todo: Todo) => todo.completed === false,
    completed: (todo: Todo) => todo.completed,
}
const FILTER_NAMES = Object.keys(FILTER_PREDICATES) as (keyof typeof FILTER_PREDICATES)[]

const PAGE_STYLE = {
    width: '100%',
    height: '100%',
    padding: '32px',
    alignItems: 'center',
    justifyContent: 'center',
}
const CARD_STYLE = {
    width: '620px',
    flexDirection: 'column',
    gap: '20px',
    padding: '28px',
    backgroundColor: '#ffffff',
    border: '1px solid #e8eef2',
    borderRadius: '24px',
}
const HEADER_STYLE = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '16px',
}
const BADGE_STYLE = {
    width: '64px',
    height: '64px',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff3e00',
    border: '1px solid #e8eef2',
    borderRadius: '20px',
}
const HEADER_TEXTS_STYLE = {
    flex: '1',
    flexDirection: 'column',
    gap: '4px',
}
const TITLE_STYLE = {
    fontFamily: TITLE_FONT_FAMILY,
    fontSize: '32px',
    color: '#141414',
    letterSpacing: '0.5px',
    textShadow: '0px 3px 0px #1414141a',
}
const SUBTITLE_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '13px',
    lineHeight: '18px',
    color: '#141414',
}
const DIVIDER_STYLE = {
    height: '1px',
    backgroundColor: '#e8eef2',
}
const NEW_TODO_STYLE = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '12px',
}
const FIELD_STYLE = {
    flex: '1',
}
const DRAFT_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    color: '#141414',
    letterSpacing: '0.3px',
    backgroundColor: '#ffffff',
    border: '2px solid #e8eef2',
    borderRadius: '14px',
    padding: '12px 16px',
}
const DRAFT_FOCUS_STYLE = {
    border: '2px solid #ff3e00',
    boxShadow: '0px 0px 0px 4px #ff3e002e',
}
const BUTTON_STYLE = {
    alignItems: 'center',
    justifyContent: 'center',
    padding: '13px 20px',
    backgroundColor: '#ffffff',
    border: '2px solid #e8eef2',
    borderRadius: '14px',
}
const BUTTON_HOVER_STYLE = {
    backgroundColor: '#ebf0f4',
    border: '2px solid #ff3e00',
}
const BUTTON_PRESSED_STYLE = {
    backgroundColor: '#ff3e00',
    border: '2px solid #ff3e00',
}
const BUTTON_TEXT_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '12px',
    letterSpacing: '1.4px',
    color: '#d43109',
}
const BUTTON_TEXT_HOVER_STYLE = {
    color: '#d43109',
}
const BUTTON_TEXT_PRESSED_STYLE = {
    color: '#ffffff',
}
const TOOLBAR_STYLE = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8px',
}
const SPACER_STYLE = {
    flex: '1',
}
const PILL_STYLE = {
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 14px',
    backgroundColor: '#ffffff',
    border: '2px solid #e8eef2',
    borderRadius: '999px',
}
const PILL_HOVER_STYLE = {
    backgroundColor: '#ebf0f4',
    border: '2px solid #ff3e00',
}
const PILL_SELECTED_STYLE = {
    backgroundColor: '#ebf0f4',
    border: '2px solid #ff3e00',
}
const PILL_TEXT_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '12px',
    letterSpacing: '1.2px',
    color: '#141414',
}
const PILL_TEXT_HIGHLIGHT_STYLE = {
    color: '#d43109',
}
const LIST_STYLE = {
    height: `${LIST_HEIGHT}px`,
    backgroundColor: '#ffffff',
    border: `${LIST_BORDER}px solid #e8eef2`,
    borderRadius: '18px',
}
const LIST_CONTENT_STYLE = {
    flexDirection: 'column',
    padding: `${LIST_PADDING}px`,
    gap: '8px',
}
// The scroll content is sized by its children, so the empty state spans the list to center inside it.
const EMPTY_STYLE = {
    height: `${LIST_HEIGHT - (LIST_BORDER + LIST_PADDING) * 2}px`,
    alignItems: 'center',
    justifyContent: 'center',
}
const EMPTY_TEXT_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '13px',
    color: '#14141480',
}
const ITEM_STYLE = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    backgroundColor: '#ffffff',
    border: '1px solid #e8eef2',
    borderRadius: '14px',
}
const ITEM_HOVER_STYLE = {
    backgroundColor: '#ebf0f4',
    border: '1px solid #ff3e00',
}
const CHECK_STYLE = {
    width: '24px',
    height: '24px',
    flexShrink: '0',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #e8eef2',
    borderRadius: '999px',
}
const CHECK_HOVER_STYLE = {
    backgroundColor: '#ff3e00',
    border: '2px solid #ff3e00',
}
const CHECK_DONE_STYLE = {
    backgroundColor: '#ff3e00',
    border: '2px solid #ff3e00',
}
const CHECK_DOT_STYLE = {
    width: '10px',
    height: '10px',
    borderRadius: '999px',
    backgroundColor: '#ffffff',
}
const ITEM_TEXT_STYLE = {
    flex: '1',
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '14px',
    lineHeight: '20px',
    color: '#141414',
}
const ITEM_TEXT_DONE_STYLE = {
    color: '#14141480',
}
const EDIT_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    color: '#141414',
    letterSpacing: '0.3px',
    backgroundColor: '#ffffff',
    border: '2px solid #ff3e00',
    borderRadius: '10px',
    padding: '5px 10px',
}
const DESTROY_STYLE = {
    width: '26px',
    height: '26px',
    flexShrink: '0',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '999px',
    opacity: '0',
}
const DESTROY_VISIBLE_STYLE = {
    backgroundColor: '#ebf0f4',
    opacity: '1',
}
const DESTROY_HOVER_STYLE = {
    backgroundColor: '#ff3e00',
}
const DESTROY_TEXT_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '13px',
    color: '#d43109',
}
const DESTROY_TEXT_HOVER_STYLE = {
    color: '#ffffff',
}
const FOOTER_STYLE = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
}
const COUNT_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '12px',
    color: '#141414',
}
const CLEAR_STYLE = {
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 14px',
    backgroundColor: '#ffffff',
    border: '2px solid #e8eef2',
    borderRadius: '999px',
}
const CLEAR_HOVER_STYLE = {
    backgroundColor: '#ff3e00',
    border: '2px solid #ff3e00',
}
const CLEAR_TEXT_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '12px',
    letterSpacing: '1.2px',
    color: '#d43109',
}
const CLEAR_TEXT_HOVER_STYLE = {
    color: '#ffffff',
}

let {
    backgroundColor: background_color = '#ebf0f4',
    boxShadow: box_shadow = '0px 24px 50px -12px #1414141a',
}: { backgroundColor?: string; boxShadow?: string } = $props()

let draft_ref = $state<InputHandle | null>(null)
let edit_ref = $state<InputHandle | null>(null)
let next_id = INITIAL_TODOS.length + 1
let last_label_click: { id: number | null; time: number } = { id: null, time: 0 }
let todos = $state(INITIAL_TODOS)
let filter = $state<keyof typeof FILTER_PREDICATES>('all')
let draft = $state('')
let draft_focused = $state(false)
let editing_id = $state<number | null>(null)
let edit_draft = $state('')
let hovered = $state<string | null>(null)
let hovered_id = $state<number | null>(null)
let pressed = $state<string | null>(null)

const visible_todos = $derived(todos.filter(FILTER_PREDICATES[filter]))
const remaining = $derived(todos.filter(FILTER_PREDICATES.active).length)
const completed_count = $derived(todos.length - remaining)

const is_browser = typeof document !== 'undefined'
let keyboard_input: HTMLInputElement | null = null

function addTodo(title: string) {
    const next_title = title.trim()

    if (next_title === '') {
        return
    }

    const id = next_id++
    todos = [...todos, { id, title: next_title, completed: false }]
    draft = ''
}

function toggleTodo(id: number) {
    todos = todos.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo))
}

function removeTodo(id: number) {
    todos = todos.filter((todo) => todo.id !== id)
}

function toggleAll() {
    const completed = remaining > 0
    todos = todos.map((todo) => ({ ...todo, completed }))
}

function clearCompleted() {
    todos = todos.filter(FILTER_PREDICATES.active)
}

function commitEdit(title: string) {
    const next_title = title.trim()

    todos = next_title === ''
        ? todos.filter((todo) => todo.id !== editing_id)
        : todos.map((todo) => (todo.id === editing_id ? { ...todo, title: next_title } : todo))
    editing_id = null
    hideKeyboard()
}

function cancelEdit() {
    editing_id = null
    hideKeyboard()
}

function onLabelClick(todo: Todo) {
    const time = Date.now()
    const is_double_click =
        last_label_click.id === todo.id && time - last_label_click.time < DOUBLE_CLICK_DELAY

    last_label_click = { id: todo.id, time }

    if (is_double_click) {
        editing_id = todo.id
        edit_draft = todo.title
    }
}

function onDraftFocus(event: NodeEventMap['focus']) {
    draft_focused = true
    showKeyboard({
        node: event.target,
        value: draft,
        onChange: (value) => { draft = value },
        onSubmit: addTodo,
        onCancel: () => { draft = '' },
    })
}

function onEditFocus(event: NodeEventMap['focus']) {
    showKeyboard({
        node: event.target,
        value: edit_draft,
        onChange: (value) => { edit_draft = value },
        onSubmit: commitEdit,
        onCancel: cancelEdit,
    })
}

function showKeyboard({ node, value, onChange, onSubmit, onCancel }: {
    node: NodeEventMap['focus']['target']
    value: string
    onChange(value: string): void
    onSubmit(title: string): void
    onCancel(): void
}) {
    if (!is_browser) {
        return
    }

    if (keyboard_input === null) {
        keyboard_input = document.createElement('input')
        keyboard_input.style.position = 'fixed'
        keyboard_input.style.width = '1px'
        keyboard_input.style.height = '1px'
        keyboard_input.style.opacity = '0'
        keyboard_input.style.pointerEvents = 'none'
        keyboard_input.style.left = '0'
        keyboard_input.style.bottom = '0'
        keyboard_input.tabIndex = -1
        keyboard_input.maxLength = MAX_TITLE_LENGTH
        document.body.appendChild(keyboard_input)
    }

    const input = keyboard_input
    input.value = value
    input.oninput = () => onChange(input.value)
    input.onkeydown = (event) => {
        if (event.key === 'Enter') {
            const submitted_value = input.value
            input.value = ''
            onSubmit(submitted_value)
        } else if (event.key === 'Escape') {
            input.value = ''
            onCancel()
        }
    }
    input.onblur = () => node.blur()
    input.focus({ preventScroll: true })
}

function hideKeyboard() {
    if (keyboard_input === null) {
        return
    }

    keyboard_input.onblur = null
    keyboard_input.blur()
}

onMount(() => {
    draft_ref!.focus()

    return () => {
        if (keyboard_input === null) {
            return
        }

        keyboard_input.oninput = null
        keyboard_input.onkeydown = null
        keyboard_input.onblur = null
        keyboard_input.remove()
    }
})

$effect(() => {
    if (editing_id !== null) {
        untrack(() => edit_ref!.focus())
    }
})
</script>

<View style={{ ...PAGE_STYLE, backgroundColor: background_color }}>
    <View style={{ ...CARD_STYLE, boxShadow: box_shadow }}>
        <View style={HEADER_STYLE}>
            <View style={BADGE_STYLE}>
                <Image src={COIN_SRC} width="42px" />
            </View>
            <View style={HEADER_TEXTS_STYLE}>
                <Text style={TITLE_STYLE}>Todo App</Text>
                <Text style={SUBTITLE_STYLE}>Type to add, click to complete, double click to rename.</Text>
            </View>
        </View>

        <View style={DIVIDER_STYLE} />

        <View style={NEW_TODO_STYLE}>
            <View style={FIELD_STYLE}>
                <Input
                    bind:this={draft_ref}
                    style={{ ...DRAFT_STYLE, ...(draft_focused && DRAFT_FOCUS_STYLE) }}
                    value={draft}
                    placeholder="What needs to be done?"
                    placeholderTextColor="#14141480"
                    onFocus={onDraftFocus}
                    onBlur={() => { draft_focused = false }}
                />
            </View>
            <View
                style={{
                    ...BUTTON_STYLE,
                    ...(hovered === 'add' && BUTTON_HOVER_STYLE),
                    ...(pressed === 'add' && BUTTON_PRESSED_STYLE),
                }}
                onPointerOver={() => { hovered = 'add' }}
                onPointerOut={() => { hovered = null }}
                onPointerDown={() => { pressed = 'add' }}
                onPointerUp={() => { pressed = null }}
                onClick={() => addTodo(draft)}
            >
                <Text
                    style={{
                        ...BUTTON_TEXT_STYLE,
                        ...(hovered === 'add' && BUTTON_TEXT_HOVER_STYLE),
                        ...(pressed === 'add' && BUTTON_TEXT_PRESSED_STYLE),
                    }}
                >ADD</Text>
            </View>
        </View>

        {#if todos.length > 0}
            <View style={TOOLBAR_STYLE}>
                <View
                    style={{
                        ...PILL_STYLE,
                        ...(hovered === 'toggle-all' && PILL_HOVER_STYLE),
                        ...(pressed === 'toggle-all' && PILL_SELECTED_STYLE),
                    }}
                    onPointerOver={() => { hovered = 'toggle-all' }}
                    onPointerOut={() => { hovered = null }}
                    onPointerDown={() => { pressed = 'toggle-all' }}
                    onPointerUp={() => { pressed = null }}
                    onClick={toggleAll}
                >
                    <Text
                        style={{
                            ...PILL_TEXT_STYLE,
                            ...(hovered === 'toggle-all' && PILL_TEXT_HIGHLIGHT_STYLE),
                        }}
                    >{remaining > 0 ? 'COMPLETE ALL' : 'REOPEN ALL'}</Text>
                </View>

                <View style={SPACER_STYLE} />

                {#each FILTER_NAMES as name (name)}
                    <View
                        style={{
                            ...PILL_STYLE,
                            ...(hovered === `filter:${name}` && PILL_HOVER_STYLE),
                            ...(filter === name && PILL_SELECTED_STYLE),
                        }}
                        onPointerOver={() => { hovered = `filter:${name}` }}
                        onPointerOut={() => { hovered = null }}
                        onClick={() => { filter = name }}
                    >
                        <Text
                            style={{
                                ...PILL_TEXT_STYLE,
                                ...((filter === name || hovered === `filter:${name}`) && PILL_TEXT_HIGHLIGHT_STYLE),
                            }}
                        >{name.toUpperCase()}</Text>
                    </View>
                {/each}
            </View>
        {/if}

        <ScrollView style={LIST_STYLE}>
            <View style={LIST_CONTENT_STYLE}>
                {#if visible_todos.length === 0}
                    <View style={EMPTY_STYLE}>
                        <Text style={EMPTY_TEXT_STYLE}>Nothing to show here.</Text>
                    </View>
                {/if}

                {#each visible_todos as todo (todo.id)}
                    <View
                        style={{ ...ITEM_STYLE, ...(hovered_id === todo.id && ITEM_HOVER_STYLE) }}
                        onPointerOver={() => { hovered_id = todo.id }}
                        onPointerOut={() => { hovered_id = null }}
                    >
                        <View
                            style={{
                                ...CHECK_STYLE,
                                ...(todo.completed && CHECK_DONE_STYLE),
                                ...(hovered === `check:${todo.id}` && CHECK_HOVER_STYLE),
                            }}
                            onPointerOver={() => { hovered = `check:${todo.id}` }}
                            onPointerOut={() => { hovered = null }}
                            onClick={() => toggleTodo(todo.id)}
                        >
                            {#if todo.completed}
                                <View style={CHECK_DOT_STYLE} />
                            {/if}
                        </View>

                        {#if editing_id === todo.id}
                            <View style={FIELD_STYLE}>
                                <Input
                                    bind:this={edit_ref}
                                    style={EDIT_STYLE}
                                    value={edit_draft}
                                    onFocus={onEditFocus}
                                    onBlur={() => commitEdit(edit_draft)}
                                />
                            </View>
                        {:else}
                            <Text
                                style={{ ...ITEM_TEXT_STYLE, ...(todo.completed && ITEM_TEXT_DONE_STYLE) }}
                                onClick={() => onLabelClick(todo)}
                            >{todo.title}</Text>
                        {/if}

                        <View
                            style={{
                                ...DESTROY_STYLE,
                                ...(hovered_id === todo.id && DESTROY_VISIBLE_STYLE),
                                ...(hovered === `destroy:${todo.id}` && DESTROY_HOVER_STYLE),
                            }}
                            onPointerOver={() => { hovered = `destroy:${todo.id}` }}
                            onPointerOut={() => { hovered = null }}
                            onClick={() => removeTodo(todo.id)}
                        >
                            <Text
                                style={{
                                    ...DESTROY_TEXT_STYLE,
                                    ...(hovered === `destroy:${todo.id}` && DESTROY_TEXT_HOVER_STYLE),
                                }}
                            >x</Text>
                        </View>
                    </View>
                {/each}
            </View>
        </ScrollView>

        {#if todos.length > 0}
            <View style={DIVIDER_STYLE} />
            <View style={FOOTER_STYLE}>
                <Text style={COUNT_STYLE}>{remaining} {remaining === 1 ? 'item' : 'items'} left</Text>
                {#if completed_count > 0}
                    <View
                        style={{ ...CLEAR_STYLE, ...(hovered === 'clear' && CLEAR_HOVER_STYLE) }}
                        onPointerOver={() => { hovered = 'clear' }}
                        onPointerOut={() => { hovered = null }}
                        onClick={clearCompleted}
                    >
                        <Text
                            style={{
                                ...CLEAR_TEXT_STYLE,
                                ...(hovered === 'clear' && CLEAR_TEXT_HOVER_STYLE),
                            }}
                        >CLEAR COMPLETED ({completed_count})</Text>
                    </View>
                {/if}
            </View>
        {/if}
    </View>
</View>
