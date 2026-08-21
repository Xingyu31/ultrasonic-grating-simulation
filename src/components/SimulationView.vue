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
        <button class="mode-btn" :class="{ active: experimentMode === 'concentration' }"
                @click="$emit('update:mode', 'concentration')">
          📊 液体浓度影响
        </button>
      </div>
      <div class="mode-info">
        <span class="mode-variable">变量: {{ currentModeInfo.variable }}</span>
        <span class="mode-fixed">固定: {{ currentModeInfo.fixed }}</span>
      </div>
    </div>
    
    <button class="guide-toggle-btn" @click="showGuide = !showGuide">
      📖 {{ showGuide ? '隐藏操作指南' : '实验操作指南' }}
    </button>
    
    <Instrument3DScene 
      ref="sceneRef"
      :params="params" 
      :experimentMode="experimentMode"
      @openComputer="goToMeasurement"
      @openGenerator="openGenerator"
      @toggleLaser="toggleLaser"
      @openLaser="openLaser"
      @openTelescope="openTelescope"
      @openCell="openCell"
      @openCCD="openCCD"
      @updateParams="updateParams"
      @scene-ready="onSceneReady"
    />
    
    <div v-if="showGuide" class="guide-panel">
      <div class="guide-header">
        <span class="guide-title">📖 实验操作指南</span>
        <button class="guide-close" @click="showGuide = false">✕</button>
      </div>
      <div class="guide-content">
        <div class="guide-section">
          <h3>🎯 实验目标</h3>
          <p>通过超声光栅衍射实验，测量液体中的声速</p>
        </div>
        <div class="guide-section">
          <h3>📋 推荐操作顺序</h3>
          <div class="guide-steps">
            <div class="guide-step">
              <span class="step-icon">1️⃣</span>
              <span class="step-text">双击激光器，开启电源并设置波长</span>
            </div>
            <div class="guide-step">
              <span class="step-icon">2️⃣</span>
              <span class="step-text">双击超声光栅水槽，设置溶液浓度</span>
            </div>
            <div class="guide-step">
              <span class="step-icon">3️⃣</span>
              <span class="step-text">双击信号发生器，选择探头谐振频率档位并设置振幅</span>
            </div>
            <div class="guide-step">
              <span class="step-icon">4️⃣</span>
              <span class="step-text">双击CCD相机，对焦并采集衍射数据</span>
            </div>
          </div>
        </div>
        <div class="guide-section">
          <h3>💡 使用提示</h3>
          <ul>
            <li>左键拖动旋转视角，右键拖动平移画面</li>
            <li>滚轮缩放视图</li>
            <li>单击仪器可查看详细信息</li>
            <li>双击仪器可打开参数调节面板</li>
            <li>初始光路已接近等高共轴，只需做细微移动或旋转校准</li>
            <li>选中仪器后可移动、旋转、滚轮缩放；右上角会提示当前共轴状态</li>
          </ul>
        </div>
      </div>
    </div>
    
    <CellModal 
      v-if="showCellModal" 
      :concentration="localParams.concentration"
      :temperature="localParams.temperature"
      :liquidTypeId="localParams.liquidTypeId"
      :stepCompleted="stepCompleted[1]"
      @close="showCellModal = false"
      @updateConcentration="updateConcentration"
      @updateLiquidType="updateLiquidType"
      @updateTemperature="updateTemperature"
      @completeStep="completeStep(2)"
    />
    <GeneratorModal 
      v-if="showGeneratorModal" 
      :frequency="localParams.frequency"
      :amplitude="localParams.amplitude"
      :stepCompleted="stepCompleted[2]"
      @close="showGeneratorModal = false"
      @updateFrequency="updateFrequency"
      @updateAmplitude="updateAmplitude"
      @completeStep="completeStep(3)"
    />
    <LaserModal 
      v-if="showLaserModal" 
      :laserOn="laserOnState"
      :wavelength="localParams.wavelength"
      :stepCompleted="stepCompleted[0]"
      @close="showLaserModal = false"
      @toggleLaser="handleToggleLaser"
      @updateWavelength="updateWavelength"
      @completeStep="completeStep(1)"
    />
    <TelescopeModal 
      v-if="showTelescopeModal"
      :currentStep="currentStep"
      :stepCompleted="stepCompleted[3]"
      @close="showTelescopeModal = false"
      @completeStep="completeStep(4)"
    />
    <CcdModal 
      v-if="showCcdModal"
      :laserOn="laserOnState"
      :params="localParams"
      :experimentMode="props.experimentMode"
      @close="showCcdModal = false"
      @focusComplete="completeStep(4)"
      @addRecord="handleAddRecord"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import Instrument3DScene from './Instrument3DScene.vue'
import CellModal from './CellModal.vue'
import GeneratorModal from './GeneratorModal.vue'
import LaserModal from './LaserModal.vue'
import TelescopeModal from './TelescopeModal.vue'
import CcdModal from './CcdModal.vue'

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

const emit = defineEmits(['update:params', 'update:mode', 'addRecord', 'switch-view'])

const sceneRef = ref(null)
const localParams = reactive({ ...props.params })
const laserOnState = ref(false)

const showGuide = ref(true)
const showCellModal = ref(false)
const showGeneratorModal = ref(false)
const showLaserModal = ref(false)
const showTelescopeModal = ref(false)
const showCcdModal = ref(false)

const progressSteps = [
  { text: '开启光源', completed: false },
  { text: '调节浓度', completed: false },
  { text: '选谐振频率', completed: false },
  { text: '对焦测量', completed: false }
]

const currentStep = ref(1)
const stepCompleted = ref([false, false, false, false])

const currentModeInfo = computed(() => {
  switch (props.experimentMode) {
    case 'wavelength':
      return { variable: '入射光波长', fixed: '超声频率8.0MHz, 浓度7.74wt%' }
    case 'frequency':
      return { variable: '探头谐振频率档位', fixed: '波长600.79nm, 浓度7.74wt%' }
    case 'concentration':
      return { variable: '液体浓度', fixed: '波长600.79nm, 频率8.0MHz' }
    default:
      return { variable: '', fixed: '' }
  }
})

const getStepClass = (index) => {
  return {
    'progress-step': true,
    'active': index === currentStep.value - 1,
    'completed': index < currentStep.value - 1,
    'pending': index > currentStep.value - 1
  }
}

const goToStep = (step) => {
  currentStep.value = step
}

const updateParams = (newParams) => {
  Object.assign(localParams, newParams)
  emit('update:params', newParams)
}

const updateConcentration = (concentration) => {
  localParams.concentration = concentration
  emit('update:params', { concentration })
}

const updateLiquidType = (liquidType) => {
  localParams.liquidType = liquidType.name
  localParams.liquidTypeId = liquidType.id
  emit('update:params', { liquidType: liquidType.name, liquidTypeId: liquidType.id })
}

const updateTemperature = (temperature) => {
  localParams.temperature = temperature
  emit('update:params', { temperature })
}

const updateFrequency = (frequency) => {
  localParams.frequency = frequency
  emit('update:params', { frequency })
}

const updateAmplitude = (amplitude) => {
  localParams.amplitude = amplitude
  emit('update:params', { amplitude })
}

const updateWavelength = (wavelength) => {
  localParams.wavelength = wavelength
  emit('update:params', { wavelength })
}

const completeStep = (step) => {
  stepCompleted.value[step - 1] = true
  if (step >= currentStep.value && currentStep.value < 4) {
    currentStep.value = step + 1
  }
}

const onSceneReady = () => {
  currentStep.value = 1
}

const handleAddRecord = (record) => {
  emit('addRecord', record)
}

const openComputer = () => {
  emit('addRecord', {
    wavelength: localParams.wavelength,
    frequency: localParams.frequency,
    concentration: localParams.concentration,
    spacing: 0.5
  })
}

const openLaser = () => {
  showLaserModal.value = true
}

const goToMeasurement = () => {
  emit('switch-view', 'measurement')
}

const toggleLaser = () => {
  laserOnState.value = !laserOnState.value
}

const handleToggleLaser = () => {
  if (sceneRef.value && sceneRef.value.toggleLaserState) {
    sceneRef.value.toggleLaserState()
  }
  laserOnState.value = !laserOnState.value
}

const openTelescope = () => {
  if (currentStep.value >= 4) {
    showTelescopeModal.value = true
  } else {
    alert('请先完成上一步：调节频率')
  }
}

const openCell = () => {
  if (currentStep.value >= 2) {
    showCellModal.value = true
  } else {
    alert('请先完成上一步：开启光源')
  }
}

const openGenerator = () => {
  if (currentStep.value >= 3) {
    showGeneratorModal.value = true
  } else {
    alert('请先完成上一步：调节浓度')
  }
}

const openCCD = () => {
  if (currentStep.value >= 4) {
    showCcdModal.value = true
  } else {
    alert('请先完成上一步：调节频率')
  }
}
</script>

<style scoped>
.instrument-simulation-mode {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  background-color: #1a1a2e;
}

.progress-bar {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 20px;
  z-index: 100;
}

.progress-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 16px;
  background: rgba(30, 41, 59, 0.8);
  border-radius: 8px;
  transition: all 0.3s;
}

.progress-step.completed {
  background: rgba(34, 197, 94, 0.8);
}

.progress-step.active {
  background: rgba(59, 130, 246, 0.9);
  transform: scale(1.1);
}

.progress-step.pending {
  opacity: 0.5;
}

.progress-step-number {
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.progress-step-text {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 4px;
}

.mode-selector {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 15px;
  background: rgba(30, 41, 59, 0.9);
  padding: 10px 20px;
  border-radius: 10px;
  z-index: 100;
}

.mode-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 13px;
}

.mode-buttons {
  display: flex;
  gap: 10px;
}

.mode-btn {
  padding: 8px 16px;
  background: rgba(71, 85, 105, 0.5);
  border: 1px solid #475569;
  border-radius: 6px;
  color: #e2e8f0;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.mode-btn.active {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-color: #3b82f6;
  color: white;
}

.mode-btn:hover {
  background: rgba(71, 85, 105, 0.8);
}

.mode-info {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.mode-variable {
  color: #fbbf24;
}

.mode-fixed {
  color: #60a5fa;
}

.guide-toggle-btn {
  position: absolute;
  top: 60px;
  right: 20px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  z-index: 100;
  transition: all 0.3s;
}

.guide-toggle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
}

.guide-panel {
  position: absolute;
  bottom: 20px;
  left: 20px;
  width: 320px;
  background: rgba(30, 41, 59, 0.95);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  z-index: 200;
  overflow: hidden;
}

.guide-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: linear-gradient(135deg, #475569 0%, #334155 100%);
}

.guide-title {
  color: #f1f5f9;
  font-size: 14px;
  font-weight: bold;
}

.guide-close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 18px;
  cursor: pointer;
}

.guide-content {
  padding: 15px;
  max-height: 350px;
  overflow-y: auto;
}

.guide-section {
  margin-bottom: 15px;
}

.guide-section h3 {
  color: #f1f5f9;
  font-size: 13px;
  margin-bottom: 8px;
}

.guide-section p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  line-height: 1.5;
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
  padding: 8px 12px;
  background: rgba(51, 65, 85, 0.5);
  border-radius: 8px;
  transition: all 0.2s;
}

.guide-step.completed {
  background: rgba(34, 197, 94, 0.2);
  border-left: 3px solid #22c55e;
}

.step-icon {
  font-size: 14px;
}

.step-text {
  flex: 1;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
}

.step-check {
  color: #22c55e;
  font-weight: bold;
}

.guide-section ul {
  margin: 0;
  padding-left: 20px;
}

.guide-section li {
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  margin-bottom: 5px;
}
</style>
