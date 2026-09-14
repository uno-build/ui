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

<View class="page" style={{ backgroundColor: background_color }}>
    <View class="card" style={{ boxShadow: box_shadow }}>
        <View class="header">
            <View class="badge">
                <Image src={COIN_SRC} width="42px" />
            </View>
            <View class="header-texts">
                <Text class="title">Todo App</Text>
                <Text class="subtitle">Type to add, click to complete, double click to rename.</Text>
            </View>
        </View>

        <View class="divider" />

        <View class="new-todo">
            <View class="field">
                <Input
                    bind:this={draft_ref}
                    class={['draft', (draft_focused && 'draft-focus')]}
                    value={draft}
                    placeholder="What needs to be done?"
                    placeholderTextColor="#14141480"
                    onFocus={onDraftFocus}
                    onBlur={() => { draft_focused = false }}
                />
            </View>
            <View
                class={['button', (hovered === 'add' && 'button-hover'), (pressed === 'add' && 'button-pressed')]}
                onPointerOver={() => { hovered = 'add' }}
                onPointerOut={() => { hovered = null }}
                onPointerDown={() => { pressed = 'add' }}
                onPointerUp={() => { pressed = null }}
                onClick={() => addTodo(draft)}
            >
                <Text
                    class={['button-text', (hovered === 'add' && 'button-text-hover'), (pressed === 'add' && 'button-text-pressed')]}
                >ADD</Text>
            </View>
        </View>

        {#if todos.length > 0}
            <View class="toolbar">
                <View
                    class={['pill', (hovered === 'toggle-all' && 'pill-hover'), (pressed === 'toggle-all' && 'pill-selected')]}
                    onPointerOver={() => { hovered = 'toggle-all' }}
                    onPointerOut={() => { hovered = null }}
                    onPointerDown={() => { pressed = 'toggle-all' }}
                    onPointerUp={() => { pressed = null }}
                    onClick={toggleAll}
                >
                    <Text
                        class={['pill-text', (hovered === 'toggle-all' && 'pill-text-highlight')]}
                    >{remaining > 0 ? 'COMPLETE ALL' : 'REOPEN ALL'}</Text>
                </View>

                <View class="spacer" />

                {#each FILTER_NAMES as name (name)}
                    <View
                        class={['pill', (hovered === `filter:${name}` && 'pill-hover'), (filter === name && 'pill-selected')]}
                        onPointerOver={() => { hovered = `filter:${name}` }}
                        onPointerOut={() => { hovered = null }}
                        onClick={() => { filter = name }}
                    >
                        <Text
                            class={['pill-text', ((filter === name || hovered === `filter:${name}`) && 'pill-text-highlight')]}
                        >{name.toUpperCase()}</Text>
                    </View>
                {/each}
            </View>
        {/if}

        <ScrollView class="list">
            <View class="list-content">
                {#if visible_todos.length === 0}
                    <View class="empty">
                        <Text class="empty-text">Nothing to show here.</Text>
                    </View>
                {/if}

                {#each visible_todos as todo (todo.id)}
                    <View
                        class={['item', (hovered_id === todo.id && 'item-hover')]}
                        onPointerOver={() => { hovered_id = todo.id }}
                        onPointerOut={() => { hovered_id = null }}
                    >
                        <View
                            class={['check', (todo.completed && 'check-done'), (hovered === `check:${todo.id}` && 'check-hover')]}
                            onPointerOver={() => { hovered = `check:${todo.id}` }}
                            onPointerOut={() => { hovered = null }}
                            onClick={() => toggleTodo(todo.id)}
                        >
                            {#if todo.completed}
                                <View class="check-dot" />
                            {/if}
                        </View>

                        {#if editing_id === todo.id}
                            <View class="field">
                                <Input
                                    bind:this={edit_ref}
                                    class="edit"
                                    value={edit_draft}
                                    onFocus={onEditFocus}
                                    onBlur={() => commitEdit(edit_draft)}
                                />
                            </View>
                        {:else}
                            <Text
                                class={['item-text', (todo.completed && 'item-text-done')]}
                                onClick={() => onLabelClick(todo)}
                            >{todo.title}</Text>
                        {/if}

                        <View
                            class={['destroy', (hovered_id === todo.id && 'destroy-visible'), (hovered === `destroy:${todo.id}` && 'destroy-hover')]}
                            onPointerOver={() => { hovered = `destroy:${todo.id}` }}
                            onPointerOut={() => { hovered = null }}
                            onClick={() => removeTodo(todo.id)}
                        >
                            <Text
                                class={['destroy-text', (hovered === `destroy:${todo.id}` && 'destroy-text-hover')]}
                            >x</Text>
                        </View>
                    </View>
                {/each}
            </View>
        </ScrollView>

        {#if todos.length > 0}
            <View class="divider" />
            <View class="footer">
                <Text class="count">{remaining} {remaining === 1 ? 'item' : 'items'} left</Text>
                {#if completed_count > 0}
                    <View
                        class={['clear', (hovered === 'clear' && 'clear-hover')]}
                        onPointerOver={() => { hovered = 'clear' }}
                        onPointerOut={() => { hovered = null }}
                        onClick={clearCompleted}
                    >
                        <Text
                            class={['clear-text', (hovered === 'clear' && 'clear-text-hover')]}
                        >CLEAR COMPLETED ({completed_count})</Text>
                    </View>
                {/if}
            </View>
        {/if}
    </View>
</View>

<style>
    .page {
        width: 100%;
        height: 100%;
        padding: 32px;
        align-items: center;
        justify-content: center;
    }

    .card {
        width: 620px;
        flex-direction: column;
        gap: 20px;
        padding: 28px;
        background-color: #ffffff;
        border: 1px solid #e8eef2;
        border-radius: 24px;
    }

    .header {
        flex-direction: row;
        align-items: center;
        gap: 16px;
    }

    .badge {
        width: 64px;
        height: 64px;
        align-items: center;
        justify-content: center;
        background-color: #ff3e00;
        border: 1px solid #e8eef2;
        border-radius: 20px;
    }

    .header-texts {
        flex: 1;
        flex-direction: column;
        gap: 4px;
    }

    .title {
        font-family: ChangaOne-Regular;
        font-size: 32px;
        color: #141414;
        letter-spacing: 0.5px;
        text-shadow: 0px 3px 0px #1414141a;
    }

    .subtitle {
        font-family: Poppins-Regular;
        font-size: 13px;
        line-height: 18px;
        color: #141414;
    }

    .divider {
        height: 1px;
        background-color: #e8eef2;
    }

    .new-todo {
        flex-direction: row;
        align-items: center;
        gap: 12px;
    }

    .field {
        flex: 1;
    }

    .page .draft {
        font-family: Poppins-Regular;
        color: #141414;
        letter-spacing: 0.3px;
        background-color: #ffffff;
        border: 2px solid #e8eef2;
        border-radius: 14px;
        padding: 12px 16px;
    }

    .page .draft-focus {
        border: 2px solid #ff3e00;
        box-shadow: 0px 0px 0px 4px #ff3e002e;
    }

    .button {
        align-items: center;
        justify-content: center;
        padding: 13px 20px;
        background-color: #ffffff;
        border: 2px solid #e8eef2;
        border-radius: 14px;
    }

    .button-hover {
        background-color: #ebf0f4;
        border: 2px solid #ff3e00;
    }

    .button-pressed {
        background-color: #ff3e00;
        border: 2px solid #ff3e00;
    }

    .button-text {
        font-family: Poppins-Regular;
        font-size: 12px;
        letter-spacing: 1.4px;
        color: #d43109;
    }

    .button-text-hover {
        color: #d43109;
    }

    .button-text-pressed {
        color: #ffffff;
    }

    .toolbar {
        flex-direction: row;
        align-items: center;
        gap: 8px;
    }

    .spacer {
        flex: 1;
    }

    .pill {
        align-items: center;
        justify-content: center;
        padding: 8px 14px;
        background-color: #ffffff;
        border: 2px solid #e8eef2;
        border-radius: 999px;
    }

    .pill-hover {
        background-color: #ebf0f4;
        border: 2px solid #ff3e00;
    }

    .pill-selected {
        background-color: #ebf0f4;
        border: 2px solid #ff3e00;
    }

    .pill-text {
        font-family: Poppins-Regular;
        font-size: 12px;
        letter-spacing: 1.2px;
        color: #141414;
    }

    .pill-text-highlight {
        color: #d43109;
    }

    .page .list {
        height: 268px;
        background-color: #ffffff;
        border: 1px solid #e8eef2;
        border-radius: 18px;
    }

    .list-content {
        flex-direction: column;
        padding: 12px;
        gap: 8px;
    }

    /* The scroll content is sized by its children; fill the list to center the empty state. */
    .empty {
        height: 242px;
        align-items: center;
        justify-content: center;
    }

    .empty-text {
        font-family: Poppins-Regular;
        font-size: 13px;
        color: #14141480;
    }

    .item {
        flex-direction: row;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        background-color: #ffffff;
        border: 1px solid #e8eef2;
        border-radius: 14px;
    }

    .item-hover {
        background-color: #ebf0f4;
        border: 1px solid #ff3e00;
    }

    .check {
        width: 24px;
        height: 24px;
        flex-shrink: 0;
        align-items: center;
        justify-content: center;
        border: 2px solid #e8eef2;
        border-radius: 999px;
    }

    .check-hover {
        background-color: #ff3e00;
        border: 2px solid #ff3e00;
    }

    .check-done {
        background-color: #ff3e00;
        border: 2px solid #ff3e00;
    }

    .check-dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background-color: #ffffff;
    }

    .item-text {
        flex: 1;
        font-family: Poppins-Regular;
        font-size: 14px;
        line-height: 20px;
        color: #141414;
    }

    .item-text-done {
        color: #14141480;
    }

    .page .edit {
        font-family: Poppins-Regular;
        color: #141414;
        letter-spacing: 0.3px;
        background-color: #ffffff;
        border: 2px solid #ff3e00;
        border-radius: 10px;
        padding: 5px 10px;
    }

    .destroy {
        width: 26px;
        height: 26px;
        flex-shrink: 0;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        opacity: 0;
    }

    .destroy-visible {
        background-color: #ebf0f4;
        opacity: 1;
    }

    .destroy-hover {
        background-color: #ff3e00;
    }

    .destroy-text {
        font-family: Poppins-Regular;
        font-size: 13px;
        color: #d43109;
    }

    .destroy-text-hover {
        color: #ffffff;
    }

    .footer {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
    }

    .count {
        font-family: Poppins-Regular;
        font-size: 12px;
        color: #141414;
    }

    .clear {
        align-items: center;
        justify-content: center;
        padding: 8px 14px;
        background-color: #ffffff;
        border: 2px solid #e8eef2;
        border-radius: 999px;
    }

    .clear-hover {
        background-color: #ff3e00;
        border: 2px solid #ff3e00;
    }

    .clear-text {
        font-family: Poppins-Regular;
        font-size: 12px;
        letter-spacing: 1.2px;
        color: #d43109;
    }

    .clear-text-hover {
        color: #ffffff;
    }
</style>
