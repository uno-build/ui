<script lang="ts">
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

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { Image, Input, ScrollView, Text, View } from 'uno-ui/vue'
import type { InputHandle } from 'uno-ui/vue'
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

type Todo = (typeof INITIAL_TODOS)[number]

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
    backgroundColor: '#f2f7f4',
    alignItems: 'center',
    justifyContent: 'center',
}
const CARD_STYLE = {
    width: '620px',
    flexDirection: 'column',
    gap: '20px',
    padding: '28px',
    backgroundColor: '#ffffff',
    border: '1px solid #a8cdb8',
    borderRadius: '24px',
    boxShadow: '0px 24px 50px -12px #203b2e33',
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
    backgroundColor: '#d9f0e4',
    border: '1px solid #a8cdb8',
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
    color: '#203b2e',
    letterSpacing: '0.5px',
}
const SUBTITLE_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '13px',
    lineHeight: '18px',
    color: '#658273',
}
const DIVIDER_STYLE = {
    height: '1px',
    backgroundColor: '#a8cdb8',
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
    color: '#203b2e',
    letterSpacing: '0.3px',
    backgroundColor: '#eaf4ee',
    border: '2px solid #a8cdb8',
    borderRadius: '14px',
    padding: '12px 16px',
}
const DRAFT_FOCUS_STYLE = {
    border: '2px solid #4fae7f',
    boxShadow: '0px 0px 0px 4px #4fae7f2e',
}
const BUTTON_STYLE = {
    alignItems: 'center',
    justifyContent: 'center',
    padding: '13px 20px',
    backgroundColor: '#ffffff',
    border: '2px solid #a8cdb8',
    borderRadius: '14px',
}
const BUTTON_HOVER_STYLE = {
    backgroundColor: '#d9f0e4',
    border: '2px solid #4fae7f',
}
const BUTTON_PRESSED_STYLE = {
    backgroundColor: '#4fae7f',
    border: '2px solid #4fae7f',
}
const BUTTON_TEXT_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '12px',
    letterSpacing: '1.4px',
    color: '#4fae7f',
}
const BUTTON_TEXT_HOVER_STYLE = {
    color: '#4fae7f',
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
    border: '2px solid #a8cdb8',
    borderRadius: '999px',
}
const PILL_HOVER_STYLE = {
    backgroundColor: '#d9f0e4',
    border: '2px solid #4fae7f',
}
const PILL_SELECTED_STYLE = {
    backgroundColor: '#d9f0e4',
    border: '2px solid #4fae7f',
}
const PILL_TEXT_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '12px',
    letterSpacing: '1.2px',
    color: '#658273',
}
const PILL_TEXT_HIGHLIGHT_STYLE = {
    color: '#4fae7f',
}
const LIST_STYLE = {
    height: `${LIST_HEIGHT}px`,
    backgroundColor: '#eaf4ee',
    border: `${LIST_BORDER}px solid #a8cdb8`,
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
    color: '#658273',
}
const ITEM_STYLE = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    backgroundColor: '#ffffff',
    border: '1px solid #a8cdb8',
    borderRadius: '14px',
}
const ITEM_HOVER_STYLE = {
    backgroundColor: '#d9f0e4',
    border: '1px solid #4fae7f',
}
const CHECK_STYLE = {
    width: '24px',
    height: '24px',
    flexShrink: '0',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #a8cdb8',
    borderRadius: '999px',
}
const CHECK_HOVER_STYLE = {
    backgroundColor: '#4fae7f',
    border: '2px solid #4fae7f',
}
const CHECK_DONE_STYLE = {
    backgroundColor: '#4fae7f',
    border: '2px solid #4fae7f',
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
    color: '#203b2e',
}
const ITEM_TEXT_DONE_STYLE = {
    color: '#658273',
}
const EDIT_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    color: '#203b2e',
    letterSpacing: '0.3px',
    backgroundColor: '#eaf4ee',
    border: '2px solid #4fae7f',
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
    backgroundColor: '#d9f0e4',
    opacity: '1',
}
const DESTROY_HOVER_STYLE = {
    backgroundColor: '#4fae7f',
}
const DESTROY_TEXT_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '13px',
    color: '#4fae7f',
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
    color: '#658273',
}
const CLEAR_STYLE = {
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 14px',
    backgroundColor: '#ffffff',
    border: '2px solid #a8cdb8',
    borderRadius: '999px',
}
const CLEAR_HOVER_STYLE = {
    backgroundColor: '#4fae7f',
    border: '2px solid #4fae7f',
}
const CLEAR_TEXT_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '12px',
    letterSpacing: '1.2px',
    color: '#4fae7f',
}
const CLEAR_TEXT_HOVER_STYLE = {
    color: '#ffffff',
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

    todos.value = next_title === ''
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
    const is_double_click =
        last_label_click.id === todo.id && time - last_label_click.time < DOUBLE_CLICK_DELAY

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
        onChange: (value) => { draft.value = value },
        onSubmit: addTodo,
        onCancel: () => { draft.value = '' },
    })
}

function onEditFocus(event: NodeEventMap['focus']) {
    showKeyboard({
        node: event.target,
        value: edit_draft.value,
        onChange: (value) => { edit_draft.value = value },
        onSubmit: commitEdit,
        onCancel: cancelEdit,
    })
}

function showKeyboard({ node, value, onChange, onSubmit, onCancel }: {
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

watch(editing_id, (id) => {
    if (id !== null) {
        edit_ref!.focus()
    }
}, { flush: 'post' })

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
    <View :style="PAGE_STYLE">
        <View :style="CARD_STYLE">
            <View :style="HEADER_STYLE">
                <View :style="BADGE_STYLE">
                    <Image :src="COIN_SRC" width="42px" />
                </View>
                <View :style="HEADER_TEXTS_STYLE">
                    <Text :style="TITLE_STYLE">Todo App</Text>
                    <Text :style="SUBTITLE_STYLE">Type to add, click to complete, double click to rename.</Text>
                </View>
            </View>

            <View :style="DIVIDER_STYLE" />

            <View :style="NEW_TODO_STYLE">
                <View :style="FIELD_STYLE">
                    <Input
                        ref="draft_ref"
                        :style="{ ...DRAFT_STYLE, ...(draft_focused && DRAFT_FOCUS_STYLE) }"
                        :value="draft"
                        placeholder="What needs to be done?"
                        placeholder-text-color="#658273"
                        @focus="onDraftFocus"
                        @blur="draft_focused = false"
                    />
                </View>
                <View
                    :style="{
                        ...BUTTON_STYLE,
                        ...(hovered === 'add' && BUTTON_HOVER_STYLE),
                        ...(pressed === 'add' && BUTTON_PRESSED_STYLE),
                    }"
                    @pointer-over="hovered = 'add'"
                    @pointer-out="hovered = null"
                    @pointer-down="pressed = 'add'"
                    @pointer-up="pressed = null"
                    @click="addTodo(draft)"
                >
                    <Text
                        :style="{
                            ...BUTTON_TEXT_STYLE,
                            ...(hovered === 'add' && BUTTON_TEXT_HOVER_STYLE),
                            ...(pressed === 'add' && BUTTON_TEXT_PRESSED_STYLE),
                        }"
                    >
                        ADD
                    </Text>
                </View>
            </View>

            <View v-if="todos.length > 0" :style="TOOLBAR_STYLE">
                <View
                    :style="{
                        ...PILL_STYLE,
                        ...(hovered === 'toggle-all' && PILL_HOVER_STYLE),
                        ...(pressed === 'toggle-all' && PILL_SELECTED_STYLE),
                    }"
                    @pointer-over="hovered = 'toggle-all'"
                    @pointer-out="hovered = null"
                    @pointer-down="pressed = 'toggle-all'"
                    @pointer-up="pressed = null"
                    @click="toggleAll"
                >
                    <Text
                        :style="{
                            ...PILL_TEXT_STYLE,
                            ...(hovered === 'toggle-all' && PILL_TEXT_HIGHLIGHT_STYLE),
                        }"
                    >
                        {{ remaining > 0 ? 'COMPLETE ALL' : 'REOPEN ALL' }}
                    </Text>
                </View>

                <View :style="SPACER_STYLE" />

                <View
                    v-for="name in FILTER_NAMES"
                    :key="name"
                    :style="{
                        ...PILL_STYLE,
                        ...(hovered === `filter:${name}` && PILL_HOVER_STYLE),
                        ...(filter === name && PILL_SELECTED_STYLE),
                    }"
                    @pointer-over="hovered = `filter:${name}`"
                    @pointer-out="hovered = null"
                    @click="filter = name"
                >
                    <Text
                        :style="{
                            ...PILL_TEXT_STYLE,
                            ...((filter === name || hovered === `filter:${name}`) && PILL_TEXT_HIGHLIGHT_STYLE),
                        }"
                    >
                        {{ name.toUpperCase() }}
                    </Text>
                </View>
            </View>

            <ScrollView :style="LIST_STYLE">
                <View :style="LIST_CONTENT_STYLE">
                    <View v-if="visible_todos.length === 0" :style="EMPTY_STYLE">
                        <Text :style="EMPTY_TEXT_STYLE">Nothing to show here.</Text>
                    </View>

                    <View
                        v-for="todo in visible_todos"
                        :key="todo.id"
                        :style="{ ...ITEM_STYLE, ...(hovered_id === todo.id && ITEM_HOVER_STYLE) }"
                        @pointer-over="hovered_id = todo.id"
                        @pointer-out="hovered_id = null"
                    >
                        <View
                            :style="{
                                ...CHECK_STYLE,
                                ...(todo.completed && CHECK_DONE_STYLE),
                                ...(hovered === `check:${todo.id}` && CHECK_HOVER_STYLE),
                            }"
                            @pointer-over="hovered = `check:${todo.id}`"
                            @pointer-out="hovered = null"
                            @click="toggleTodo(todo.id)"
                        >
                            <View v-if="todo.completed" :style="CHECK_DOT_STYLE" />
                        </View>

                        <View v-if="editing_id === todo.id" :style="FIELD_STYLE">
                            <Input
                                :ref="setEditRef"
                                :style="EDIT_STYLE"
                                :value="edit_draft"
                                @focus="onEditFocus"
                                @blur="commitEdit(edit_draft)"
                            />
                        </View>
                        <Text
                            v-else
                            :style="{ ...ITEM_TEXT_STYLE, ...(todo.completed && ITEM_TEXT_DONE_STYLE) }"
                            @click="onLabelClick(todo)"
                        >
                            {{ todo.title }}
                        </Text>

                        <View
                            :style="{
                                ...DESTROY_STYLE,
                                ...(hovered_id === todo.id && DESTROY_VISIBLE_STYLE),
                                ...(hovered === `destroy:${todo.id}` && DESTROY_HOVER_STYLE),
                            }"
                            @pointer-over="hovered = `destroy:${todo.id}`"
                            @pointer-out="hovered = null"
                            @click="removeTodo(todo.id)"
                        >
                            <Text
                                :style="{
                                    ...DESTROY_TEXT_STYLE,
                                    ...(hovered === `destroy:${todo.id}` && DESTROY_TEXT_HOVER_STYLE),
                                }"
                            >
                                x
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>

            <View v-if="todos.length > 0" :style="DIVIDER_STYLE" />

            <View v-if="todos.length > 0" :style="FOOTER_STYLE">
                <Text :style="COUNT_STYLE">{{ remaining }} {{ remaining === 1 ? 'item' : 'items' }} left</Text>
                <View
                    v-if="completed_count > 0"
                    :style="{ ...CLEAR_STYLE, ...(hovered === 'clear' && CLEAR_HOVER_STYLE) }"
                    @pointer-over="hovered = 'clear'"
                    @pointer-out="hovered = null"
                    @click="clearCompleted"
                >
                    <Text
                        :style="{
                            ...CLEAR_TEXT_STYLE,
                            ...(hovered === 'clear' && CLEAR_TEXT_HOVER_STYLE),
                        }"
                    >
                        CLEAR COMPLETED ({{ completed_count }})
                    </Text>
                </View>
            </View>
        </View>
    </View>
</template>
