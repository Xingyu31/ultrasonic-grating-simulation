<template>
  <div class="archive-measure-view">
    <div class="am-header">
      <div class="am-header-left">
        <button class="btn-back" @click="$emit('exit')">← 返回</button>
        <span class="am-title">未知浓度测量模式</span>
      </div>
      <div class="am-header-right">
        <button class="btn-instrument" @click="$emit('openInstrument')">🔬 仪器仿真</button>
        <div class="archive-info-tag">
          <span class="tag-icon">📊</span>
          <span class="tag-name">{{ archive.name }}</span>
        </div>
      </div>
    </div>
    
    <div class="am-main">
      <div class="am-panel am-left-panel">
        <div class="panel-section">
          <div class="section-header">
            <span class="section-title">实验参数设置</span>
            <span class="section-subtitle">室温 20.00°C | 距离 0.30m</span>
          </div>
          
          <div class="param-row">
            <label class="param-label">光波长</label>
            <div class="param-control">
              <el-slider v-model="localParams.wavelength" :min="380" :max="700" :step="0.1" 
                         show-input :input-size="'small'" @change="onParamChange" />
              <span class="param-unit">nm</span>
            </div>
          </div>
          
          <div class="param-row">
            <label class="param-label">超声频率</label>
            <div class="param-control">
              <el-slider v-model="localParams.frequency" :min="5" :max="15" :step="0.1" 
                         show-input :input-size="'small'" @change="onParamChange" />
              <span class="param-unit">MHz</span>
            </div>
          </div>
          
          <div class="param-row concentration-row">
            <label class="param-label">溶液浓度</label>
            <div class="param-value secret">❓ 未知（测量后推算）</div>
          </div>
          
          <div class="action-buttons">
            <button class="btn-run" @click="runSimulation">▶ 运行仿真</button>
            <button class="btn-refresh" @click="refreshConcentration">🔄 刷新浓度</button>
          </div>
        </div>
        
        <div class="panel-section">
          <div class="section-header">
            <span class="section-title">测量结果</span>
          </div>
          
          <div class="result-item">
            <span class="result-label">测量声速</span>
            <span class="result-value">{{ measuredSpeed !== 0 ? measuredSpeed.toFixed(2) : '--' }}</span>
            <span class="result-unit">m/s</span>
          </div>
          
          <div class="result-item">
            <span class="result-label">推算浓度</span>
            <span class="result-value" :class="{ calculated: calculatedConcentration !== null }">
              {{ calculatedConcentration !== null ? calculatedConcentration.toFixed(4) : '--' }}
            </span>
            <span class="result-unit">wt%</span>
          </div>
        </div>
        
        <div class="panel-section">
          <div class="section-header">
            <span class="section-title">校准曲线</span>
          </div>
          
          <canvas ref="curveCanvas" class="curve-canvas" @dblclick="zoomCurve"></canvas>
          
          <div class="curve-formula">
            <span>校准公式: v = {{ archive.slope.toFixed(2) }} × c + {{ archive.intercept.toFixed(2) }}</span>
          </div>
          
          <div class="curve-range">
            <span>浓度范围: {{ archive.concentrationMin.toFixed(2) }}% ~ {{ archive.concentrationMax.toFixed(2) }}%</span>
          </div>
        </div>
      </div>
      
      <div class="am-panel am-center-panel">
        <div class="panel-section pattern-section">
          <div class="section-header">
            <span class="section-title">衍射光斑图样</span>
            <button class="btn-zoom" @click="zoomPattern">🔍 放大</button>
          </div>
          <canvas ref="mainCanvas" class="main-canvas" 
                  @click="handleCanvasClick"
                  @dblclick="zoomPattern"></canvas>
        </div>
        
        <div class="panel-section intensity-section">
          <div class="section-header">
            <span class="section-title">衍射光强分布曲线</span>
            <button class="btn-zoom" @click="zoomIntensity">🔍 放大</button>
          </div>
          <canvas ref="intensityCanvas" class="intensity-canvas" @dblclick="zoomIntensity"></canvas>
        </div>
      </div>
      
      <div class="am-panel am-right-panel">
        <div class="panel-section">
          <div class="section-header">
            <span class="section-title">游标读数</span>
            <button class="btn-auto-cursor" @click="autoCursor">⚡ 自动游标</button>
          </div>
          
          <div class="cursor-control">
            <div class="cursor-group">
              <div class="cursor-header">
                <label class="cursor-label">一级亮纹(+1)</label>
                <div class="cursor-actions">
                  <button class="btn-cursor-action" 
                          :class="{ active: activeCursor === 'plus' }"
                          @click="setActiveCursor('plus')">
                    {{ activeCursor === 'plus' ? '✓ 已激活' : '○ 激活' }}
                  </button>
                </div>
              </div>
              <div class="cursor-input-row">
                <button class="btn-adjust" @click="adjustCursor(-0.01, 'plus')">◀</button>
                <input v-model="plus1Position" type="number" step="0.01" class="cursor-input" />
                <button class="btn-adjust" @click="adjustCursor(0.01, 'plus')">▶</button>
              </div>
              <span class="cursor-unit">mm</span>
            </div>
            
            <div class="cursor-group">
              <div class="cursor-header">
                <label class="cursor-label">一级亮纹(-1)</label>
                <div class="cursor-actions">
                  <button class="btn-cursor-action" 
                          :class="{ active: activeCursor === 'minus' }"
                          @click="setActiveCursor('minus')">
                    {{ activeCursor === 'minus' ? '✓ 已激活' : '○ 激活' }}
                  </button>
                </div>
              </div>
              <div class="cursor-input-row">
                <button class="btn-adjust" @click="adjustCursor(-0.01, 'minus')">◀</button>
                <input v-model="minus1Position" type="number" step="0.01" class="cursor-input" />
                <button class="btn-adjust" @click="adjustCursor(0.01, 'minus')">▶</button>
              </div>
              <span class="cursor-unit">mm</span>
            </div>
            
            <div class="spacing-display">
              <span class="spacing-label">条纹间距:</span>
              <span class="spacing-value">{{ spacing.toFixed(4) }}</span>
              <span class="spacing-unit">mm</span>
            </div>
            
            <div class="cursor-buttons">
              <button class="btn-calculate" @click="calculateSpacing">计算间距</button>
              <button class="btn-save" @click="saveRecord">保存记录</button>
            </div>
          </div>
        </div>
        
        <div class="panel-section">
          <div class="section-header">
            <span class="section-title">测量记录</span>
            <button class="btn-clear" @click="clearAllRecords">清空</button>
          </div>
          
          <div class="records-table">
            <table>
              <thead>
                <tr>
                  <th>序号</th>
                  <th>波长(nm)</th>
                  <th>频率(MHz)</th>
                  <th>测量声速(m/s)</th>
                  <th>推算浓度(wt%)</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(record, index) in records" :key="index">
                  <td>{{ index + 1 }}</td>
                  <td>{{ record.wavelength.toFixed(1) }}</td>
                  <td>{{ record.frequency.toFixed(1) }}</td>
                  <td>{{ record.speed.toFixed(2) }}</td>
                  <td>{{ record.calculatedConcentration.toFixed(4) }}</td>
                  <td><button class="btn-delete" @click="deleteRecord(index)">✕</button></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <button class="btn-export" @click="exportResults">📥 导出结果</button>
        </div>
      </div>
    </div>
    
    <ZoomModal :show="showZoomModal"
               :title="zoomTitle"
               :width="zoomWidth"
               :height="zoomHeight"
               :drawFn="zoomDrawFn"
               @close="closeZoomModal" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import ZoomModal from './ZoomModal.vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  archive: {
    type: Object,
    required: true
  },
  params: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['exit', 'openInstrument'])

const localParams = reactive({ ...props.params })
const records = ref([])

const mainCanvas = ref(null)
const intensityCanvas = ref(null)
const curveCanvas = ref(null)

const plus1Position = ref('')
const minus1Position = ref('')
const activeCursor = ref('plus')

const showZoomModal = ref(false)
const zoomTitle = ref('')
const zoomDrawFn = ref(null)
const zoomWidth = ref(900)
const zoomHeight = ref(600)

const experimentVs = ref(null)
const measuredSpeed = ref(0)
const calculatedConcentration = ref(null)

const spacing = computed(() => {
  if (!plus1Position.value || !minus1Position.value) return 0
  const p1 = parseFloat(plus1Position.value)
  const m1 = parseFloat(minus1Position.value)
  return Math.abs(p1 - m1)
})

const getSoundSpeed = (concentration) => {
  return props.archive.intercept + props.archive.slope * concentration
}

const ultrasonicWavelength = (frequency, concentration, vs = null) => {
  if (vs === null) {
    const baseVs = getSoundSpeed(concentration)
    const randomVariation = (Math.random() - 0.5) * 5
    vs = baseVs + randomVariation
  }
  return vs / (frequency * 1e6)
}

const wavelengthToRgb = (wavelength) => {
  let r, g, b
  if (wavelength >= 380 && wavelength < 440) {
    r = -(wavelength - 440) / (440 - 380)
    g = 0
    b = 1
  } else if (wavelength >= 440 && wavelength < 490) {
    r = 0
    g = (wavelength - 440) / (490 - 440)
    b = 1
  } else if (wavelength >= 490 && wavelength < 510) {
    r = 0
    g = 1
    b = -(wavelength - 510) / (510 - 490)
  } else if (wavelength >= 510 && wavelength < 580) {
    r = (wavelength - 510) / (580 - 510)
    g = 1
    b = 0
  } else if (wavelength >= 580 && wavelength < 645) {
    r = 1
    g = -(wavelength - 645) / (645 - 580)
    b = 0
  } else if (wavelength >= 645 && wavelength <= 780) {
    r = 1
    g = 0
    b = 0
  } else {
    r = 1; g = 1; b = 1
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
}

const fringePosition = (m, wavelength, frequency, concentration, distance, vs) => {
  const ds = vs / (frequency * 1e6)
  return m * wavelength * distance / ds
}

const createDrawDiffractionPattern = (params, vs) => {
  return (ctx, width, height) => {
    if (!ctx || !width || !height) return
    
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, width, height)
    
    const wavelength = params.wavelength * 1e-9
    const wavelengthNm = params.wavelength
    const spotColor = wavelengthToRgb(wavelengthNm)
    
    const yCenter = height / 2
    const xCenter = width / 2
    
    const stripeHeight = height * 0.85
    const stripeWidth = 2
    
    for (let m = -5; m <= 5; m++) {
      const xM = fringePosition(m, wavelength, params.frequency, params.concentration, 0.3, vs)
      
      let mIntensity
      if (m === 0) {
        mIntensity = 1.0
      } else {
        mIntensity = Math.pow(Math.sin(Math.PI * m * 0.1) / (Math.PI * m * 0.1), 2) * 
                     Math.exp(-0.08 * Math.abs(m))
      }
      
      const px = xCenter + (xM * 1000 / 15) * (width / 2)
      const r = spotColor.r
      const g = spotColor.g
      const b = spotColor.b
      
      if (mIntensity > 0.01) {
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${mIntensity})`
        ctx.lineWidth = stripeWidth
        ctx.beginPath()
        ctx.moveTo(px, yCenter - stripeHeight / 2)
        ctx.lineTo(px, yCenter + stripeHeight / 2)
        ctx.stroke()
        
        const verticalGradient = ctx.createLinearGradient(px, yCenter - stripeHeight / 2, px, yCenter + stripeHeight / 2)
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
        ctx.moveTo(px, yCenter - stripeHeight / 2)
        ctx.lineTo(px, yCenter + stripeHeight / 2)
        ctx.stroke()
        
        const radialGradient = ctx.createRadialGradient(px, yCenter, 0, px, yCenter, stripeHeight / 2)
        radialGradient.addColorStop(0, `rgba(${r + 50}, ${g + 50}, ${b + 50}, ${mIntensity})`)
        radialGradient.addColorStop(0.2, `rgba(${r + 20}, ${g + 20}, ${b + 20}, ${mIntensity * 0.9})`)
        radialGradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.6})`)
        radialGradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.2})`)
        radialGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
        ctx.fillStyle = radialGradient
        ctx.fillRect(px - stripeWidth * 1.5, yCenter - stripeHeight / 2, stripeWidth * 3, stripeHeight)
        
        const coreGradient = ctx.createLinearGradient(px, yCenter - stripeHeight / 2, px, yCenter + stripeHeight / 2)
        coreGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`)
        coreGradient.addColorStop(0.4, `rgba(${r + 30}, ${g + 30}, ${b + 30}, ${mIntensity * 0.6})`)
        coreGradient.addColorStop(0.48, `rgba(${r + 50}, ${g + 50}, ${b + 50}, ${mIntensity})`)
        coreGradient.addColorStop(0.5, `rgba(255, 255, 255, ${mIntensity})`)
        coreGradient.addColorStop(0.52, `rgba(${r + 50}, ${g + 50}, ${b + 50}, ${mIntensity})`)
        coreGradient.addColorStop(0.6, `rgba(${r + 30}, ${g + 30}, ${b + 30}, ${mIntensity * 0.6})`)
        coreGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
        ctx.strokeStyle = coreGradient
        ctx.lineWidth = stripeWidth * 1.2
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(px, yCenter - stripeHeight / 2)
        ctx.lineTo(px, yCenter + stripeHeight / 2)
        ctx.stroke()
        
        if (mIntensity > 0.6) {
          const brightCoreGradient = ctx.createLinearGradient(px, yCenter - stripeHeight / 2, px, yCenter + stripeHeight / 2)
          brightCoreGradient.addColorStop(0, `rgba(255, 255, 255, 0)`)
          brightCoreGradient.addColorStop(0.45, `rgba(255, 255, 255, ${mIntensity * 0.5})`)
          brightCoreGradient.addColorStop(0.5, `rgba(255, 255, 255, ${mIntensity})`)
          brightCoreGradient.addColorStop(0.55, `rgba(255, 255, 255, ${mIntensity * 0.5})`)
          brightCoreGradient.addColorStop(1, `rgba(255, 255, 255, 0)`)
          ctx.strokeStyle = brightCoreGradient
          ctx.lineWidth = stripeWidth * 0.6
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(px, yCenter - stripeHeight / 2)
          ctx.lineTo(px, yCenter + stripeHeight / 2)
          ctx.stroke()
        }
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
    
    for (let m = -3; m <= 3; m++) {
      const pos = fringePosition(m, wavelength, params.frequency, params.concentration, 0.3, vs) * 1000
      const px = xCenter + (pos / 15) * (width / 2)
      
      ctx.strokeStyle = '#374151'
      ctx.lineWidth = 0.5
      ctx.setLineDash([2, 2])
      ctx.beginPath()
      ctx.moveTo(px, 0)
      ctx.lineTo(px, height)
      ctx.stroke()
    }
    ctx.setLineDash([])
    
    for (let m = -2; m <= 2; m++) {
      const pos = fringePosition(m, wavelength, params.frequency, params.concentration, 0.3, vs) * 1000
      const px = xCenter + (pos / 15) * (width / 2)
      
      ctx.fillStyle = 'rgba(0,0,0,0.8)'
      ctx.fillRect(px - 25, yCenter + 10, 50, 20)
      
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 11px Microsoft YaHei'
      ctx.textAlign = 'center'
      ctx.fillText(`${m}级`, px, yCenter + 24)
    }
    
    const p1 = parseFloat(plus1Position.value) || 0
    const m1 = parseFloat(minus1Position.value) || 0
    
    const drawCursor = (posMm) => {
      const posPx = xCenter + (posMm / 15) * (width / 2)
      
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(posPx, 0)
      ctx.lineTo(posPx, height)
      ctx.stroke()
      ctx.setLineDash([])
      
      ctx.strokeStyle = '#ef4444'
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(posPx, yCenter, 20, 0, Math.PI * 2)
      ctx.stroke()
      ctx.fill()
      
      ctx.fillStyle = '#ef4444'
      ctx.font = 'bold 12px Microsoft YaHei'
      ctx.textAlign = 'left'
      ctx.fillText(posMm.toFixed(2) + 'mm', posPx + 25, yCenter + 5)
    }
    
    if (plus1Position.value) drawCursor(p1)
    if (minus1Position.value) drawCursor(m1)
  }
}

const intensityDistribution = (x, wavelength, frequency, concentration, distance, gratingWidth, vs) => {
  const ds = vs / (frequency * 1e6)
  const k = 2 * Math.PI / wavelength
  const characteristicScale = gratingWidth / 5
  const u = k * characteristicScale * x / (2 * distance)
  const beta = k * ds / 2
  
  const envelope = Math.pow(Math.sin(u) / (u || 1), 2)
  const interference = Math.pow(Math.cos(beta * x / distance), 2)
  
  return envelope * interference
}

const createDrawIntensityCurve = (params, vs) => {
  return (ctx, width, height) => {
    if (!ctx || !width || !height) return
    
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    for (let i = 0; i <= 5; i++) {
      const y = height * 0.05 + (i / 5) * height * 0.9
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
    for (let i = 0; i <= 6; i++) {
      const x = (i / 6) * width
      ctx.beginPath()
      ctx.moveTo(x, height * 0.05)
      ctx.lineTo(x, height * 0.95)
      ctx.stroke()
    }
    ctx.setLineDash([])
    
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, height * 0.95)
    ctx.lineTo(width, height * 0.95)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, height * 0.95)
    ctx.lineTo(0, height * 0.05)
    ctx.stroke()
    
    const wavelength = params.wavelength * 1e-9
    const wavelengthNm = params.wavelength
    const spotColor = wavelengthToRgb(wavelengthNm)
    
    const xMin = -15 / 1000
    const xMax = 15 / 1000
    const xResolution = 500
    
    const dataPoints = []
    for (let i = 0; i <= xResolution; i++) {
      const x = xMin + (i / xResolution) * (xMax - xMin)
      let intensity = intensityDistribution(x, wavelength, params.frequency, params.concentration, 0.3, params.gratingWidth || 0.0003, vs)
      dataPoints.push({ x, y: intensity })
    }
    
    const scaleX = width / (xMax - xMin)
    const scaleY = height * 0.9
    
    ctx.strokeStyle = '#1e40af'
    ctx.lineWidth = 3
    ctx.beginPath()
    
    dataPoints.forEach((point, i) => {
      const px = (point.x - xMin) * scaleX
      const py = height - (point.y * scaleY + height * 0.05)
      
      if (i === 0) {
        ctx.moveTo(px, py)
      } else {
        ctx.lineTo(px, py)
      }
    })
    ctx.stroke()
    
    ctx.fillStyle = `rgba(${Math.round(spotColor.r * 50)}, ${Math.round(spotColor.g * 50)}, ${Math.round(spotColor.b * 50)}, 0.3)`
    ctx.beginPath()
    ctx.moveTo(0, height * 0.95)
    
    dataPoints.forEach((point, i) => {
      const px = (point.x - xMin) * scaleX
      const py = height - (point.y * scaleY + height * 0.05)
      ctx.lineTo(px, py)
    })
    
    ctx.lineTo(width, height * 0.95)
    ctx.closePath()
    ctx.fill()
    
    for (let m = -3; m <= 3; m++) {
      const ds = vs / (params.frequency * 1e6)
      const pos = m * wavelength * 0.3 / ds
      const px = (pos - xMin) * scaleX
      
      ctx.strokeStyle = m === 0 ? '#dc2626' : '#1e40af'
      ctx.lineWidth = m === 0 ? 2 : 1.5
      ctx.setLineDash(m === 0 ? [] : [5, 3])
      
      ctx.beginPath()
      ctx.moveTo(px, height * 0.05)
      ctx.lineTo(px, height * 0.95)
      ctx.stroke()
      ctx.setLineDash([])
    }
    
    ctx.fillStyle = '#6b7280'
    ctx.font = '10px Microsoft YaHei'
    ctx.textAlign = 'right'
    for (let i = 0; i <= 5; i++) {
      const y = height * 0.05 + (i / 5) * height * 0.9
      ctx.fillText((1 - i / 5).toFixed(1), width - 10, y + 4)
    }
    
    ctx.fillStyle = '#374151'
    ctx.font = '12px Microsoft YaHei'
    ctx.textAlign = 'center'
    ctx.fillText('位置 (mm)', width / 2, height - 5)
    
    ctx.save()
    ctx.translate(35, height / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText('归一化光强', 0, 0)
    ctx.restore()
    
    ctx.fillStyle = '#1f2937'
    ctx.font = 'bold 13px Microsoft YaHei'
    ctx.textAlign = 'center'
    ctx.fillText('衍射光强分布曲线', width / 2, 20)
    
    ctx.fillStyle = '#6b7280'
    ctx.font = '10px Microsoft YaHei'
    ctx.textAlign = 'center'
    const labelPositions = [-10, -5, 0, 5, 10]
    labelPositions.forEach(pos => {
      const px = ((pos / 1000 - xMin) / (xMax - xMin)) * width
      ctx.fillText(pos.toString(), px, height - 20)
    })
  }
}

const createDrawCalibrationCurve = (archive) => {
  return (ctx, width, height) => {
    if (!ctx || !width || !height) return
    
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, width, height)
    
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    for (let i = 0; i <= 4; i++) {
      const y = height * 0.1 + (i / 4) * height * 0.8
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
    for (let i = 0; i <= 5; i++) {
      const x = width * 0.1 + (i / 5) * width * 0.8
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }
    ctx.setLineDash([])
    
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2
    ctx.beginPath()
    
    const cMin = archive.concentrationMin
    const cMax = archive.concentrationMax
    const vMin = archive.speedMin
    const vMax = archive.speedMax
    
    for (let i = 0; i <= 100; i++) {
      const c = cMin + (i / 100) * (cMax - cMin)
      const v = archive.intercept + archive.slope * c
      
      const x = width * 0.1 + ((c - cMin) / (cMax - cMin)) * width * 0.8
      const y = height * 0.9 - ((v - vMin) / (vMax - vMin)) * height * 0.8
      
      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.stroke()
    
    archive.points.forEach(point => {
      const x = width * 0.1 + ((point.concentration - cMin) / (cMax - cMin)) * width * 0.8
      const y = height * 0.9 - ((point.speed - vMin) / (vMax - vMin)) * height * 0.8
      
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fill()
    })
    
    ctx.fillStyle = '#94a3b8'
    ctx.font = '12px Arial'
    ctx.fillText('浓度(c)', width * 0.45, height * 0.98)
    ctx.fillText('声速(v)', width * 0.01, height * 0.15)
  }
}

const drawDiffractionPattern = (ctx, width, height) => {
  if (!experimentVs.value) return
  createDrawDiffractionPattern(localParams, experimentVs.value)(ctx, width, height)
}

const drawIntensityCurve = (ctx, width, height) => {
  if (!experimentVs.value) return
  createDrawIntensityCurve(localParams, experimentVs.value)(ctx, width, height)
}

const drawCurvePreview = () => {
  const ctx = curveCanvas.value?.getContext('2d')
  const width = curveCanvas.value?.width || 300
  const height = curveCanvas.value?.height || 120
  
  if (!ctx) return
  
  ctx.fillStyle = '#0f172a'
  ctx.fillRect(0, 0, width, height)
  
  ctx.strokeStyle = '#374151'
  ctx.lineWidth = 1
  ctx.setLineDash([3, 3])
  for (let i = 0; i <= 4; i++) {
    const y = height * 0.1 + (i / 4) * height * 0.8
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
  for (let i = 0; i <= 5; i++) {
    const x = width * 0.1 + (i / 5) * width * 0.8
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  ctx.setLineDash([])
  
  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 2
  ctx.beginPath()
  
  const cMin = props.archive.concentrationMin
  const cMax = props.archive.concentrationMax
  const vMin = props.archive.speedMin
  const vMax = props.archive.speedMax
  
  for (let i = 0; i <= 100; i++) {
    const c = cMin + (i / 100) * (cMax - cMin)
    const v = props.archive.intercept + props.archive.slope * c
    
    const x = width * 0.1 + ((c - cMin) / (cMax - cMin)) * width * 0.8
    const y = height * 0.9 - ((v - vMin) / (vMax - vMin)) * height * 0.8
    
    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }
  ctx.stroke()
  
  props.archive.points.forEach(point => {
    const x = width * 0.1 + ((point.concentration - cMin) / (cMax - cMin)) * width * 0.8
    const y = height * 0.9 - ((point.speed - vMin) / (vMax - vMin)) * height * 0.8
    
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(x, y, 2, 0, Math.PI * 2)
    ctx.fill()
  })
  
  if (calculatedConcentration.value !== null) {
    const x = width * 0.1 + ((calculatedConcentration.value - cMin) / (cMax - cMin)) * width * 0.8
    const y = height * 0.9 - ((measuredSpeed.value - vMin) / (vMax - vMin)) * height * 0.8
    
    ctx.fillStyle = '#10b981'
    ctx.beginPath()
    ctx.arc(x, y, 8, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fill()
  }
}

const runSimulation = () => {
  const baseVs = getSoundSpeed(localParams.concentration)
  const randomVariation = (Math.random() - 0.5) * 2
  experimentVs.value = baseVs + randomVariation
  
  measuredSpeed.value = experimentVs.value
  
  nextTick(() => {
    drawDiffractionPattern(mainCanvas.value?.getContext('2d'), mainCanvas.value?.width, mainCanvas.value?.height)
    drawIntensityCurve(intensityCanvas.value?.getContext('2d'), intensityCanvas.value?.width, intensityCanvas.value?.height)
    drawCurvePreview()
  })
}

const refreshConcentration = () => {
  const randomConcentration = props.archive.concentrationMin + 
    Math.random() * (props.archive.concentrationMax - props.archive.concentrationMin)
  localParams.concentration = randomConcentration
  experimentVs.value = getSoundSpeed(randomConcentration) + (Math.random() - 0.5) * 3
  measuredSpeed.value = 0
  calculatedConcentration.value = null
  
  plus1Position.value = ''
  minus1Position.value = ''
  
  nextTick(() => {
    drawDiffractionPattern(mainCanvas.value?.getContext('2d'), mainCanvas.value?.width, mainCanvas.value?.height)
    drawIntensityCurve(intensityCanvas.value?.getContext('2d'), intensityCanvas.value?.width, intensityCanvas.value?.height)
    drawCurvePreview()
  })
  
  ElMessage.info(`已刷新未知浓度溶液，请重新测量`)
}

const autoCursor = () => {
  if (!experimentVs.value) {
    ElMessage.warning('请先运行仿真')
    return
  }
  
  const wavelength = localParams.wavelength * 1e-9
  const plus1Pos = fringePosition(1, wavelength, localParams.frequency, localParams.concentration, 0.3, experimentVs.value) * 1000
  const minus1Pos = fringePosition(-1, wavelength, localParams.frequency, localParams.concentration, 0.3, experimentVs.value) * 1000
  
  plus1Position.value = plus1Pos.toFixed(2)
  minus1Position.value = minus1Pos.toFixed(2)
  
  nextTick(() => {
    drawDiffractionPattern(mainCanvas.value?.getContext('2d'), mainCanvas.value?.width, mainCanvas.value?.height)
    drawIntensityCurve(intensityCanvas.value?.getContext('2d'), intensityCanvas.value?.width, intensityCanvas.value?.height)
  })
  
  ElMessage.success('自动游标已完成！')
}

const setActiveCursor = (cursor) => {
  activeCursor.value = cursor
}

const handleCanvasClick = (e) => {
  if (!activeCursor.value) return
  
  const canvas = mainCanvas.value
  if (!canvas) return
  
  const rect = canvas.getBoundingClientRect()
  const x = e.clientX - rect.left
  const width = canvas.width
  const xCenter = width / 2
  
  const posMm = ((x - xCenter) / (width / 2)) * 15
  const roundedPos = Math.round(posMm * 100) / 100
  
  if (activeCursor.value === 'plus') {
    plus1Position.value = roundedPos.toString()
  } else {
    minus1Position.value = roundedPos.toString()
  }
  
  nextTick(() => {
    drawDiffractionPattern(canvas.getContext('2d'), width, canvas.height)
    drawIntensityCurve(intensityCanvas.value?.getContext('2d'), intensityCanvas.value?.width, intensityCanvas.value?.height)
  })
}

const adjustCursor = (delta, type) => {
  if (type === 'plus') {
    const current = parseFloat(plus1Position.value) || 0
    plus1Position.value = (current + delta).toFixed(2)
  } else {
    const current = parseFloat(minus1Position.value) || 0
    minus1Position.value = (current + delta).toFixed(2)
  }
  
  drawDiffractionPattern(mainCanvas.value?.getContext('2d'), mainCanvas.value?.width, mainCanvas.value?.height)
  drawIntensityCurve(intensityCanvas.value?.getContext('2d'), intensityCanvas.value?.width, intensityCanvas.value?.height)
}

const calculateSpacing = () => {
  if (!plus1Position.value || !minus1Position.value) {
    ElMessage.warning('请先输入两个游标位置')
    return
  }
  
  const p1 = parseFloat(plus1Position.value)
  const m1 = parseFloat(minus1Position.value)
  const diff = Math.abs(p1 - m1)
  
  if (diff > 0) {
    const spacing = diff / 2
    const ds = localParams.wavelength * 1e-9 / (spacing * 1e-3 / 0.3)
    const calculatedVs = ds * localParams.frequency * 1e6
    measuredSpeed.value = calculatedVs
    calculatedConcentration.value = (calculatedVs - props.archive.intercept) / props.archive.slope
    
    ElMessage.success(`计算完成！声速: ${calculatedVs.toFixed(2)} m/s, 浓度: ${calculatedConcentration.value.toFixed(4)} wt%`)
    
    nextTick(() => {
      drawCurvePreview()
    })
  }
}

const saveRecord = () => {
  if (measuredSpeed.value === 0 || calculatedConcentration.value === null) {
    ElMessage.warning('请先计算间距')
    return
  }
  
  records.value.push({
    wavelength: localParams.wavelength,
    frequency: localParams.frequency,
    speed: measuredSpeed.value,
    calculatedConcentration: calculatedConcentration.value,
    timestamp: new Date().toISOString()
  })
  
  ElMessage.success('记录已保存')
}

const deleteRecord = (index) => {
  records.value.splice(index, 1)
}

const clearAllRecords = () => {
  records.value = []
}

const exportResults = () => {
  if (records.value.length === 0) {
    ElMessage.warning('没有数据可导出')
    return
  }
  
  const headers = ['序号', '波长(nm)', '频率(MHz)', '测量声速(m/s)', '推算浓度(wt%)']
  const rows = records.value.map((r, i) => [
    i + 1,
    r.wavelength.toFixed(1),
    r.frequency.toFixed(1),
    r.speed.toFixed(2),
    r.calculatedConcentration.toFixed(4)
  ])
  
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `未知浓度测量结果_${new Date().toLocaleDateString()}.csv`
  link.click()
}

const zoomPattern = () => {
  zoomTitle.value = '衍射光斑图样'
  zoomDrawFn.value = createDrawDiffractionPattern({ ...localParams }, experimentVs.value)
  zoomWidth.value = 900
  zoomHeight.value = 600
  showZoomModal.value = true
}

const zoomIntensity = () => {
  zoomTitle.value = '衍射光强分布曲线'
  zoomDrawFn.value = createDrawIntensityCurve({ ...localParams }, experimentVs.value)
  zoomWidth.value = 900
  zoomHeight.value = 600
  showZoomModal.value = true
}

const zoomCurve = () => {
  zoomTitle.value = '校准曲线'
  zoomDrawFn.value = createDrawCalibrationCurve(props.archive)
  zoomWidth.value = 900
  zoomHeight.value = 600
  showZoomModal.value = true
}

const closeZoomModal = () => {
  showZoomModal.value = false
}

const onParamChange = () => {
  if (experimentVs.value) {
    nextTick(() => {
      drawDiffractionPattern(mainCanvas.value?.getContext('2d'), mainCanvas.value?.width, mainCanvas.value?.height)
      drawIntensityCurve(intensityCanvas.value?.getContext('2d'), intensityCanvas.value?.width, intensityCanvas.value?.height)
    })
  }
}

const updateCanvasSizes = () => {
  const mainCanvasEl = mainCanvas.value
  const intCanvas = intensityCanvas.value
  const curveCanvasEl = curveCanvas.value
  
  if (mainCanvasEl) {
    const rect = mainCanvasEl.parentElement.getBoundingClientRect()
    mainCanvasEl.width = rect.width
    mainCanvasEl.height = rect.height - 60
    drawDiffractionPattern(mainCanvasEl.getContext('2d'), mainCanvasEl.width, mainCanvasEl.height)
  }
  
  if (intCanvas) {
    const rect = intCanvas.parentElement.getBoundingClientRect()
    intCanvas.width = rect.width
    intCanvas.height = rect.height - 60
    drawIntensityCurve(intCanvas.getContext('2d'), intCanvas.width, intCanvas.height)
  }
  
  if (curveCanvasEl) {
    const rect = curveCanvasEl.parentElement.getBoundingClientRect()
    curveCanvasEl.width = rect.width
    curveCanvasEl.height = 120
    drawCurvePreview()
  }
}

watch(() => props.params, (newParams) => {
  Object.assign(localParams, newParams)
  nextTick(() => {
    if (experimentVs.value) {
      drawDiffractionPattern(mainCanvas.value?.getContext('2d'), mainCanvas.value?.width, mainCanvas.value?.height)
      drawIntensityCurve(intensityCanvas.value?.getContext('2d'), intensityCanvas.value?.width, intensityCanvas.value?.height)
      drawCurvePreview()
    }
  })
}, { deep: true })

watch(() => props.archive, () => {
  nextTick(() => {
    updateCanvasSizes()
    
    const randomConcentration = props.archive.concentrationMin + 
      Math.random() * (props.archive.concentrationMax - props.archive.concentrationMin)
    localParams.concentration = randomConcentration
    experimentVs.value = getSoundSpeed(randomConcentration) + (Math.random() - 0.5) * 3
    measuredSpeed.value = 0
    calculatedConcentration.value = null
    plus1Position.value = ''
    minus1Position.value = ''
    
    nextTick(() => {
      drawDiffractionPattern(mainCanvas.value?.getContext('2d'), mainCanvas.value?.width, mainCanvas.value?.height)
      drawIntensityCurve(intensityCanvas.value?.getContext('2d'), intensityCanvas.value?.width, intensityCanvas.value?.height)
      drawCurvePreview()
    })
    
    ElMessage.info(`已生成未知浓度溶液，请使用游标测量声速来推算浓度`)
  })
})

onMounted(() => {
  nextTick(() => {
    updateCanvasSizes()
    
    const randomConcentration = props.archive.concentrationMin + 
      Math.random() * (props.archive.concentrationMax - props.archive.concentrationMin)
    localParams.concentration = randomConcentration
    experimentVs.value = getSoundSpeed(randomConcentration) + (Math.random() - 0.5) * 3
    measuredSpeed.value = 0
    calculatedConcentration.value = null
    
    nextTick(() => {
      drawDiffractionPattern(mainCanvas.value?.getContext('2d'), mainCanvas.value?.width, mainCanvas.value?.height)
      drawIntensityCurve(intensityCanvas.value?.getContext('2d'), intensityCanvas.value?.width, intensityCanvas.value?.height)
      drawCurvePreview()
    })
    
    ElMessage.info(`已生成未知浓度溶液，请使用游标测量声速来推算浓度`)
  })
  
  window.addEventListener('resize', updateCanvasSizes)
})
</script>

<style scoped>
.archive-measure-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #f1f5f9;
}

.am-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid #334155;
}

.am-header-left {
  display: flex;
  align-items: center;
  gap: 15px;
}

.btn-back {
  padding: 6px 12px;
  background: #334155;
  color: #f1f5f9;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn-back:hover {
  background: #475569;
}

.am-title {
  font-size: 18px;
  font-weight: bold;
}

.am-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-instrument {
  padding: 6px 12px;
  background: #f59e0b;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
}

.btn-instrument:hover {
  background: #d97706;
}

.archive-info-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #6d28d9;
  border-radius: 20px;
}

.tag-name {
  font-size: 14px;
}

.am-main {
  flex: 1;
  display: flex;
  gap: 15px;
  padding: 15px;
  overflow: hidden;
}

.am-panel {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  overflow: hidden;
}

.am-left-panel {
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.am-center-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 15px;
  min-width: 0;
}

.am-right-panel {
  width: 380px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.panel-section {
  background: #1e293b;
  border-radius: 10px;
  padding: 15px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.section-title {
  font-size: 15px;
  font-weight: bold;
  color: #f1f5f9;
}

.section-subtitle {
  font-size: 12px;
  color: #94a3b8;
}

.param-row {
  margin-bottom: 15px;
}

.param-label {
  display: block;
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 8px;
}

.param-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.param-unit {
  font-size: 12px;
  color: #94a3b8;
}

.param-value {
  font-size: 14px;
  color: #f1f5f9;
  font-weight: bold;
}

.param-value.secret {
  color: #f59e0b;
}

.concentration-row {
  padding: 12px;
  background: rgba(245, 158, 11, 0.1);
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-run {
  flex: 1;
  padding: 12px;
  background: #10b981;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
}

.btn-run:hover {
  background: #059669;
}

.btn-refresh {
  flex: 1;
  padding: 12px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.btn-refresh:hover {
  background: #2563eb;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #0f172a;
  border-radius: 8px;
  margin-bottom: 10px;
}

.result-label {
  font-size: 13px;
  color: #94a3b8;
}

.result-value {
  font-size: 18px;
  font-weight: bold;
  color: #f1f5f9;
}

.result-value.calculated {
  color: #10b981;
}

.result-unit {
  font-size: 12px;
  color: #94a3b8;
}

.curve-canvas {
  width: 100%;
  height: 120px;
  border-radius: 8px;
}

.curve-formula {
  font-size: 12px;
  color: #fbbf24;
  margin-top: 10px;
}

.curve-range {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 5px;
}

.pattern-section {
  flex: 2;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.intensity-section {
  flex: 3;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.main-canvas {
  flex: 1;
  width: 100%;
  background: #000;
  border-radius: 8px;
  cursor: crosshair;
}

.intensity-canvas {
  flex: 1;
  width: 100%;
  background: #fff;
  border-radius: 8px;
}

.btn-zoom {
  padding: 4px 10px;
  background: #334155;
  color: #f1f5f9;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}

.btn-zoom:hover {
  background: #475569;
}

.btn-auto-cursor {
  padding: 4px 10px;
  background: #f59e0b;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
}

.btn-auto-cursor:hover {
  background: #d97706;
}

.cursor-control {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.cursor-group {
  background: #0f172a;
  padding: 12px;
  border-radius: 8px;
}

.cursor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.cursor-label {
  font-size: 13px;
  color: #f1f5f9;
}

.cursor-actions {
  display: flex;
  gap: 8px;
}

.btn-cursor-action {
  padding: 4px 10px;
  background: #334155;
  color: #94a3b8;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
}

.btn-cursor-action:hover {
  background: #475569;
}

.btn-cursor-action.active {
  background: #10b981;
  color: #fff;
}

.cursor-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-adjust {
  padding: 6px 12px;
  background: #334155;
  color: #f1f5f9;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-adjust:hover {
  background: #475569;
}

.cursor-input {
  flex: 1;
  padding: 8px;
  background: #1e293b;
  color: #f1f5f9;
  border: 1px solid #334155;
  border-radius: 4px;
  font-size: 14px;
  text-align: center;
}

.cursor-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.cursor-unit {
  font-size: 12px;
  color: #94a3b8;
}

.spacing-display {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 8px;
}

.spacing-label {
  font-size: 13px;
  color: #94a3b8;
}

.spacing-value {
  font-size: 18px;
  font-weight: bold;
  color: #3b82f6;
}

.spacing-unit {
  font-size: 12px;
  color: #94a3b8;
}

.cursor-buttons {
  display: flex;
  gap: 10px;
}

.btn-calculate {
  flex: 1;
  padding: 12px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
}

.btn-calculate:hover {
  background: #2563eb;
}

.btn-save {
  flex: 1;
  padding: 12px;
  background: #10b981;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.btn-save:hover {
  background: #059669;
}

.records-table {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 15px;
}

.records-table table {
  width: 100%;
  border-collapse: collapse;
}

.records-table th,
.records-table td {
  padding: 8px;
  text-align: center;
  border-bottom: 1px solid #334155;
  font-size: 12px;
}

.records-table th {
  background: #334155;
  color: #f1f5f9;
  font-weight: bold;
}

.records-table td {
  color: #94a3b8;
}

.btn-delete {
  padding: 4px 8px;
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
}

.btn-clear {
  padding: 4px 10px;
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}

.btn-clear:hover {
  background: #dc2626;
}

.btn-export {
  width: 100%;
  padding: 12px;
  background: #6d28d9;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
}

.btn-export:hover {
  background: #5b21b6;
}
</style>
