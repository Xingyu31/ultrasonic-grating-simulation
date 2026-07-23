<template>
  <div class="archive-list">
    <div class="archive-header">
      <h2>📁 校准曲线存档</h2>
      <button class="btn-close" @click="$emit('close')">✕</button>
    </div>
    
    <div class="archive-content">
      <div class="archive-info">
        <p>选择一个存档进入未知浓度测量模式，此时您将无法看到溶液浓度，只能通过测量声速反推浓度。</p>
      </div>
      
      <div v-if="archives.length === 0" class="empty-state">
        <span>📭</span>
        <p>暂无存档</p>
        <p>请先在数据测量界面测量至少3组浓度实验数据，然后创建存档</p>
      </div>
      
      <div v-else class="archive-grid">
        <div v-for="archive in archives" :key="archive.id" class="archive-card" @click="selectArchive(archive)">
          <div class="archive-card-header">
            <span class="archive-icon">📊</span>
            <div class="archive-title-wrapper">
              <span class="archive-name">{{ archive.name }}</span>
              <span class="archive-date">{{ formatDate(archive.createdAt) }}</span>
            </div>
          </div>
          
          <div class="archive-card-body">
            <div class="archive-stats">
              <div class="stat-item">
                <span class="stat-label">数据点数</span>
                <span class="stat-value">{{ archive.recordCount }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">浓度范围</span>
                <span class="stat-value">{{ archive.concentrationMin.toFixed(2) }}~{{ archive.concentrationMax.toFixed(2) }}%</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">声速范围</span>
                <span class="stat-value">{{ archive.speedMin.toFixed(1) }}~{{ archive.speedMax.toFixed(1) }} m/s</span>
              </div>
            </div>
            
            <div class="fit-equation">
              <span class="equation-label">拟合公式:</span>
              <span class="equation-value">v = {{ archive.slope.toFixed(2) }} × c + {{ archive.intercept.toFixed(1) }}</span>
            </div>
            
            <div class="archive-preview">
              <canvas :ref="el => setPreviewCanvas(archive.id, el)" class="preview-canvas"></canvas>
            </div>
          </div>
          
          <div class="archive-card-footer">
            <button class="btn-select">进入测量</button>
            <button class="btn-delete" @click.stop="handleDelete(archive.id)">删除</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import { getArchives, deleteArchive } from '../utils/archive'

const emit = defineEmits(['close', 'select'])

const archives = ref([])
const previewCanvases = {}

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString()
}

const setPreviewCanvas = (id, el) => {
  if (el) {
    previewCanvases[id] = el
  }
}

const drawPreview = (archive) => {
  const canvas = previewCanvases[archive.id]
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height
  
  ctx.fillStyle = '#f1f5f9'
  ctx.fillRect(0, 0, width, height)
  
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 1
  ctx.setLineDash([2, 2])
  for (let i = 0; i <= 4; i++) {
    const y = 5 + (i / 4) * (height - 10)
    ctx.beginPath()
    ctx.moveTo(10, y)
    ctx.lineTo(width - 10, y)
    ctx.stroke()
  }
  ctx.setLineDash([])
  
  const points = archive.points
  if (points.length === 0) return
  
  const xMin = archive.concentrationMin * 0.95
  const xMax = archive.concentrationMax * 1.05
  const yMin = archive.speedMin - 10
  const yMax = archive.speedMax + 10
  
  const scaleX = (width - 20) / (xMax - xMin)
  const scaleY = (height - 10) / (yMax - yMin)
  
  ctx.fillStyle = '#3b82f6'
  points.forEach(p => {
    const px = 10 + (p.concentration - xMin) * scaleX
    const py = height - 5 - (p.speed - yMin) * scaleY
    ctx.beginPath()
    ctx.arc(px, py, 3, 0, Math.PI * 2)
    ctx.fill()
  })
  
  ctx.strokeStyle = '#1d4ed8'
  ctx.lineWidth = 1.5
  ctx.setLineDash([3, 2])
  ctx.beginPath()
  ctx.moveTo(10, height - 5 - (calculateSpeed(archive, xMin) - yMin) * scaleY)
  ctx.lineTo(width - 10, height - 5 - (calculateSpeed(archive, xMax) - yMin) * scaleY)
  ctx.stroke()
  ctx.setLineDash([])
}

const calculateSpeed = (archive, concentration) => {
  return archive.intercept + archive.slope * concentration
}

const selectArchive = (archive) => {
  emit('select', archive)
}

const handleDelete = (id) => {
  if (confirm('确定要删除这个存档吗？')) {
    deleteArchive(id)
    loadArchives()
  }
}

const loadArchives = () => {
  archives.value = getArchives()
}

onMounted(() => {
  loadArchives()
})

watch(archives, () => {
  nextTick(() => {
    archives.value.forEach(drawPreview)
  })
}, { deep: true })
</script>

<style scoped>
.archive-list {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  z-index: 9999;
}

.archive-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  border-bottom: 1px solid #334155;
}

.archive-header h2 {
  font-size: 24px;
  font-weight: bold;
  color: #f1f5f9;
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px 12px;
  transition: color 0.2s;
}

.btn-close:hover {
  color: #fff;
}

.archive-content {
  flex: 1;
  overflow-y: auto;
  padding: 30px;
}

.archive-info {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 30px;
  border-left: 4px solid #f59e0b;
}

.archive-info p {
  color: #78350f;
  font-size: 14px;
  margin: 0;
  line-height: 1.6;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  text-align: center;
}

.empty-state span {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-state p {
  color: #94a3b8;
  font-size: 16px;
  margin: 8px 0;
}

.archive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 24px;
}

.archive-card {
  background: #1e293b;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.archive-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
}

.archive-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: linear-gradient(135deg, #334155 0%, #1e293b 100%);
  border-bottom: 1px solid #334155;
}

.archive-icon {
  font-size: 24px;
}

.archive-title-wrapper {
  display: flex;
  flex-direction: column;
}

.archive-name {
  font-size: 16px;
  font-weight: bold;
  color: #f1f5f9;
}

.archive-date {
  font-size: 12px;
  color: #94a3b8;
}

.archive-card-body {
  padding: 16px 20px;
}

.archive-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.stat-item {
  flex: 1;
  background: #0f172a;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 11px;
  color: #94a3b8;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 13px;
  font-weight: bold;
  color: #f1f5f9;
}

.fit-equation {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px 12px;
  background: #0f172a;
  border-radius: 8px;
}

.equation-label {
  font-size: 12px;
  color: #94a3b8;
}

.equation-value {
  font-size: 13px;
  font-weight: bold;
  color: #22c55e;
}

.archive-preview {
  background: #f1f5f9;
  border-radius: 8px;
  padding: 8px;
}

.preview-canvas {
  width: 100%;
  height: 80px;
  border-radius: 4px;
}

.archive-card-footer {
  display: flex;
  gap: 10px;
  padding: 16px 20px;
  background: #0f172a;
}

.btn-select {
  flex: 1;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-select:hover {
  opacity: 0.9;
}

.btn-delete {
  background: transparent;
  color: #ef4444;
  border: 1px solid #ef4444;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-delete:hover {
  background: rgba(239, 68, 68, 0.1);
}
</style>
