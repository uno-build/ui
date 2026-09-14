import { useEffect, useRef, useState } from 'react'
import { registerRootComponent, View, Text, Image, Input, ScrollView } from 'uno-ui/react'
import type { InputHandle } from 'uno-ui/react'
import { loadImage, loadJson } from '../../tests/utils/load-assets'

const TITLE_FONT_FAMILY = 'ChangaOne-Regular'
const TEXT_FONT_FAMILY = 'Poppins-Regular'
const ICON_SRC = 'assets/images/react.png'
const MAX_TITLE_LENGTH = 48
const DOUBLE_CLICK_DELAY = 320
const LIST_HEIGHT = 268
const LIST_BORDER = 1
const LIST_PADDING = 12

const INITIAL_TODOS = [
    { id: 1, title: 'Render a todo list on the GPU', completed: true },
    { id: 2, title: 'Hover the buttons to see them react', completed: false },
    { id: 3, title: 'Double click a row to rename it', completed: false },
]

const FILTER_PREDICATES = {
    all: () => true,
    active: (todo) => todo.completed === false,
    completed: (todo) => todo.completed,
}
const FILTER_NAMES = Object.keys(FILTER_PREDICATES)

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
    border: '1px solid #cfe0f2',
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
    backgroundColor: '#ffffff',
    border: '1px solid #cfe0f2',
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
    color: '#123f66',
    letterSpacing: '0.5px',
    textShadow: '0px 3px 0px #b9d5ee',
}
const SUBTITLE_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '13px',
    lineHeight: '18px',
    color: '#54789a',
}
const DIVIDER_STYLE = {
    height: '1px',
    backgroundColor: '#cfe0f2',
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
    color: '#123f66',
    letterSpacing: '0.3px',
    backgroundColor: '#eef5fc',
    border: '2px solid #cfe0f2',
    borderRadius: '14px',
    padding: '12px 16px',
}
const DRAFT_FOCUS_STYLE = {
    border: '2px solid #1f6fb2',
    boxShadow: '0px 0px 0px 4px #1f6fb22e',
}
const BUTTON_STYLE = {
    alignItems: 'center',
    justifyContent: 'center',
    padding: '13px 20px',
    backgroundColor: '#ffffff',
    border: '2px solid #cfe0f2',
    borderRadius: '14px',
}
const BUTTON_HOVER_STYLE = {
    backgroundColor: '#d3e7fa',
    border: '2px solid #1f6fb2',
}
const BUTTON_PRESSED_STYLE = {
    backgroundColor: '#1f6fb2',
    border: '2px solid #1f6fb2',
}
const BUTTON_TEXT_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '12px',
    letterSpacing: '1.4px',
    color: '#1f6fb2',
}
const BUTTON_TEXT_HOVER_STYLE = {
    color: '#1f6fb2',
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
    border: '2px solid #cfe0f2',
    borderRadius: '999px',
}
const PILL_HOVER_STYLE = {
    backgroundColor: '#d3e7fa',
    border: '2px solid #1f6fb2',
}
const PILL_SELECTED_STYLE = {
    backgroundColor: '#d3e7fa',
    border: '2px solid #1f6fb2',
}
const PILL_TEXT_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '12px',
    letterSpacing: '1.2px',
    color: '#54789a',
}
const PILL_TEXT_HIGHLIGHT_STYLE = {
    color: '#1f6fb2',
}
const LIST_STYLE = {
    height: `${LIST_HEIGHT}px`,
    backgroundColor: '#eef5fc',
    border: `${LIST_BORDER}px solid #cfe0f2`,
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
    color: '#6e8ca9',
}
const ITEM_STYLE = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 12px',
    backgroundColor: '#ffffff',
    border: '1px solid #cfe0f2',
    borderRadius: '14px',
}
const ITEM_HOVER_STYLE = {
    backgroundColor: '#d3e7fa',
    border: '1px solid #1f6fb2',
}
const CHECK_STYLE = {
    width: '24px',
    height: '24px',
    flexShrink: '0',
    alignItems: 'center',
    justifyContent: 'center',
    border: '2px solid #cfe0f2',
    borderRadius: '999px',
}
const CHECK_HOVER_STYLE = {
    backgroundColor: '#1f6fb2',
    border: '2px solid #1f6fb2',
}
const CHECK_DONE_STYLE = {
    backgroundColor: '#1f6fb2',
    border: '2px solid #1f6fb2',
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
    color: '#123f66',
}
const ITEM_TEXT_DONE_STYLE = {
    color: '#6e8ca9',
}
const EDIT_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    color: '#123f66',
    letterSpacing: '0.3px',
    backgroundColor: '#eef5fc',
    border: '2px solid #1f6fb2',
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
    backgroundColor: '#d3e7fa',
    opacity: '1',
}
const DESTROY_HOVER_STYLE = {
    backgroundColor: '#1f6fb2',
}
const DESTROY_TEXT_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '13px',
    color: '#1f6fb2',
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
    color: '#54789a',
}
const CLEAR_STYLE = {
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 14px',
    backgroundColor: '#ffffff',
    border: '2px solid #cfe0f2',
    borderRadius: '999px',
}
const CLEAR_HOVER_STYLE = {
    backgroundColor: '#1f6fb2',
    border: '2px solid #1f6fb2',
}
const CLEAR_TEXT_STYLE = {
    fontFamily: TEXT_FONT_FAMILY,
    fontSize: '12px',
    letterSpacing: '1.2px',
    color: '#1f6fb2',
}
const CLEAR_TEXT_HOVER_STYLE = {
    color: '#ffffff',
}

export function ReactTodo({
    backgroundColor: background_color = '#dfeaf7',
    boxShadow: box_shadow = '0px 24px 50px -12px #1f6fb233',
}) {
    const draft_ref = useRef<InputHandle>(null)
    const edit_ref = useRef<InputHandle>(null)
    const next_id = useRef(INITIAL_TODOS.length + 1)
    const last_label_click = useRef<{ id: number | null; time: number }>({ id: null, time: 0 })
    const [todos, setTodos] = useState(INITIAL_TODOS)
    const [filter, setFilter] = useState('all')
    const [draft, setDraft] = useState('')
    const [draft_focused, setDraftFocused] = useState(false)
    const [editing_id, setEditingId] = useState<number | null>(null)
    const [edit_draft, setEditDraft] = useState('')
    const [hovered, setHovered] = useState<string | null>(null)
    const [hovered_id, setHoveredId] = useState<number | null>(null)
    const [pressed, setPressed] = useState<string | null>(null)

    const visible_todos = todos.filter(FILTER_PREDICATES[filter])
    const remaining = todos.filter(FILTER_PREDICATES.active).length
    const completed_count = todos.length - remaining

    function addTodo(title) {
        const next_title = title.trim()

        if (next_title === '') {
            return
        }

        const id = next_id.current++
        setTodos((current) => [...current, { id, title: next_title, completed: false }])
        setDraft('')
    }

    function toggleTodo(id) {
        setTodos((current) => current.map((todo) => (todo.id === id ? { ...todo, completed: !todo.completed } : todo)))
    }

    function removeTodo(id) {
        setTodos((current) => current.filter((todo) => todo.id !== id))
    }

    function toggleAll() {
        const completed = remaining > 0
        setTodos((current) => current.map((todo) => ({ ...todo, completed })))
    }

    function clearCompleted() {
        setTodos((current) => current.filter(FILTER_PREDICATES.active))
    }

    function commitEdit(title) {
        const next_title = title.trim()

        setTodos((current) =>
            next_title === ''
                ? current.filter((todo) => todo.id !== editing_id)
                : current.map((todo) => (todo.id === editing_id ? { ...todo, title: next_title } : todo)),
        )
        setEditingId(null)
        PLATFORM_KEYBOARD.hide()
    }

    function cancelEdit() {
        setEditingId(null)
        PLATFORM_KEYBOARD.hide()
    }

    function onLabelClick(todo) {
        const time = Date.now()
        const is_double_click =
            last_label_click.current.id === todo.id && time - last_label_click.current.time < DOUBLE_CLICK_DELAY

        last_label_click.current = { id: todo.id, time }

        if (is_double_click) {
            setEditingId(todo.id)
            setEditDraft(todo.title)
        }
    }

    function onDraftFocus(event) {
        setDraftFocused(true)
        PLATFORM_KEYBOARD.show({
            node: event.target,
            value: draft,
            max_length: MAX_TITLE_LENGTH,
            onChange: setDraft,
            onSubmit: addTodo,
            onCancel: () => setDraft(''),
        })
    }

    function onEditFocus(event) {
        PLATFORM_KEYBOARD.show({
            node: event.target,
            value: edit_draft,
            max_length: MAX_TITLE_LENGTH,
            onChange: setEditDraft,
            onSubmit: commitEdit,
            onCancel: cancelEdit,
        })
    }

    useEffect(() => {
        draft_ref.current!.focus()
    }, [])

    useEffect(() => {
        if (editing_id !== null) {
            edit_ref.current!.focus()
        }
    }, [editing_id])

    return (
        <View style={{ ...PAGE_STYLE, backgroundColor: background_color }}>
            <View style={{ ...CARD_STYLE, boxShadow: box_shadow }}>
                <View style={HEADER_STYLE}>
                    <View style={BADGE_STYLE}>
                        <Image src={ICON_SRC} width="42px" />
                    </View>
                    <View style={HEADER_TEXTS_STYLE}>
                        <Text style={TITLE_STYLE}>React Todo App</Text>
                        <Text style={SUBTITLE_STYLE}>Type to add, click to complete, double click to rename.</Text>
                    </View>
                </View>

                <View style={DIVIDER_STYLE} />

                <View style={NEW_TODO_STYLE}>
                    <View style={FIELD_STYLE}>
                        <Input
                            ref={draft_ref}
                            style={{ ...DRAFT_STYLE, ...(draft_focused && DRAFT_FOCUS_STYLE) }}
                            value={draft}
                            placeholder="What needs to be done?"
                            placeholderTextColor="#6e8ca9"
                            onFocus={onDraftFocus}
                            onBlur={() => setDraftFocused(false)}
                        />
                    </View>
                    <View
                        style={{
                            ...BUTTON_STYLE,
                            ...(hovered === 'add' && BUTTON_HOVER_STYLE),
                            ...(pressed === 'add' && BUTTON_PRESSED_STYLE),
                        }}
                        onPointerOver={() => setHovered('add')}
                        onPointerOut={() => setHovered(null)}
                        onPointerDown={() => setPressed('add')}
                        onPointerUp={() => setPressed(null)}
                        onClick={() => addTodo(draft)}
                    >
                        <Text
                            style={{
                                ...BUTTON_TEXT_STYLE,
                                ...(hovered === 'add' && BUTTON_TEXT_HOVER_STYLE),
                                ...(pressed === 'add' && BUTTON_TEXT_PRESSED_STYLE),
                            }}
                        >
                            ADD
                        </Text>
                    </View>
                </View>

                {todos.length > 0 && (
                    <View style={TOOLBAR_STYLE}>
                        <View
                            style={{
                                ...PILL_STYLE,
                                ...(hovered === 'toggle-all' && PILL_HOVER_STYLE),
                                ...(pressed === 'toggle-all' && PILL_SELECTED_STYLE),
                            }}
                            onPointerOver={() => setHovered('toggle-all')}
                            onPointerOut={() => setHovered(null)}
                            onPointerDown={() => setPressed('toggle-all')}
                            onPointerUp={() => setPressed(null)}
                            onClick={toggleAll}
                        >
                            <Text
                                style={{
                                    ...PILL_TEXT_STYLE,
                                    ...(hovered === 'toggle-all' && PILL_TEXT_HIGHLIGHT_STYLE),
                                }}
                            >
                                {remaining > 0 ? 'COMPLETE ALL' : 'REOPEN ALL'}
                            </Text>
                        </View>

                        <View style={SPACER_STYLE} />

                        {FILTER_NAMES.map((name) => (
                            <View
                                key={name}
                                style={{
                                    ...PILL_STYLE,
                                    ...(hovered === `filter:${name}` && PILL_HOVER_STYLE),
                                    ...(filter === name && PILL_SELECTED_STYLE),
                                }}
                                onPointerOver={() => setHovered(`filter:${name}`)}
                                onPointerOut={() => setHovered(null)}
                                onClick={() => setFilter(name)}
                            >
                                <Text
                                    style={{
                                        ...PILL_TEXT_STYLE,
                                        ...((filter === name || hovered === `filter:${name}`) &&
                                            PILL_TEXT_HIGHLIGHT_STYLE),
                                    }}
                                >
                                    {name.toUpperCase()}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                <ScrollView style={LIST_STYLE}>
                    <View style={LIST_CONTENT_STYLE}>
                        {visible_todos.length === 0 && (
                            <View style={EMPTY_STYLE}>
                                <Text style={EMPTY_TEXT_STYLE}>Nothing to show here.</Text>
                            </View>
                        )}

                        {visible_todos.map((todo) => (
                            <View
                                key={todo.id}
                                style={{ ...ITEM_STYLE, ...(hovered_id === todo.id && ITEM_HOVER_STYLE) }}
                                onPointerOver={() => setHoveredId(todo.id)}
                                onPointerOut={() => setHoveredId(null)}
                            >
                                <View
                                    style={{
                                        ...CHECK_STYLE,
                                        ...(todo.completed && CHECK_DONE_STYLE),
                                        ...(hovered === `check:${todo.id}` && CHECK_HOVER_STYLE),
                                    }}
                                    onPointerOver={() => setHovered(`check:${todo.id}`)}
                                    onPointerOut={() => setHovered(null)}
                                    onClick={() => toggleTodo(todo.id)}
                                >
                                    {todo.completed && <View style={CHECK_DOT_STYLE} />}
                                </View>

                                {editing_id === todo.id ? (
                                    <View style={FIELD_STYLE}>
                                        <Input
                                            ref={edit_ref}
                                            style={EDIT_STYLE}
                                            value={edit_draft}
                                            onFocus={onEditFocus}
                                            onBlur={() => commitEdit(edit_draft)}
                                        />
                                    </View>
                                ) : (
                                    <Text
                                        style={{ ...ITEM_TEXT_STYLE, ...(todo.completed && ITEM_TEXT_DONE_STYLE) }}
                                        onClick={() => onLabelClick(todo)}
                                    >
                                        {todo.title}
                                    </Text>
                                )}

                                <View
                                    style={{
                                        ...DESTROY_STYLE,
                                        ...(hovered_id === todo.id && DESTROY_VISIBLE_STYLE),
                                        ...(hovered === `destroy:${todo.id}` && DESTROY_HOVER_STYLE),
                                    }}
                                    onPointerOver={() => setHovered(`destroy:${todo.id}`)}
                                    onPointerOut={() => setHovered(null)}
                                    onClick={() => removeTodo(todo.id)}
                                >
                                    <Text
                                        style={{
                                            ...DESTROY_TEXT_STYLE,
                                            ...(hovered === `destroy:${todo.id}` && DESTROY_TEXT_HOVER_STYLE),
                                        }}
                                    >
                                        x
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </ScrollView>

                {todos.length > 0 && <View style={DIVIDER_STYLE} />}

                {todos.length > 0 && (
                    <View style={FOOTER_STYLE}>
                        <Text style={COUNT_STYLE}>{`${remaining} ${remaining === 1 ? 'item' : 'items'} left`}</Text>
                        {completed_count > 0 && (
                            <View
                                style={{ ...CLEAR_STYLE, ...(hovered === 'clear' && CLEAR_HOVER_STYLE) }}
                                onPointerOver={() => setHovered('clear')}
                                onPointerOut={() => setHovered(null)}
                                onClick={clearCompleted}
                            >
                                <Text
                                    style={{
                                        ...CLEAR_TEXT_STYLE,
                                        ...(hovered === 'clear' && CLEAR_TEXT_HOVER_STYLE),
                                    }}
                                >
                                    {`CLEAR COMPLETED (${completed_count})`}
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            </View>
        </View>
    )
}

// The hidden input is what raises the soft keyboard in a browser. Native hosts have no
// `document`, so it is created on the first focus instead of at module scope: outside the
// browser there is nothing to create and the panel runs without it.
const PLATFORM_KEYBOARD = (function () {
    const is_browser = typeof document !== 'undefined'
    let input = null

    function mountInput() {
        const element = document.createElement('input')
        element.style.position = 'fixed'
        element.style.width = '1px'
        element.style.height = '1px'
        element.style.opacity = '0'
        element.style.pointerEvents = 'none'
        element.style.left = '0'
        element.style.bottom = '0'
        element.tabIndex = -1
        document.body.appendChild(element)

        return element
    }

    return {
        show({ node, value, max_length, onChange, onSubmit, onCancel }) {
            if (!is_browser) {
                return
            }

            if (input === null) {
                input = mountInput()
            }

            input.value = value
            input.maxLength = max_length
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
        },
        hide() {
            if (input === null) {
                return
            }

            input.onblur = null
            input.blur()
        },
    }
})()

export default function createReactTodo({ ui, resources }) {
    return Promise.all([
        loadImage(`/${ICON_SRC}`),
        loadImage(`/assets/fonts/${TEXT_FONT_FAMILY}.mtsdf.png`),
        loadJson(`/assets/fonts/${TEXT_FONT_FAMILY}.mtsdf.json`),
        loadImage(`/assets/fonts/${TITLE_FONT_FAMILY}.mtsdf.png`),
        loadJson(`/assets/fonts/${TITLE_FONT_FAMILY}.mtsdf.json`),
    ]).then(([icon, text_font_image, text_font_json, title_font_image, title_font_json]) => {
        resources.registerImage(ICON_SRC, icon)
        resources.registerFont(TEXT_FONT_FAMILY, text_font_image, text_font_json)
        resources.registerFont(TITLE_FONT_FAMILY, title_font_image, title_font_json)

        const renderer = registerRootComponent(ReactTodo, { ui })
        renderer.render({})
    })
}
