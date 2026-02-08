<template>
  <div
    ref="gameContainer"
    class="relative select-none outline-none"
    tabindex="0"
    @keydown="handleKeydown"
  >
    <canvas
      ref="canvas"
      :width="canvasSize"
      :height="canvasSize"
      class="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-950 block mx-auto"
      :class="{ 'opacity-60': state !== 'playing' }"
      @touchstart.prevent="handleTouchStart"
      @touchmove.prevent
      @touchend.prevent="handleTouchEnd"
    />

    <!-- Overlay: Start / Game Over -->
    <Transition name="fade">
      <div
        v-if="state !== 'playing'"
        class="absolute inset-0 flex items-center justify-center"
      >
        <div class="text-center space-y-4 p-6">
          <template v-if="state === 'idle'">
            <div class="text-5xl mb-2">🐍</div>
            <h2 class="text-2xl font-bold text-white font-display">Snake</h2>
            <p class="text-gray-400 text-sm">
              {{ isTouchDevice ? 'Swipe to move' : 'Arrow keys or WASD' }}
            </p>
            <UButton size="xl" @click="startGame" class="mt-2">
              Play
            </UButton>
          </template>

          <template v-else-if="state === 'gameover'">
            <div class="text-4xl mb-1">💀</div>
            <h2 class="text-2xl font-bold text-white font-display">Game Over</h2>
            <p class="text-3xl font-bold text-primary-400 font-display">{{ score }}</p>
            <p v-if="score >= highScore && score > 0" class="text-yellow-400 text-sm font-medium">
              New High Score!
            </p>
            <UButton size="xl" @click="startGame" class="mt-2">
              Play Again
            </UButton>
          </template>
        </div>
      </div>
    </Transition>

    <!-- Mobile D-Pad -->
    <div v-if="isTouchDevice && state === 'playing'" class="mt-4 flex flex-col items-center gap-1">
      <UButton
        variant="soft"
        color="neutral"
        size="xl"
        icon="i-lucide-chevron-up"
        class="w-14 h-14"
        @touchstart.prevent="changeDirection('up')"
      />
      <div class="flex gap-1">
        <UButton
          variant="soft"
          color="neutral"
          size="xl"
          icon="i-lucide-chevron-left"
          class="w-14 h-14"
          @touchstart.prevent="changeDirection('left')"
        />
        <div class="w-14 h-14" />
        <UButton
          variant="soft"
          color="neutral"
          size="xl"
          icon="i-lucide-chevron-right"
          class="w-14 h-14"
          @touchstart.prevent="changeDirection('right')"
        />
      </div>
      <UButton
        variant="soft"
        color="neutral"
        size="xl"
        icon="i-lucide-chevron-down"
        class="w-14 h-14"
        @touchstart.prevent="changeDirection('down')"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
type Direction = 'up' | 'down' | 'left' | 'right'
type GameState = 'idle' | 'playing' | 'gameover'
type Point = { x: number; y: number }

const props = defineProps<{
  gridSize?: number
}>()

const GRID = props.gridSize ?? 20
const CELL = 20
const canvasSize = GRID * CELL
const TICK_MS = 110

const canvas = ref<HTMLCanvasElement | null>(null)
const gameContainer = ref<HTMLDivElement | null>(null)

const state = ref<GameState>('idle')
const score = ref(0)
const highScore = ref(0)

const isTouchDevice = ref(false)

let snake: Point[] = []
let direction: Direction = 'right'
let nextDirection: Direction = 'right'
let food: Point = { x: 10, y: 10 }
let tickTimer: ReturnType<typeof setInterval> | null = null
let touchStartPos: Point | null = null

// Colors
const COLORS = {
  bg: '#0a0a0a',
  grid: '#1a1a1a',
  snakeHead: '#22c55e',
  snakeBody: '#16a34a',
  snakeTail: '#15803d',
  food: '#ef4444',
  foodGlow: 'rgba(239, 68, 68, 0.3)',
}

onMounted(() => {
  isTouchDevice.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const saved = localStorage.getItem('snake-high-score')
  if (saved) highScore.value = parseInt(saved, 10) || 0
  draw()
  gameContainer.value?.focus()
})

onUnmounted(() => {
  if (tickTimer) clearInterval(tickTimer)
})

function startGame() {
  // Init snake in the middle
  const mid = Math.floor(GRID / 2)
  snake = [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid },
  ]
  direction = 'right'
  nextDirection = 'right'
  score.value = 0
  state.value = 'playing'
  spawnFood()
  gameContainer.value?.focus()

  if (tickTimer) clearInterval(tickTimer)
  tickTimer = setInterval(tick, TICK_MS)
}

function spawnFood() {
  const occupied = new Set(snake.map((p) => `${p.x},${p.y}`))
  const free: Point[] = []
  for (let x = 0; x < GRID; x++) {
    for (let y = 0; y < GRID; y++) {
      if (!occupied.has(`${x},${y}`)) free.push({ x, y })
    }
  }
  if (free.length === 0) {
    endGame()
    return
  }
  food = free[Math.floor(Math.random() * free.length)]
}

function tick() {
  direction = nextDirection
  const head = snake[0]
  const next: Point = { x: head.x, y: head.y }

  switch (direction) {
    case 'up': next.y--; break
    case 'down': next.y++; break
    case 'left': next.x--; break
    case 'right': next.x++; break
  }

  // Wall collision
  if (next.x < 0 || next.x >= GRID || next.y < 0 || next.y >= GRID) {
    endGame()
    return
  }

  // Self collision
  if (snake.some((p) => p.x === next.x && p.y === next.y)) {
    endGame()
    return
  }

  snake.unshift(next)

  // Eat food?
  if (next.x === food.x && next.y === food.y) {
    score.value += 10
    spawnFood()
  } else {
    snake.pop()
  }

  draw()
}

function endGame() {
  state.value = 'gameover'
  if (tickTimer) {
    clearInterval(tickTimer)
    tickTimer = null
  }
  if (score.value > highScore.value) {
    highScore.value = score.value
    localStorage.setItem('snake-high-score', String(highScore.value))
  }
  draw()
}

function changeDirection(dir: Direction) {
  const opposites: Record<Direction, Direction> = {
    up: 'down', down: 'up', left: 'right', right: 'left',
  }
  if (dir !== opposites[direction]) {
    nextDirection = dir
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (state.value !== 'playing') {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      startGame()
    }
    return
  }

  const keyMap: Record<string, Direction> = {
    ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
    w: 'up', s: 'down', a: 'left', d: 'right',
    W: 'up', S: 'down', A: 'left', D: 'right',
  }

  const dir = keyMap[e.key]
  if (dir) {
    e.preventDefault()
    changeDirection(dir)
  }
}

function handleTouchStart(e: TouchEvent) {
  const touch = e.touches[0]
  touchStartPos = { x: touch.clientX, y: touch.clientY }
}

function handleTouchEnd(e: TouchEvent) {
  if (!touchStartPos) return
  const touch = e.changedTouches[0]
  const dx = touch.clientX - touchStartPos.x
  const dy = touch.clientY - touchStartPos.y
  touchStartPos = null

  const absDx = Math.abs(dx)
  const absDy = Math.abs(dy)
  const minSwipe = 20

  if (absDx < minSwipe && absDy < minSwipe) {
    // Tap
    if (state.value !== 'playing') startGame()
    return
  }

  if (absDx > absDy) {
    changeDirection(dx > 0 ? 'right' : 'left')
  } else {
    changeDirection(dy > 0 ? 'down' : 'up')
  }
}

function draw() {
  const ctx = canvas.value?.getContext('2d')
  if (!ctx) return

  // Background
  ctx.fillStyle = COLORS.bg
  ctx.fillRect(0, 0, canvasSize, canvasSize)

  // Grid dots
  ctx.fillStyle = COLORS.grid
  for (let x = 0; x < GRID; x++) {
    for (let y = 0; y < GRID; y++) {
      ctx.beginPath()
      ctx.arc(x * CELL + CELL / 2, y * CELL + CELL / 2, 1, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Food glow
  ctx.fillStyle = COLORS.foodGlow
  ctx.beginPath()
  ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL * 0.8, 0, Math.PI * 2)
  ctx.fill()

  // Food
  ctx.fillStyle = COLORS.food
  ctx.beginPath()
  ctx.roundRect(food.x * CELL + 2, food.y * CELL + 2, CELL - 4, CELL - 4, 4)
  ctx.fill()

  // Snake
  snake.forEach((segment, i) => {
    const t = i / Math.max(snake.length - 1, 1)
    if (i === 0) {
      ctx.fillStyle = COLORS.snakeHead
    } else if (t < 0.5) {
      ctx.fillStyle = COLORS.snakeBody
    } else {
      ctx.fillStyle = COLORS.snakeTail
    }

    const pad = i === 0 ? 1 : 2
    const r = i === 0 ? 5 : 3
    ctx.beginPath()
    ctx.roundRect(
      segment.x * CELL + pad,
      segment.y * CELL + pad,
      CELL - pad * 2,
      CELL - pad * 2,
      r
    )
    ctx.fill()
  })

  // Snake eyes (head)
  if (snake.length > 0 && state.value === 'playing') {
    const head = snake[0]
    ctx.fillStyle = '#fff'
    const cx = head.x * CELL + CELL / 2
    const cy = head.y * CELL + CELL / 2
    const eyeOffset = 3
    let e1: Point, e2: Point

    switch (direction) {
      case 'right':
        e1 = { x: cx + eyeOffset, y: cy - eyeOffset }
        e2 = { x: cx + eyeOffset, y: cy + eyeOffset }
        break
      case 'left':
        e1 = { x: cx - eyeOffset, y: cy - eyeOffset }
        e2 = { x: cx - eyeOffset, y: cy + eyeOffset }
        break
      case 'up':
        e1 = { x: cx - eyeOffset, y: cy - eyeOffset }
        e2 = { x: cx + eyeOffset, y: cy - eyeOffset }
        break
      case 'down':
        e1 = { x: cx - eyeOffset, y: cy + eyeOffset }
        e2 = { x: cx + eyeOffset, y: cy + eyeOffset }
        break
    }

    ctx.beginPath()
    ctx.arc(e1.x, e1.y, 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(e2.x, e2.y, 2, 0, Math.PI * 2)
    ctx.fill()
  }
}

defineExpose({ score, highScore, state })
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
