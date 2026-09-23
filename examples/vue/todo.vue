<script lang="ts">
import type ResourcesDom from '../../src/renderer/dom/ResourcesDom'
import type ResourcesWebGPU from '../../src/renderer/webgpu/ResourcesWebGPU'
import { loadImage, loadJson } from '../shared/load-assets'
import {
    loadFont,
    FONT_NAME_CHANGA as TITLE_FONT_FAMILY,
    FONT_NAME_POPPINS as TEXT_FONT_FAMILY,
} from '../shared/assets'

const ICON_SRC = 'assets/images/vue.png'

export async function loadResources(resources: ResourcesDom | ResourcesWebGPU) {
    const [icon, text_font, title_font] = await Promise.all([
        loadImage(ICON_SRC),
        loadFont(TEXT_FONT_FAMILY, { loadImage, loadJson }),
        loadFont(TITLE_FONT_FAMILY, { loadImage, loadJson }),
    ])
    resources.registerImage(ICON_SRC, icon)
    resources.registerFont(TEXT_FONT_FAMILY, text_font)
    resources.registerFont(TITLE_FONT_FAMILY, title_font)
}
</script>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { Image, Input, ScrollView, Text, View } from '../../src/components/vue'
import type { InputHandle } from '../../src/components/vue'
import type { NodeEventMap } from '../../src/events'

const props = defineProps<{
    backgroundColor?: string
    boxShadow?: string
}>()

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

type Todo = (typeof INITIAL_TODOS)[number]

const FILTER_PREDICATES = {
    all: () => true,
    active: (todo: Todo) => todo.completed === false,
    completed: (todo: Todo) => todo.completed,
}
const FILTER_NAMES = Object.keys(FILTER_PREDICATES) as (keyof typeof FILTER_PREDICATES)[]

const LIST_STYLE = {
    height: `${LIST_HEIGHT}px`,
    border: `${LIST_BORDER}px solid #0a1f16`,
}
const LIST_CONTENT_STYLE = {
    padding: `${LIST_PADDING}px`,
}
// The scroll content is sized by its children, so the empty state spans the list to center inside it.
const EMPTY_STYLE = {
    height: `${LIST_HEIGHT - (LIST_BORDER + LIST_PADDING) * 2}px`,
}

const draft_ref = ref<InputHandle | null>(null)
let edit_ref: InputHandle | null = null
let next_id = INITIAL_TODOS.length + 1
let last_label_click: { id: number | null; time: number } = { id: null, time: 0 }
const todos = ref(INITIAL_TODOS)
const filter = ref<keyof typeof FILTER_PREDICATES>('all')
const draft = ref('')
const draft_focused = ref(false)
const editing_id = ref<number | null>(null)
const edit_draft = ref('')
const hovered = ref<string | null>(null)
const hovered_id = ref<number | null>(null)
const pressed = ref<string | null>(null)

const visible_todos = computed(() => todos.value.filter(FILTER_PREDICATES[filter.value]))
const remaining = computed(() => todos.value.filter(FILTER_PREDICATES.active).length)
const completed_count = computed(() => todos.value.length - remaining.value)

const is_browser = typeof document !== 'undefined'
let keyboard_input: HTMLInputElement | null = null

function addTodo(title: string) {
    const next_title = title.trim()

    if (next_title === '') {
        return
    }

    const id = next_id++
    todos.value = [...todos.value, { id, title: next_title, completed: false }]
    draft.value = ''
}

function toggleTodo(id: number) {
    todos.value = todos.value.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo))
}

function removeTodo(id: number) {
    todos.value = todos.value.filter((todo) => todo.id !== id)
}

function toggleAll() {
    const completed = remaining.value > 0
    todos.value = todos.value.map((todo) => ({ ...todo, completed }))
}

function clearCompleted() {
    todos.value = todos.value.filter(FILTER_PREDICATES.active)
}

function commitEdit(title: string) {
    const next_title = title.trim()

    todos.value =
        next_title === ''
            ? todos.value.filter((todo) => todo.id !== editing_id.value)
            : todos.value.map((todo) => (todo.id === editing_id.value ? { ...todo, title: next_title } : todo))
    editing_id.value = null
    hideKeyboard()
}

function cancelEdit() {
    editing_id.value = null
    hideKeyboard()
}

function onLabelClick(todo: Todo) {
    const time = Date.now()
    const is_double_click = last_label_click.id === todo.id && time - last_label_click.time < DOUBLE_CLICK_DELAY

    last_label_click = { id: todo.id, time }

    if (is_double_click) {
        editing_id.value = todo.id
        edit_draft.value = todo.title
    }
}

function setEditRef(handle: unknown) {
    edit_ref = handle as InputHandle | null
}

function onDraftFocus(event: NodeEventMap['focus']) {
    draft_focused.value = true
    showKeyboard({
        node: event.target,
        value: draft.value,
        onChange: (value) => {
            draft.value = value
        },
        onSubmit: addTodo,
        onCancel: () => {
            draft.value = ''
        },
    })
}

function onEditFocus(event: NodeEventMap['focus']) {
    showKeyboard({
        node: event.target,
        value: edit_draft.value,
        onChange: (value) => {
            edit_draft.value = value
        },
        onSubmit: commitEdit,
        onCancel: cancelEdit,
    })
}

function showKeyboard({
    node,
    value,
    onChange,
    onSubmit,
    onCancel,
}: {
    node: NodeEventMap['focus']['target']
    value: string
    onChange: (value: string) => void
    onSubmit: (title: string) => void
    onCancel: () => void
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

onMounted(() => {
    draft_ref.value!.focus()
})

watch(
    editing_id,
    (id) => {
        if (id !== null) {
            edit_ref!.focus()
        }
    },
    { flush: 'post' },
)

onUnmounted(() => {
    if (keyboard_input === null) {
        return
    }

    keyboard_input.oninput = null
    keyboard_input.onkeydown = null
    keyboard_input.onblur = null
    keyboard_input.remove()
})
</script>

<template>
    <View class="page" :style="{ backgroundColor: props.backgroundColor }">
        <View class="card" :style="{ boxShadow: props.boxShadow }">
            <View class="header">
                <View class="badge">
                    <Image :src="ICON_SRC" width="42px" />
                </View>
                <View class="header-texts">
                    <Text class="title">Vue Todo App</Text>
                    <Text class="subtitle">Type to add, click to complete, double click to rename.</Text>
                </View>
            </View>

            <View class="divider" />

            <View class="new-todo">
                <View class="field">
                    <Input
                        ref="draft_ref"
                        class="draft"
                        :class="{ 'draft-focus': draft_focused }"
                        :value="draft"
                        placeholder="What needs to be done?"
                        placeholder-text-color="#658273"
                        @focus="onDraftFocus"
                        @blur="draft_focused = false"
                    />
                </View>
                <View
                    class="button"
                    :class="{
                        'button-hover': hovered === 'add',
                        'button-pressed': pressed === 'add',
                    }"
                    @pointerover="hovered = 'add'"
                    @pointerout="hovered = null"
                    @pointerdown="pressed = 'add'"
                    @pointerup="pressed = null"
                    @click="addTodo(draft)"
                >
                    <Text
                        class="button-text"
                        :class="{
                            'button-text-hover': hovered === 'add',
                            'button-text-pressed': pressed === 'add',
                        }"
                    >
                        ADD
                    </Text>
                </View>
            </View>

            <View v-if="todos.length > 0" class="toolbar">
                <View
                    class="pill"
                    :class="{
                        'pill-hover': hovered === 'toggle-all',
                        'pill-selected': pressed === 'toggle-all',
                    }"
                    @pointerover="hovered = 'toggle-all'"
                    @pointerout="hovered = null"
                    @pointerdown="pressed = 'toggle-all'"
                    @pointerup="pressed = null"
                    @click="toggleAll"
                >
                    <Text class="pill-text" :class="{ 'pill-text-highlight': hovered === 'toggle-all' }">
                        {{ remaining > 0 ? 'COMPLETE ALL' : 'REOPEN ALL' }}
                    </Text>
                </View>

                <View class="spacer" />

                <View
                    v-for="name in FILTER_NAMES"
                    :key="name"
                    class="pill"
                    :class="{
                        'pill-hover': hovered === `filter:${name}`,
                        'pill-selected': filter === name,
                    }"
                    @pointerover="hovered = `filter:${name}`"
                    @pointerout="hovered = null"
                    @click="filter = name"
                >
                    <Text
                        class="pill-text"
                        :class="{ 'pill-text-highlight': filter === name || hovered === `filter:${name}` }"
                    >
                        {{ name.toUpperCase() }}
                    </Text>
                </View>
            </View>

            <ScrollView class="list" :style="LIST_STYLE">
                <View class="list-content" :style="LIST_CONTENT_STYLE">
                    <View v-if="visible_todos.length === 0" class="empty" :style="EMPTY_STYLE">
                        <Text class="empty-text">Nothing to show here.</Text>
                    </View>

                    <View
                        v-for="todo in visible_todos"
                        :key="todo.id"
                        class="item"
                        :class="{ 'item-hover': hovered_id === todo.id }"
                        @pointerover="hovered_id = todo.id"
                        @pointerout="hovered_id = null"
                    >
                        <View
                            class="check"
                            :class="{
                                'check-done': todo.completed,
                                'check-hover': hovered === `check:${todo.id}`,
                            }"
                            @pointerover="hovered = `check:${todo.id}`"
                            @pointerout="hovered = null"
                            @click="toggleTodo(todo.id)"
                        >
                            <View v-if="todo.completed" class="check-dot" />
                        </View>

                        <View v-if="editing_id === todo.id" class="field">
                            <Input
                                :ref="setEditRef"
                                class="edit"
                                :value="edit_draft"
                                @focus="onEditFocus"
                                @blur="commitEdit(edit_draft)"
                            />
                        </View>
                        <Text
                            v-else
                            class="item-text"
                            :class="{ 'item-text-done': todo.completed }"
                            @click="onLabelClick(todo)"
                        >
                            {{ todo.title }}
                        </Text>

                        <View
                            class="destroy"
                            :class="{
                                'destroy-visible': hovered_id === todo.id,
                                'destroy-hover': hovered === `destroy:${todo.id}`,
                            }"
                            @pointerover="hovered = `destroy:${todo.id}`"
                            @pointerout="hovered = null"
                            @click="removeTodo(todo.id)"
                        >
                            <Text
                                class="destroy-text"
                                :class="{ 'destroy-text-hover': hovered === `destroy:${todo.id}` }"
                            >
                                x
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View v-if="todos.length > 0" class="divider" />

            <View v-if="todos.length > 0" class="footer">
                <Text class="count">{{ remaining }} {{ remaining === 1 ? 'item' : 'items' }} left</Text>
                <View
                    v-if="completed_count > 0"
                    class="clear"
                    :class="{ 'clear-hover': hovered === 'clear' }"
                    @pointerover="hovered = 'clear'"
                    @pointerout="hovered = null"
                    @click="clearCompleted"
                >
                    <Text class="clear-text" :class="{ 'clear-text-hover': hovered === 'clear' }">
                        CLEAR COMPLETED ({{ completed_count }})
                    </Text>
                </View>
            </View>
        </View>
    </View>
</template>

<style scoped>
.page {
    width: 100%;
    height: 100%;
    padding: 32px;
    background-color: #f2f7f4;
    align-items: center;
    justify-content: center;
}

.card {
    width: 620px;
    flex-direction: column;
    gap: 20px;
    padding: 28px;
    background-color: #ffffff;
    border: 1px solid #0a1f16;
    border-radius: 24px;
    box-shadow: 0px 24px 50px -12px #0a1f1633;
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
    background-color: #d9f0e4;
    border: 1px solid #0a1f16;
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
    color: #0a1f16;
    letter-spacing: 0.5px;
}

.subtitle {
    font-family: Poppins-Regular;
    font-size: 13px;
    line-height: 18px;
    color: #658273;
}

.divider {
    height: 1px;
    background-color: #a8cdb8;
}

.new-todo {
    flex-direction: row;
    align-items: center;
    gap: 12px;
}

.field {
    flex: 1;
}

.draft {
    font-family: Poppins-Regular;
    color: #0a1f16;
    letter-spacing: 0.3px;
    background-color: #eaf4ee;
    border: 2px solid #0a1f16;
    border-radius: 14px;
    padding: 12px 16px;
}

.draft-focus {
    border: 2px solid #1f8a5b;
    box-shadow: 0px 0px 0px 4px #1f8a5b2e;
}

.button {
    align-items: center;
    justify-content: center;
    padding: 13px 20px;
    background-color: #ffffff;
    border: 2px solid #0a1f16;
    border-radius: 14px;
}

.button-hover {
    background-color: #1f8a5b;
    border: 2px solid #1f8a5b;
}

.button-pressed {
    background-color: #e8a33d;
    border: 2px solid #e8a33d;
}

.button-text {
    font-family: Poppins-Regular;
    font-size: 12px;
    letter-spacing: 1.4px;
    color: #0a1f16;
}

.button-text-hover {
    color: #ffffff;
}

.button-text-pressed {
    color: #0a1f16;
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
    border: 2px solid #0a1f16;
    border-radius: 999px;
}

.pill-hover {
    background-color: #d9f0e4;
    border: 2px solid #1f8a5b;
}

.pill-selected {
    background-color: #fdefd6;
    border: 2px solid #e8a33d;
}

.pill-text {
    font-family: Poppins-Regular;
    font-size: 12px;
    letter-spacing: 1.2px;
    color: #658273;
}

.pill-text-highlight {
    color: #0a1f16;
}

.list {
    background-color: #eaf4ee;
    border-radius: 18px;
}

.list-content {
    flex-direction: column;
    gap: 8px;
}

.empty {
    align-items: center;
    justify-content: center;
}

.empty-text {
    font-family: Poppins-Regular;
    font-size: 13px;
    color: #658273;
}

.item {
    flex-direction: row;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    background-color: #ffffff;
    border: 1px solid #0a1f16;
    border-radius: 14px;
}

.item-hover {
    background-color: #d9f0e4;
    border: 1px solid #1f8a5b;
}

.check {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border: 2px solid #0a1f16;
    border-radius: 999px;
}

.check-hover {
    background-color: #e8a33d;
    border: 2px solid #e8a33d;
}

.check-done {
    background-color: #1f8a5b;
    border: 2px solid #1f8a5b;
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
    color: #0a1f16;
}

.item-text-done {
    color: #658273;
}

.edit {
    font-family: Poppins-Regular;
    color: #0a1f16;
    letter-spacing: 0.3px;
    background-color: #eaf4ee;
    border: 2px solid #1f8a5b;
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
    background-color: #fde4e0;
    opacity: 1;
}

.destroy-hover {
    background-color: #c1443a;
}

.destroy-text {
    font-family: Poppins-Regular;
    font-size: 13px;
    color: #c1443a;
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
    color: #658273;
}

.clear {
    align-items: center;
    justify-content: center;
    padding: 8px 14px;
    background-color: #ffffff;
    border: 2px solid #0a1f16;
    border-radius: 999px;
}

.clear-hover {
    background-color: #c1443a;
    border: 2px solid #c1443a;
}

.clear-text {
    font-family: Poppins-Regular;
    font-size: 12px;
    letter-spacing: 1.2px;
    color: #c1443a;
}

.clear-text-hover {
    color: #ffffff;
}
</style>
