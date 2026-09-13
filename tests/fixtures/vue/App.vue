<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Image, Text, View, useUI } from 'uno-ui/vue'
import type { NodeHandle } from 'uno-ui/vue'

const props = defineProps<{
    title: string
    onReady(controls: any): void
    onClick?: ((event: any) => void) | null
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

function setItemRef(key: string, handle: NodeHandle | null) {
    item_refs[key] = handle
}

props.onReady({
    ui: useUI(), count, visible, text_visible, keys, style, image_src, image_width, image_style,
    main_ref, text_ref, list_ref, image_ref, conditional_ref, item_refs,
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
    </View>
</template>
