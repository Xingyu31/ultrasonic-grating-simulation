<template>
  <div class="rail-svg">
    <svg viewBox="0 0 200 100" class="rail-icon">
      <rect x="10" y="40" width="180" height="20" rx="4" fill="#374151"/>
      
      <rect x="15" y="45" width="170" height="10" rx="2" fill="#6b7280"/>
      
      <rect x="10" y="70" width="180" height="25" rx="4" fill="#1f2937"/>
      <text x="100" y="88" text-anchor="middle" fill="#9ca3af" font-size="11" font-weight="bold">光学平移导轨</text>
      
      <rect x="10" y="10" width="180" height="25" rx="4" fill="#374151"/>
      <text x="100" y="28" text-anchor="middle" fill="#6b7280" font-size="10">距离: {{ distance.toFixed(3) }} m</text>
      
      <circle v-for="i in 10" :key="i" :cx="15 + (i-1)*20" cy="50" r="2" fill="#9ca3af"/>
      
      <rect :x="15 + (distance * 200).toFixed(0)" y="25" width="30" height="30" rx="4" fill="#2563eb"/>
      <circle :cx="15 + (distance * 200).toFixed(0) + 15" cy="40" r="8" fill="#3b82f6"/>
      
      <text x="100" y="45" text-anchor="middle" fill="#f97316" font-size="9">光栅位置</text>
    </svg>
  </div>
</template>

<script setup>
defineProps({
  distance: { type: Number, default: 0.3 }
})
</script>

<style scoped>
.rail-svg {
  width: 200px;
  height: 100px;
}

.rail-icon {
  width: 100%;
  height: 100%;
}
</style>