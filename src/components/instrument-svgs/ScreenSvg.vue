<template>
  <div class="screen-svg">
    <svg viewBox="0 0 140 240" class="screen-icon">
      <rect x="10" y="10" width="120" height="200" rx="4" fill="#1f2937" stroke="#374151" stroke-width="2"/>
      
      <rect x="20" y="20" width="100" height="160" rx="2" :fill="focusComplete ? '#000000' : '#1e293b'"/>
      
      <line v-if="focusComplete" x1="20" y1="100" x2="120" y2="100" stroke="#ef4444" stroke-width="2"/>
      <line v-if="focusComplete" x1="70" y1="20" x2="70" y2="180" stroke="#ef4444" stroke-width="2"/>
      
      <line v-if="focusComplete" x1="40" y1="100" x2="40" y2="60" stroke="#fbbf24" stroke-width="3"/>
      <line v-if="focusComplete" x1="40" y1="100" x2="40" y2="140" stroke="#fbbf24" stroke-width="3"/>
      
      <line v-if="focusComplete" x1="60" y1="100" x2="60" y2="50" stroke="#fbbf24" stroke-width="4"/>
      <line v-if="focusComplete" x1="60" y1="100" x2="60" y2="150" stroke="#fbbf24" stroke-width="4"/>
      
      <line v-if="focusComplete" x1="70" y1="100" x2="70" y2="40" stroke="#ffffff" stroke-width="6"/>
      <line v-if="focusComplete" x1="70" y1="100" x2="70" y2="160" stroke="#ffffff" stroke-width="6"/>
      
      <line v-if="focusComplete" x1="80" y1="100" x2="80" y2="50" stroke="#fbbf24" stroke-width="4"/>
      <line v-if="focusComplete" x1="80" y1="100" x2="80" y2="150" stroke="#fbbf24" stroke-width="4"/>
      
      <line v-if="focusComplete" x1="100" y1="100" x2="100" y2="60" stroke="#fbbf24" stroke-width="3"/>
      <line v-if="focusComplete" x1="100" y1="100" x2="100" y2="140" stroke="#fbbf24" stroke-width="3"/>
      
      <rect x="10" y="185" width="120" height="25" rx="4" fill="#374151"/>
      <text x="70" y="203" text-anchor="middle" :fill="focusComplete ? '#22c55e' : '#ef4444'" font-size="11" font-weight="bold">
        {{ focusComplete ? '✓ 条纹清晰' : '✗ 条纹模糊' }}
      </text>
      
      <rect x="10" y="215" width="120" height="20" rx="2" fill="#0f172a"/>
      <text x="70" y="229" text-anchor="middle" fill="#6b7280" font-size="9">观察接收屏</text>
    </svg>
  </div>
</template>

<script setup>
defineProps({
  focusComplete: { type: Boolean, default: false }
})
</script>

<style scoped>
.screen-svg {
  width: 140px;
  height: 240px;
}

.screen-icon {
  width: 100%;
  height: 100%;
}
</style>