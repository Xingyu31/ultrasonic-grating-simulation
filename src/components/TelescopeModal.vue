<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <span class="modal-title">望远镜调节</span>
        <button class="modal-close" @click="$emit('close')">×</button>
      </div>
      <div class="modal-body">
        <div class="instruction" :class="{ completed: stepCompleted }">
          <h4>步骤四：调整望远镜聚焦</h4>
          <p>请调节望远镜的焦距旋钮，使衍射图样清晰可见</p>
        </div>
        
        <div class="viewfinder">
          <div class="viewfinder-frame">
            <div class="crosshair"></div>
            <div v-if="focusLevel > 30" class="diffraction-view">
              <div class="diffraction-dot center"></div>
              <div class="diffraction-dot left-1"></div>
              <div class="diffraction-dot right-1"></div>
              <div class="diffraction-dot left-2" v-if="focusLevel > 60"></div>
              <div class="diffraction-dot right-2" v-if="focusLevel > 60"></div>
            </div>
          </div>
          <div class="focus-indicator">
            <div class="focus-bar">
              <div class="focus-fill" :style="{ width: focusLevel + '%' }"></div>
            </div>
            <span class="focus-text">聚焦清晰度: {{ Math.round(focusLevel) }}%</span>
          </div>
        </div>
        
        <div class="control-section">
          <label class="control-label">
            <span>焦距调节</span>
            <span class="value">{{ focusLevel.toFixed(0) }}%</span>
          </label>
          <input type="range" :min="0" :max="100" :step="1" :value="focusLevel"
                 @input="updateFocus"
                 class="slider">
        </div>
        
        <div class="tips">
          <div class="tip">
            <span class="tip-icon">💡</span>
            <span>调节焦距直到衍射条纹清晰可见</span>
          </div>
          <div class="tip">
            <span class="tip-icon">💡</span>
            <span>聚焦度达到80%以上效果最佳</span>
          </div>
        </div>
        
        <div v-if="currentStep === 4 && !stepCompleted" class="step-action">
          <button class="btn-success" :disabled="focusLevel < 60" @click="$emit('completeStep')">
            {{ focusLevel >= 60 ? '✓ 完成步骤四' : '请先调节焦距' }}
          </button>
        </div>
        <div v-else-if="stepCompleted" class="step-complete">
          <span class="complete-icon">✓</span>
          <span>步骤四已完成</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  currentStep: Number,
  stepCompleted: Boolean
})

const emit = defineEmits(['close', 'completeStep'])

const focusLevel = ref(0)

const updateFocus = (event) => {
  focusLevel.value = parseFloat(event.target.value)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: linear-gradient(135deg, #1f2937, #374151);
  border-radius: 12px;
  padding: 20px;
  width: 450px;
  max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.modal-title {
  font-size: 18px;
  font-weight: bold;
  color: #f8fafc;
}

.modal-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 24px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  border: none;
  color: #94a3b8;
  transition: all 0.2s;
}

.modal-close:hover {
  background-color: rgba(239, 68, 68, 0.2);
  color: #ef4444;
}

.modal-body {
  color: #e5e7eb;
}

.instruction {
  background: rgba(59, 130, 246, 0.1);
  border-left: 4px solid #3b82f6;
  padding: 12px;
  margin-bottom: 20px;
  border-radius: 0 8px 8px 0;
}

.instruction.completed {
  background: rgba(34, 197, 94, 0.1);
  border-left-color: #22c55e;
}

.instruction h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #f1f5f9;
}

.instruction p {
  margin: 0;
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.5;
}

.viewfinder {
  background: #0a0a0a;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  border: 2px solid #374151;
}

.viewfinder-frame {
  width: 100%;
  height: 180px;
  background: radial-gradient(circle, #1a1a1a 0%, #0a0a0a 70%);
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.crosshair {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.crosshair::before,
.crosshair::after {
  content: '';
  position: absolute;
  background: rgba(34, 197, 94, 0.5);
}

.crosshair::before {
  width: 2px;
  height: 60px;
  top: -30px;
  left: 0;
}

.crosshair::after {
  width: 60px;
  height: 2px;
  top: 0;
  left: -30px;
}

.diffraction-view {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
}

.diffraction-dot {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: #ef4444;
  border-radius: 50%;
  transition: all 0.3s;
}

.diffraction-dot.center {
  left: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: #f97316;
  box-shadow: 0 0 15px #f97316;
}

.diffraction-dot.left-1 {
  left: 35%;
  width: 8px;
  height: 8px;
  box-shadow: 0 0 10px #ef4444;
}

.diffraction-dot.right-1 {
  right: 35%;
  width: 8px;
  height: 8px;
  box-shadow: 0 0 10px #ef4444;
}

.diffraction-dot.left-2 {
  left: 20%;
  width: 5px;
  height: 5px;
  background: #fbbf24;
  box-shadow: 0 0 6px #fbbf24;
}

.diffraction-dot.right-2 {
  right: 20%;
  width: 5px;
  height: 5px;
  background: #fbbf24;
  box-shadow: 0 0 6px #fbbf24;
}

.focus-indicator {
  margin-top: 10px;
}

.focus-bar {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.focus-fill {
  height: 100%;
  background: linear-gradient(90deg, #ef4444, #f97316, #22c55e);
  border-radius: 4px;
  transition: width 0.1s;
}

.focus-text {
  display: block;
  text-align: center;
  margin-top: 5px;
  font-size: 12px;
  color: #94a3b8;
}

.control-section {
  margin-bottom: 15px;
}

.control-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-size: 14px;
  color: #d1d5db;
}

.control-label .value {
  font-weight: bold;
  color: #f97316;
  font-size: 16px;
}

.slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  outline: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  border-radius: 50%;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
  transition: all 0.2s;
}

.slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.tips {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
}

.tip {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #94a3b8;
  background: rgba(0, 0, 0, 0.2);
  padding: 8px 12px;
  border-radius: 6px;
}

.tip-icon {
  font-size: 14px;
}

.step-action {
  display: flex;
  justify-content: center;
}

.btn-success {
  padding: 12px 30px;
  background: linear-gradient(135deg, #22c55e, #16a34a);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(34, 197, 94, 0.3);
}

.btn-success:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
}

.btn-success:disabled {
  background: #4b5563;
  cursor: not-allowed;
  box-shadow: none;
}

.step-complete {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px;
  background: rgba(34, 197, 94, 0.1);
  border-radius: 8px;
  color: #22c55e;
  font-weight: bold;
}

.complete-icon {
  font-size: 20px;
}
</style>