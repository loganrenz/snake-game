<template>
  <div class="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-8">
    <!-- Header -->
    <div class="text-center mb-6">
      <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-white font-display">
        🐍 Snake
      </h1>
    </div>

    <!-- Score bar -->
    <div class="w-full max-w-[400px] flex items-center justify-between mb-3 px-1">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-crosshair" class="text-primary-400" />
        <span class="text-sm font-medium text-gray-300">Score</span>
        <span class="text-lg font-bold text-white font-display tabular-nums">{{ gameRef?.score ?? 0 }}</span>
      </div>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-trophy" class="text-yellow-400" />
        <span class="text-sm font-medium text-gray-300">Best</span>
        <span class="text-lg font-bold text-yellow-400 font-display tabular-nums">{{ gameRef?.highScore ?? 0 }}</span>
      </div>
    </div>

    <!-- Game -->
    <ClientOnly>
      <SnakeGame ref="gameRef" />
    </ClientOnly>

    <!-- Footer -->
    <p class="mt-6 text-xs text-gray-600">
      {{ isTouchDevice ? 'Swipe or use D-pad' : 'Arrow keys / WASD · Enter to start' }}
    </p>
  </div>
</template>

<script setup lang="ts">
useSeoMeta({
  title: 'Snake Game',
  description: 'Classic snake game built with Nuxt. Eat, grow, don\'t crash.',
  ogTitle: 'Snake Game',
  ogDescription: 'Classic snake game built with Nuxt.',
})

const gameRef = ref<{ score: number; highScore: number; state: string } | null>(null)
const isTouchDevice = ref(false)

onMounted(() => {
  isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
})
</script>
