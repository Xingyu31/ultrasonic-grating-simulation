<template>
  <div v-if="show && drawFn" ref="overlayRef" class="zoom-modal-overlay">
    <div class="zoom-modal-content">
      <div class="zoom-modal-header">
        <span class="zoom-modal-title">{{ title }}</span>
        <button class="zoom-modal-close" @click="handleClose">✕</button>
      </div>
      <div class="zoom-modal-body">
        <canvas ref="zoomCanvas" class="zoom-canvas"></canvas>
      </div>
      <div class="zoom-modal-footer">
        <span class="zoom-tip">滚轮缩放 | 拖拽平移 | 双击复位 | 点击空白处或按ESC关闭</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '放大视图'
  },
  drawFn: {
    type: Function,
    required: true
  },
  width: {
    type: Number,
    default: 800
  },
  height: {
    type: Number,
    default: 600
  }
})

const emit = defineEmits(['close'])

const overlayRef = ref(null)
const zoomCanvas = ref(null)
const scale = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)
const isDragging = ref(false)
const dragStartX = ref(0)
const dragStartY = ref(0)
const offsetStartX = ref(0)
const offsetStartY = ref(0)

const handleClose = () => {
  emit('close')
}

const draw = () => {
  const canvas = zoomCanvas.value
  if (!canvas || !props.drawFn || typeof props.drawFn !== 'function') return
  
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  ctx.save()
  ctx.translate(offsetX.value, offsetY.value)
  ctx.scale(scale.value, scale.value)
  
  props.drawFn(ctx, canvas.width / scale.value, canvas.height / scale.value)
  
  ctx.restore()
}

const handleWheel = (e) => {
  e.preventDefault()
  const rect = e.currentTarget.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top
  
  const delta = e.deltaY > 0 ? 0.9 : 1.1
  const newScale = Math.max(0.5, Math.min(5, scale.value * delta))
  
  const scaleRatio = newScale / scale.value
  offsetX.value = mouseX - (mouseX - offsetX.value) * scaleRatio
  offsetY.value = mouseY - (mouseY - offsetY.value) * scaleRatio
  scale.value = newScale
  
  draw()
}

const handleMouseDown = (e) => {
  isDragging.value = true
  dragStartX.value = e.clientX
  dragStartY.value = e.clientY
  offsetStartX.value = offsetX.value
  offsetStartY.value = offsetY.value
}

const handleMouseMove = (e) => {
  if (!isDragging.value) return
  offsetX.value = offsetStartX.value + (e.clientX - dragStartX.value)
  offsetY.value = offsetStartY.value + (e.clientY - dragStartY.value)
  draw()
}

const handleMouseUp = () => {
  isDragging.value = false
}

const handleDoubleClick = () => {
  scale.value = 1
  offsetX.value = 0
  offsetY.value = 0
  draw()
}

const handleKeydown = (e) => {
  if (e.key === 'Escape') {
    handleClose()
  }
}

const handleOverlayClick = (e) => {
  if (e.target === overlayRef.value) {
    handleClose()
  }
}

onMounted(() => {
  nextTick(() => {
    const canvas = zoomCanvas.value
    if (canvas) {
      canvas.width = props.width
      canvas.height = props.height
      canvas.addEventListener('wheel', handleWheel, { passive: false })
      canvas.addEventListener('mousedown', handleMouseDown)
      canvas.addEventListener('mousemove', handleMouseMove)
      canvas.addEventListener('mouseup', handleMouseUp)
      canvas.addEventListener('dblclick', handleDoubleClick)
      draw()
    }
    
    const overlay = overlayRef.value
    if (overlay) {
      overlay.addEventListener('click', handleOverlayClick)
    }
  })
  
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  const canvas = zoomCanvas.value
  if (canvas) {
    canvas.removeEventListener('wheel', handleWheel)
    canvas.removeEventListener('mousedown', handleMouseDown)
    canvas.removeEventListener('mousemove', handleMouseMove)
    canvas.removeEventListener('mouseup', handleMouseUp)
    canvas.removeEventListener('dblclick', handleDoubleClick)
  }
  const overlay = overlayRef.value
  if (overlay) {
    overlay.removeEventListener('click', handleOverlayClick)
  }
})

watch(() => props.drawFn, () => {
  draw()
})

watch([() => props.width, () => props.height], () => {
  const canvas = zoomCanvas.value
  if (canvas) {
    canvas.width = props.width
    canvas.height = props.height
    scale.value = 1
    offsetX.value = 0
    offsetY.value = 0
    draw()
  }
})

watch(() => props.show, (newVal) => {
  if (newVal) {
    nextTick(() => {
      const canvas = zoomCanvas.value
      if (canvas) {
        canvas.width = props.width
        canvas.height = props.height
        scale.value = 1
        offsetX.value = 0
        offsetY.value = 0
        draw()
      }
    })
  }
})
</script>

<style scoped>
.zoom-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  cursor: pointer;
}

.zoom-modal-content {
  background: #1e293b;
  border-radius: 12px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 400px;
  min-height: 300px;
  cursor: default;
}

.zoom-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #334155;
  border-bottom: 1px solid #475569;
  flex-shrink: 0;
}

.zoom-modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
}

.zoom-modal-close {
  background: none;
  border: none;
  font-size: 20px;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  transition: color 0.2s;
}

.zoom-modal-close:hover {
  color: #fff;
}

.zoom-modal-body {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: #0f172a;
}

.zoom-canvas {
  background: #0f172a;
  border-radius: 8px;
  cursor: grab;
  width: auto;
  height: auto;
  max-width: 85vw;
  max-height: 75vh;
}

.zoom-canvas:active {
  cursor: grabbing;
}

.zoom-modal-footer {
  padding: 12px 20px;
  background: #334155;
  border-top: 1px solid #475569;
  flex-shrink: 0;
}

.zoom-tip {
  font-size: 12px;
  color: #94a3b8;
}
</style>
