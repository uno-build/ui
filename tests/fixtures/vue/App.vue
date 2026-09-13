<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Image, Input, ScrollView, Text, View, useUI } from 'uno-ui/vue'
import type { InputHandle, NodeHandle, ScrollViewHandle, StyleProps } from 'uno-ui/vue'

const props = defineProps<{
    title: string
    onReady(controls: any): void
    onClick?: ((event: any) => void) | null
    onScroll?: ((event: any) => void) | null
    onFocus?: ((event: any) => void) | null
    onBlur?: ((event: any) => void) | null
    onPointerDown?: ((event: any) => void) | null
}>()
const count = ref(0)
const visible = ref(false)
const text_visible = ref(true)
const keys = ref(['a', 'b', 'c'])
const style = reactive({ width: '100px', height: '120px', backgroundColor: '#f00' })
const image_src = ref('wide')
const image_width = ref<string>()
const image_style = reactive({ objectFit: 'fill' })
const main_ref = ref<NodeHandle | null>(null)
const text_ref = ref<NodeHandle | null>(null)
const list_ref = ref<NodeHandle | null>(null)
const image_ref = ref<NodeHandle | null>(null)
const conditional_ref = ref<NodeHandle | null>(null)
const item_refs: Record<string, NodeHandle | null> = {}
const widgets_visible = ref(false)
const scroll_horizontal = ref(false)
const scroll_ref = ref<ScrollViewHandle | null>(null)
const horizontal_ref = ref<ScrollViewHandle | null>(null)
const input_visible = ref(true)
const input_ref = ref<InputHandle | null>(null)
const input_value = ref<string | number | null>()
const input_placeholder = ref<string | number | null>('Name')
const input_placeholder_color = ref<string>('#abcdef')
const input_style = ref<StyleProps>({
    width: '120px', height: '40px', color: '#123456', lineHeight: '20px',
    letterSpacing: '1px', textAlign: 'right',
})

function setItemRef(key: string, handle: NodeHandle | null) {
    item_refs[key] = handle
}

props.onReady({
    ui: useUI(), count, visible, text_visible, keys, style, image_src, image_width, image_style,
    main_ref, text_ref, list_ref, image_ref, conditional_ref, item_refs,
    widgets_visible, scroll_horizontal, scroll_ref, horizontal_ref,
    input_visible, input_ref, input_value, input_placeholder, input_placeholder_color, input_style,
})
</script>

<template>
    <View ref="main_ref" :style="style" :onClick="props.onClick">
        <Text ref="text_ref"><template v-if="text_visible">{{ title }} {{ count }}<template v-if="visible">!</template></template></Text>
        <View ref="list_ref">
            <View v-for="key in keys" :key="key" :ref="handle => setItemRef(key, handle)">
                <Text>{{ key }}</Text>
            </View>
        </View>
        <Image ref="image_ref" :src="image_src" :width="image_width" :style="image_style" />
        <Text v-if="visible" ref="conditional_ref">Conditional</Text>
        <template v-if="widgets_visible">
            <ScrollView ref="scroll_ref" :horizontal="scroll_horizontal" :style="{ width: '100px', height: '50px' }" @scroll="props.onScroll">
                <View :style="{ width: '200px', height: '100px' }"><Text>{{ title }}</Text></View>
            </ScrollView>
            <ScrollView ref="horizontal_ref" horizontal><Text>Horizontal</Text></ScrollView>
            <Input
                v-if="input_visible"
                ref="input_ref"
                :value="input_value"
                :placeholder="input_placeholder"
                :placeholder-text-color="input_placeholder_color"
                :style="input_style"
                @focus="props.onFocus"
                @blur="props.onBlur"
                @pointer-down="props.onPointerDown"
            />
        </template>
    </View>
</template>
