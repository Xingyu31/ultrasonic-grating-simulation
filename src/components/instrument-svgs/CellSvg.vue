<template>
  <div class="cell-svg">
    <svg viewBox="0 0 160 180" class="cell-icon">
      <defs>
        <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#60a5fa;stop-opacity:0.3" />
          <stop offset="50%" style="stop-color:#3b82f6;stop-opacity:0.5" />
          <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:0.3" />
        </linearGradient>
        <linearGradient id="liquidGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#93c5fd;stop-opacity:0.8" />
          <stop offset="50%" style="stop-color:#60a5fa;stop-opacity:0.9" />
          <stop offset="100%" style="stop-color:#2563eb;stop-opacity:0.7" />
        </linearGradient>
        <linearGradient id="reflectGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ffffff;stop-opacity:0.3" />
          <stop offset="50%" style="stop-color:#ffffff;stop-opacity:0.1" />
          <stop offset="100%" style="stop-color:#ffffff;stop-opacity:0" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      <rect x="30" y="150" width="100" height="15" rx="3" fill="#374151"/>
      <rect x="25" y="145" width="110" height="8" rx="2" fill="#4b5563"/>
      
      <line x1="30" y1="150" x2="20" y2="175" stroke="#374151" stroke-width="4" stroke-linecap="round"/>
      <line x1="130" y1="150" x2="140" y2="175" stroke="#374151" stroke-width="4" stroke-linecap="round"/>
      
      <rect x="20" y="60" width="120" height="95" rx="4" fill="url(#glassGradient)" stroke="#93c5fd" stroke-width="2" filter="url(#glow)"/>
      
      <rect x="22" y="62" width="116" height="10" rx="2" fill="url(#reflectGradient)"/>
      
      <rect x="25" y="70" width="110" height="75" rx="3" fill="url(#liquidGradient)"/>
      
      <path d="M25 70 Q30 65, 40 70 T60 70 T80 70 T100 70 T120 70 T135 70" fill="none" stroke="#bfdbfe" stroke-width="1" opacity="0.6"/>
      <path d="M25 80 Q35 75, 50 80 T75 80 T100 80 T125 80 T135 80" fill="none" stroke="#bfdbfe" stroke-width="1" opacity="0.4"/>
      <path d="M25 90 Q40 85, 55 90 T85 90 T115 90 T135 90" fill="none" stroke="#bfdbfe" stroke-width="1" opacity="0.3"/>
      
      <g transform="translate(80, 115)">
        <line x1="-40" y1="0" x2="40" y2="0" stroke="#fbbf24" stroke-width="1.5" opacity="0.8"/>
        <line x1="-35" y1="-8" x2="35" y2="8" stroke="#fbbf24" stroke-width="1" opacity="0.6"/>
        <line x1="-35" y1="8" x2="35" y2="-8" stroke="#fbbf24" stroke-width="1" opacity="0.6"/>
        <line x1="-25" y1="-5" x2="25" y2="5" stroke="#fbbf24" stroke-width="1" opacity="0.5"/>
        <line x1="-25" y1="5" x2="25" y2="-5" stroke="#fbbf24" stroke-width="1" opacity="0.5"/>
        <line x1="-15" y1="-3" x2="15" y2="3" stroke="#fbbf24" stroke-width="1" opacity="0.4"/>
        <line x1="-15" y1="3" x2="15" y2="-3" stroke="#fbbf24" stroke-width="1" opacity="0.4"/>
      </g>
      
      <rect x="15" y="30" width="130" height="25" rx="4" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
      <text x="80" y="48" text-anchor="middle" fill="#94a3b8" font-size="10" font-weight="600">超声光栅水槽</text>
      
      <rect x="15" y="155" width="130" height="18" rx="3" fill="#1e293b" stroke="#475569" stroke-width="1"/>
      <text x="80" y="168" text-anchor="middle" fill="#60a5fa" font-size="9" font-weight="500">浓度: {{ concentration.toFixed(4) }} wt%</text>
      
      <circle cx="145" cy="100" r="5" fill="#f97316"/>
      <line x1="145" y1="95" x2="145" y2="85" stroke="#f97316" stroke-width="2"/>
      <line x1="145" y1="105" x2="145" y2="115" stroke="#f97316" stroke-width="2"/>
      
      <circle cx="15" cy="100" r="5" fill="#60a5fa"/>
      <line x1="15" y1="95" x2="15" y2="85" stroke="#60a5fa" stroke-width="2"/>
      <line x1="15" y1="105" x2="15" y2="115" stroke="#60a5fa" stroke-width="2"/>
    </svg>
  </div>
</template>

<script setup>
defineProps({
  concentration: { type: Number, default: 7.74 }
})
</script>

<style scoped>
.cell-svg {
  width: 160px;
  height: 180px;
}

.cell-icon {
  width: 100%;
  height: 100%;
}
</style>