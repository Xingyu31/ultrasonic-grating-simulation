<template>
  <div class="fullscreen-simulation" ref="fullscreenRef">
    <div class="sim-header">
      <div class="header-left">
        <h1>超声光栅虚拟仿真实验平台</h1>
        <div class="header-subtitle">实物仪器实操仿真模式</div>
      </div>
      <div class="header-right">
        <button class="btn-exit" @click="$emit('close')">
          <span class="exit-icon">✕</span>
          <span>退出全屏</span>
        </button>
      </div>
    </div>
    
    <div class="progress-bar-wrapper">
      <div class="progress-bar">
        <div v-for="(step, index) in progressSteps" :key="index"
             :class="getStepClass(index)">
          <div class="progress-step-circle">
            <span class="progress-step-icon">{{ step.icon }}</span>
          </div>
          <div class="progress-step-text">{{ step.text }}</div>
          <div v-if="index < progressSteps.length - 1" class="progress-line"
               :class="{ completed: currentStep > index + 1 }"></div>
        </div>
      </div>
    </div>
    
    <div class="main-scene-container">
      <div class="experiment-scene" ref="sceneRef" @click="handleSceneClick">
        <div class="scene-inner">
          <svg class="connection-lines" :width="sceneWidth" :height="sceneHeight">
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
              </marker>
            </defs>
            <path v-for="(line, idx) in connections" :key="'conn-' + idx"
                  :d="line.path"
                  stroke="#3b82f6"
                  stroke-width="3"
                  fill="none"
                  marker-end="url(#arrowhead)"
                  :class="{ 'active': line.active }" />
          </svg>
          
          <div class="table-surface">
            <div class="table-grain"></div>
            <div class="optical-axis-line"></div>
          </div>
          <div class="table-edge"></div>
          
          <div v-for="inst in instruments" :key="inst.id"
               class="instrument"
               :class="{ 'selected': selectedInstrument?.id === inst.id }"
               :style="{ left: inst.x + 'px', top: inst.y + 'px', zIndex: selectedInstrument?.id === inst.id ? 100 : 20 }"
               @mousedown="startDrag($event, inst)"
               @dblclick="openInstrumentModal(inst)">
            <div class="instrument-body">
              <LaserSvg v-if="inst.id === 'laser'" :laserOn="laserOn" />
              <CollimatorSvg v-else-if="inst.id === 'collimator'" />
              <CellSvg v-else-if="inst.id === 'cell'" />
              <TelescopeSvg v-else-if="inst.id === 'telescope'" />
              <CcdSvg v-else-if="inst.id === 'ccd'" />
              <GeneratorSvg v-else-if="inst.id === 'generator'" :frequency="localParams.frequency" :amplitude="localParams.amplitude" />
              <ComputerSvg v-else-if="inst.id === 'computer'" />
            </div>
            <div class="instrument-label">{{ inst.name }}</div>
            <div class="port port-left" v-if="inst.hasPortLeft" @click.stop="startConnection(inst, 'left')"></div>
            <div class="port port-right" v-if="inst.hasPortRight" @click.stop="startConnection(inst, 'right')"></div>
            <div class="port port-bottom" v-if="inst.hasPortBottom" @click.stop="startConnection(inst, 'bottom')"></div>
          </div>
          
          <div class="optical-path" v-if="laserOn && instruments.length > 0"
               :style="opticalPathStyle"></div>
        </div>
      </div>
      
      <div class="side-panel">
        <div class="panel-section">
          <h3>操作提示</h3>
          <div class="tip-list">
            <div class="tip-item">
              <span class="tip-icon">👆</span>
              <span>从下方工具栏选择器具</span>
            </div>
            <div class="tip-item">
              <span class="tip-icon">🖱️</span>
              <span>拖拽仪器到实验台上</span>
            </div>
            <div class="tip-item">
              <span class="tip-icon">🔗</span>
              <span>点击仪器端口进行连接</span>
            </div>
            <div class="tip-item">
              <span class="tip-icon">📋</span>
              <span>完成所有步骤后确认参数</span>
            </div>
          </div>
        </div>
        
        <div class="panel-section">
          <h3>当前参数</h3>
          <div class="param-grid">
            <div class="param-item">
              <span class="param-label">液体浓度</span>
              <span class="param-value">{{ params.concentration.toFixed(3) }} wt%</span>
            </div>
            <div class="param-item">
              <span class="param-label">入射波长</span>
              <span class="param-value">{{ params.wavelength.toFixed(1) }} nm</span>
            </div>
            <div class="param-item">
              <span class="param-label">超声频率</span>
              <span class="param-value">{{ params.frequency.toFixed(1) }} MHz</span>
            </div>
            <div class="param-item">
              <span class="param-label">水槽到光屏距离</span>
              <span class="param-value">{{ params.distance.toFixed(3) }} m</span>
            </div>
            <div class="param-item">
              <span class="param-label">狭缝宽度</span>
              <span class="param-value">{{ params.gratingWidth.toFixed(5) }} m</span>
            </div>
          </div>
        </div>
        
        <div v-if="allStepsCompleted" class="panel-section final-section">
          <h3>实验完成</h3>
          <p>所有仪器操作步骤已完成</p>
          <div class="final-buttons">
            <button class="btn-primary" @click="confirmParams">确认参数</button>
            <button class="btn-secondary" @click="resetExperiment">重置实验</button>
          </div>
        </div>
      </div>
    </div>
    
    <div class="toolbar">
      <div class="toolbar-title">仪器工具栏 - 拖拽仪器到实验台</div>
      <div class="toolbar-items">
        <div v-for="tool in availableTools" :key="tool.id"
             class="toolbar-item"
             :class="{ 'disabled': isInstrumentPlaced(tool.id) }"
             @mousedown="startDragFromToolbar($event, tool)">
          <component :is="tool.component" />
          <div class="toolbar-item-label">{{ tool.name }}</div>
        </div>
      </div>
    </div>
    
    <LaserModal v-if="showLaserModal" @close="closeLaserModal"
                :laserOn="laserOn" :wavelength="params.wavelength"
                :currentStep="currentStep" :stepCompleted="stepCompleted[0]"
                @toggleLaser="toggleLaser" @updateWavelength="updateWavelength"
                @completeStep="completeStep(1)" />
    
    <CellModal v-if="showCellModal" @close="closeCellModal"
               :concentration="params.concentration" :frequency="params.frequency"
               :amplitude="params.amplitude" :currentStep="currentStep"
               :stepCompleted="stepCompleted[1]"
               @updateConcentration="updateConcentration"
               @updateFrequency="updateFrequency"
               @updateAmplitude="updateAmplitude"
               @completeStep="completeStep(2)" />
    
    <GeneratorModal v-if="showGeneratorModal" @close="closeGeneratorModal"
                    :frequency="params.frequency" :amplitude="params.amplitude"
                    :currentStep="currentStep" :stepCompleted="stepCompleted[2]"
                    @updateFrequency="updateFrequency"
                    @updateAmplitude="updateAmplitude"
                    @completeStep="completeStep(3)" />
    
    <TelescopeModal v-if="showTelescopeModal" @close="closeTelescopeModal"
                    :currentStep="currentStep" :stepCompleted="stepCompleted[3]"
                    @completeStep="completeStep(4)" />
    
    <ScreenModal v-if="showScreenModal" @close="closeScreenModal"
                 :params="params" :currentStep="currentStep"
                 :stepCompleted="stepCompleted[4]"
                 @completeStep="completeStep(5)" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import LaserSvg from './instrument-svgs/LaserSvg.vue'
import CellSvg from './instrument-svgs/CellSvg.vue'
import CollimatorSvg from './instrument-svgs/CollimatorSvg.vue'
import TelescopeSvg from './instrument-svgs/TelescopeSvg.vue'
import CcdSvg from './instrument-svgs/CcdSvg.vue'
import GeneratorSvg from './instrument-svgs/GeneratorSvg.vue'
import ComputerSvg from './instrument-svgs/ComputerSvg.vue'
import LaserModal from './LaserModal.vue'
import CellModal from './CellModal.vue'
import GeneratorModal from './GeneratorModal.vue'
import TelescopeModal from './TelescopeModal.vue'
import ScreenModal from './ScreenModal.vue'

const props = defineProps({
  params: Object
})

const emit = defineEmits(['close', 'update:params'])

const currentStep = ref(1)
const stepCompleted = ref([false, false, false, false, false])
const laserOn = ref(false)
const showLaserModal = ref(false)
const showCellModal = ref(false)
const showGeneratorModal = ref(false)
const showTelescopeModal = ref(false)
const showScreenModal = ref(false)

const defaultParams = {
  concentration: 7.7404479578,
  wavelength: 600.79051383,
  frequency: 8.0,
  amplitude: 50,
  distance: 0.3,
  gratingWidth: 0.0003
}

const localParams = reactive({ ...defaultParams, ...props.params })

const progressSteps = [
  { icon: '1', text: '开启光源' },
  { icon: '2', text: '调节超声池液体' },
  { icon: '3', text: '调节信号发生器' },
  { icon: '4', text: '调整望远镜聚焦' },
  { icon: '5', text: '观察衍射图样' }
]

const instruments = ref([])

const connections = ref([])

const selectedInstrument = ref(null)
const draggingInstrument = ref(null)
const dragOffset = reactive({ x: 0, y: 0 })
const sceneRef = ref(null)
const fullscreenRef = ref(null)
const sceneWidth = ref(1200)
const sceneHeight = ref(500)
const connectingFrom = ref(null)

const availableTools = [
  { id: 'laser', name: '光源', component: LaserSvg, hasPortRight: true, hasPortLeft: false, hasPortBottom: false },
  { id: 'collimator', name: '平行光管', component: CollimatorSvg, hasPortRight: true, hasPortLeft: true, hasPortBottom: false },
  { id: 'cell', name: '超声光栅水槽', component: CellSvg, hasPortRight: true, hasPortLeft: true, hasPortBottom: true },
  { id: 'telescope', name: '望远镜', component: TelescopeSvg, hasPortRight: true, hasPortLeft: true, hasPortBottom: false },
  { id: 'ccd', name: 'CCD相机', component: CcdSvg, hasPortRight: false, hasPortLeft: true, hasPortBottom: true },
  { id: 'generator', name: '信号发生器', component: GeneratorSvg, hasPortRight: false, hasPortLeft: false, hasPortBottom: true },
  { id: 'computer', name: '计算机', component: ComputerSvg, hasPortRight: false, hasPortLeft: false, hasPortBottom: true }
]

const instrumentSizes = {
  laser: { width: 140, height: 180 },
  collimator: { width: 120, height: 100 },
  cell: { width: 160, height: 200 },
  telescope: { width: 140, height: 100 },
  ccd: { width: 80, height: 100 },
  generator: { width: 140, height: 120 },
  computer: { width: 160, height: 140 }
}

const allStepsCompleted = computed(() => {
  return stepCompleted.value.every(s => s)
})

const isInstrumentPlaced = (id) => {
  return instruments.value.some(i => i.id === id)
}

const getStepClass = (index) => {
  const stepNum = index + 1
  if (stepCompleted.value[index]) return 'completed'
  if (stepNum === currentStep.value) return 'current'
  return 'pending'
}

const startDragFromToolbar = (event, tool) => {
  if (isInstrumentPlaced(tool.id)) return
  
  const size = instrumentSizes[tool.id]
  const scene = sceneRef.value
  if (!scene) return
  
  const rect = scene.getBoundingClientRect()
  const newInstrument = {
    ...tool,
    x: Math.max(0, Math.min(event.clientX - rect.left - size.width / 2, rect.width - size.width)),
    y: Math.max(0, Math.min(event.clientY - rect.top - size.height / 2, rect.height - size.height - 40)),
    width: size.width,
    height: size.height
  }
  
  instruments.value.push(newInstrument)
  draggingInstrument.value = newInstrument
  dragOffset.x = event.clientX - newInstrument.x - rect.left
  dragOffset.y = event.clientY - newInstrument.y - rect.top
  
  const onMouseMove = (e) => {
    if (!draggingInstrument.value) return
    const sceneRect = scene.getBoundingClientRect()
    let newX = e.clientX - dragOffset.x - sceneRect.left
    let newY = e.clientY - dragOffset.y - sceneRect.top
    newX = Math.max(0, Math.min(newX, sceneRect.width - draggingInstrument.value.width))
    newY = Math.max(0, Math.min(newY, sceneRect.height - draggingInstrument.value.height - 30))
    draggingInstrument.value.x = newX
    draggingInstrument.value.y = newY
    updateConnections()
  }
  
  const onMouseUp = () => {
    draggingInstrument.value = null
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }
  
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

const startDrag = (event, instrument) => {
  draggingInstrument.value = instrument
  const scene = sceneRef.value
  if (!scene) return
  
  const rect = scene.getBoundingClientRect()
  dragOffset.x = event.clientX - instrument.x - rect.left
  dragOffset.y = event.clientY - instrument.y - rect.top
  selectedInstrument.value = instrument
  
  const onMouseMove = (e) => {
    if (!draggingInstrument.value) return
    const sceneRect = scene.getBoundingClientRect()
    let newX = e.clientX - dragOffset.x - sceneRect.left
    let newY = e.clientY - dragOffset.y - sceneRect.top
    newX = Math.max(0, Math.min(newX, sceneRect.width - draggingInstrument.value.width))
    newY = Math.max(0, Math.min(newY, sceneRect.height - draggingInstrument.value.height - 30))
    draggingInstrument.value.x = newX
    draggingInstrument.value.y = newY
    updateConnections()
  }
  
  const onMouseUp = () => {
    draggingInstrument.value = null
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }
  
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
}

const handleSceneClick = () => {
  selectedInstrument.value = null
  if (connectingFrom.value) {
    connectingFrom.value = null
  }
}

const startConnection = (instrument, port) => {
  if (!connectingFrom.value) {
    connectingFrom.value = { instrument, port }
  } else {
    const from = connectingFrom.value
    if (from.instrument.id !== instrument.id) {
      createConnection(from.instrument, from.port, instrument, port)
    }
    connectingFrom.value = null
  }
}

const createConnection = (fromInst, fromPort, toInst, toPort) => {
  const fromPos = getPortPosition(fromInst, fromPort)
  const toPos = getPortPosition(toInst, toPort)
  const path = generatePath(fromPos, toPos)
  
  connections.value.push({
    from: fromInst.id,
    to: toInst.id,
    fromPort,
    toPort,
    path,
    active: true
  })
}

const getPortPosition = (inst, port) => {
  let x = inst.x + inst.width / 2
  let y = inst.y + inst.height / 2
  
  switch (port) {
    case 'left':
      x = inst.x
      break
    case 'right':
      x = inst.x + inst.width
      break
    case 'bottom':
      y = inst.y + inst.height
      break
  }
  return { x, y }
}

const generatePath = (from, to) => {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const midX = (from.x + to.x) / 2
  const midY = (from.y + to.y) / 2
  
  if (Math.abs(dy) > Math.abs(dx)) {
    return `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`
  } else {
    return `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`
  }
}

const updateConnections = () => {
  connections.value = connections.value.map(conn => {
    const fromInst = instruments.value.find(i => i.id === conn.from)
    const toInst = instruments.value.find(i => i.id === conn.to)
    if (fromInst && toInst) {
      const fromPos = getPortPosition(fromInst, conn.fromPort)
      const toPos = getPortPosition(toInst, conn.toPort)
      return {
        ...conn,
        path: generatePath(fromPos, toPos)
      }
    }
    return conn
  })
}

const opticalPathStyle = computed(() => {
  const laser = instruments.value.find(i => i.id === 'laser')
  const endInst = instruments.value.find(i => i.id === 'ccd') || 
                  instruments.value.find(i => i.id === 'telescope') ||
                  instruments.value.find(i => i.id === 'cell')
  
  if (!laser || !endInst) return { display: 'none' }
  
  const startX = laser.x + laser.width
  const startY = laser.y + laser.height / 2
  const endX = endInst.x
  const endY = endInst.y + endInst.height / 2
  
  return {
    left: startX + 'px',
    top: startY + 'px',
    width: Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2)) + 'px',
    transform: `rotate(${Math.atan2(endY - startY, endX - startX) * 180 / Math.PI}deg)`,
    transformOrigin: 'left center'
  }
})

const openInstrumentModal = (instrument) => {
  selectedInstrument.value = instrument
  
  switch (instrument.id) {
    case 'laser':
      showLaserModal.value = true
      break
    case 'cell':
      showCellModal.value = true
      break
    case 'generator':
      showGeneratorModal.value = true
      break
    case 'telescope':
      showTelescopeModal.value = true
      break
    case 'ccd':
    case 'computer':
      showScreenModal.value = true
      break
    case 'collimator':
      showLaserModal.value = true
      break
  }
}

const closeLaserModal = () => { showLaserModal.value = false }
const closeCellModal = () => { showCellModal.value = false }
const closeGeneratorModal = () => { showGeneratorModal.value = false }
const closeTelescopeModal = () => { showTelescopeModal.value = false }
const closeScreenModal = () => { showScreenModal.value = false }

const toggleLaser = () => {
  laserOn.value = !laserOn.value
}

const updateWavelength = (val) => {
  localParams.wavelength = val
  emit('update:params', { ...localParams })
}

const updateConcentration = (val) => {
  localParams.concentration = val
  emit('update:params', { ...localParams })
}

const updateFrequency = (val) => {
  localParams.frequency = val
  emit('update:params', { ...localParams })
}

const updateAmplitude = (val) => {
  localParams.amplitude = val
  emit('update:params', { ...localParams })
}

const completeStep = (step) => {
  stepCompleted.value[step - 1] = true
  if (step < 5) {
    currentStep.value = step + 1
  }
}

const confirmParams = () => {
  emit('update:params', { ...localParams })
  emit('close')
}

const resetExperiment = () => {
  currentStep.value = 1
  stepCompleted.value = [false, false, false, false, false]
  laserOn.value = false
  instruments.value = []
  connections.value = []
}

const handleKeydown = (e) => {
  if (e.key === 'Escape') {
    emit('close')
  }
}

const updateSceneSize = () => {
  nextTick(() => {
    const scene = sceneRef.value
    if (scene) {
      sceneWidth.value = scene.offsetWidth
      sceneHeight.value = scene.offsetHeight
    }
  })
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  updateSceneSize()
  window.addEventListener('resize', updateSceneSize)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', updateSceneSize)
})
</script>

<style scoped>
.fullscreen-simulation {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
}

.sim-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header-left h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: 2px;
}

.header-subtitle {
  font-size: 14px;
  color: #94a3b8;
  margin-top: 5px;
}

.btn-exit {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 8px;
  color: #ef4444;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-exit:hover {
  background: rgba(239, 68, 68, 0.4);
  transform: translateY(-2px);
}

.exit-icon {
  font-size: 16px;
}

.progress-bar-wrapper {
  padding: 15px 30px;
  background: rgba(0, 0, 0, 0.2);
}

.progress-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.progress-step-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.3s;
  position: relative;
}

.progress-step-icon {
  position: relative;
  z-index: 2;
}

.progress-step-text {
  margin-top: 8px;
  font-size: 12px;
  color: #94a3b8;
  white-space: nowrap;
  text-align: center;
}

.progress-step.completed .progress-step-circle {
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  box-shadow: 0 0 15px rgba(16, 185, 129, 0.5);
}

.progress-step.completed .progress-step-text {
  color: #10b981;
}

.progress-step.current .progress-step-circle {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
  animation: pulse 1.5s infinite;
}

.progress-step.current .progress-step-text {
  color: #3b82f6;
  font-weight: 600;
}

.progress-step.pending .progress-step-circle {
  background: rgba(255, 255, 255, 0.1);
  color: #64748b;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.progress-line {
  width: 60px;
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  margin: 0 5px;
}

.progress-line.completed {
  background: linear-gradient(90deg, #10b981, #059669);
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.main-scene-container {
  flex: 1;
  display: flex;
  padding: 20px;
  gap: 20px;
  overflow: hidden;
}

.experiment-scene {
  flex: 3;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  position: relative;
  min-height: 700px;
  width: 100%;
}

.scene-inner {
  position: relative;
  width: 100%;
  height: 100%;
}

.connection-lines {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 5;
  pointer-events: none;
}

.connection-lines path {
  transition: all 0.3s ease;
}

.connection-lines path.active {
  filter: drop-shadow(0 0 8px rgba(59, 130, 246, 0.8));
}

.table-surface {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #d4a574 0%, #c4956a 50%, #b8865f 100%);
  border-radius: 12px;
}

.table-grain {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(90deg, 
    transparent, 
    transparent 30px, 
    rgba(0, 0, 0, 0.04) 30px, 
    rgba(0, 0, 0, 0.04) 31px);
  border-radius: 12px;
}

.optical-axis-line {
  position: absolute;
  top: 50%;
  left: 50px;
  right: 50px;
  height: 2px;
  background: rgba(0, 0, 0, 0.2);
  transform: translateY(-50%);
  border-radius: 1px;
}

.table-edge {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 30px;
  background: linear-gradient(180deg, #8b6914 0%, #6b4f10 100%);
  border-radius: 0 0 12px 12px;
  border-top: 2px solid #a0781c;
}

.optical-path {
  position: absolute;
  height: 4px;
  background: linear-gradient(90deg, 
    rgba(239, 68, 68, 0.4) 0%, 
    rgba(239, 68, 68, 0.9) 30%, 
    rgba(249, 115, 22, 1) 50%, 
    rgba(239, 68, 68, 0.9) 70%, 
    rgba(239, 68, 68, 0.4) 100%);
  border-radius: 2px;
  box-shadow: 
    0 0 12px rgba(239, 68, 68, 0.9), 
    0 0 25px rgba(249, 115, 22, 0.7),
    0 0 40px rgba(239, 68, 68, 0.5);
  z-index: 10;
  pointer-events: none;
  animation: beamPulse 2s ease-in-out infinite;
}

@keyframes beamPulse {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

.instrument {
  position: absolute;
  cursor: grab;
  transition: transform 0.2s, box-shadow 0.2s;
  z-index: 20;
}

.instrument:hover {
  transform: translateY(-5px);
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.3));
}

.instrument:active {
  cursor: grabbing;
}

.instrument.selected {
  filter: drop-shadow(0 0 15px rgba(59, 130, 246, 0.8));
}

.instrument-body {
  position: relative;
}

.instrument-label {
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: #f8fafc;
  margin-top: 10px;
  background: rgba(0, 0, 0, 0.6);
  padding: 4px 12px;
  border-radius: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.port {
  position: absolute;
  width: 16px;
  height: 16px;
  background: #ef4444;
  border-radius: 50%;
  border: 3px solid #ffffff;
  cursor: pointer;
  z-index: 30;
  transition: all 0.2s;
  box-shadow: 0 0 8px rgba(239, 68, 68, 0.6);
}

.port:hover {
  transform: scale(1.3);
  box-shadow: 0 0 15px rgba(239, 68, 68, 0.9);
}

.port-left {
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
}

.port-right {
  right: -8px;
  top: 50%;
  transform: translateY(-50%);
}

.port-bottom {
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
}

.side-panel {
  width: 280px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.panel-section {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-section h3 {
  margin: 0 0 15px 0;
  font-size: 16px;
  font-weight: 600;
  color: #f1f5f9;
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-section h3::before {
  content: '';
  width: 4px;
  height: 16px;
  background: linear-gradient(180deg, #3b82f6, #8b5cf6);
  border-radius: 2px;
}

.tip-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
  color: #cbd5e1;
  line-height: 1.5;
}

.tip-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.param-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.param-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

.param-label {
  font-size: 13px;
  color: #94a3b8;
}

.param-value {
  font-size: 14px;
  font-weight: 600;
  color: #f8fafc;
}

.final-section {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(59, 130, 246, 0.1));
  border-color: rgba(16, 185, 129, 0.3);
}

.final-section p {
  font-size: 13px;
  color: #10b981;
  margin: 5px 0 15px 0;
}

.final-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-primary {
  padding: 12px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 20px rgba(59, 130, 246, 0.4);
}

.btn-secondary {
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #f1f5f9;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2);
}

.toolbar {
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 12px 20px;
}

.toolbar-title {
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 10px;
  text-align: center;
}

.toolbar-items {
  display: flex;
  justify-content: center;
  gap: 25px;
  overflow-x: auto;
}

.toolbar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background: transparent;
  border-radius: 12px;
  cursor: grab;
  transition: all 0.2s;
  border: 2px solid transparent;
  min-width: 100px;
}

.toolbar-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-3px);
}

.toolbar-item:active {
  cursor: grabbing;
}

.toolbar-item.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-item.disabled:hover {
  transform: none;
}

.toolbar-item-label {
  font-size: 11px;
  color: #f1f5f9;
  margin-top: 8px;
  text-align: center;
}
</style>
