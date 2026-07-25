<template>
  <div class="instrument-modal">
    <div class="modal-overlay" @click="$emit('close')"></div>
    <ZoomModal :show="showZoomModal" :title="zoomTitle" :drawFn="zoomDrawFn" :width="zoomWidth" :height="zoomHeight" @close="closeZoomModal" />
    <div class="modal-content">
      <div class="modal-header">
        <span class="modal-title">📷 CCD相机</span>
        <button class="modal-close" @click="$emit('close')">✕</button>
      </div>
      <div class="modal-body">
        <div class="focus-section">
          <div class="focus-label">对焦状态</div>
          <div class="focus-status" :class="{ focused: isFocused }">
            <span class="status-icon">{{ isFocused ? '✓' : '○' }}</span>
            <span class="status-text">{{ isFocused ? '条纹清晰（已对焦）' : '条纹模糊（未对焦）' }}</span>
          </div>
        </div>

        <div class="preview-section">
          <div class="preview-title">CCD相机观察到的衍射光斑图样</div>
          <div class="preview-canvas">
            <canvas ref="diffractionCanvas" class="diffraction-canvas" @dblclick="zoomDiffraction"></canvas>
          </div>
        </div>

        <div class="focus-control">
          <button class="focus-button" :class="{ focused: isFocused }" @click="handleFocus">
            {{ isFocused ? '重新对焦' : '点击对焦' }}
          </button>
        </div>

        <div class="ccd-info">
          <div class="info-item">
            <span class="info-label">CCD型号</span>
            <span class="info-value">SONY ICX429AL</span>
          </div>
          <div class="info-item">
            <span class="info-label">像素数</span>
            <span class="info-value">1360 × 1024</span>
          </div>
          <div class="info-item">
            <span class="info-label">像元尺寸</span>
            <span class="info-value">6.45 μm × 6.45 μm</span>
          </div>
          <div class="info-item">
            <span class="info-label">状态</span>
            <span class="info-value" :class="{ active: laserOn }">{{ laserOn ? '✓ 正在采集' : '○ 待机' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import ZoomModal from './ZoomModal.vue'

const props = defineProps({
  laserOn: {
    type: Boolean,
    default: false
  },
  params: {
    type: Object,
    default: () => ({
      wavelength: 600,
      frequency: 8.0,
      concentration: 7.74,
      distance: 0.3,
      liquidTypeId: 'nacl'
    })
  },
  experimentMode: {
    type: String,
    default: 'wavelength'
  }
})

const emit = defineEmits(['close', 'focusComplete', 'addRecord'])

const diffractionCanvas = ref(null)
const isFocused = ref(false)
const showZoomModal = ref(false)
const zoomTitle = ref('')
const zoomDrawFn = ref(null)
const zoomWidth = ref(900)
const zoomHeight = ref(600)

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

const getSoundSpeed = (liquidTypeId, concentration, temperature = 20) => {
  const liquidConfigs = {
    'pure-water': {
      temperatureFormula: (t) => 1398 + 3.46 * t
    },
    'nacl': { 
      baseSpeed: 1482.3, 
      speedFactor: 0,
      tableData: [
        { molL: 0.000, wt: 0, speed: 1482.3 },
        { molL: 0.402, wt: 2.35, speed: 1496.0 },
        { molL: 0.707, wt: 4.13, speed: 1500.4 },
        { molL: 1.058, wt: 6.18, speed: 1514.8 },
        { molL: 1.436, wt: 8.40, speed: 1521.5 },
        { molL: 1.803, wt: 10.53, speed: 1535.8 },
        { molL: 2.156, wt: 12.59, speed: 1541.7 },
        { molL: 2.576, wt: 15.04, speed: 1558.5 },
        { molL: 2.958, wt: 17.28, speed: 1564.7 },
        { molL: 3.383, wt: 19.76, speed: 1580.1 },
        { molL: 3.801, wt: 22.20, speed: 1590.2 },
        { molL: 4.232, wt: 24.72, speed: 1606.3 },
        { molL: 4.665, wt: 27.24, speed: 1612.7 },
        { molL: 5.115, wt: 29.87, speed: 1629.3 },
        { molL: 5.564, wt: 32.50, speed: 1641.0 },
        { molL: 6.065, wt: 35.42, speed: 1656.5 },
        { molL: 6.520, wt: 38.08, speed: 1668.2 },
        { molL: 6.958, wt: 40.64, speed: 1683.4 },
        { molL: 7.547, wt: 44.07, speed: 1695.8 },
        { molL: 8.019, wt: 46.83, speed: 1713.4 },
        { molL: 8.570, wt: 50, speed: 1729.8 },
        { molL: 10.284, wt: 60, speed: 1779.2 },
        { molL: 11.998, wt: 70, speed: 1828.6 },
        { molL: 13.712, wt: 80, speed: 1878.0 },
        { molL: 15.426, wt: 90, speed: 1927.4 },
        { molL: 16.283, wt: 95, speed: 1952.1 }
      ]
    },
    'ethylene-glycol': { baseSpeed: 1500, speedFactor: 10 },
    'glycerol': { baseSpeed: 1480, speedFactor: 12 },
    'sugar': { baseSpeed: 1480, speedFactor: 5.5 },
    'alcohol': { baseSpeed: 1480, speedFactor: -2.5 },
    'hcl': { baseSpeed: 1480, speedFactor: 8 },
    'naoh': { baseSpeed: 1480, speedFactor: 7 }
  }
  const config = liquidConfigs[liquidTypeId] || liquidConfigs['nacl']
  
  if (config.temperatureFormula) {
    return config.temperatureFormula(temperature)
  }
  
  if (config.tableData) {
    const tableData = config.tableData
    if (concentration <= tableData[0].wt) return tableData[0].speed
    if (concentration >= tableData[tableData.length - 1].wt) return tableData[tableData.length - 1].speed
    
    for (let i = 0; i < tableData.length - 1; i++) {
      const current = tableData[i]
      const next = tableData[i + 1]
      if (concentration >= current.wt && concentration <= next.wt) {
        const ratio = (concentration - current.wt) / (next.wt - current.wt)
        return current.speed + ratio * (next.speed - current.speed)
      }
    }
    return tableData[0].speed
  }
  
  return config.baseSpeed + config.speedFactor * concentration
}

const ultrasonicWavelength = (frequency, concentration, temperature = 20) => {
  const liquidTypeId = props.params.liquidTypeId || 'nacl'
  const vs = getSoundSpeed(liquidTypeId, concentration, temperature)
  return vs / (frequency * 1e6)
}

const fringePosition = (m, wavelength, frequency, concentration, distance) => {
  const temperature = props.params.temperature || 20
  const ds = ultrasonicWavelength(frequency, concentration, temperature)
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
  const stripeWidth = isFocused.value ? 2 : 6
  
  for (let m = -5; m <= 5; m++) {
    const xM = fringePosition(m, wavelength, props.params.frequency, props.params.concentration, props.params.distance)
    
    let mIntensity
    if (m === 0) {
      mIntensity = 1.0
    } else {
      mIntensity = Math.max(0.05, Math.pow(0.6, Math.abs(m)))
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
    verticalGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`)
    verticalGradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.3})`)
    verticalGradient.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.7})`)
    verticalGradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${mIntensity})`)
    verticalGradient.addColorStop(0.55, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.7})`)
    verticalGradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.3})`)
    verticalGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
    ctx.strokeStyle = verticalGradient
    ctx.lineWidth = stripeWidth * 3
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(px, yStart)
    ctx.lineTo(px, yEnd)
    ctx.stroke()
  }
}

const createDrawDiffractionPattern = (params, focused) => {
  return (ctx, width, height) => {
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, width, height)
    
    const wavelength = params.wavelength * 1e-9
    const wavelengthNm = params.wavelength
    const spotColor = wavelengthToRgb(wavelengthNm)
    
    const yCenter = height / 2
    const xCenter = width / 2
    
    const xMin = -15 / 1000
    const xMax = 15 / 1000
    
    const stripeHeight = height * 0.85
    const stripeWidth = focused ? 2 : 6
    
    for (let m = -5; m <= 5; m++) {
      const xM = fringePosition(m, wavelength, params.frequency, params.concentration, params.distance)
      
      let mIntensity
      if (m === 0) {
        mIntensity = 1.0
      } else {
        mIntensity = Math.max(0.05, Math.pow(0.6, Math.abs(m)))
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
      verticalGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`)
      verticalGradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.3})`)
      verticalGradient.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.7})`)
      verticalGradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${mIntensity})`)
      verticalGradient.addColorStop(0.55, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.7})`)
      verticalGradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.3})`)
      verticalGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
      ctx.strokeStyle = verticalGradient
      ctx.lineWidth = stripeWidth * 3
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(px, yStart)
      ctx.lineTo(px, yEnd)
      ctx.stroke()
    }
  }
}

const zoomDiffraction = () => {
  zoomTitle.value = '衍射光斑图样'
  zoomDrawFn.value = createDrawDiffractionPattern(props.params, isFocused.value)
  zoomWidth.value = 900
  zoomHeight.value = 600
  showZoomModal.value = true
}

const closeZoomModal = () => {
  showZoomModal.value = false
}

const handleFocus = () => {
  isFocused.value = !isFocused.value
  drawDiffractionPattern()
  
  if (isFocused.value) {
    const baseVs = getSoundSpeed(props.params.liquidTypeId || 'nacl', props.params.concentration, props.params.temperature)
    const speedError = (Math.random() - 0.5) * 3
    const finalSpeed = baseVs + speedError
    
    const k = 1
    const lambda = props.params.wavelength * 1e-9
    const f = props.params.frequency * 1e6
    const L = props.params.distance
    const vs = finalSpeed
    
    const theoreticalSpacing = (2 * k * lambda * f * L) / vs
    const spacingError = (Math.random() - 0.5) * 0.005 * theoreticalSpacing
    const measuredSpacingMeters = theoreticalSpacing + spacingError
    
    emit('addRecord', {
      wavelength: props.params.wavelength,
      frequency: props.params.frequency,
      concentration: props.params.concentration,
      spacing: measuredSpacingMeters * 1000,
      speed: finalSpeed,
      experimentMode: props.experimentMode
    })
    
    emit('focusComplete')
    
    setTimeout(() => {
      alert('已将数据嵌入到测量界面的实验记录表中')
    }, 500)
  }
}

onMounted(() => {
  nextTick(() => {
    drawDiffractionPattern()
  })
})

watch(() => props.params, () => {
  nextTick(() => {
    drawDiffractionPattern()
  })
}, { deep: true })
</script>

<style scoped>
.instrument-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
}

.modal-content {
  position: relative;
  width: 500px;
  background: #1e293b;
  border-radius: 12px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #334155;
}

.modal-title {
  font-size: 16px;
  font-weight: bold;
  color: #f1f5f9;
}

.modal-close {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 20px;
  cursor: pointer;
}

.modal-close:hover {
  color: #fff;
}

.modal-body {
  padding: 20px;
}

.focus-section {
  margin-bottom: 15px;
}

.focus-label {
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 8px;
}

.focus-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 15px;
  background: #0f172a;
  border-radius: 8px;
}

.focus-status.focused {
  background: #064e3b;
}

.status-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #64748b;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
  font-size: 12px;
}

.focus-status.focused .status-icon {
  background: #10b981;
}

.status-text {
  font-size: 14px;
  color: #f1f5f9;
}

.preview-section {
  margin-bottom: 15px;
}

.preview-title {
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 10px;
}

.preview-canvas {
  width: 100%;
  height: 200px;
  background: #000;
  border-radius: 8px;
  overflow: hidden;
}

.diffraction-canvas {
  width: 100%;
  height: 100%;
}

.focus-control {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
}

.focus-button {
  padding: 12px 30px;
  font-size: 14px;
  font-weight: bold;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  transition: all 0.3s;
}

.focus-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
}

.focus-button.focused {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.focus-button.focused:hover {
  box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
}

.ccd-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #0f172a;
  border-radius: 8px;
}

.info-label {
  font-size: 13px;
  color: #94a3b8;
}

.info-value {
  font-size: 14px;
  color: #f1f5f9;
  font-weight: bold;
}

.info-value.active {
  color: #10b981;
}
</style>