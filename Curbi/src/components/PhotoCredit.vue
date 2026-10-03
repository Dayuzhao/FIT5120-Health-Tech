<script setup>
import { computed } from 'vue'
import { licenseLabel } from '@/services/species'

// The photo credit every licence on these images requires (CC BY / BY-NC need
// the creator named and a link to the original record), shown wherever a
// species photo appears.
const props = defineProps({
  image: { type: Object, required: true },
})

const license = computed(() => licenseLabel(props.image.licenseUrl))
</script>

<template>
  <p class="photo-credit">
    Photo: {{ image.creator }}<template v-if="image.publisher"> via {{ image.publisher }}</template>
    ·
    <a :href="image.sourceUrl" target="_blank" rel="noopener">original</a>
    ·
    <a :href="image.licenseUrl" target="_blank" rel="noopener">{{ license }}</a>
  </p>
</template>

<style scoped>
.photo-credit {
  margin: 0;
  color: #879088;
  font-size: 12px;
  line-height: 1.5;
}

.photo-credit a {
  color: #5d856a;
}
</style>
