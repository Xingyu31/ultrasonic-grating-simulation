<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <span class="modal-icon">🟢</span>
        <span class="modal-title">光学平移导轨</span>
        <button class="modal-close" @click="$emit('close')">×</button>
      </div>
      
      <div class="modal-body">
        <div class="control-section">
          <div class="section-label">水槽到光屏距离调节</div>
          <div class="slider-container">
            <span class="slider-label">距离: {{ distance.toFixed(3) }} m</span>
            <el-slider v-model="localDistance" :min="0.1" :max="0.6" :step="0.001" 
                       show-input :input-size="'small'" />
          </div>
        </div>
        
        <div class="control-section">
          <div class="section-label">狭缝宽度设置</div>
          <div class="slider-container">
            <span class="slider-label">宽度: {{ gratingWidth.toFixed(5) }} m</span>
            <el-slider v-model="localGratingWidth" :min="0.0001" :max="0.0005" :step="0.00001" 
                       show-input :input-size="'small'" />
          </div>
        </div>
        
        <div class="position-display">
          <div class="position-track">
            <div class="position-marker" :style="{ left: (distance - 0.1) * 200 + '%' }"></div>
          </div>
          <div class="position-scale">
            <span>0.1m</span>
            <span>0.2m</span>
            <span>0.3m</span>
            <span>0.4m</span>
            <span>0.5m</span>
            <span>0.6m</span>
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
  distance: Number,
  gratingWidth: Number,
  stepCompleted: Boolean
})

const emit = defineEmits(['close', 'updateDistance', 'updateGratingWidth', 'completeStep'])

const localDistance = ref(props.distance)
const localGratingWidth = ref(props.gratingWidth)

watch(() => props.distance, (val) => {
  localDistance.value = val
})

watch(() => props.gratingWidth, (val) => {
  localGratingWidth.value = val
})

const applyChanges = () => {
  emit('updateDistance', localDistance.value)
  emit('updateGratingWidth', localGratingWidth.value)
}

const completeStep = () => {
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
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
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
  margin-bottom: 15px;
}

.section-label {
  font-size: 13px;
  font-weight: bold;
  color: #374151;
  margin-bottom: 10px;
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

.position-display {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8fafc;
  border-radius: 8px;
}

.position-track {
  height: 10px;
  background-color: #e5e7eb;
  border-radius: 5px;
  position: relative;
}

.position-marker {
  position: absolute;
  top: -5px;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border-radius: 50%;
  transform: translateX(-50%);
  box-shadow: 0 2px 8px rgba(34, 197, 94, 0.4);
}

.position-scale {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 10px;
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
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
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
</style>