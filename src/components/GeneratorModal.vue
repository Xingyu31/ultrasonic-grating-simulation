<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <span class="modal-icon">⚡</span>
        <span class="modal-title">超声波信号发生器</span>
        <button class="modal-close" @click="$emit('close')">×</button>
      </div>
      
      <div class="modal-body">
        <div class="control-section">
          <div class="section-label">频率调节</div>
          <div class="slider-container">
            <span class="slider-label">频率: {{ frequency.toFixed(1) }} MHz</span>
            <el-slider v-model="localFrequency" :min="4" :max="15" :step="0.1" 
                       show-input :input-size="'small'" />
          </div>
          <div class="preset-buttons">
            <button v-for="f in presetFrequencies" :key="f"
                    class="preset-btn" @click="setFrequency(f)">
              {{ f.toFixed(1) }} MHz
            </button>
          </div>
        </div>
        
        <div class="control-section">
          <div class="section-label">振幅调节</div>
          <div class="slider-container">
            <span class="slider-label">振幅: {{ amplitude }}%</span>
            <el-slider v-model="localAmplitude" :min="0" :max="100" :step="1" 
                       show-input :input-size="'small'" />
          </div>
          <div class="preset-buttons">
            <button v-for="a in presetAmplitudes" :key="a"
                    class="preset-btn" @click="setAmplitude(a)">
              {{ a }}%
            </button>
          </div>
        </div>
        
        <div class="generator-display">
          <div class="display-panel">
            <div class="display-row">
              <span class="display-label">频率</span>
              <span class="display-value frequency">{{ frequency.toFixed(1) }}</span>
              <span class="display-unit">MHz</span>
            </div>
            <div class="display-row">
              <span class="display-label">振幅</span>
              <span class="display-value amplitude">{{ amplitude }}</span>
              <span class="display-unit">%</span>
            </div>
          </div>
          <div class="power-indicator" :class="{ active: amplitude > 0 }">
            <div class="power-led"></div>
            <span>POWER</span>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-cancel" @click="$emit('close')">取消</button>
        <button class="btn-apply" @click="applyChanges">应用设置</button>
        <button class="btn-complete" @click="completeStep">
          {{ stepCompleted ? '已完成' : '完成步骤' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  frequency: Number,
  amplitude: Number,
  stepCompleted: Boolean
})

const emit = defineEmits(['close', 'updateFrequency', 'updateAmplitude', 'completeStep'])

const localFrequency = ref(props.frequency)
const localAmplitude = ref(props.amplitude)

const presetFrequencies = [6, 7, 8, 9, 10]
const presetAmplitudes = [30, 50, 70, 90]

watch(() => props.frequency, (val) => {
  localFrequency.value = val
})

watch(() => props.amplitude, (val) => {
  localAmplitude.value = val
})

const setFrequency = (f) => {
  localFrequency.value = f
}

const setAmplitude = (a) => {
  localAmplitude.value = a
}

const applyChanges = () => {
  emit('updateFrequency', localFrequency.value)
  emit('updateAmplitude', localAmplitude.value)
}

const completeStep = () => {
  applyChanges()
  emit('completeStep')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: linear-gradient(180deg, #1f2937 0%, #111827 100%);
  border-radius: 12px;
  width: 480px;
  max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid #374151;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  border-bottom: 1px solid #374151;
}

.modal-icon {
  font-size: 20px;
}

.modal-title {
  font-size: 16px;
  font-weight: bold;
  color: #ffffff;
}

.modal-close {
  background: none;
  border: none;
  color: #9ca3af;
  font-size: 24px;
  cursor: pointer;
  padding: 0 10px;
  transition: color 0.3s;
}

.modal-close:hover {
  color: #ffffff;
}

.modal-body {
  padding: 20px;
}

.control-section {
  margin-bottom: 20px;
}

.section-label {
  font-size: 13px;
  font-weight: bold;
  color: #9ca3af;
  margin-bottom: 10px;
}

.slider-container {
  margin-bottom: 10px;
}

.slider-label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 5px;
  display: block;
}

.preset-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.preset-btn {
  padding: 6px 12px;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.4);
  border-radius: 4px;
  color: #93c5fd;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.preset-btn:hover {
  background: rgba(59, 130, 246, 0.4);
  color: #ffffff;
}

.generator-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #111827;
  border-radius: 8px;
  padding: 15px;
  margin-top: 10px;
}

.display-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.display-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.display-label {
  font-size: 12px;
  color: #6b7280;
  width: 50px;
}

.display-value {
  font-size: 24px;
  font-weight: bold;
  font-family: 'Courier New', monospace;
}

.display-value.frequency {
  color: #22c55e;
}

.display-value.amplitude {
  color: #a855f7;
}

.display-unit {
  font-size: 12px;
  color: #6b7280;
}

.power-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  opacity: 0.3;
  transition: opacity 0.3s;
}

.power-indicator.active {
  opacity: 1;
}

.power-led {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #374151;
  transition: all 0.3s;
}

.power-indicator.active .power-led {
  background: #22c55e;
  box-shadow: 0 0 10px #22c55e;
}

.power-indicator span {
  font-size: 10px;
  color: #6b7280;
}

.power-indicator.active span {
  color: #22c55e;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 15px 20px;
  border-top: 1px solid #374151;
}

.btn-cancel {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 4px;
  color: #9ca3af;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
}

.btn-apply {
  padding: 8px 16px;
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-apply:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.4);
}

.btn-complete {
  padding: 8px 20px;
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-complete:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(39, 174, 96, 0.4);
}
</style>