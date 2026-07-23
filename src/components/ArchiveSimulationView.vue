<template>
  <div class="instrument-simulation-mode">
    <div class="progress-bar">
      <div v-for="(step, index) in progressSteps" :key="index"
           :class="getStepClass(index)"
           @click="goToStep(index + 1)">
        <div class="progress-step-number">{{ index + 1 }}</div>
        <div class="progress-step-text">{{ step.text }}</div>
      </div>
    </div>
    
    <div class="mode-selector">
      <span class="mode-label">实验方向选择</span>
      <div class="mode-buttons">
        <button class="mode-btn" :class="{ active: experimentMode === 'wavelength' }"
                @click="$emit('update:mode', 'wavelength')">
          🌈 光波长影响
        </button>
        <button class="mode-btn" :class="{ active: experimentMode === 'frequency' }"
                @click="$emit('update:mode', 'frequency')">
          📡 超声频率影响
        </button>
      </div>
      <div class="mode-info">
        <span class="mode-variable">变量: {{ currentModeInfo.variable }}</span>
        <span class="mode-fixed">固定: {{ currentModeInfo.fixed }}</span>
      </div>
    </div>
    
    <div class="experiment-scene" ref="sceneRef">
      <div class="table-surface"></div>
      
      <div class="optical-guide-rail">
        <div class="rail-main-groove">
          <div class="groove-section laser-section" :class="{ occupied: instruments.find(i => i.id === 'laser') }">
            <div class="groove-indent"></div>
            <span class="groove-number">1</span>
            <span class="groove-name">光源</span>
          </div>
          <div class="groove-divider"></div>
          <div class="groove-section collimator-section" :class="{ occupied: instruments.find(i => i.id === 'collimator') }">
            <div class="groove-indent"></div>
            <span class="groove-number">2</span>
            <span class="groove-name">平行光管</span>
          </div>
          <div class="groove-divider"></div>
          <div class="groove-section cell-section" :class="{ occupied: instruments.find(i => i.id === 'cell') }">
            <div class="groove-indent"></div>
            <span class="groove-number">3</span>
            <span class="groove-name">超声光栅水槽</span>
          </div>
          <div class="groove-divider"></div>
          <div class="groove-section telescope-section" :class="{ occupied: instruments.find(i => i.id === 'telescope') }">
            <div class="groove-indent"></div>
            <span class="groove-number">4</span>
            <span class="groove-name">望远镜</span>
          </div>
          <div class="groove-divider"></div>
          <div class="groove-section ccd-section" :class="{ occupied: instruments.find(i => i.id === 'ccd') }">
            <div class="groove-indent"></div>
            <span class="groove-number">5</span>
            <span class="groove-name">CCD相机</span>
          </div>
          
          <div class="rail-marks">
            <span v-for="i in 20" :key="i" class="rail-mark" :style="{ left: (i * 5) + '%' }"></span>
          </div>
        </div>
        
        <div class="rail-bottom-grooves">
          <div class="groove-section generator-section" :class="{ occupied: instruments.find(i => i.id === 'generator') }">
            <div class="groove-indent"></div>
            <span class="groove-number">6</span>
            <span class="groove-name">信号发生器</span>
          </div>
          <div class="groove-section computer-section" :class="{ occupied: instruments.find(i => i.id === 'computer') }">
            <div class="groove-indent"></div>
            <span class="groove-number">7</span>
            <span class="groove-name">计算机</span>
          </div>
        </div>
      </div>
      
      <div class="optical-guide-center-line"></div>
      
      <div class="optical-path" v-if="laserOn"
           :style="opticalPathStyle"></div>
      
      <div class="optical-connections" v-if="laserOn && instruments.length > 1">
        <svg class="connection-lines">
          <line v-for="(conn, index) in opticalConnections" :key="index"
                :x1="conn.x1" :y1="conn.y1" :x2="conn.x2" :y2="conn.y2"
                stroke="#fbbf24" stroke-width="2" opacity="0.3"/>
        </svg>
      </div>
      
      <div v-for="inst in instruments" :key="inst.id"
           class="instrument"
           :style="{ left: inst.x + 'px', top: inst.y + 'px', transform: inst.scale ? `scale(${inst.scale})` : 'scale(1)', transformOrigin: 'center center' }"
           @mousedown="startDrag($event, inst)"
           @dblclick="openInstrumentModal(inst)"
           @wheel="handleWheel($event, inst)">
        <LaserSvg v-if="inst.id === 'laser'" :laserOn="laserOn" :wavelength="localParams.wavelength" />
        <CollimatorSvg v-else-if="inst.id === 'collimator'" />
        <CellSvg v-else-if="inst.id === 'cell'" :concentration="localParams.concentration" />
        <TelescopeSvg v-else-if="inst.id === 'telescope'" />
        <CcdSvg v-else-if="inst.id === 'ccd'" />
        <GeneratorSvg v-else-if="inst.id === 'generator'" :frequency="localParams.frequency" :amplitude="localParams.amplitude" />
        <ComputerSvg v-else-if="inst.id === 'computer'" />
        <div class="instrument-label">{{ inst.name }}</div>
      </div>
      
      <div v-if="dragPreview" class="drag-preview"
           :style="{ left: dragPreviewPos.x + 'px', top: dragPreviewPos.y + 'px' }">
        <LaserSvg v-if="dragPreview.id === 'laser'" :laserOn="false" :wavelength="600" />
        <CollimatorSvg v-else-if="dragPreview.id === 'collimator'" />
        <CellSvg v-else-if="dragPreview.id === 'cell'" :concentration="7.74" />
        <TelescopeSvg v-else-if="dragPreview.id === 'telescope'" />
        <CcdSvg v-else-if="dragPreview.id === 'ccd'" />
        <GeneratorSvg v-else-if="dragPreview.id === 'generator'" :frequency="8.0" :amplitude="50" />
        <ComputerSvg v-else-if="dragPreview.id === 'computer'" />
        <div class="preview-label">{{ dragPreview.name }}</div>
      </div>
    </div>
    
    <div class="toolbar-area">
      <div class="toolbar-header">仪器工具栏：拖拽仪器到实验台</div>
      <div class="toolbar-tools">
        <div v-for="inst in availableTools" :key="inst.id"
             class="tool-item"
             @mousedown="startDragFromToolbar($event, inst)">
          <LaserSvg v-if="inst.id === 'laser'" :laserOn="false" :wavelength="600" />
          <CollimatorSvg v-else-if="inst.id === 'collimator'" />
          <CellSvg v-else-if="inst.id === 'cell'" :concentration="7.74" />
          <TelescopeSvg v-else-if="inst.id === 'telescope'" />
          <CcdSvg v-else-if="inst.id === 'ccd'" />
          <GeneratorSvg v-else-if="inst.id === 'generator'" :frequency="8.0" :amplitude="50" />
          <ComputerSvg v-else-if="inst.id === 'computer'" />
          <span class="tool-name">{{ inst.name }}</span>
        </div>
      </div>
    </div>
    
    <div v-if="showGuide" class="guide-panel">
      <div class="guide-header">
        <span class="guide-title">📖 实验操作指南</span>
        <button class="guide-close" @click="showGuide = false">✕</button>
      </div>
      <div class="guide-content">
        <div class="guide-section">
          <h3>🎯 实验目标</h3>
          <p>通过超声光栅衍射实验，测量未知浓度溶液中的声速，反推溶液浓度</p>
        </div>
        <div class="guide-section">
          <h3>📋 推荐操作顺序</h3>
          <div class="guide-steps">
            <div class="guide-step" :class="{ completed: instruments.find(i => i.id === 'laser') }">
              <span class="step-icon">1️⃣</span>
              <span class="step-text">拖入光源（激光器）</span>
              <span v-if="instruments.find(i => i.id === 'laser')" class="step-check">✓</span>
            </div>
            <div class="guide-step" :class="{ completed: instruments.find(i => i.id === 'collimator') }">
              <span class="step-icon">2️⃣</span>
              <span class="step-text">拖入平行光管</span>
              <span v-if="instruments.find(i => i.id === 'collimator')" class="step-check">✓</span>
            </div>
            <div class="guide-step" :class="{ completed: instruments.find(i => i.id === 'cell') }">
              <span class="step-icon">3️⃣</span>
              <span class="step-text">拖入超声光栅水槽（浓度未知）</span>
              <span v-if="instruments.find(i => i.id === 'cell')" class="step-check">✓</span>
            </div>
            <div class="guide-step" :class="{ completed: instruments.find(i => i.id === 'generator') }">
              <span class="step-icon">4️⃣</span>
              <span class="step-text">拖入信号发生器（水槽下方）</span>
              <span v-if="instruments.find(i => i.id === 'generator')" class="step-check">✓</span>
            </div>
            <div class="guide-step" :class="{ completed: instruments.find(i => i.id === 'telescope') }">
              <span class="step-icon">5️⃣</span>
              <span class="step-text">拖入望远镜</span>
              <span v-if="instruments.find(i => i.id === 'telescope')" class="step-check">✓</span>
            </div>
            <div class="guide-step" :class="{ completed: instruments.find(i => i.id === 'ccd') }">
              <span class="step-icon">6️⃣</span>
              <span class="step-text">拖入CCD相机</span>
              <span v-if="instruments.find(i => i.id === 'ccd')" class="step-check">✓</span>
            </div>
            <div class="guide-step" :class="{ completed: instruments.find(i => i.id === 'computer') }">
              <span class="step-icon">7️⃣</span>
              <span class="step-text">拖入计算机（CCD下方）</span>
              <span v-if="instruments.find(i => i.id === 'computer')" class="step-check">✓</span>
            </div>
          </div>
        </div>
        <div class="guide-section">
          <h3>💡 使用提示</h3>
          <ul>
            <li>双击仪器可打开控制面板</li>
            <li>滚轮可放大/缩小仪器</li>
            <li>水槽中溶液浓度未知，需通过测量声速推算</li>
            <li>完成仪器布置后，点击光源打开激光</li>
          </ul>
        </div>
      </div>
    </div>
    
    <div v-if="showModal" class="instrument-modal">
      <div class="modal-overlay" @click="closeModal"></div>
      <div class="modal-content">
        <div class="modal-header">
          <span class="modal-title">{{ modalTitle }}</span>
          <button class="modal-close" @click="closeModal">✕</button>
        </div>
        <div class="modal-body">
          <div v-if="modalType === 'laser'" class="modal-section">
            <label class="modal-label">光波长 (nm)</label>
            <el-slider v-model="localParams.wavelength" :min="380" :max="700" :step="0.1"
                       show-input :input-size="'small'" />
          </div>
          
          <div v-if="modalType === 'cell'" class="modal-section">
            <div class="cell-info">
              <div class="info-item">
                <span class="info-label">溶液类型</span>
                <span class="info-value">氯化钠溶液</span>
              </div>
              <div class="info-item">
                <span class="info-label">溶液浓度</span>
                <span class="info-value secret">❓ 未知（测量声速后推算）</span>
              </div>
              <div class="info-item">
                <span class="info-label">温度</span>
                <span class="info-value">{{ localParams.temperature.toFixed(2) }}°C</span>
              </div>
            </div>
          </div>
          
          <div v-if="modalType === 'generator'" class="modal-section">
            <label class="modal-label">超声频率 (MHz)</label>
            <el-slider v-model="localParams.frequency" :min="5" :max="15" :step="0.1"
                       show-input :input-size="'small'" />
            <label class="modal-label">信号幅度 (%)</label>
            <el-slider v-model="localParams.amplitude" :min="10" :max="100" :step="1"
                       show-input :input-size="'small'" />
          </div>
          
          <div v-if="modalType === 'telescope'" class="modal-section">
            <div class="telescope-controls">
              <label class="modal-label">对焦旋钮</label>
              <div class="knob-controls">
                <button class="knob-btn" @click="adjustFocus(-1)">◀ 左旋</button>
                <button class="knob-btn" @click="adjustFocus(1)">右旋 ▶</button>
              </div>
              <div class="focus-status">
                <span :class="{ focused: focusComplete }">{{ focusComplete ? '✓ 对焦完成' : '○ 未对焦' }}</span>
              </div>
            </div>
          </div>
          
          <div v-if="modalType === 'ccd'" class="modal-section">
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
          
          <div v-if="modalType === 'computer'" class="modal-section">
            <div class="computer-controls">
              <button class="computer-btn" @click="openMeasure">📊 进入测量界面</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import LaserSvg from './instrument-svgs/LaserSvg.vue'
import CollimatorSvg from './instrument-svgs/CollimatorSvg.vue'
import CellSvg from './instrument-svgs/CellSvg.vue'
import TelescopeSvg from './instrument-svgs/TelescopeSvg.vue'
import CcdSvg from './instrument-svgs/CcdSvg.vue'
import GeneratorSvg from './instrument-svgs/GeneratorSvg.vue'
import ComputerSvg from './instrument-svgs/ComputerSvg.vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  params: {
    type: Object,
    required: true
  },
  experimentMode: {
    type: String,
    default: 'wavelength'
  }
})

const emit = defineEmits(['update:params', 'update:mode', 'openMeasure'])

const localParams = reactive({ ...props.params })
const instruments = ref([])
const showGuide = ref(true)
const showModal = ref(false)
const modalType = ref('')
const laserOn = ref(false)
const focusComplete = ref(false)

const dragPreview = ref(null)
const dragPreviewPos = ref({ x: 0, y: 0 })
const dragInst = ref(null)
const dragOffset = ref({ x: 0, y: 0 })

const progressSteps = [
  { text: '布置仪器', done: false },
  { text: '调节参数', done: false },
  { text: '对焦测量', done: false }
]

const currentModeInfo = computed(() => {
  if (props.experimentMode === 'wavelength') {
    return { variable: '光波长', fixed: '频率8MHz，浓度未知' }
  } else if (props.experimentMode === 'frequency') {
    return { variable: '超声频率', fixed: '波长600nm，浓度未知' }
  }
  return { variable: '-', fixed: '-' }
})

const availableTools = [
  { id: 'laser', name: '光源' },
  { id: 'collimator', name: '平行光管' },
  { id: 'cell', name: '超声光栅水槽' },
  { id: 'telescope', name: '望远镜' },
  { id: 'ccd', name: 'CCD相机' },
  { id: 'generator', name: '信号发生器' },
  { id: 'computer', name: '计算机' }
]

const sceneRef = ref(null)

const modalTitle = computed(() => {
  const titles = {
    laser: '光源控制面板',
    collimator: '平行光管',
    cell: '超声光栅水槽',
    generator: '信号发生器',
    telescope: '望远镜',
    ccd: 'CCD相机',
    computer: '计算机'
  }
  return titles[modalType.value] || ''
})

const opticalPathStyle = computed(() => {
  if (!sceneRef.value) return {}
  const rect = sceneRef.value.getBoundingClientRect()
  return {
    width: rect.width + 'px',
    height: rect.height + 'px'
  }
})

const opticalConnections = computed(() => {
  const conn = []
  const scene = sceneRef.value
  if (!scene) return conn
  
  const laser = instruments.value.find(i => i.id === 'laser')
  const collimator = instruments.value.find(i => i.id === 'collimator')
  const cell = instruments.value.find(i => i.id === 'cell')
  const telescope = instruments.value.find(i => i.id === 'telescope')
  const ccd = instruments.value.find(i => i.id === 'ccd')
  
  if (laser && collimator) conn.push({ x1: laser.x + 40, y1: laser.y + 30, x2: collimator.x, y2: collimator.y + 30 })
  if (collimator && cell) conn.push({ x1: collimator.x + 40, y1: collimator.y + 30, x2: cell.x, y2: cell.y + 30 })
  if (cell && telescope) conn.push({ x1: cell.x + 40, y1: cell.y + 30, x2: telescope.x, y2: telescope.y + 30 })
  if (telescope && ccd) conn.push({ x1: telescope.x + 40, y1: telescope.y + 30, x2: ccd.x, y2: ccd.y + 30 })
  
  return conn
})

const getStepClass = (index) => {
  let done = false
  if (index === 0) done = instruments.value.length >= 7
  if (index === 1) done = laserOn.value
  if (index === 2) done = focusComplete.value
  return { done }
}

const goToStep = (step) => {
  progressSteps.value[step - 1].done = true
}

const startDrag = (e, inst) => {
  e.preventDefault()
  dragInst.value = inst
  dragOffset.value = { x: e.clientX - inst.x, y: e.clientY - inst.y }
  
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', endDrag)
}

const onDrag = (e) => {
  if (!dragInst.value) return
  dragInst.value.x = e.clientX - dragOffset.value.x
  dragInst.value.y = e.clientY - dragOffset.value.y
}

const endDrag = () => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', endDrag)
  
  if (dragInst.value) {
    const scene = sceneRef.value
    if (scene) {
      const rect = scene.getBoundingClientRect()
      dragInst.value.x = Math.max(0, Math.min(rect.width - 80, dragInst.value.x))
      dragInst.value.y = Math.max(0, Math.min(rect.height - 80, dragInst.value.y))
    }
  }
  
  dragInst.value = null
}

const startDragFromToolbar = (e, inst) => {
  e.preventDefault()
  
  if (instruments.value.find(i => i.id === inst.id)) {
    ElMessage.warning('该仪器已在实验台上')
    return
  }
  
  dragPreview.value = inst
  dragPreviewPos.value = { x: e.clientX - 40, y: e.clientY - 30 }
  
  document.addEventListener('mousemove', onToolbarDrag)
  document.addEventListener('mouseup', endToolbarDrag)
}

const onToolbarDrag = (e) => {
  if (!dragPreview.value) return
  dragPreviewPos.value = { x: e.clientX - 40, y: e.clientY - 30 }
}

const endToolbarDrag = () => {
  document.removeEventListener('mousemove', onToolbarDrag)
  document.removeEventListener('mouseup', endToolbarDrag)
  
  if (dragPreview.value) {
    const scene = sceneRef.value
    if (scene) {
      const sceneRect = scene.getBoundingClientRect()
      const previewRect = { x: dragPreviewPos.value.x, y: dragPreviewPos.value.y }
      
      if (previewRect.x >= sceneRect.left && previewRect.x <= sceneRect.right &&
          previewRect.y >= sceneRect.top && previewRect.y <= sceneRect.bottom) {
        
        const newInst = {
          id: dragPreview.value.id,
          name: dragPreview.value.name,
          x: dragPreviewPos.value.x - sceneRect.left,
          y: dragPreviewPos.value.y - sceneRect.top
        }
        
        instruments.value.push(newInst)
        
        if (newInst.id === 'laser') {
          setTimeout(() => {
            laserOn.value = true
            ElMessage.success('激光已开启')
          }, 500)
        }
        
        if (instruments.value.length >= 7) {
          goToStep(1)
          ElMessage.info('仪器布置完成，请调节参数')
        }
      }
    }
  }
  
  dragPreview.value = null
}

const openInstrumentModal = (inst) => {
  modalType.value = inst.id
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const adjustFocus = (direction) => {
  focusComplete.value = true
  ElMessage.success('对焦完成')
}

const handleWheel = (e, inst) => {
  e.preventDefault()
  const delta = e.deltaY > 0 ? 0.9 : 1.1
  inst.scale = Math.max(0.5, Math.min(2, (inst.scale || 1) * delta))
}

const openMeasure = () => {
  emit('update:params', { ...localParams })
  emit('openMeasure', { ...localParams })
}

watch(() => props.params, (newParams) => {
  Object.assign(localParams, newParams)
}, { deep: true })

onMounted(() => {
})

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', endDrag)
  document.removeEventListener('mousemove', onToolbarDrag)
  document.removeEventListener('mouseup', endToolbarDrag)
})
</script>

<style scoped>
.instrument-simulation-mode {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #f1f5f9;
}

.progress-bar {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 15px 20px;
  background: rgba(0, 0, 0, 0.2);
}

.progress-bar > div {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  padding: 8px 20px;
  border-radius: 10px;
  transition: all 0.3s;
}

.progress-bar > div.done {
  background: rgba(16, 185, 129, 0.2);
}

.progress-step-number {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #334155;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  font-size: 14px;
}

.progress-bar > div.done .progress-step-number {
  background: #10b981;
  color: #fff;
}

.progress-step-text {
  font-size: 12px;
  color: #94a3b8;
}

.mode-selector {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  padding: 10px 20px;
  background: rgba(0, 0, 0, 0.1);
}

.mode-label {
  font-size: 14px;
  color: #94a3b8;
}

.mode-buttons {
  display: flex;
  gap: 10px;
}

.mode-btn {
  padding: 8px 16px;
  background: #334155;
  color: #f1f5f9;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.mode-btn:hover {
  background: #475569;
}

.mode-btn.active {
  background: #3b82f6;
  color: #fff;
}

.mode-info {
  display: flex;
  gap: 15px;
  font-size: 12px;
}

.mode-variable {
  color: #fbbf24;
}

.mode-fixed {
  color: #94a3b8;
}

.experiment-scene {
  flex: 1;
  position: relative;
  overflow: hidden;
  border-bottom: 2px solid #334155;
}

.table-surface {
  position: absolute;
  top: 20%;
  left: 5%;
  right: 5%;
  bottom: 20%;
  background: linear-gradient(180deg, #4a5568 0%, #2d3748 100%);
  border-radius: 20px;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.5);
}

.optical-guide-rail {
  position: absolute;
  top: 50%;
  left: 10%;
  right: 10%;
  transform: translateY(-50%);
  height: 150px;
}

.rail-main-groove {
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  height: 60px;
  background: #1a202c;
  border-radius: 10px;
  display: flex;
  align-items: center;
  padding: 0 10px;
}

.groove-section {
  flex: 1;
  height: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  position: relative;
  transition: all 0.2s;
}

.groove-section.occupied {
  background: rgba(59, 130, 246, 0.2);
  border-radius: 5px;
}

.groove-indent {
  width: 50px;
  height: 8px;
  background: #4a5568;
  border-radius: 4px;
}

.groove-number {
  font-size: 10px;
  color: #718096;
  position: absolute;
  top: 2px;
  left: 5px;
}

.groove-name {
  font-size: 10px;
  color: #94a3b8;
}

.groove-divider {
  width: 2px;
  height: 40px;
  background: #4a5568;
}

.rail-marks {
  position: absolute;
  top: 85px;
  left: 0;
  right: 0;
  height: 10px;
}

.rail-mark {
  position: absolute;
  width: 1px;
  height: 10px;
  background: #4a5568;
}

.rail-bottom-grooves {
  position: absolute;
  bottom: 10px;
  left: 20%;
  right: 20%;
  height: 50px;
  display: flex;
  gap: 20px;
}

.rail-bottom-grooves .groove-section {
  flex: 1;
}

.optical-guide-center-line {
  position: absolute;
  top: 50%;
  left: 10%;
  right: 10%;
  height: 2px;
  background: rgba(251, 191, 36, 0.3);
  transform: translateY(-50%);
}

.optical-path {
  position: absolute;
  top: 0;
  left: 0;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(251, 191, 36, 0.1) 10%, 
    rgba(251, 191, 36, 0.3) 50%, 
    rgba(251, 191, 36, 0.1) 90%, 
    transparent 100%);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.optical-connections {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.connection-lines {
  width: 100%;
  height: 100%;
}

.instrument {
  position: absolute;
  cursor: move;
  z-index: 10;
  transition: transform 0.2s;
}

.instrument:hover {
  z-index: 20;
}

.instrument-label {
  position: absolute;
  bottom: -25px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.5);
  padding: 2px 8px;
  border-radius: 4px;
}

.drag-preview {
  position: fixed;
  pointer-events: none;
  z-index: 1000;
  opacity: 0.8;
}

.preview-label {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: #fff;
  white-space: nowrap;
}

.toolbar-area {
  padding: 15px 20px;
  background: #1e293b;
  border-top: 1px solid #334155;
}

.toolbar-header {
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 10px;
}

.toolbar-tools {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.tool-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  padding: 10px;
  background: #334155;
  border-radius: 10px;
  cursor: grab;
  transition: all 0.2s;
}

.tool-item:hover {
  background: #475569;
  transform: translateY(-2px);
}

.tool-item:active {
  cursor: grabbing;
}

.tool-name {
  font-size: 12px;
  color: #f1f5f9;
}

.guide-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 320px;
  background: #1e293b;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  z-index: 100;
  overflow: hidden;
}

.guide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #334155;
}

.guide-title {
  font-size: 15px;
  font-weight: bold;
}

.guide-close {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 20px;
  cursor: pointer;
}

.guide-content {
  padding: 20px;
}

.guide-section {
  margin-bottom: 20px;
}

.guide-section h3 {
  font-size: 13px;
  color: #fbbf24;
  margin-bottom: 10px;
}

.guide-section p {
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.5;
}

.guide-section ul {
  margin: 0;
  padding-left: 20px;
}

.guide-section li {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 5px;
}

.guide-steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.guide-step {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: #0f172a;
  border-radius: 8px;
}

.guide-step.completed {
  background: rgba(16, 185, 129, 0.1);
}

.step-icon {
  font-size: 14px;
}

.step-text {
  flex: 1;
  font-size: 12px;
  color: #94a3b8;
}

.step-check {
  color: #10b981;
  font-weight: bold;
}

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
  width: 400px;
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
}

.modal-close {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 20px;
  cursor: pointer;
}

.modal-body {
  padding: 20px;
}

.modal-section {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.modal-label {
  font-size: 13px;
  color: #94a3b8;
}

.cell-info {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.ccd-info {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
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

.info-value.secret {
  color: #f59e0b;
}

.info-value.active {
  color: #10b981;
}

.telescope-controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.knob-controls {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.knob-btn {
  padding: 10px 20px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.knob-btn:hover {
  background: #2563eb;
}

.focus-status {
  text-align: center;
  font-size: 14px;
}

.focus-status span {
  color: #ef4444;
}

.focus-status span.focused {
  color: #10b981;
}

.computer-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.computer-btn {
  padding: 12px;
  background: #10b981;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
}

.computer-btn:hover {
  background: #059669;
}
</style>
