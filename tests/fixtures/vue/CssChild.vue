<script setup lang="ts">
import { ref } from 'vue'
import { Text, View } from 'uno-ui/vue'
import type { NodeHandle } from 'uno-ui/vue'

const props = defineProps<{ onReady(controls: any): void }>()
const root_ref = ref<NodeHandle | null>(null)
const text_ref = ref<NodeHandle | null>(null)
props.onReady({ root_ref, text_ref })
</script>

<template>
    <!-- A root comment must not change CSS scope inheritance. -->
    <View ref="root_ref" class="css-parent-local">
        <Text ref="text_ref" class="css-parent-local css-child-local css-global-color">Child</Text>
        <slot />
    </View>
</template>

<style scoped>
.css-child-local {
    background-color: #fedcba;
}
</style>
