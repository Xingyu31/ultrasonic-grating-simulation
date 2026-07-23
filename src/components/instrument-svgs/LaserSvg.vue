<template>
  <div class="laser-svg">
    <svg viewBox="0 0 100 150" class="laser-icon">
      <rect x="5" y="10" width="90" height="130" rx="8" fill="#1f2937" stroke="#374151" stroke-width="2"/>
      
      <rect x="10" y="20" width="80" height="35" rx="4" fill="#111827"/>
      <text x="50" y="42" text-anchor="middle" fill="#9ca3af" font-size="10" font-weight="bold">氦氖激光器</text>
      
      <rect x="10" y="60" width="80" height="50" rx="4" fill="#111827"/>
      
      <circle cx="35" cy="85" r="18" fill="#1f2937" stroke="#4b5563" stroke-width="2"/>
      <circle cx="35" cy="85" r="12" :fill="laserOn ? '#f59e0b' : '#374151'" />
      <circle v-if="laserOn" cx="35" cy="85" r="8" fill="#fef3c7" />
      <circle v-if="laserOn" cx="35" cy="85" r="14" fill="#f59e0b" opacity="0.3">
        <animate attributeName="r" values="12;16;12" dur="1.5s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.5;0.2;0.5" dur="1.5s" repeatCount="indefinite"/>
      </circle>
      
      <rect x="55" y="70" width="30" height="30" rx="3" fill="#1f2937"/>
      <text x="70" y="88" text-anchor="middle" :fill="laserOn ? '#ef4444' : '#6b7280'" font-size="12" font-weight="bold">{{ laserOn ? 'ON' : 'OFF' }}</text>
      
      <rect x="10" y="115" width="80" height="20" rx="3" fill="#111827"/>
      <text x="50" y="129" text-anchor="middle" fill="#6b7280" font-size="9">波长: {{ wavelength.toFixed(2) }} nm</text>
      
      <rect x="90" y="75" width="8" height="30" rx="2" fill="#4b5563"/>
      
      <line v-if="laserOn" x1="98" y1="90" x2="120" y2="90" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
      <line v-if="laserOn" x1="98" y1="90" x2="120" y2="90" stroke="#fecaca" stroke-width="1" stroke-linecap="round"/>
    </svg>
  </div>
</template>

<script setup>
defineProps({
  laserOn: { type: Boolean, default: false },
  wavelength: { type: Number, default: 600.79 }
})
</script>

<style scoped>
.laser-svg {
  width: 100px;
  height: 150px;
}

.laser-icon {
  width: 100%;
  height: 100%;
}
</style>