<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <span class="modal-icon">⚪</span>
        <span class="modal-title">CCD相机观察屏</span>
        <button class="modal-close" @click="$emit('close')">×</button>
      </div>
      
      <div class="modal-body">
        <div class="focus-section">
          <div class="focus-label">对焦状态</div>
          <div class="focus-status" :class="{ focused: focusComplete }">
            <span class="status-icon">{{ focusComplete ? '✓' : '○' }}</span>
            <span class="status-text">{{ focusComplete ? '条纹清晰（已对焦）' : '条纹模糊（未对焦）' }}</span>
          </div>
        </div>
        
        <div class="preview-section">
          <div class="preview-title">CCD相机观察到的衍射光斑图样</div>
          <div class="preview-canvas">
            <canvas ref="diffractionCanvas" class="diffraction-canvas"></canvas>
          </div>
        </div>
        
        <div class="focus-control">
          <div class="control-label">对焦调节</div>
          <button class="focus-button" :class="{ focused: focusComplete }" @click="$emit('toggleFocus')">
            {{ focusComplete ? '重新对焦' : '点击对焦' }}
          </button>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-cancel" @click="$emit('close')">取消</button>
        <button class="btn-complete" :class="{ disabled: !focusComplete }" @click="completeStep">
          {{ stepCompleted ? '已完成' : '完成步骤' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'

const props = defineProps({
  focusComplete: Boolean,
  stepCompleted: Boolean,
  params: Object
})

const emit = defineEmits(['close', 'toggleFocus', 'completeStep'])

const diffractionCanvas = ref(null)

const wavelengthToRgb = (wavelength) => {
  const w = wavelength
  let R, G, B
  if (w >= 380 && w < 440) {
    R = -(w - 440) / (440 - 380)
    G = 0.0
    B = 1.0
  } else if (w >= 440 && w < 490) {
    R = 0.0
    G = (w - 440) / (490 - 440)
    B = 1.0
  } else if (w >= 490 && w < 510) {
    R = 0.0
    G = 1.0
    B = -(w - 510) / (510 - 490)
  } else if (w >= 510 && w < 580) {
    R = (w - 510) / (580 - 510)
    G = 1.0
    B = 0.0
  } else if (w >= 580 && w < 645) {
    R = 1.0
    G = -(w - 645) / (645 - 580)
    B = 0.0
  } else if (w >= 645 && w <= 780) {
    R = 1.0
    G = 0.0
    B = 0.0
  } else {
    R = 0.5
    G = 0.5
    B = 0.5
  }
  return { r: R, g: G, b: B }
}

const ultrasonicWavelength = (frequency, concentration) => {
  const vs = 1500 + concentration * 10
  return vs / (frequency * 1e6)
}

const fringePosition = (m, wavelength, frequency, concentration, distance) => {
  const ds = ultrasonicWavelength(frequency, concentration)
  return m * wavelength * distance / ds
}

const drawDiffractionPattern = () => {
  const canvas = diffractionCanvas.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height
  
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, width, height)
  
  const wavelength = props.params.wavelength * 1e-9
  const wavelengthNm = props.params.wavelength
  const spotColor = wavelengthToRgb(wavelengthNm)
  
  const yCenter = height / 2
  const xCenter = width / 2
  
  const xMin = -15 / 1000
  const xMax = 15 / 1000
  
  const stripeHeight = height * 0.85
  const stripeWidth = props.focusComplete ? 2 : 6
  
  for (let m = -5; m <= 5; m++) {
    const xM = fringePosition(m, wavelength, props.params.frequency, props.params.concentration, props.params.distance)
    
    let mIntensity
    if (m === 0) {
      mIntensity = 1.0
    } else {
      mIntensity = Math.max(0.4, 1.0 - Math.abs(m) * 0.07)
    }
    
    const px = xCenter + (xM / (xMax - xMin)) * width
    
    const r = Math.round(spotColor.r * 255)
    const g = Math.round(spotColor.g * 255)
    const b = Math.round(spotColor.b * 255)
    
    const yStart = yCenter - stripeHeight / 2
    const yEnd = yCenter + stripeHeight / 2
    
    const outerGlowGradient = ctx.createLinearGradient(px - stripeWidth * 4, yStart, px + stripeWidth * 4, yStart)
    outerGlowGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`)
    outerGlowGradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.2})`)
    outerGlowGradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.35})`)
    outerGlowGradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.2})`)
    outerGlowGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
    ctx.strokeStyle = outerGlowGradient
    ctx.lineWidth = stripeWidth * 8
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(px, yStart)
    ctx.lineTo(px, yEnd)
    ctx.stroke()
    
    const middleGlowGradient = ctx.createLinearGradient(px - stripeWidth * 2.5, yStart, px + stripeWidth * 2.5, yStart)
    middleGlowGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`)
    middleGlowGradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.4})`)
    middleGlowGradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.6})`)
    middleGlowGradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.4})`)
    middleGlowGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
    ctx.strokeStyle = middleGlowGradient
    ctx.lineWidth = stripeWidth * 4
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(px, yStart)
    ctx.lineTo(px, yEnd)
    ctx.stroke()
    
    const verticalGradient = ctx.createLinearGradient(px, yStart, px, yEnd)
    verticalGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.3})`)
    verticalGradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.7})`)
    verticalGradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${mIntensity})`)
    verticalGradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.7})`)
    verticalGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.3})`)
    ctx.strokeStyle = verticalGradient
    ctx.lineWidth = stripeWidth * 2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(px, yStart)
    ctx.lineTo(px, yEnd)
    ctx.stroke()
    
    const coreGradient = ctx.createLinearGradient(px, yStart, px, yEnd)
    coreGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.5})`)
    coreGradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${mIntensity})`)
    coreGradient.addColorStop(0.5, `rgba(${r + 20}, ${g + 20}, ${b + 20}, ${mIntensity})`)
    coreGradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${mIntensity})`)
    coreGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.5})`)
    ctx.strokeStyle = coreGradient
    ctx.lineWidth = stripeWidth
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(px, yStart)
    ctx.lineTo(px, yEnd)
    ctx.stroke()
    
    if (mIntensity > 0.6) {
      const brightCoreGradient = ctx.createLinearGradient(px, yStart, px, yEnd)
      brightCoreGradient.addColorStop(0, `rgba(255, 255, 255, 0)`)
      brightCoreGradient.addColorStop(0.45, `rgba(255, 255, 255, ${mIntensity * 0.4})`)
      brightCoreGradient.addColorStop(0.5, `rgba(255, 255, 255, ${mIntensity * 0.7})`)
      brightCoreGradient.addColorStop(0.55, `rgba(255, 255, 255, ${mIntensity * 0.4})`)
      brightCoreGradient.addColorStop(1, `rgba(255, 255, 255, 0)`)
      ctx.strokeStyle = brightCoreGradient
      ctx.lineWidth = stripeWidth * 0.5
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(px, yStart)
      ctx.lineTo(px, yEnd)
      ctx.stroke()
    }
  }
  
  ctx.strokeStyle = '#374151'
  ctx.lineWidth = 0.5
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  ctx.moveTo(0, yCenter)
  ctx.lineTo(width, yCenter)
  ctx.stroke()
  
  ctx.strokeStyle = '#4b5563'
  ctx.lineWidth = 1
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(xCenter, 0)
  ctx.lineTo(xCenter, height)
  ctx.stroke()
  
  ctx.setLineDash([])
  
  if (props.focusComplete) {
    for (let m = -2; m <= 2; m++) {
      const pos = fringePosition(m, wavelength, props.params.frequency, props.params.concentration, props.params.distance) * 1000
      const px = xCenter + (pos / 15) * (width / 2)
      
      ctx.fillStyle = 'rgba(0,0,0,0.8)'
      ctx.fillRect(px - 20, yCenter + 8, 40, 16)
      
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 10px Microsoft YaHei'
      ctx.textAlign = 'center'
      ctx.fillText(`${m}级`, px, yCenter + 20)
    }
  } else {
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.fillRect(width / 2 - 70, height / 2 - 15, 140, 30)
    
    ctx.fillStyle = '#ef4444'
    ctx.font = 'bold 12px Microsoft YaHei'
    ctx.textAlign = 'center'
    ctx.fillText('对焦未完成 - 条纹模糊', width / 2, height / 2 + 5)
  }
}

const completeStep = () => {
  emit('completeStep')
}

onMounted(() => {
  nextTick(() => {
    const canvas = diffractionCanvas.value
    if (canvas) {
      const rect = canvas.parentElement.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height * 0.8
      drawDiffractionPattern()
    }
  })
})

watch(() => [props.focusComplete, props.params], () => {
  drawDiffractionPattern()
}, { deep: true })
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  width: 500px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
  color: white;
}

.modal-icon {
  font-size: 24px;
  margin-right: 10px;
}

.modal-title {
  flex: 1;
  font-size: 16px;
  font-weight: bold;
}

.modal-close {
  font-size: 24px;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.modal-body {
  padding: 20px;
}

.focus-section {
  margin-bottom: 15px;
}

.focus-label {
  font-size: 13px;
  font-weight: bold;
  color: #374151;
  margin-bottom: 10px;
}

.focus-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background-color: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fee2e2;
}

.focus-status.focused {
  background-color: #f0fdf4;
  border-color: #bbf7d0;
}

.status-icon {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background-color: #ef4444;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.focus-status.focused .status-icon {
  background-color: #22c55e;
}

.status-text {
  font-size: 12px;
  font-weight: 600;
  color: #dc2626;
}

.focus-status.focused .status-text {
  color: #16a34a;
}

.preview-section {
  margin-bottom: 15px;
}

.preview-title {
  font-size: 13px;
  font-weight: bold;
  color: #374151;
  margin-bottom: 10px;
}

.preview-canvas {
  background-color: #1f2937;
  border-radius: 8px;
  padding: 10px;
  height: 200px;
}

.diffraction-canvas {
  width: 100%;
  height: 100%;
  border-radius: 4px;
}

.focus-control {
  margin-top: 15px;
}

.control-label {
  font-size: 13px;
  font-weight: bold;
  color: #374151;
  margin-bottom: 10px;
}

.focus-button {
  width: 100%;
  padding: 15px;
  background-color: #f3f4f6;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.3s;
}

.focus-button:hover {
  background-color: #e5e7eb;
}

.focus-button.focused {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  border-color: #22c55e;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 15px 20px;
  background-color: #f8fafc;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel {
  padding: 8px 16px;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel:hover {
  background-color: #e5e7eb;
}

.btn-complete {
  padding: 8px 24px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-complete.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>