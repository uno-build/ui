<script setup lang="ts">
import { ref } from 'vue'
import { Image, Input, ScrollView, Text, View } from 'uno-ui/vue'
import type { InputHandle, NodeHandle, ScrollViewHandle, StyleProps } from 'uno-ui/vue'
import CssChild from './CssChild.vue'

const props = defineProps<{ onReady(controls: any): void }>()
const dynamic_class = ref<any>('css-base css-active')
const inline_style = ref<StyleProps>({ paddingLeft: '10px' })
const widget_classes = ref(true)
const dynamic_ref = ref<NodeHandle | null>(null)
const ordered_ref = ref<NodeHandle | null>(null)
const scoped_ref = ref<NodeHandle | null>(null)
const slot_ref = ref<NodeHandle | null>(null)
const child_local_ref = ref<NodeHandle | null>(null)
const live_ref = ref<NodeHandle | null>(null)
const image_ref = ref<NodeHandle | null>(null)
const input_ref = ref<InputHandle | null>(null)
const scroll_ref = ref<ScrollViewHandle | null>(null)
const child_controls: Record<string, any> = {}

function onChildReady(controls: any) {
    Object.assign(child_controls, controls)
}

props.onReady({
    dynamic_class, inline_style, widget_classes, dynamic_ref, ordered_ref, scoped_ref, slot_ref,
    child_local_ref, live_ref, image_ref, input_ref, scroll_ref, child_controls,
})
</script>

<template>
    <View>
        <View ref="dynamic_ref" :class="dynamic_class" :style="inline_style" />
        <View ref="ordered_ref" class="css-later css-earlier css-source-order" />
        <View ref="scoped_ref" class="css-parent-local" />
        <View ref="child_local_ref" class="css-child-local" />
        <View ref="live_ref" class="css-live" />
        <CssChild :onReady="onChildReady"><Text ref="slot_ref" class="css-parent-local css-child-local">Slot</Text></CssChild>
        <Image ref="image_ref" src="wide" :class="{ 'css-image': widget_classes }" />
        <Input ref="input_ref" value="Styled" :class="{ 'css-input': widget_classes }" />
        <ScrollView ref="scroll_ref" :class="{ 'css-scroll': widget_classes }"><Text>Content</Text></ScrollView>
    </View>
</template>

<style>
.css-global-color {
    color: #123456;
}
.css-source-order {
    opacity: 0.25;
}
.css-earlier {
    width: 10px;
}
.css-later {
    width: 20px;
}
</style>

<style scoped>
.css-base.css-active {
    height: 45px;
}
.css-base {
    width: 90px;
    height: 30px;
    padding: 4px;
}
.css-active {
    width: 120px;
    padding: 8px;
    background-color: #abcdef;
}
.css-parent-local {
    padding-left: 7px;
}
.css-image {
    width: 120px;
    object-fit: contain;
}
.css-input {
    width: 150px;
    color: #345678;
    line-height: 22px;
    letter-spacing: 2px;
    text-align: right;
}
.css-scroll {
    flex-direction: row;
    overflow-y: hidden;
}
</style>

<style>
.css-source-order {
    opacity: 0.75;
}
</style>
