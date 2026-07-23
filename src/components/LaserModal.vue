<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <span class="modal-icon">🔴</span>
        <span class="modal-title">氦氖激光器控制</span>
        <button class="modal-close" @click="$emit('close')">×</button>
      </div>
      
      <div class="modal-body">
        <div class="control-section">
          <div class="section-label">电源开关</div>
          <button class="power-button" :class="{ on: laserOn }" @click="$emit('toggleLaser')">
            <span class="power-icon">{{ laserOn ? '●' : '○' }}</span>
            <span class="power-text">{{ laserOn ? '关闭电源' : '开启电源' }}</span>
          </button>
        </div>
        
        <div class="control-section">
          <div class="section-label">入射波长设置</div>
          <div class="slider-container">
            <span class="slider-label">波长: {{ wavelength.toFixed(2) }} nm</span>
            <el-slider v-model="localWavelength" :min="580" :max="650" :step="0.0001" 
                       show-input :input-size="'small'" />
          </div>
          <div class="preset-buttons">
            <button v-for="w in presetWavelengths" :key="w"
                    class="preset-btn" @click="setWavelength(w)">
              {{ w }} nm
            </button>
          </div>
        </div>
        
        <div class="status-section">
          <div class="status-row">
            <span class="status-label">当前状态</span>
            <span :class="laserOn ? 'status-on' : 'status-off'">{{ laserOn ? '运行中' : '已关闭' }}</span>
          </div>
          <div class="status-row">
            <span class="status-label">输出功率</span>
            <span class="status-value">{{ laserOn ? '15 mW' : '0 mW' }}</span>
          </div>
          <div class="status-row">
            <span class="status-label">光束质量</span>
            <span class="status-value">M² < 1.1</span>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-cancel" @click="$emit('close')">取消</button>
        <button class="btn-apply" @click="applyChanges">应用设置</button>
        <button class="btn-complete" :class="{ disabled: !laserOn }" @click="completeStep">
          {{ stepCompleted ? '已完成' : '完成步骤' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  laserOn: Boolean,
  wavelength: Number,
  stepCompleted: Boolean
})

const emit = defineEmits(['close', 'toggleLaser', 'updateWavelength', 'completeStep'])

const localWavelength = ref(props.wavelength)

const presetWavelengths = [632.8, 600.0, 589.3]

watch(() => props.wavelength, (val) => {
  localWavelength.value = val
})

const setWavelength = (w) => {
  localWavelength.value = w
}

const applyChanges = () => {
  emit('updateWavelength', localWavelength.value)
}

const completeStep = () => {
  if (!props.laserOn) return
  applyChanges()
  emit('completeStep')
}
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
  width: 450px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
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

.control-section {
  margin-bottom: 20px;
}

.section-label {
  font-size: 13px;
  font-weight: bold;
  color: #374151;
  margin-bottom: 10px;
}

.power-button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 30px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  border: none;
  transition: all 0.3s;
  background-color: #f3f4f6;
  color: #4b5563;
}

.power-button.on {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4);
}

.power-icon {
  font-size: 20px;
}

.slider-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slider-label {
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
}

.preset-buttons {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.preset-btn {
  flex: 1;
  padding: 8px;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.3s;
}

.preset-btn:hover {
  background-color: #e5e7eb;
}

.status-section {
  background-color: #f8fafc;
  border-radius: 8px;
  padding: 15px;
}

.status-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e5e7eb;
}

.status-row:last-child {
  border-bottom: none;
}

.status-label {
  font-size: 12px;
  color: #6b7280;
}

.status-value {
  font-size: 12px;
  font-weight: bold;
  color: #374151;
}

.status-on {
  font-size: 12px;
  font-weight: bold;
  color: #22c55e;
}

.status-off {
  font-size: 12px;
  font-weight: bold;
  color: #6b7280;
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

.btn-apply {
  padding: 8px 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
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