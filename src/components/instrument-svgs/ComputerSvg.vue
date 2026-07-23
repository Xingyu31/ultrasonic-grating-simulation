<template>
  <div class="computer-container">
    <svg viewBox="0 0 180 160" class="computer-icon">
      <rect x="20" y="5" width="140" height="100" rx="4" fill="#1f2937" stroke="#374151" stroke-width="2"/>
      
      <rect x="25" y="15" width="130" height="70" rx="2" fill="#0a0a0a"/>
      
      <rect x="30" y="20" width="120" height="15" rx="2" fill="#1e293b"/>
      <text x="90" y="32" text-anchor="middle" fill="#94a3b8" font-size="8">超声光栅衍射数据采集系统</text>
      
      <rect x="30" y="40" width="120" height="40" rx="2" fill="#0f172a"/>
      
      <text x="45" y="52" text-anchor="start" fill="#22c55e" font-size="8">波长: 600.8 nm</text>
      <text x="45" y="62" text-anchor="start" fill="#22c55e" font-size="8">频率: 8.0 MHz</text>
      <text x="45" y="72" text-anchor="start" fill="#22c55e" font-size="8">间距: 0.096 mm</text>
      
      <rect x="30" y="90" width="120" height="5" rx="2" fill="#374151"/>
      
      <rect x="25" y="85" width="130" height="15" rx="0" fill="#1f2937"/>
      
      <rect x="20" y="105" width="140" height="8" rx="0" fill="#4b5563"/>
      
      <rect x="5" y="70" width="20" height="80" rx="4" fill="#1f2937" stroke="#374151" stroke-width="2"/>
      
      <rect x="10" y="78" width="10" height="15" rx="2" fill="#374151"/>
      
      <circle cx="15" cy="102" r="4" fill="#22c55e"/>
      
      <rect x="10" y="115" width="10" height="25" rx="2" fill="#374151"/>
      
      <line x1="25" y1="95" x2="5" y2="95" stroke="#4b5563" stroke-width="3"/>
      
      <circle cx="170" cy="25" r="3" fill="#22c55e"/>
      <circle cx="170" cy="40" r="3" fill="#22c55e"/>
      <circle cx="170" cy="55" r="3" fill="#ef4444"/>
    </svg>
  </div>
</template>

<script setup>
</script>

<style scoped>
.computer-container {
  width: 180px;
  height: 160px;
}

.computer-icon {
  width: 100%;
  height: 100%;
}
</style>