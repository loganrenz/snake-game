<template>
  <UApp>
    <NuxtPage />
  </UApp>
</template>

<script setup lang="ts">
useHead({
  htmlAttrs: { lang: 'en', class: 'dark' },
  title: 'Snake Game',
  meta: [
    { name: 'description', content: 'Classic snake game. Eat, grow, don\'t crash.' },
    { name: 'theme-color', content: '#0a0a0a' },
  ],
})
</script>
