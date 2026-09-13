<script setup lang="ts">
import { reactive, ref } from 'vue'
import { Image, Text, View } from 'uno-ui/vue'

defineProps<{ image_src: string }>()

const PAGE_STYLE = {
    width: '100%',
    height: '100%',
    padding: '32px',
    backgroundColor: '#f2f3f5',
    alignItems: 'center',
    justifyContent: 'center',
}
const PANEL_STYLE = {
    width: '640px',
    maxWidth: '100%',
    padding: '24px',
    gap: '20px',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    border: '2px solid #1c1c1c',
    borderRadius: '24px',
}
const TEXT_STYLE = {
    fontFamily: 'Poppins-Regular',
    fontSize: '14px',
    color: '#303038',
}
const ROW_STYLE = {
    flexDirection: 'row',
    gap: '12px',
}
const BUTTON_STYLE = {
    padding: '10px 14px',
    borderRadius: '12px',
    backgroundColor: '#d9f0e4',
}
const IMAGE_CARD_STYLE = {
    flex: '1',
    padding: '12px',
    gap: '10px',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#f2f3f5',
    borderRadius: '14px',
}
const count = ref(0)
const highlighted = ref(true)
const image_modes = ref<Array<'contain' | 'cover' | 'fill'>>(['contain', 'cover', 'fill'])
const counter_style = reactive<Record<string, string>>({
    padding: '16px',
    gap: '8px',
    flexDirection: 'column',
    borderRadius: '14px',
    backgroundColor: '#d9f0e4',
})

function increment() {
    count.value++
}

function toggleHighlight() {
    highlighted.value = !highlighted.value

    if (highlighted.value) {
        counter_style.backgroundColor = '#d9f0e4'
    } else {
        delete counter_style.backgroundColor
    }
}

function reverseImages() {
    image_modes.value = [...image_modes.value].reverse()
}
</script>

<template>
    <View :style="PAGE_STYLE">
        <View :style="PANEL_STYLE">
            <Text :style="{ ...TEXT_STYLE, fontSize: '24px' }">Vue components</Text>
            <Text :style="TEXT_STYLE">View, Text and Image on the Uno renderer.</Text>

            <View :style="counter_style">
                <Text :style="{ ...TEXT_STYLE, fontSize: '20px' }">Count: {{ count }}</Text>
                <Text v-if="count > 0" :style="TEXT_STYLE">Clicked {{ count }} times.</Text>
                <Text v-else :style="TEXT_STYLE">Click to update the text and this conditional.</Text>
            </View>

            <View :style="ROW_STYLE">
                <View :style="BUTTON_STYLE" @click="increment">
                    <Text :style="TEXT_STYLE">Add one</Text>
                </View>
                <View :style="BUTTON_STYLE" @click="toggleHighlight">
                    <Text :style="TEXT_STYLE">{{ highlighted ? 'Remove' : 'Add' }} highlight</Text>
                </View>
                <View :style="BUTTON_STYLE" @click="reverseImages">
                    <Text :style="TEXT_STYLE">Reverse images</Text>
                </View>
            </View>

            <View :style="ROW_STYLE">
                <View v-for="mode in image_modes" :key="mode" :style="IMAGE_CARD_STYLE">
                    <Image :src="image_src" width="132px" height="80px" :style="{ objectFit: mode }" />
                    <Text :style="TEXT_STYLE">{{ mode }}</Text>
                </View>
            </View>
        </View>
    </View>
</template>
