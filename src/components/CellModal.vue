<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <span class="modal-icon">🔵</span>
        <span class="modal-title">声光调制超声池</span>
        <button class="modal-close" @click="$emit('close')">×</button>
      </div>
      
      <div class="modal-body">
        <div class="control-section">
          <div class="section-label">溶液类型选择</div>
          <div class="liquid-types">
            <button v-for="liquid in liquidTypes" :key="liquid.id"
                    class="liquid-type-btn" 
                    :class="{ active: selectedLiquid.id === liquid.id }"
                    :style="{ '--liquid-color': liquid.color }"
                    @click="selectLiquid(liquid)">
              <span class="liquid-dot"></span>
              <span class="liquid-name">{{ liquid.name }}</span>
            </button>
          </div>
        </div>
        
        <div class="control-section">
          <div class="section-label">{{ selectedLiquid.name }} - 浓度调配</div>
          <div class="slider-container">
            <span class="slider-label">浓度: {{ localConcentration.toFixed(4) }} wt%</span>
            <el-slider v-model="localConcentration" :min="selectedLiquid.minConcentration" :max="selectedLiquid.maxConcentration" :step="0.0001" 
                       show-input :input-size="'small'" :disabled="isPureWater" />
          </div>
          <div class="preset-buttons">
            <button v-for="c in selectedLiquid.presetConcentrations" :key="c"
                    class="preset-btn" @click="setConcentration(c)" :disabled="isPureWater">
              {{ c.toFixed(2) }}%
            </button>
          </div>
        </div>
        
        <div class="control-section" v-if="selectedLiquid.useTemperature">
          <div class="section-label">水温调节</div>
          <div class="slider-container">
            <span class="slider-label">温度: {{ localTemperature.toFixed(2) }} °C</span>
            <el-slider v-model="localTemperature" :min="selectedLiquid.minTemperature" :max="selectedLiquid.maxTemperature" :step="0.1" 
                       show-input :input-size="'small'" />
          </div>
          <div class="temperature-info">
            <span class="info-icon">💡</span>
            <span>声速公式: v = 1398 + 3.46 × t</span>
            <span>当前温度下声速: {{ soundSpeed.toFixed(1) }} m/s</span>
          </div>
        </div>
        
        <div class="control-section" v-else>
          <div class="section-label">温度设置</div>
          <div class="temp-locked-container">
            <span class="temp-locked-icon">🔒</span>
            <span class="temp-locked-text">盐溶液模式下温度固定为 20.00°C</span>
            <button class="temp-locked-btn" @click="showTempWarning">尝试调节温度</button>
          </div>
        </div>
        
        <div class="liquid-display">
          <div class="liquid-tank">
            <div class="liquid-level" :style="{ height: localConcentration * 3 + '%', background: selectedLiquid.gradient }"></div>
          </div>
          <div class="liquid-info">
            <div>{{ selectedLiquid.name }}</div>
            <div>声速: {{ soundSpeed.toFixed(1) }} m/s</div>
            <div>特性: {{ selectedLiquid.description }}</div>
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
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  concentration: Number,
  temperature: {
    type: Number,
    default: 20
  },
  liquidTypeId: {
    type: String,
    default: 'nacl'
  },
  stepCompleted: Boolean
})

const emit = defineEmits(['close', 'updateConcentration', 'updateLiquidType', 'updateTemperature', 'completeStep'])

const liquidTypes = [
  {
    id: 'pure-water',
    name: '纯水（0 wt% NaCl）',
    color: '#38bdf8',
    gradient: 'linear-gradient(180deg, #7dd3fc 0%, #0ea5e9 100%)',
    minConcentration: 0,
    maxConcentration: 0,
    presetConcentrations: [],
    baseSpeed: 1480,
    speedFactor: 0,
    description: '纯水，声速随温度变化（v = 1398 + 3.46t）',
    useTableData: false,
    useTemperature: true,
    minTemperature: 21.0,
    maxTemperature: 41.0,
    temperatureFormula: (t) => 1398 + 3.46 * t
  },
  {
    id: 'nacl',
    name: '氯化钠溶液',
    color: '#fbbf24',
    gradient: 'linear-gradient(180deg, #fcd34d 0%, #f59e0b 100%)',
    minConcentration: 0,
    maxConcentration: 95,
    presetConcentrations: [5.84, 11.68, 17.52, 23.36, 29.2, 35.04, 40.88, 50, 60, 70, 80, 90],
    baseSpeed: 1482.3,
    speedFactor: 0,
    description: '盐水溶液，浓度越高声速越快（基于实测数据）',
    useTableData: true,
    useTemperature: false,
    tableData: [
      { molL: 0.000, wt: 0, speed: 1482.3 },
      { molL: 0.402, wt: 2.35, speed: 1496.0 },
      { molL: 0.707, wt: 4.13, speed: 1500.4 },
      { molL: 1.058, wt: 6.18, speed: 1514.8 },
      { molL: 1.436, wt: 8.40, speed: 1521.5 },
      { molL: 1.803, wt: 10.53, speed: 1535.8 },
      { molL: 2.156, wt: 12.59, speed: 1541.7 },
      { molL: 2.576, wt: 15.04, speed: 1558.5 },
      { molL: 2.958, wt: 17.28, speed: 1564.7 },
      { molL: 3.383, wt: 19.76, speed: 1580.1 },
      { molL: 3.801, wt: 22.20, speed: 1590.2 },
      { molL: 4.232, wt: 24.72, speed: 1606.3 },
      { molL: 4.665, wt: 27.24, speed: 1612.7 },
      { molL: 5.115, wt: 29.87, speed: 1629.3 },
      { molL: 5.564, wt: 32.50, speed: 1641.0 },
      { molL: 6.065, wt: 35.42, speed: 1656.5 },
      { molL: 6.520, wt: 38.08, speed: 1668.2 },
      { molL: 6.958, wt: 40.64, speed: 1683.4 },
      { molL: 7.547, wt: 44.07, speed: 1695.8 },
      { molL: 8.019, wt: 46.83, speed: 1713.4 },
      { molL: 8.570, wt: 50, speed: 1729.8 },
      { molL: 10.284, wt: 60, speed: 1779.2 },
      { molL: 11.998, wt: 70, speed: 1828.6 },
      { molL: 13.712, wt: 80, speed: 1878.0 },
      { molL: 15.426, wt: 90, speed: 1927.4 },
      { molL: 16.283, wt: 95, speed: 1952.1 }
    ]
  }
]

const selectedLiquid = ref(liquidTypes.find(l => l.id === props.liquidTypeId) || liquidTypes[0])
const localConcentration = ref(props.concentration)
const localTemperature = ref(props.temperature)

const isPureWater = computed(() => selectedLiquid.value.id === 'pure-water')

const interpolateSpeed = (tableData, concentration) => {
  if (concentration <= tableData[0].wt) return tableData[0].speed
  if (concentration >= tableData[tableData.length - 1].wt) return tableData[tableData.length - 1].speed
  
  for (let i = 0; i < tableData.length - 1; i++) {
    const current = tableData[i]
    const next = tableData[i + 1]
    if (concentration >= current.wt && concentration <= next.wt) {
      const ratio = (concentration - current.wt) / (next.wt - current.wt)
      return current.speed + ratio * (next.speed - current.speed)
    }
  }
  return tableData[0].speed
}

const soundSpeed = computed(() => {
  const liquid = selectedLiquid.value
  if (liquid.temperatureFormula) {
    return liquid.temperatureFormula(localTemperature.value)
  }
  if (liquid.useTableData && liquid.tableData) {
    return interpolateSpeed(liquid.tableData, localConcentration.value)
  }
  return liquid.baseSpeed + localConcentration.value * liquid.speedFactor
})

watch(() => props.concentration, (val) => {
  localConcentration.value = val
})

watch(() => props.temperature, (val) => {
  localTemperature.value = val
})

watch(() => props.liquidTypeId, (val) => {
  selectedLiquid.value = liquidTypes.find(l => l.id === val) || liquidTypes[0]
})

const selectLiquid = (liquid) => {
  selectedLiquid.value = liquid
  if (liquid.maxConcentration === 0) {
    localConcentration.value = 0
  } else if (localConcentration.value > liquid.maxConcentration) {
    localConcentration.value = liquid.presetConcentrations[2] || liquid.maxConcentration / 2
  }
  if (liquid.useTemperature && !localTemperature.value) {
    localTemperature.value = liquid.minTemperature
  }
}

const setConcentration = (c) => {
  localConcentration.value = c
}

const showTempWarning = () => {
  ElMessage.warning('⚠️ 盐溶液模式下温度固定为20°C，请选择"纯水"模式以调节温度')
}

const applyChanges = () => {
  emit('updateConcentration', localConcentration.value)
  emit('updateLiquidType', {
    id: selectedLiquid.value.id,
    name: selectedLiquid.value.name
  })
  emit('updateTemperature', localTemperature.value)
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
  width: 500px;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
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
  max-height: 500px;
  overflow-y: auto;
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

.liquid-types {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.liquid-type-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background-color: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.3s;
}

.liquid-type-btn:hover {
  background-color: #f3f4f6;
  border-color: #d1d5db;
}

.liquid-type-btn.active {
  background-color: #eff6ff;
  border-color: var(--liquid-color, #3b82f6);
  color: var(--liquid-color, #3b82f6);
}

.liquid-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: var(--liquid-color, #3b82f6);
}

.liquid-name {
  flex: 1;
  text-align: left;
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
  gap: 8px;
  margin-top: 10px;
  flex-wrap: wrap;
}

.preset-btn {
  padding: 6px 12px;
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

.preset-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.temperature-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 10px;
  padding: 10px;
  background-color: #f0fdf4;
  border-radius: 6px;
  border-left: 3px solid #22c55e;
}

.temperature-info .info-icon {
  font-size: 12px;
}

.temperature-info span {
  font-size: 11px;
  color: #166534;
}

.temp-locked-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  padding: 15px;
  background-color: #fef3c7;
  border-radius: 8px;
  border: 1px solid #fcd34d;
}

.temp-locked-icon {
  font-size: 24px;
}

.temp-locked-text {
  font-size: 12px;
  color: #92400e;
  font-weight: 600;
}

.temp-locked-btn {
  padding: 6px 16px;
  background-color: #f59e0b;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.temp-locked-btn:hover {
  background-color: #d97706;
}

.liquid-display {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background-color: #f0f9ff;
  border-radius: 8px;
}

.liquid-tank {
  width: 80px;
  height: 150px;
  border: 3px solid #93c5fd;
  border-radius: 8px;
  background-color: #dbeafe;
  position: relative;
  overflow: hidden;
}

.liquid-level {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  transition: height 0.5s ease;
}

.liquid-info {
  flex: 1;
  font-size: 12px;
  color: #374151;
}

.liquid-info div:first-child {
  font-weight: bold;
  margin-bottom: 5px;
  font-size: 14px;
}

.liquid-info div:last-child {
  margin-top: 5px;
  opacity: 0.7;
  font-size: 11px;
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
</style>