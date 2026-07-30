<template>
  <div v-if="show" ref="overlayRef" class="temp-fit-overlay" @click.self="handleClose">
    <div class="temp-fit-content">
      <div class="temp-fit-header">
        <span class="temp-fit-title">🌡️ 温度-声速关系拟合（纯水）</span>
        <button class="temp-fit-close" @click="handleClose">✕</button>
      </div>
      <div class="temp-fit-body">
        <div class="temp-fit-left">
          <div class="info-panel">
            <div class="info-title">实验信息</div>
            <div class="info-row">
              <span class="info-label">液体类型：</span>
              <span class="info-value">纯水（0 wt% NaCl）</span>
            </div>
            <div class="info-row">
              <span class="info-label">理论公式：</span>
              <span class="info-value">v = 1398 + 3.46 × t</span>
            </div>
            <div class="info-row">
              <span class="info-label">温度范围：</span>
              <span class="info-value">0 ~ 100 °C</span>
            </div>
            <div class="info-row">
              <span class="info-label">数据点数：</span>
              <span class="info-value">{{ tempRecords.length }}</span>
            </div>
          </div>

          <div class="data-panel">
            <div class="data-title">实验数据表</div>
            <div class="data-table-wrapper">
              <table class="data-table">
                <thead>
                  <tr>
                    <th>序号</th>
                    <th>温度 (°C)</th>
                    <th>声速 (m/s)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(r, i) in tempRecords" :key="i">
                    <td>{{ i + 1 }}</td>
                    <td>{{ r.temperature.toFixed(1) }}</td>
                    <td>{{ r.speed.toFixed(1) }}</td>
                  </tr>
                  <tr v-if="tempRecords.length === 0">
                    <td colspan="3" class="empty">暂无数据，请先在纯水模式下测量并保存实验</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="result-panel" v-if="fitResult">
            <div class="result-title">拟合结果</div>
            <div class="result-row">
              <span class="result-label">拟合公式：</span>
              <span class="result-value">v = {{ fitResult.slope.toFixed(3) }} × t + {{ fitResult.intercept.toFixed(2) }}</span>
            </div>
            <div class="result-row">
              <span class="result-label">理论斜率：</span>
              <span class="result-value">3.460 m/s/°C</span>
            </div>
            <div class="result-row">
              <span class="result-label">实验斜率：</span>
              <span class="result-value">{{ fitResult.slope.toFixed(3) }} m/s/°C</span>
            </div>
            <div class="result-row">
              <span class="result-label">斜率误差：</span>
              <span class="result-value">{{ fitResult.slopeError.toFixed(2) }}%</span>
            </div>
            <div class="result-row">
              <span class="result-label">相关系数 R²：</span>
              <span class="result-value">{{ fitResult.rSquared.toFixed(4) }}</span>
            </div>
            <div class="result-row">
              <span class="result-label">平均声速：</span>
              <span class="result-value">{{ fitResult.avgSpeed.toFixed(2) }} m/s</span>
            </div>
          </div>
        </div>

        <div class="temp-fit-right">
          <div class="canvas-wrapper">
            <canvas ref="fitCanvas" class="fit-canvas"></canvas>
          </div>
          <div class="canvas-tip" v-if="tempRecords.length < 2">
            <span>⚠️ 需要至少2组不同温度的数据才能进行拟合</span>
            <span>请在纯水模式下调节温度，测量并保存实验数据</span>
          </div>
        </div>
      </div>
      <div class="temp-fit-footer">
        <button class="btn-refresh" @click="drawChart">🔄 刷新图表</button>
        <span class="footer-tip">按 ESC 或点击空白处关闭</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  records: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close'])

const overlayRef = ref(null)
const fitCanvas = ref(null)
const fitResult = ref(null)

const tempRecords = computed(() => {
  if (!props.records || props.records.length === 0) return []
  return props.records
    .filter(r => r.liquidTypeId === 'pure-water' || (r.temperature !== undefined && r.temperature !== null))
    .filter(r => r.temperature !== undefined && r.temperature !== null && !isNaN(r.temperature) && r.speed > 0)
    .slice()
    .sort((a, b) => a.temperature - b.temperature)
})

const performLinearFit = (points) => {
  if (points.length < 2) return null
  const n = points.length
  const sumX = points.reduce((acc, p) => acc + p.x, 0)
  const sumY = points.reduce((acc, p) => acc + p.y, 0)
  const sumXY = points.reduce((acc, p) => acc + p.x * p.y, 0)
  const sumX2 = points.reduce((acc, p) => acc + p.x * p.x, 0)
  const sumY2 = points.reduce((acc, p) => acc + p.y * p.y, 0)

  const denom = n * sumX2 - sumX * sumX
  if (Math.abs(denom) < 1e-10) return null

  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n

  const meanY = sumY / n
  const ssTot = points.reduce((acc, p) => acc + Math.pow(p.y - meanY, 2), 0)
  const ssRes = points.reduce((acc, p) => acc + Math.pow(p.y - (slope * p.x + intercept), 2), 0)
  const rSquared = ssTot > 1e-10 ? 1 - (ssRes / ssTot) : 0

  const avgSpeed = meanY
  const slopeError = Math.abs((slope - 3.46) / 3.46) * 100

  return { slope, intercept, rSquared, avgSpeed, slopeError }
}

const drawChart = () => {
  const canvas = fitCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height

  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(0, 0, width, height)

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(60, 40, width - 90, height - 100)

  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 1
  ctx.setLineDash([3, 3])
  for (let i = 0; i <= 5; i++) {
    const y = 40 + (i / 5) * (height - 100)
    ctx.beginPath()
    ctx.moveTo(60, y)
    ctx.lineTo(width - 30, y)
    ctx.stroke()
  }
  for (let i = 0; i <= 6; i++) {
    const x = 60 + (i / 6) * (width - 90)
    ctx.beginPath()
    ctx.moveTo(x, 40)
    ctx.lineTo(x, height - 60)
    ctx.stroke()
  }
  ctx.setLineDash([])

  ctx.strokeStyle = '#334155'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(60, height - 60)
  ctx.lineTo(width - 30, height - 60)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(60, height - 60)
  ctx.lineTo(60, 40)
  ctx.stroke()

  ctx.fillStyle = '#334155'
  ctx.font = 'bold 13px Microsoft YaHei'
  ctx.textAlign = 'center'
  ctx.fillText('温度 t (°C)', width / 2 + 15, height - 20)
  ctx.save()
  ctx.translate(20, height / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.fillText('声速 v (m/s)', 0, 0)
  ctx.restore()

  ctx.fillStyle = '#1e293b'
  ctx.font = 'bold 14px Microsoft YaHei'
  ctx.fillText('声速 vs 温度（纯水）', width / 2, 25)

  if (tempRecords.value.length === 0) {
    ctx.fillStyle = '#94a3b8'
    ctx.font = '13px Microsoft YaHei'
    ctx.textAlign = 'center'
    ctx.fillText('暂无数据', width / 2, height / 2)
    ctx.font = '11px Microsoft YaHei'
    ctx.fillText('请在纯水模式下调节温度、测量并保存实验数据', width / 2, height / 2 + 20)
    return
  }

  const points = tempRecords.value.map(r => ({
    x: r.temperature,
    y: r.speed
  }))

  const xMin = 0
  const xMax = 100
  const allY = points.map(p => p.y)
  const yMin = Math.min(...allY) - 20
  const yMax = Math.max(...allY) + 20

  const scaleX = (width - 90) / (xMax - xMin)
  const scaleY = (height - 100) / (yMax - yMin)

  ctx.fillStyle = '#64748b'
  ctx.font = '10px Microsoft YaHei'
  ctx.textAlign = 'right'
  for (let i = 0; i <= 5; i++) {
    const y = 40 + (i / 5) * (height - 100)
    const val = yMax - (i / 5) * (yMax - yMin)
    ctx.fillText(val.toFixed(0), 55, y + 3)
  }

  ctx.textAlign = 'center'
  for (let i = 0; i <= 6; i++) {
    const x = 60 + (i / 6) * (width - 90)
    const val = xMin + (i / 6) * (xMax - xMin)
    ctx.fillText(val.toFixed(0), x, height - 40)
  }

  ctx.strokeStyle = '#f59e0b'
  ctx.lineWidth = 1.5
  ctx.setLineDash([6, 4])
  ctx.beginPath()
  const theoryY1 = 1398 + 3.46 * xMin
  const theoryY2 = 1398 + 3.46 * xMax
  ctx.moveTo(60, height - 60 - (theoryY1 - yMin) * scaleY)
  ctx.lineTo(width - 30, height - 60 - (theoryY2 - yMin) * scaleY)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.fillStyle = '#f59e0b'
  ctx.font = '10px Microsoft YaHei'
  ctx.textAlign = 'left'
  ctx.fillText('理论: v=1398+3.46t', width - 180, 55)

  ctx.fillStyle = '#3b82f6'
  ctx.strokeStyle = '#1d4ed8'
  ctx.lineWidth = 2
  points.forEach(p => {
    const px = 60 + (p.x - xMin) * scaleX
    const py = height - 60 - (p.y - yMin) * scaleY
    ctx.beginPath()
    ctx.arc(px, py, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  })

  const fit = performLinearFit(points)
  fitResult.value = fit

  if (fit) {
    ctx.strokeStyle = '#3b82f6'
    ctx.lineWidth = 2.5
    ctx.setLineDash([5, 3])
    ctx.beginPath()
    const fitY1 = fit.slope * xMin + fit.intercept
    const fitY2 = fit.slope * xMax + fit.intercept
    ctx.moveTo(60, height - 60 - (fitY1 - yMin) * scaleY)
    ctx.lineTo(width - 30, height - 60 - (fitY2 - yMin) * scaleY)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = '#3b82f6'
    ctx.font = '10px Microsoft YaHei'
    ctx.textAlign = 'left'
    ctx.fillText(`拟合: v=${fit.slope.toFixed(3)}t+${fit.intercept.toFixed(1)}`, width - 220, 70)
  }

  ctx.fillStyle = '#64748b'
  ctx.font = '11px Microsoft YaHei'
  ctx.textAlign = 'left'
  ctx.fillText(`数据点: ${points.length}`, 70, 25)
  if (fit) {
    ctx.fillText(`R² = ${fit.rSquared.toFixed(4)}`, 160, 25)
  }
}

const handleClose = () => {
  emit('close')
}

const handleKeydown = (e) => {
  if (e.key === 'Escape') {
    handleClose()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

watch(() => props.show, (newVal) => {
  if (newVal) {
    nextTick(() => {
      const canvas = fitCanvas.value
      if (canvas) {
        canvas.width = 600
        canvas.height = 480
        drawChart()
      }
    })
  }
})

watch(() => props.records, () => {
  if (props.show) {
    nextTick(() => {
      drawChart()
    })
  }
}, { deep: true })
</script>

<style scoped>
.temp-fit-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.temp-fit-content {
  background: #f1f5f9;
  border-radius: 12px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  width: 1000px;
  max-width: 95vw;
  max-height: 92vh;
  overflow: hidden;
}

.temp-fit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #334155;
  flex-shrink: 0;
}

.temp-fit-title {
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
}

.temp-fit-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px 8px;
  transition: color 0.2s;
}

.temp-fit-close:hover {
  color: #fff;
}

.temp-fit-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  padding: 16px;
  gap: 16px;
}

.temp-fit-left {
  width: 340px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  flex-shrink: 0;
}

.temp-fit-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #fff;
  border-radius: 8px;
  padding: 12px;
  min-width: 0;
}

.info-panel,
.data-panel,
.result-panel {
  background: #fff;
  border-radius: 8px;
  padding: 14px;
}

.info-title,
.data-title,
.result-title {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}

.info-row,
.result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 5px 0;
  font-size: 12px;
}

.info-label,
.result-label {
  color: #64748b;
}

.info-value,
.result-value {
  color: #1e293b;
  font-weight: 500;
}

.data-table-wrapper {
  max-height: 200px;
  overflow-y: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.data-table th {
  background: #f1f5f9;
  color: #475569;
  padding: 6px 8px;
  text-align: center;
  font-weight: 600;
  position: sticky;
  top: 0;
}

.data-table td {
  padding: 6px 8px;
  text-align: center;
  color: #334155;
  border-bottom: 1px solid #f1f5f9;
}

.data-table tr:hover td {
  background: #f8fafc;
}

.data-table .empty {
  color: #94a3b8;
  padding: 20px;
}

.canvas-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.fit-canvas {
  max-width: 100%;
  height: auto;
}

.canvas-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: #f59e0b;
  font-size: 12px;
  margin-top: 12px;
  text-align: center;
}

.temp-fit-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: #334155;
  flex-shrink: 0;
}

.btn-refresh {
  background: #3b82f6;
  color: #fff;
  border: none;
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-refresh:hover {
  background: #2563eb;
}

.footer-tip {
  font-size: 12px;
  color: #94a3b8;
}
</style>
