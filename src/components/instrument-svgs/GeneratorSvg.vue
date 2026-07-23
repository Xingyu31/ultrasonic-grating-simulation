<template>
  <div class="generator-svg">
    <svg viewBox="0 0 160 140" class="generator-icon">
      <rect x="5" y="5" width="150" height="130" rx="8" fill="#1f2937" stroke="#374151" stroke-width="2"/>
      
      <rect x="10" y="10" width="140" height="30" rx="4" fill="#111827"/>
      <text x="80" y="30" text-anchor="middle" fill="#22c55e" font-size="11" font-weight="bold">超声波发生器</text>
      
      <rect x="10" y="45" width="70" height="60" rx="4" fill="#111827"/>
      <text x="45" y="60" text-anchor="middle" fill="#9ca3af" font-size="9">频率</text>
      
      <rect x="20" y="68" width="50" height="25" rx="3" fill="#065f46"/>
      <text x="45" y="86" text-anchor="middle" fill="#22c55e" font-size="18" font-weight="bold">{{ frequency.toFixed(1) }}</text>
      <text x="45" y="98" text-anchor="middle" fill="#166534" font-size="8">MHz</text>
      
      <circle cx="30" cy="115" r="10" fill="#f59e0b" stroke="#d97706" stroke-width="2"/>
      <circle cx="30" cy="115" r="6" fill="#d97706"/>
      
      <rect x="80" y="45" width="70" height="60" rx="4" fill="#111827"/>
      <text x="115" y="60" text-anchor="middle" fill="#9ca3af" font-size="9">振幅</text>
      
      <rect x="90" y="68" width="50" height="25" rx="3" fill="#581c87"/>
      <text x="115" y="86" text-anchor="middle" fill="#a855f7" font-size="18" font-weight="bold">{{ amplitude }}</text>
      <text x="115" y="98" text-anchor="middle" fill="#4c1d95" font-size="8">%</text>
      
      <circle cx="105" cy="115" r="10" fill="#a855f7" stroke="#7e22ce" stroke-width="2"/>
      <circle cx="105" cy="115" r="6" fill="#7e22ce"/>
      
      <circle cx="145" cy="25" r="5" fill="#22c55e"/>
      <rect x="130" y="110" width="20" height="15" rx="3" fill="#166534"/>
      <text x="140" y="121" text-anchor="middle" fill="#22c55e" font-size="9" font-weight="bold">POWER</text>
    </svg>
  </div>
</template>

<script setup>
defineProps({
  frequency: { type: Number, default: 8.0 },
  amplitude: { type: Number, default: 50 }
})
</script>

<style scoped>
.generator-svg {
  width: 160px;
  height: 140px;
}

.generator-icon {
  width: 100%;
  height: 100%;
}
</style>