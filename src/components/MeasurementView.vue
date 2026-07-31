<template>
  <div class="measurement-view">
    <div v-if="showMessage" class="custom-message" :class="messageType">
      <div class="message-content">{{ message }}</div>
    </div>
    
    <ZoomModal :show="showZoomModal" :title="zoomTitle" :drawFn="zoomDrawFn" :width="zoomWidth" :height="zoomHeight" @close="closeZoomModal" />

    <TemperatureFitModal :show="showTempFitModal" :records="records" @close="showTempFitModal = false" />
    
    <div class="left-panel">
      <div class="panel-section params-section">
        <div class="section-header">
          <span class="section-title">实验参数设置</span>
          <div class="status-indicators">
            <div class="temp-indicator">
              <span class="temp-icon">🌡️</span>
              <span class="temp-value">{{ isPureWater ? `温度 ${localParams.temperature.toFixed(2)}°C` : '常温 20.00°C' }}</span>
            </div>
            <div class="distance-indicator">
              <span class="distance-icon">📏</span>
              <span class="distance-value">距离 0.30m</span>
            </div>
          </div>
          <button class="btn-run" @click="runSimulation">▶ 运行仿真</button>
        </div>
        <div class="params-tabs">
          <button class="param-tab" :class="{ active: paramTab === 'liquid' }" @click="paramTab = 'liquid'">
            💧 液体参数
          </button>
          <button class="param-tab" :class="{ active: paramTab === 'optical' }" @click="paramTab = 'optical'">
            🌈 光学参数
          </button>
          <button class="param-tab" :class="{ active: paramTab === 'acoustic' }" @click="paramTab = 'acoustic'">
            🔊 声学参数
          </button>
        </div>
        <div class="params-grid">
          <template v-if="paramTab === 'liquid'">
            <div class="param-item">
              <label class="param-label">液体类型</label>
              <select v-model="localParams.liquidTypeId" class="param-select" @change="onLiquidTypeChange">
                <option value="pure-water">纯水（0 wt% NaCl）</option>
                <option value="nacl">氯化钠溶液</option>
              </select>
            </div>
            <div class="param-item">
              <label class="param-label">液体浓度</label>
              <el-slider v-model="localParams.concentration" :min="0" :max="26.47" :step="0.0001" 
                         show-input :input-size="'small'" :disabled="isPureWater" />
              <span class="param-unit">wt%</span>
            </div>
            <div class="param-item">
              <label class="param-label">温度
                <button v-if="isPureWater" class="btn-temp-fit" @click="showTempFitModal = true">🌡️ 温度拟合</button>
              </label>
              <el-slider v-model="localParams.temperature" :min="0" :max="80" :step="0.1"
                         show-input :input-size="'small'" :disabled="!isPureWater" />
              <span class="param-unit">°C</span>
            </div>
          </template>
          <template v-else-if="paramTab === 'optical'">
            <div class="param-item">
              <label class="param-label">入射波长</label>
              <el-slider v-model="localParams.wavelength" :min="380" :max="700" :step="0.1" 
                         show-input :input-size="'small'" />
              <span class="param-unit">nm</span>
            </div>
            <div class="param-item">
              <label class="param-label">狭缝宽度</label>
              <el-slider v-model="localParams.gratingWidth" :min="0.0001" :max="0.0005" :step="0.00001" 
                         show-input :input-size="'small'" />
              <span class="param-unit">m</span>
            </div>
          </template>
          <template v-else-if="paramTab === 'acoustic'">
            <div class="param-item">
              <label class="param-label">超声频率</label>
              <el-slider v-model="localParams.frequency" :min="4" :max="15" :step="0.1" 
                         show-input :input-size="'small'" />
              <span class="param-unit">MHz</span>
            </div>
            <div class="param-item">
              <label class="param-label">超声振幅</label>
              <el-slider v-model="localParams.amplitude" :min="0" :max="100" :step="1" 
                         show-input :input-size="'small'" />
              <span class="param-unit">%</span>
            </div>
          </template>
        </div>
        <div class="section-footer">
          <button class="btn-reset" @click="resetParams">重置参数</button>
        </div>
      </div>
      
      <div class="panel-section fit-section">
        <div class="section-header">
          <span class="section-title">数据拟合分析</span>
          <button class="btn-fit" @click="performFit">执行拟合</button>
        </div>
        <div class="fit-tabs">
          <button class="fit-tab" :class="{ active: fitTab === 'concentration' }" @click="fitTab = 'concentration'">
            📊 液体浓度影响
          </button>
          <button class="fit-tab" :class="{ active: fitTab === 'wavelength' }" @click="fitTab = 'wavelength'">
            🌈 光波长影响
          </button>
          <button class="fit-tab" :class="{ active: fitTab === 'frequency' }" @click="fitTab = 'frequency'">
            📡 超声频率影响
          </button>
        </div>
        <div class="experiment-mode-info">
          <span class="mode-badge">📋</span>
          <span class="mode-variable">{{ currentModeInfo.variable }}</span>
          <span class="mode-divider">|</span>
          <span class="mode-fixed">{{ currentModeInfo.fixed }}</span>
        </div>
        <div class="fit-canvas-container">
          <canvas ref="fitCanvas" class="fit-canvas" @dblclick="zoomFit"></canvas>
          <div v-if="!hasData" class="no-data-hint">
            <span>📈</span>
            <p>请先测量数据</p>
            <p>测量至少2组数据后进行拟合分析</p>
          </div>
        </div>
      </div>
    </div>
    
    <div class="center-panel">
      <div class="plot-container">
        <div class="plot-header">
          <span class="plot-title">超声光栅衍射光斑图样</span>
          <div class="plot-controls">
            <button class="btn-control" @click="clearMarkers">清除标记</button>
            <button class="btn-control" @click="autoIdentify">自动识别</button>
          </div>
        </div>
        <div class="plot-canvas-wrapper">
          <canvas ref="mainCanvas" class="main-canvas" @dblclick="zoomDiffraction" @click="handleMainCanvasClick"></canvas>
          <canvas ref="intensityCanvas" class="intensity-canvas" @dblclick="zoomIntensity"></canvas>
        </div>
        <div class="plot-status" :class="{ focused: focusComplete }">
          {{ focusComplete ? '✓ 条纹清晰（已对焦）' : '✗ 条纹模糊（未对焦）' }}
        </div>
      </div>
    </div>
    
    <div class="right-panel">
      <div class="panel-section measurement-section">
        <div class="section-header">
          <span class="section-title">数据测量</span>
        </div>
        <div class="measurement-grid">
          <div class="measure-item">
            <label class="measure-label">手动录入</label>
            <button class="btn-input" @click="inputMeasurement">输入测量值</button>
          </div>
          <div class="measure-item">
            <label class="measure-label">游标读数</label>
            <button class="btn-input" @click="autoRead">游标自动读数</button>
          </div>
        </div>
        <div class="cursor-selector">
          <button class="cursor-select-btn" :class="{ active: activeCursor === 0 }" @click="toggleCursor(0)">
            <span class="cursor-indicator red"></span>
            激活游标1
          </button>
          <button class="cursor-select-btn" :class="{ active: activeCursor === 1 }" @click="toggleCursor(1)">
            <span class="cursor-indicator green"></span>
            激活游标2
          </button>
        </div>
        <div v-if="activeCursor !== null" class="cursor-status">
          已激活{{ activeCursor === 0 ? '游标1(红色)' : '游标2(绿色)' }}，点击光斑图放置
        </div>
        <div class="measure-results">
          <div class="result-row">
            <span class="result-label">+1级位置</span>
            <div class="cursor-control">
              <button class="cursor-btn" @click="adjustCursor(0, -0.01)">◄</button>
              <input class="result-input" type="text" v-model="plus1Position">
              <button class="cursor-btn" @click="adjustCursor(0, 0.01)">►</button>
            </div>
          </div>
          <div class="result-row">
            <span class="result-label">-1级位置</span>
            <div class="cursor-control">
              <button class="cursor-btn" @click="adjustCursor(1, -0.01)">◄</button>
              <input class="result-input" type="text" v-model="minus1Position">
              <button class="cursor-btn" @click="adjustCursor(1, 0.01)">►</button>
            </div>
          </div>
          <div class="result-row">
            <span class="result-label">间距计算</span>
            <span class="result-value">{{ spacing.toFixed(4) }} mm</span>
          </div>
        </div>
        <div class="measure-actions">
          <button class="btn-calculate" @click="calculateSpacing">计算间距</button>
          <button class="btn-save" @click="saveRecord">保存实验</button>
          <button class="btn-save-archive" @click="saveToArchive">📁 创建存档</button>
        </div>
      </div>
      
      <div class="panel-section records-section">
        <div class="section-header">
          <span class="section-title">实验记录表</span>
          <div class="section-actions">
            <button class="btn-clear" @click="clearAllRecords">清除数据</button>
            <button class="btn-export" @click="exportExcel">导出Excel</button>
            <button class="btn-save-archive" @click="saveToArchive">📁 创建存档</button>
          </div>
        </div>
        <div class="record-tabs">
          <button class="record-tab" :class="{ active: recordTab === 'all' }" @click="recordTab = 'all'">
            📋 全部 <span class="tab-count">({{ modeRecordCounts.all }})</span>
          </button>
          <button class="record-tab" :class="{ active: recordTab === 'wavelength' }" @click="recordTab = 'wavelength'">
            🌈 波长影响 <span class="tab-count">({{ modeRecordCounts.wavelength }})</span>
          </button>
          <button class="record-tab" :class="{ active: recordTab === 'frequency' }" @click="recordTab = 'frequency'">
            📡 频率影响 <span class="tab-count">({{ modeRecordCounts.frequency }})</span>
          </button>
          <button class="record-tab" :class="{ active: recordTab === 'concentration' }" @click="recordTab = 'concentration'">
            📊 浓度影响 <span class="tab-count">({{ modeRecordCounts.concentration }})</span>
          </button>
        </div>
        <div class="records-table-container" @dblclick="showTableZoom = true">
          <table class="records-table">
            <thead>
              <tr>
                <th>序号</th>
                <th>模式</th>
                <th>波长(nm)</th>
                <th>频率(MHz)</th>
                <th>温度(°C)</th>
                <th>浓度(wt%)</th>
                <th>间距(mm)</th>
                <th>声速(m/s)</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(record, index) in filteredRecords" :key="index">
                <td>{{ index + 1 }}</td>
                <td><span class="mode-badge-small" :class="record.experimentMode">{{ getModeLabel(record.experimentMode) }}</span></td>
                <td>{{ record.wavelength.toFixed(2) }}</td>
                <td>{{ record.frequency.toFixed(1) }}</td>
                <td>{{ record.temperature ? record.temperature.toFixed(1) : '-' }}</td>
                <td>{{ record.concentration ? record.concentration.toFixed(5) : '-' }}</td>
                <td>{{ record.spacing.toFixed(4) }}</td>
                <td>{{ record.speed.toFixed(1) }}</td>
                <td><button class="btn-delete" @click.stop="deleteRecord(getOriginalIndex(record))">删除</button></td>
              </tr>
              <tr v-if="filteredRecords.length === 0">
                <td colspan="9" class="empty-row">暂无数据，请先测量</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="panel-section results-section">
        <div class="section-header">
          <span class="section-title">计算结果</span>
        </div>
        <div class="results-grid">
          <div class="result-item">
            <span class="result-label">光栅常数</span>
            <span class="result-value">{{ gratingConstant.toFixed(8) }} m</span>
          </div>
          <div class="result-item">
            <span class="result-label">条纹间距</span>
            <span class="result-value">{{ spacing.toFixed(4) }} mm</span>
          </div>
          <div class="result-item">
            <span class="result-label">声速</span>
            <span class="result-value">{{ soundSpeed.toFixed(1) }} m/s</span>
          </div>
          <div class="result-item">
            <span class="result-label">误差区间</span>
            <span class="result-value">±1.00%</span>
          </div>
          <div class="result-item">
            <span class="result-label">信噪比</span>
            <span class="result-value">30.00</span>
          </div>
        </div>
      </div>
      
      <div class="panel-section analysis-section">
        <div class="section-header">
          <span class="section-title">分析与验证</span>
          <button class="btn-analyze" @click="performAnalysis">执行验证</button>
        </div>
        <div class="analysis-tabs">
          <button class="analysis-tab" :class="{ active: analysisTab === 'wavelength' }" @click="analysisTab = 'wavelength'">
            🌈 波长影响
          </button>
          <button class="analysis-tab" :class="{ active: analysisTab === 'frequency' }" @click="analysisTab = 'frequency'">
            📡 频率影响
          </button>
          <button class="analysis-tab" :class="{ active: analysisTab === 'concentration' }" @click="analysisTab = 'concentration'">
            📊 浓度影响
          </button>
        </div>
        <div class="analysis-content">
          <div v-if="filteredAnalysisResult" class="analysis-result">
            <div class="analysis-summary">
              <div class="mode-title">📋 {{ filteredAnalysisResult.mode }}</div>
              <div class="summary-item">
                <span class="summary-label">实验声速</span>
                <span class="summary-value">{{ filteredAnalysisResult.experimentalSpeed.toFixed(2) }} m/s</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">理论声速</span>
                <span class="summary-value">{{ filteredAnalysisResult.theoreticalSpeed.toFixed(2) }} m/s</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">相对误差</span>
                <span class="summary-value" :class="{ 'error-high': Math.abs(filteredAnalysisResult.relativeError) > 5 }">{{ filteredAnalysisResult.relativeError.toFixed(2) }}%</span>
              </div>
            </div>
            <div class="analysis-details">
              <div class="detail-section">
                <h4>📊 数据分析</h4>
                <div class="stat-grid">
                  <div class="stat-item">
                    <span class="stat-label">数据点数</span>
                    <span class="stat-value">{{ filteredAnalysisResult.dataPoints }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">标准差</span>
                    <span class="stat-value">±{{ filteredAnalysisResult.stdDev.toFixed(2) }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">变异系数</span>
                    <span class="stat-value">{{ filteredAnalysisResult.cv.toFixed(3) }}%</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">中位数</span>
                    <span class="stat-value">{{ filteredAnalysisResult.median.toFixed(2) }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">极差</span>
                    <span class="stat-value">{{ filteredAnalysisResult.range.toFixed(2) }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">四分位距</span>
                    <span class="stat-value">{{ filteredAnalysisResult.iqr.toFixed(2) }}</span>
                  </div>
                </div>
                <div class="consistency-badge" :class="filteredAnalysisResult.consistency.toLowerCase()">
                  数据一致性: {{ filteredAnalysisResult.consistency }}
                </div>
                <div v-if="filteredAnalysisResult.outlierCount > 0" class="outlier-warning">
                  ⚠️ 检测到 {{ filteredAnalysisResult.outlierCount }} 个异常值
                </div>
                <div class="normal-range">
                  正常范围: {{ filteredAnalysisResult.normalRangeLower.toFixed(2) }} ~ {{ filteredAnalysisResult.normalRangeUpper.toFixed(2) }} m/s
                </div>
              </div>
              <div class="detail-section">
                <h4>📈 拟合参数验证</h4>
                <div v-if="filteredAnalysisResult.analysisType === 'constantSpeed'" class="fit-params">
                  <div class="fit-param-item">
                    <span class="fit-param-label">验证指标</span>
                    <span class="fit-param-value">声速恒定（标准差 < 6 m/s）</span>
                  </div>
                  <div class="fit-param-item">
                    <span class="fit-param-label">当前标准差</span>
                    <span class="fit-param-value" :class="{ 'good': filteredAnalysisResult.stdDev < 6, 'bad': filteredAnalysisResult.stdDev >= 6 }">{{ filteredAnalysisResult.stdDev.toFixed(2) }} m/s</span>
                  </div>
                  <div class="fit-formula">
                    理论公式: v = 2kλfL / D（波长/频率变化，v恒定）
                  </div>
                </div>
                <div v-else class="fit-params">
                  <div class="fit-param-item">
                    <span class="fit-param-label">拟合斜率</span>
                    <span class="fit-param-value">{{ filteredAnalysisResult.fitSlope.toFixed(2) }}（理论值: {{ filteredAnalysisResult.theoreticalSlope }}）</span>
                  </div>
                  <div class="fit-param-item">
                    <span class="fit-param-label">斜率误差</span>
                    <span class="fit-param-value" :class="{ 'good': Math.abs(filteredAnalysisResult.slopeError) < 10, 'bad': Math.abs(filteredAnalysisResult.slopeError) >= 10 }">{{ filteredAnalysisResult.slopeError.toFixed(2) }}%</span>
                  </div>
                  <div class="fit-param-item">
                    <span class="fit-param-label">拟合截距</span>
                    <span class="fit-param-value">{{ filteredAnalysisResult.fitIntercept.toFixed(1) }}（理论值: {{ filteredAnalysisResult.theoreticalIntercept }}）</span>
                  </div>
                  <div class="fit-param-item">
                    <span class="fit-param-label">截距误差</span>
                    <span class="fit-param-value" :class="{ 'good': Math.abs(filteredAnalysisResult.interceptError) < 2, 'bad': Math.abs(filteredAnalysisResult.interceptError) >= 2 }">{{ filteredAnalysisResult.interceptError.toFixed(2) }}%</span>
                  </div>
                  <div class="fit-formula">
                    理论公式: v = {{ filteredAnalysisResult.theoreticalIntercept }} + {{ filteredAnalysisResult.theoreticalSlope }} × c
                  </div>
                </div>
              </div>
              <div class="detail-section">
                <h4>✅ 验证结果</h4>
                <p class="validation-result" :class="filteredAnalysisResult.validationPass ? 'pass' : 'fail'">
                  {{ filteredAnalysisResult.validationPass ? '✓ 实验结果符合理论预期' : '✗ 实验结果与理论偏差较大' }}
                </p>
                <div class="suggestion-box">
                  <span class="suggestion-icon">💡</span>
                  <span class="suggestion-text">{{ filteredAnalysisResult.suggestion }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="no-analysis-hint">
            <span>🔍</span>
            <p>请先测量至少3组"{{ getModeLabel(analysisTab) }}"数据</p>
            <p>点击"执行验证"进行数据分析</p>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="showTableZoom" class="zoom-modal" @click="showTableZoom = false">
      <div class="zoom-modal-content" @click.stop>
        <div class="zoom-modal-header">
          <span class="zoom-modal-title">实验记录表</span>
          <button class="zoom-modal-close" @click="showTableZoom = false">✕</button>
        </div>
        <div class="zoom-modal-body">
          <table class="records-table-large">
            <thead>
              <tr>
                <th>序号</th>
                <th>波长(nm)</th>
                <th>频率(MHz)</th>
                <th>温度(°C)</th>
                <th>浓度(wt%)</th>
                <th>间距(mm)</th>
                <th>声速(m/s)</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(record, index) in records" :key="index">
                <td>{{ index + 1 }}</td>
                <td>{{ record.wavelength.toFixed(2) }}</td>
                <td>{{ record.frequency.toFixed(1) }}</td>
                <td>{{ record.temperature ? record.temperature.toFixed(1) : '-' }}</td>
                <td>{{ record.concentration ? record.concentration.toFixed(5) : '-' }}</td>
                <td>{{ record.spacing.toFixed(4) }}</td>
                <td>{{ record.speed.toFixed(1) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted, onActivated, onDeactivated, nextTick } from 'vue'
import ZoomModal from './ZoomModal.vue'
import TemperatureFitModal from './TemperatureFitModal.vue'
import { saveArchive } from '../utils/archive.js'
import { ElMessage } from 'element-plus'

const props = defineProps({
  params: Object,
  records: Array,
  experimentMode: {
    type: String,
    default: 'wavelength'
  }
})

const emit = defineEmits(['update:params', 'update:records', 'update:mode'])

const localParams = reactive({ ...props.params })
const isInternalUpdate = ref(false)
const focusComplete = ref(true)

const mainCanvas = ref(null)
const intensityCanvas = ref(null)
const fitCanvas = ref(null)

const plus1Position = ref('')
const minus1Position = ref('')

const showMessage = ref(false)
const message = ref('')
const messageType = ref('info')

const showZoomModal = ref(false)
const zoomTitle = ref('')
const zoomDrawFn = ref(null)
const zoomWidth = ref(800)
const zoomHeight = ref(600)

const showTableZoom = ref(false)
const showTempFitModal = ref(false)

const fitTab = ref('frequency')
const paramTab = ref('liquid')
const recordTab = ref('all')
const analysisTab = ref('wavelength')

const currentModeInfo = computed(() => {
  switch (fitTab.value) {
    case 'wavelength':
      return {
        variable: `光波长 λ (${props.params.wavelength.toFixed(1)} nm)`,
        fixed: `频率=${props.params.frequency.toFixed(1)}MHz, 浓度=${props.params.concentration.toFixed(4)}wt%`,
        formula: '声速 v = 2kλfL / D（λ变化，v恒定）',
        mode: 'wavelength'
      }
    case 'frequency':
      return {
        variable: `超声频率 f (${props.params.frequency.toFixed(1)} MHz)`,
        fixed: `波长=${props.params.wavelength.toFixed(1)}nm, 浓度=${props.params.concentration.toFixed(4)}wt%`,
        formula: '声速 v = 2kλfL / D（f变化，v恒定）',
        mode: 'frequency'
      }
    case 'concentration':
      return {
        variable: `液体浓度 c (${props.params.concentration.toFixed(4)} wt%)`,
        fixed: `波长=${props.params.wavelength.toFixed(1)}nm, 频率=${props.params.frequency.toFixed(1)}MHz`,
        formula: '声速 v 基于实测数据表插值（c变化，v非线性变化）',
        mode: 'concentration'
      }
    default:
      return {
        variable: '未知',
        fixed: '未知',
        formula: '',
        mode: ''
      }
  }
})

const experimentVs = ref(null)

const analysisResult = ref(null)

const filteredRecords = computed(() => {
  if (recordTab.value === 'all') {
    return props.records || []
  }
  return (props.records || []).filter(r => r.experimentMode === recordTab.value)
})

const modeRecordCounts = computed(() => {
  const records = props.records || []
  return {
    all: records.length,
    wavelength: records.filter(r => r.experimentMode === 'wavelength').length,
    frequency: records.filter(r => r.experimentMode === 'frequency').length,
    concentration: records.filter(r => r.experimentMode === 'concentration').length
  }
})

const filteredAnalysisResult = computed(() => {
  if (!analysisResult.value) return null
  if (analysisResult.value.mode === analysisTab.value) {
    return analysisResult.value
  }
  return null
})

const isPureWater = computed(() => localParams.liquidTypeId === 'pure-water')

const onLiquidTypeChange = () => {
  if (isPureWater.value) {
    localParams.concentration = 0
    if (localParams.temperature < 0 || localParams.temperature > 80) {
      localParams.temperature = 21
    }
  } else {
    localParams.temperature = 20
  }
  experimentVs.value = null
  emit('update:params', { ...localParams })
  runSimulation()
}

const cursors = ref([{ m: 1, x: null }, { m: -1, x: null }])
const cursorMode = ref(0)
const activeCursor = ref(null)

const spacing = computed(() => {
  const pos1 = parseFloat(plus1Position.value) || 0
  const pos2 = parseFloat(minus1Position.value) || 0
  return Math.abs(pos1 - pos2)
})

const gratingConstant = computed(() => {
  if (spacing.value === 0) return 0
  return (2 * props.params.wavelength * 1e-9 * props.params.distance) / (spacing.value * 1e-3)
})

const soundSpeed = computed(() => {
  if (spacing.value === 0) return 0
  if (experimentVs.value !== null) {
    return experimentVs.value
  }
  return (2 * props.params.wavelength * 1e-9 * props.params.distance * props.params.frequency * 1e6) / (spacing.value * 1e-3)
})

const hasData = computed(() => props.records && props.records.length > 0)

watch(fitTab, () => {
  if (hasData.value) {
    drawFitChart()
  }
  emit('update:mode', fitTab.value)
})

watch(() => props.experimentMode, (newMode) => {
  if (newMode !== fitTab.value) {
    fitTab.value = newMode
  }
})

watch(() => localParams.concentration, () => {
  isInternalUpdate.value = true
  emit('update:params', { ...localParams })
  runSimulation()
  nextTick(() => { isInternalUpdate.value = false })
})

watch(() => localParams.temperature, (newTemp) => {
  if (isPureWater.value) {
    isInternalUpdate.value = true
    emit('update:params', { ...localParams })
    experimentVs.value = null
    runSimulation()
    nextTick(() => { isInternalUpdate.value = false })
  }
})

watch(() => props.params.temperature, () => {
  experimentVs.value = null
})

watch(() => props.params.liquidTypeId, () => {
  experimentVs.value = null
})

watch([() => localParams.wavelength, () => localParams.frequency, () => localParams.amplitude, () => localParams.gratingWidth], () => {
  isInternalUpdate.value = true
  emit('update:params', { ...localParams })
  runSimulation()
  nextTick(() => { isInternalUpdate.value = false })
})

watch(() => props.params, (newVal) => {
  if (!isInternalUpdate.value) {
    Object.assign(localParams, newVal)
  }
}, { deep: true })

const wavelengthToRgb = (wavelength) => {
  const w = wavelength
  let R, G, B
  if (w >= 380 && w < 440) {
    R = -(w - 440) / (440 - 380)
    G = 0.0
    B = 1.0
  } else if (w >= 440 && w < 490) {
    R = 0.0
    G = (w - 440) / (490 - 440)
    B = 1.0
  } else if (w >= 490 && w < 510) {
    R = 0.0
    G = 1.0
    B = -(w - 510) / (510 - 490)
  } else if (w >= 510 && w < 580) {
    R = (w - 510) / (580 - 510)
    G = 1.0
    B = 0.0
  } else if (w >= 580 && w < 645) {
    R = 1.0
    G = -(w - 645) / (645 - 580)
    B = 0.0
  } else if (w >= 645 && w <= 780) {
    R = 1.0
    G = 0.0
    B = 0.0
  } else {
    R = 0.5
    G = 0.5
    B = 0.5
  }
  return { r: R, g: G, b: B }
}

const liquidConfigs = {
  'pure-water': {
    baseSpeed: 1480,
    speedFactor: 0,
    tableData: null,
    temperatureFormula: (t) => 1398 + 3.46 * t,
    minTemperature: 0,
    maxTemperature: 80
  },
  'nacl': {
    baseSpeed: 1482.3,
    speedFactor: 4.945,
    tableData: null,
    temperatureFormula: null
  },
  'ethylene-glycol': {
    baseSpeed: 1500,
    speedFactor: 10,
    tableData: null
  },
  'glycerol': {
    baseSpeed: 1480,
    speedFactor: 12,
    tableData: null
  },
  'sugar': {
    baseSpeed: 1480,
    speedFactor: 5.5,
    tableData: null
  },
  'alcohol': {
    baseSpeed: 1480,
    speedFactor: -2.5,
    tableData: null
  },
  'hcl': {
    baseSpeed: 1480,
    speedFactor: 8,
    tableData: null
  },
  'naoh': {
    baseSpeed: 1480,
    speedFactor: 7,
    tableData: null
  }
}

const getSoundSpeed = (liquidTypeId, concentration, temperature = 20) => {
  const config = liquidConfigs[liquidTypeId] || liquidConfigs['nacl']
  
  if (config.temperatureFormula) {
    return config.temperatureFormula(temperature)
  }
  
  if (config.tableData) {
    const tableData = config.tableData
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
  
  return config.baseSpeed + concentration * config.speedFactor
}

const ultrasonicWavelength = (frequency, concentration, vs = null) => {
  if (vs === null) {
    const baseVs = getSoundSpeed(localParams.liquidTypeId || 'nacl', concentration, localParams.temperature)
    const randomVariation = (Math.random() - 0.5) * 5
    vs = baseVs + randomVariation
  }
  return vs / (frequency * 1e6)
}

const fringePosition = (m, wavelength, frequency, concentration, distance) => {
  const ds = ultrasonicWavelength(frequency, concentration, experimentVs.value)
  return m * wavelength * distance / ds
}

const intensityDistribution = (x, wavelength, frequency, concentration, distance, gratingWidth) => {
  const ds = ultrasonicWavelength(frequency, concentration, experimentVs.value)
  const k = 2 * Math.PI / wavelength
  const u = k * ds * x / (2 * distance)
  const beta = k * gratingWidth / 2
  
  const envelope = Math.pow(Math.sin(u) / (u || 1), 2)
  const interference = Math.pow(Math.cos(beta * x / distance), 2)
  
  return envelope * interference
}

const runSimulation = () => {
  focusComplete.value = true
  
  const baseVs = getSoundSpeed(localParams.liquidTypeId || 'nacl', localParams.concentration, localParams.temperature)
  const randomVariation = (Math.random() - 0.5) * 2
  experimentVs.value = baseVs + randomVariation
  
  const k = 1
  const lambda = localParams.wavelength * 1e-9
  const f = localParams.frequency * 1e6
  const L = localParams.distance
  const vs = experimentVs.value
  
  const theoreticalSpacing = (2 * k * lambda * f * L) / vs
  
  const spacingError = (Math.random() - 0.5) * 0.005 * theoreticalSpacing
  const measuredSpacingMeters = theoreticalSpacing + spacingError
  
  spacing.value = measuredSpacingMeters * 1000
  
  nextTick(() => {
    drawDiffractionPattern()
    drawIntensityCurve()
  })
}

const resetParams = () => {
  Object.assign(localParams, {
    concentration: 7.7404479578,
    wavelength: 600.79051383,
    frequency: 8.0,
    amplitude: 50,
    distance: 0.3,
    gratingWidth: 0.0003
  })
  emit('update:params', { ...localParams })
}

const drawDiffractionPattern = () => {
  const canvas = mainCanvas.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height
  
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, width, height)
  
  const wavelength = props.params.wavelength * 1e-9
  const wavelengthNm = props.params.wavelength
  const spotColor = wavelengthToRgb(wavelengthNm)
  
  const yCenter = height / 2
  const xCenter = width / 2
  
  const xMin = -15 / 1000
  const xMax = 15 / 1000
  
  const stripeHeight = height * 0.85
  const stripeWidth = focusComplete.value ? 2 : 6
  
  for (let m = -5; m <= 5; m++) {
    const xM = fringePosition(m, wavelength, props.params.frequency, props.params.concentration, props.params.distance)
    
    let mIntensity
    if (m === 0) {
      mIntensity = 1.0
    } else {
      mIntensity = Math.max(0.05, Math.pow(0.6, Math.abs(m)))
    }
    
    const px = xCenter + (xM / (xMax - xMin)) * width
    
    const r = Math.round(spotColor.r * 255)
    const g = Math.round(spotColor.g * 255)
    const b = Math.round(spotColor.b * 255)
    
    const yStart = yCenter - stripeHeight / 2
    const yEnd = yCenter + stripeHeight / 2
    
    const outerGlowGradient = ctx.createLinearGradient(px - stripeWidth * 4, yStart, px + stripeWidth * 4, yStart)
    outerGlowGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`)
    outerGlowGradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.2})`)
    outerGlowGradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.35})`)
    outerGlowGradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.2})`)
    outerGlowGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
    ctx.strokeStyle = outerGlowGradient
    ctx.lineWidth = stripeWidth * 8
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(px, yStart)
    ctx.lineTo(px, yEnd)
    ctx.stroke()
    
    const middleGlowGradient = ctx.createLinearGradient(px - stripeWidth * 2.5, yStart, px + stripeWidth * 2.5, yStart)
    middleGlowGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`)
    middleGlowGradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.4})`)
    middleGlowGradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.6})`)
    middleGlowGradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.4})`)
    middleGlowGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
    ctx.strokeStyle = middleGlowGradient
    ctx.lineWidth = stripeWidth * 4
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(px, yStart)
    ctx.lineTo(px, yEnd)
    ctx.stroke()
    
    const verticalGradient = ctx.createLinearGradient(px, yStart, px, yEnd)
    verticalGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`)
    verticalGradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.3})`)
    verticalGradient.addColorStop(0.45, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.7})`)
    verticalGradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${mIntensity})`)
    verticalGradient.addColorStop(0.55, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.7})`)
    verticalGradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.3})`)
    verticalGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
    ctx.strokeStyle = verticalGradient
    ctx.lineWidth = stripeWidth * 3
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(px, yStart)
    ctx.lineTo(px, yEnd)
    ctx.stroke()
    
    const radialGradient = ctx.createRadialGradient(px, yCenter, 0, px, yCenter, stripeHeight / 2)
    radialGradient.addColorStop(0, `rgba(${r + 50}, ${g + 50}, ${b + 50}, ${mIntensity})`)
    radialGradient.addColorStop(0.2, `rgba(${r + 20}, ${g + 20}, ${b + 20}, ${mIntensity * 0.9})`)
    radialGradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.6})`)
    radialGradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.2})`)
    radialGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
    ctx.fillStyle = radialGradient
    ctx.fillRect(px - stripeWidth * 1.5, yStart, stripeWidth * 3, stripeHeight)
    
    const coreGradient = ctx.createLinearGradient(px, yStart, px, yEnd)
    coreGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`)
    coreGradient.addColorStop(0.4, `rgba(${r + 30}, ${g + 30}, ${b + 30}, ${mIntensity * 0.6})`)
    coreGradient.addColorStop(0.48, `rgba(${r + 50}, ${g + 50}, ${b + 50}, ${mIntensity})`)
    coreGradient.addColorStop(0.5, `rgba(255, 255, 255, ${mIntensity})`)
    coreGradient.addColorStop(0.52, `rgba(${r + 50}, ${g + 50}, ${b + 50}, ${mIntensity})`)
    coreGradient.addColorStop(0.6, `rgba(${r + 30}, ${g + 30}, ${b + 30}, ${mIntensity * 0.6})`)
    coreGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
    ctx.strokeStyle = coreGradient
    ctx.lineWidth = stripeWidth * 1.2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(px, yStart)
    ctx.lineTo(px, yEnd)
    ctx.stroke()
    
    if (mIntensity > 0.6) {
      const brightCoreGradient = ctx.createLinearGradient(px, yStart, px, yEnd)
      brightCoreGradient.addColorStop(0, `rgba(255, 255, 255, 0)`)
      brightCoreGradient.addColorStop(0.45, `rgba(255, 255, 255, ${mIntensity * 0.5})`)
      brightCoreGradient.addColorStop(0.5, `rgba(255, 255, 255, ${mIntensity})`)
      brightCoreGradient.addColorStop(0.55, `rgba(255, 255, 255, ${mIntensity * 0.5})`)
      brightCoreGradient.addColorStop(1, `rgba(255, 255, 255, 0)`)
      ctx.strokeStyle = brightCoreGradient
      ctx.lineWidth = stripeWidth * 0.6
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(px, yStart)
      ctx.lineTo(px, yEnd)
      ctx.stroke()
    }
  }
  
  ctx.strokeStyle = '#374151'
  ctx.lineWidth = 0.5
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  ctx.moveTo(0, yCenter)
  ctx.lineTo(width, yCenter)
  ctx.stroke()
  
  ctx.strokeStyle = '#4b5563'
  ctx.lineWidth = 1
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(xCenter, 0)
  ctx.lineTo(xCenter, height)
  ctx.stroke()
  
  for (let m = -3; m <= 3; m++) {
    const pos = fringePosition(m, wavelength, props.params.frequency, props.params.concentration, props.params.distance) * 1000
    const px = xCenter + (pos / 15) * (width / 2)
    
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 0.5
    ctx.setLineDash([2, 2])
    ctx.beginPath()
    ctx.moveTo(px, 0)
    ctx.lineTo(px, height)
    ctx.stroke()
  }
  ctx.setLineDash([])
  
  if (focusComplete.value) {
    for (let m = -2; m <= 2; m++) {
      const pos = fringePosition(m, wavelength, props.params.frequency, props.params.concentration, props.params.distance) * 1000
      const px = xCenter + (pos / 15) * (width / 2)
      
      ctx.fillStyle = 'rgba(0,0,0,0.8)'
      ctx.fillRect(px - 25, yCenter + 10, 50, 20)
      
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 11px Microsoft YaHei'
      ctx.textAlign = 'center'
      ctx.fillText(`${m}级`, px, yCenter + 24)
    }
  } else {
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.fillRect(width / 2 - 80, height / 2 - 20, 160, 40)
    
    ctx.fillStyle = '#ef4444'
    ctx.font = 'bold 14px Microsoft YaHei'
    ctx.textAlign = 'center'
    ctx.fillText('对焦未完成 - 条纹模糊', width / 2, height / 2 + 8)
  }
  
  drawCursors(ctx, width, height)
}

const drawIntensityCurve = () => {
  const canvas = intensityCanvas.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height
  
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  ctx.setLineDash([3, 3])
  for (let i = 0; i <= 5; i++) {
    const y = height * 0.05 + (i / 5) * height * 0.9
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }
  for (let i = 0; i <= 6; i++) {
    const x = (i / 6) * width
    ctx.beginPath()
    ctx.moveTo(x, height * 0.05)
    ctx.lineTo(x, height * 0.95)
    ctx.stroke()
  }
  ctx.setLineDash([])
  
  ctx.strokeStyle = '#374151'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(0, height * 0.95)
  ctx.lineTo(width, height * 0.95)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(0, height * 0.95)
  ctx.lineTo(0, height * 0.05)
  ctx.stroke()
  
  const wavelength = props.params.wavelength * 1e-9
  const wavelengthNm = props.params.wavelength
  const spotColor = wavelengthToRgb(wavelengthNm)
  
  const xMin = -15 / 1000
  const xMax = 15 / 1000
  const xResolution = 500
  
  const dataPoints = []
  for (let i = 0; i <= xResolution; i++) {
    const x = xMin + (i / xResolution) * (xMax - xMin)
    let intensity = intensityDistribution(x, wavelength, props.params.frequency, props.params.concentration, props.params.distance, props.params.gratingWidth)
    
    if (!focusComplete.value) {
      const noise = (Math.random() - 0.5) * 0.16
      intensity = Math.max(0, Math.min(1, intensity + noise))
    }
    
    dataPoints.push({ x, y: intensity })
  }
  
  const scaleX = width / (xMax - xMin)
  const scaleY = height * 0.9
  
  ctx.strokeStyle = '#1e40af'
  ctx.lineWidth = 3
  ctx.beginPath()
  
  dataPoints.forEach((point, i) => {
    const px = (point.x - xMin) * scaleX
    const py = height - (point.y * scaleY + height * 0.05)
    
    if (i === 0) {
      ctx.moveTo(px, py)
    } else {
      ctx.lineTo(px, py)
    }
  })
  ctx.stroke()
  
  if (focusComplete.value) {
    ctx.fillStyle = `rgba(${Math.round(spotColor.r * 50)}, ${Math.round(spotColor.g * 50)}, ${Math.round(spotColor.b * 50)}, 0.3)`
    ctx.beginPath()
    ctx.moveTo(0, height * 0.95)
    
    dataPoints.forEach((point, i) => {
      const px = (point.x - xMin) * scaleX
      const py = height - (point.y * scaleY + height * 0.05)
      ctx.lineTo(px, py)
    })
    
    ctx.lineTo(width, height * 0.95)
    ctx.closePath()
    ctx.fill()
  }
  
  for (let m = -3; m <= 3; m++) {
    const pos = fringePosition(m, wavelength, props.params.frequency, props.params.concentration, props.params.distance)
    const px = (pos - xMin) * scaleX
    
    if (focusComplete.value) {
      if (m === 0) {
        ctx.strokeStyle = '#dc2626'
        ctx.lineWidth = 2
      } else {
        ctx.strokeStyle = '#1e40af'
        ctx.lineWidth = 1.5
        ctx.setLineDash([5, 3])
      }
      
      ctx.beginPath()
      ctx.moveTo(px, height * 0.05)
      ctx.lineTo(px, height * 0.95)
      ctx.stroke()
      ctx.setLineDash([])
    } else {
      ctx.strokeStyle = '#9ca3af'
      ctx.lineWidth = 1
      ctx.setLineDash([2, 2])
      ctx.beginPath()
      ctx.moveTo(px, height * 0.05)
      ctx.lineTo(px, height * 0.95)
      ctx.stroke()
    }
  }
  ctx.setLineDash([])
  
  ctx.fillStyle = '#6b7280'
  ctx.font = '10px Microsoft YaHei'
  ctx.textAlign = 'right'
  for (let i = 0; i <= 5; i++) {
    const y = height * 0.05 + (i / 5) * height * 0.9
    ctx.fillText((1 - i / 5).toFixed(1), width - 10, y + 4)
  }
  
  ctx.fillStyle = '#374151'
  ctx.font = '12px Microsoft YaHei'
  ctx.textAlign = 'center'
  ctx.fillText('位置 (mm)', width / 2, height - 5)
  
  ctx.save()
  ctx.translate(35, height / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.fillText('归一化光强', 0, 0)
  ctx.restore()
  
  ctx.fillStyle = '#1f2937'
  ctx.font = 'bold 13px Microsoft YaHei'
  ctx.textAlign = 'center'
  
  if (focusComplete.value) {
    ctx.fillText('衍射光强分布曲线', width / 2, 20)
  } else {
    ctx.fillStyle = '#dc2626'
    ctx.fillText('衍射光强分布曲线 (对焦未完成，曲线有毛刺)', width / 2, 20)
  }
  
  ctx.fillStyle = '#6b7280'
  ctx.font = '10px Microsoft YaHei'
  ctx.textAlign = 'center'
  const labelPositions = [-10, -5, 0, 5, 10]
  labelPositions.forEach(pos => {
    const px = ((pos / 1000 - xMin) / (xMax - xMin)) * width
    ctx.fillText(pos.toString(), px, height - 20)
  })
}

const drawFitChart = () => {
  const canvas = fitCanvas.value
  if (!canvas) return
  
  const ctx = canvas.getContext('2d')
  const width = canvas.width
  const height = canvas.height
  
  ctx.fillStyle = '#f3f4f6'
  ctx.fillRect(0, 0, width, height)
  
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(50, 30, width - 100, height - 80)
  
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  ctx.setLineDash([3, 3])
  for (let i = 0; i <= 5; i++) {
    const y = 40 + (i / 5) * (height - 90)
    ctx.beginPath()
    ctx.moveTo(50, y)
    ctx.lineTo(width - 50, y)
    ctx.stroke()
  }
  
  for (let i = 0; i <= 6; i++) {
    const x = 50 + (i / 6) * (width - 100)
    ctx.beginPath()
    ctx.moveTo(x, 40)
    ctx.lineTo(x, height - 50)
    ctx.stroke()
  }
  ctx.setLineDash([])
  
  ctx.strokeStyle = '#374151'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(50, height - 50)
  ctx.lineTo(width - 50, height - 50)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(50, height - 50)
  ctx.lineTo(50, 40)
  ctx.stroke()
  
  if (!props.records || props.records.length === 0) {
    ctx.fillStyle = '#9ca3af'
    ctx.font = '12px Microsoft YaHei'
    ctx.textAlign = 'center'
    ctx.fillText('请先测量数据，然后点击"执行拟合"按钮', width / 2, height / 2)
    return
  }
  
  let points, xLabel, yLabel, title, stats
  
  if (fitTab.value === 'frequency') {
    points = props.records.map(r => ({
      x: r.frequency,
      y: r.spacing
    })).filter(p => p.x > 0 && p.y > 0 && !isNaN(p.x) && !isNaN(p.y))
    xLabel = '超声频率 f (MHz)'
    yLabel = '条纹间距 D (mm)'
    title = '条纹间距 vs 超声频率'
  } else if (fitTab.value === 'wavelength') {
    points = props.records.map(r => ({
      x: r.wavelength,
      y: r.spacing
    })).filter(p => p.x > 0 && p.y > 0 && !isNaN(p.x) && !isNaN(p.y))
    xLabel = '光波长 λ (nm)'
    yLabel = '条纹间距 D (mm)'
    title = '条纹间距 vs 光波长'
  } else {
    points = props.records.map(r => ({
      x: r.concentration,
      y: r.speed
    })).filter(p => p.x >= 0 && p.y > 0 && !isNaN(p.x) && !isNaN(p.y) && p.y < 2000)
    xLabel = '液体浓度 (wt%)'
    yLabel = '声速 v (m/s)'
    title = '声速 vs 液体浓度'
  }
  
  if (points.length === 0) {
    ctx.fillStyle = '#9ca3af'
    ctx.font = '12px Microsoft YaHei'
    ctx.textAlign = 'center'
    ctx.fillText('有效数据不足', width / 2, height / 2)
    return
  }
  
  ctx.fillStyle = '#374151'
  ctx.font = 'bold 12px Microsoft YaHei'
  ctx.textAlign = 'center'
  ctx.fillText(xLabel, width / 2, height - 15)
  ctx.save()
  ctx.translate(25, height / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.fillText(yLabel, 0, 0)
  ctx.restore()
  
  const xMin = Math.min(...points.map(p => p.x)) * 0.95
  const xMax = Math.max(...points.map(p => p.x)) * 1.05
  
  let yMin, yMax
  
  if (fitTab.value === 'frequency' || fitTab.value === 'wavelength') {
    const yRange = Math.max(...points.map(p => p.y)) - Math.min(...points.map(p => p.y))
    const avgY = (Math.max(...points.map(p => p.y)) + Math.min(...points.map(p => p.y))) / 2
    const padding = yRange * 0.5
    yMin = avgY - padding
    yMax = avgY + padding
    if (yMin < 0) yMin = 0
  } else {
    yMin = Math.min(...points.map(p => p.y)) - 20
    yMax = Math.max(...points.map(p => p.y)) + 20
    if (yMin < 1400) yMin = 1400
    if (yMax > 1800) yMax = 1800
  }
  
  const scaleX = (width - 100) / (xMax - xMin)
  const scaleY = (height - 90) / (yMax - yMin)
  
  ctx.fillStyle = '#9ca3af'
  ctx.font = '10px Microsoft YaHei'
  ctx.textAlign = 'right'
  for (let i = 0; i <= 5; i++) {
    const y = 40 + (i / 5) * (height - 90)
    const val = yMax - (i / 5) * (yMax - yMin)
    if (fitTab.value === 'concentration') {
      ctx.fillText(val.toFixed(0), 45, y + 3)
    } else {
      ctx.fillText(val.toFixed(2), 45, y + 3)
    }
  }
  
  ctx.fillStyle = '#9ca3af'
  ctx.font = '10px Microsoft YaHei'
  ctx.textAlign = 'center'
  for (let i = 0; i <= 6; i++) {
    const x = 50 + (i / 6) * (width - 100)
    const val = xMin + (i / 6) * (xMax - xMin)
    if (fitTab.value === 'wavelength') {
      ctx.fillText(val.toFixed(0), x, height - 30)
    } else if (fitTab.value === 'concentration') {
      ctx.fillText(val.toFixed(2), x, height - 30)
    } else {
      ctx.fillText(val.toFixed(1), x, height - 30)
    }
  }
  
  const colors = {
    frequency: { fill: '#3b82f6', stroke: '#1d4ed8' },
    wavelength: { fill: '#a855f7', stroke: '#7c3aed' },
    concentration: { fill: '#22c55e', stroke: '#16a34a' }
  }
  
  const color = colors[fitTab.value] || colors.frequency
  
  ctx.fillStyle = color.fill
  ctx.strokeStyle = color.stroke
  ctx.lineWidth = 2
  points.forEach(p => {
    const px = 50 + (p.x - xMin) * scaleX
    const py = height - 50 - (p.y - yMin) * scaleY
    ctx.beginPath()
    ctx.arc(px, py, 6, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  })
  
  if (points.length >= 2) {
    const sumX = points.reduce((acc, p) => acc + p.x, 0)
    const sumY = points.reduce((acc, p) => acc + p.y, 0)
    const sumXY = points.reduce((acc, p) => acc + p.x * p.y, 0)
    const sumX2 = points.reduce((acc, p) => acc + p.x * p.x, 0)
    const n = points.length
    
    const denom = n * sumX2 - sumX * sumX
    if (Math.abs(denom) > 1e-10) {
      const slope = (n * sumXY - sumX * sumY) / denom
      const intercept = (sumY - slope * sumX) / n
      
      ctx.strokeStyle = color.stroke
      ctx.lineWidth = 2
      ctx.setLineDash([5, 3])
      ctx.beginPath()
      ctx.moveTo(50, height - 50 - ((intercept + slope * xMin - yMin)) * scaleY)
      ctx.lineTo(width - 50, height - 50 - ((intercept + slope * xMax - yMin)) * scaleY)
      ctx.stroke()
      ctx.setLineDash([])
      
      stats = { slope, intercept, n }
    }
  }
  
  ctx.fillStyle = '#374151'
  ctx.font = '11px Microsoft YaHei'
  ctx.textAlign = 'left'
  
  if (fitTab.value === 'frequency') {
    ctx.fillText(`实验公式: D = (2kλL/v) × f`, 60, 25)
    ctx.fillText(`固定: 波长=${props.params.wavelength}nm, 浓度=${props.params.concentration}wt%`, 60, 42)
  } else if (fitTab.value === 'wavelength') {
    ctx.fillText(`实验公式: D = (2kfL/v) × λ`, 60, 25)
    ctx.fillText(`固定: 频率=${props.params.frequency}MHz, 浓度=${props.params.concentration}wt%`, 60, 42)
  } else {
    ctx.fillText(`实验公式: v = 2kλfL / D`, 60, 25)
    ctx.fillText(`固定: 波长=${props.params.wavelength}nm, 频率=${props.params.frequency}MHz`, 60, 42)
  }
  
  const n = points.length
  ctx.fillText(`数据点数: ${n}`, 60, 59)
  
  if (fitTab.value === 'concentration') {
    const avgSpeed = avgY
    const speeds = points.map(p => p.y)
    const minSpeed = Math.min(...speeds)
    const maxSpeed = Math.max(...speeds)
    const stdDev = Math.sqrt(speeds.reduce((acc, v) => acc + Math.pow(v - avgSpeed, 2), 0) / points.length)
    ctx.fillText(`平均声速: ${avgSpeed.toFixed(2)} m/s`, 60, 76)
    ctx.fillText(`声速范围: ${minSpeed.toFixed(1)} ~ ${maxSpeed.toFixed(1)} m/s`, 60, 93)
    ctx.fillText(`标准差: ±${stdDev.toFixed(2)} m/s`, 60, 110)
  }
  
  if (stats) {
    if (fitTab.value === 'frequency') {
      ctx.fillText(`拟合直线: D = ${stats.slope.toFixed(4)} × f`, 60, 76)
      const calcV = (2 * props.params.wavelength * props.params.distance) / stats.slope
      ctx.fillText(`计算声速: v = ${calcV.toFixed(2)} m/s`, 60, 93)
    } else if (fitTab.value === 'wavelength') {
      ctx.fillText(`拟合直线: D = ${stats.slope.toFixed(6)} × λ`, 60, 76)
      const calcV = (2 * props.params.frequency * props.params.distance) / stats.slope
      ctx.fillText(`计算声速: v = ${calcV.toFixed(2)} m/s`, 60, 93)
    } else {
      ctx.fillText(`拟合直线: v = ${stats.slope.toFixed(2)} × c + ${stats.intercept.toFixed(1)}`, 60, 110)
    }
  }
}

const performFit = () => {
  drawFitChart()
}

const performAnalysis = () => {
  const mode = analysisTab.value
  const records = (props.records || []).filter(r => r.experimentMode === mode)
  
  if (records.length < 3) {
    showNotification(`请至少测量3组"${getModeLabel(mode)}"数据后再进行分析`, 'warning')
    return
  }
  
  let analysisResultData
  
  if (mode === 'wavelength' || mode === 'frequency') {
    const speeds = records.map(r => r.speed)
    const sumSpeed = speeds.reduce((acc, v) => acc + v, 0)
    const experimentalSpeed = sumSpeed / speeds.length
    
    const theoreticalSpeed = getSoundSpeed(props.params.liquidTypeId || 'nacl', props.params.concentration, props.params.temperature)
    const relativeError = ((experimentalSpeed - theoreticalSpeed) / theoreticalSpeed) * 100
    
    const variance = speeds.reduce((acc, v) => acc + Math.pow(v - experimentalSpeed, 2), 0) / speeds.length
    const stdDev = Math.sqrt(variance)
    const cv = (stdDev / experimentalSpeed) * 100
    
    const sortedSpeeds = [...speeds].sort((a, b) => a - b)
    const median = sortedSpeeds[Math.floor(sortedSpeeds.length / 2)]
    const range = sortedSpeeds[sortedSpeeds.length - 1] - sortedSpeeds[0]
    
    const q1 = sortedSpeeds[Math.floor(sortedSpeeds.length * 0.25)]
    const q3 = sortedSpeeds[Math.floor(sortedSpeeds.length * 0.75)]
    const iqr = q3 - q1
    
    const outlierCount = speeds.filter(v => Math.abs(v - experimentalSpeed) > 3 * stdDev).length
    const normalRangeLower = experimentalSpeed - 2 * stdDev
    const normalRangeUpper = experimentalSpeed + 2 * stdDev
    
    let consistency, suggestion, validationPass
    
    if (stdDev < 3) {
      consistency = '优秀'
    } else if (stdDev < 6) {
      consistency = '良好'
    } else if (stdDev < 10) {
      consistency = '一般'
    } else {
      consistency = '较差'
    }
    
    if (Math.abs(relativeError) < 2) {
      validationPass = true
      suggestion = '实验结果非常准确！声速恒定，与理论值高度吻合。'
    } else if (Math.abs(relativeError) < 5) {
      validationPass = true
      suggestion = '实验结果基本符合理论预期，声速恒定，误差在可接受范围内。'
    } else if (Math.abs(relativeError) < 10) {
      validationPass = false
      suggestion = '实验结果与理论有一定偏差，建议检查仪器对焦或重新测量。'
    } else {
      validationPass = false
      suggestion = '实验结果与理论偏差较大，请检查实验设置或重新进行实验。'
    }
    
    analysisResultData = {
      mode: mode === 'wavelength' ? '🌈 光波长影响' : '📡 超声频率影响',
      analysisType: 'constantSpeed',
      experimentalSpeed,
      theoreticalSpeed,
      relativeError,
      dataPoints: records.length,
      stdDev,
      cv,
      median,
      range,
      iqr,
      consistency,
      validationPass,
      suggestion,
      outlierCount,
      normalRangeLower,
      normalRangeUpper,
      fitSlope: null,
      fitIntercept: null,
      slopeError: null,
      interceptError: null
    }
  } else {
    const concentrations = records.map(r => r.concentration || 0)
    const speeds = records.map(r => r.speed)
    
    const n = records.length
    const sumX = concentrations.reduce((acc, v) => acc + v, 0)
    const sumY = speeds.reduce((acc, v) => acc + v, 0)
    const sumXY = concentrations.reduce((acc, v, i) => acc + v * speeds[i], 0)
    const sumX2 = concentrations.reduce((acc, v) => acc + v * v, 0)
    
    const denom = n * sumX2 - sumX * sumX
    let slope, intercept
    
    if (Math.abs(denom) > 1e-10) {
      slope = (n * sumXY - sumX * sumY) / denom
      intercept = (sumY - slope * sumX) / n
    } else {
      slope = 0
      intercept = sumY / n
    }
    
    const liquidType = props.params.liquidTypeId || 'nacl'
    const config = liquidConfigs[liquidType]
    
    let theoreticalSlope, theoreticalIntercept
    
    if (config.tableData) {
      const tableConcentrations = config.tableData.map(d => d.wt)
      const tableSpeeds = config.tableData.map(d => d.speed)
      const tn = tableConcentrations.length
      const tSumX = tableConcentrations.reduce((acc, v) => acc + v, 0)
      const tSumY = tableSpeeds.reduce((acc, v) => acc + v, 0)
      const tSumXY = tableConcentrations.reduce((acc, v, i) => acc + v * tableSpeeds[i], 0)
      const tSumX2 = tableConcentrations.reduce((acc, v) => acc + v * v, 0)
      const tDenom = tn * tSumX2 - tSumX * tSumX
      theoreticalSlope = tDenom > 1e-10 ? (tn * tSumXY - tSumX * tSumY) / tDenom : 0
      theoreticalIntercept = tDenom > 1e-10 ? (tSumY - theoreticalSlope * tSumX) / tn : tSumY / tn
    } else {
      theoreticalSlope = config.speedFactor
      theoreticalIntercept = config.baseSpeed
    }
    
    const slopeError = Math.abs(theoreticalSlope) > 1e-10 ? ((slope - theoreticalSlope) / theoreticalSlope) * 100 : 0
    const interceptError = Math.abs(theoreticalIntercept) > 1e-10 ? ((intercept - theoreticalIntercept) / theoreticalIntercept) * 100 : 0
    
    const predictedSpeeds = concentrations.map(c => slope * c + intercept)
    const residuals = speeds.map((v, i) => v - predictedSpeeds[i])
    const rss = residuals.reduce((acc, v) => acc + v * v, 0)
    const stdDev = Math.sqrt(rss / n)
    
    const avgSpeed = sumY / n
    const cv = (stdDev / avgSpeed) * 100
    
    const sortedSpeeds = [...speeds].sort((a, b) => a - b)
    const median = sortedSpeeds[Math.floor(sortedSpeeds.length / 2)]
    const range = sortedSpeeds[sortedSpeeds.length - 1] - sortedSpeeds[0]
    
    const q1 = sortedSpeeds[Math.floor(sortedSpeeds.length * 0.25)]
    const q3 = sortedSpeeds[Math.floor(sortedSpeeds.length * 0.75)]
    const iqr = q3 - q1
    
    const outlierCount = residuals.filter(v => Math.abs(v) > 3 * stdDev).length
    const normalRangeLower = avgSpeed - 2 * stdDev
    const normalRangeUpper = avgSpeed + 2 * stdDev
    
    let consistency, suggestion, validationPass
    
    const slopeOk = Math.abs(slopeError) < 10
    const interceptOk = Math.abs(interceptError) < 2
    
    if (slopeOk && interceptOk) {
      consistency = '优秀'
      validationPass = true
      suggestion = `拟合直线与实测数据表高度吻合！`
    } else if (slopeOk || interceptOk) {
      consistency = '良好'
      validationPass = true
      suggestion = '拟合结果基本符合理论预期，建议增加测量次数提高精度。'
    } else {
      consistency = '较差'
      validationPass = false
      suggestion = '拟合结果与理论偏差较大，请检查实验设置或重新进行实验。'
    }
    
    const avgRelativeError = ((slopeError + interceptError) / 2)
    
    analysisResultData = {
      mode: '📊 液体浓度影响',
      analysisType: 'linearFit',
      experimentalSpeed: avgSpeed,
      theoreticalSpeed: theoreticalIntercept + slope * props.params.concentration,
      relativeError: avgRelativeError,
      dataPoints: records.length,
      stdDev,
      cv,
      median,
      range,
      iqr,
      consistency,
      validationPass,
      suggestion,
      outlierCount,
      normalRangeLower,
      normalRangeUpper,
      fitSlope: slope,
      fitIntercept: intercept,
      slopeError,
      interceptError,
      theoreticalSlope,
      theoreticalIntercept
    }
  }
  
  analysisResult.value = analysisResultData
}

const handleCanvasClick = (event) => {
}

const clearMarkers = () => {
}

const autoIdentify = () => {
}

const inputMeasurement = () => {
}

const autoRead = () => {
  const wavelength = localParams.wavelength * 1e-9
  const plus1Pos = fringePosition(1, wavelength, localParams.frequency, localParams.concentration, localParams.distance) * 1000
  const minus1Pos = fringePosition(-1, wavelength, localParams.frequency, localParams.concentration, localParams.distance) * 1000
  
  const error1 = (Math.random() - 0.5) * 0.008
  const error2 = (Math.random() - 0.5) * 0.008
  
  plus1Position.value = (plus1Pos + error1).toFixed(4)
  minus1Position.value = (minus1Pos + error2).toFixed(4)
  
  showNotification('游标自动读数完成', 'success')
}

const calculateSpacing = () => {
  if (!plus1Position.value || !minus1Position.value) {
    showNotification('请先放置游标位置', 'warning')
    return
  }
  
  const plus1 = parseFloat(plus1Position.value)
  const minus1 = parseFloat(minus1Position.value)
  
  const spacingValue = Math.abs(plus1 - minus1)
  spacing.value = parseFloat(spacingValue.toFixed(4))
  
  showNotification('间距计算完成', 'success')
}

const showNotification = (msg, type = 'info') => {
  message.value = msg
  messageType.value = type
  showMessage.value = true
  setTimeout(() => { showMessage.value = false }, 2000)
}

const zoomDiffraction = () => {
  zoomTitle.value = '超声光栅衍射光斑图样'
  zoomDrawFn.value = drawDiffractionPatternZoom
  zoomWidth.value = 900
  zoomHeight.value = 600
  showZoomModal.value = true
}

const zoomIntensity = () => {
  zoomTitle.value = '衍射光强分布曲线'
  zoomDrawFn.value = drawIntensityCurveZoom
  zoomWidth.value = 900
  zoomHeight.value = 600
  showZoomModal.value = true
}

const zoomFit = (event) => {
  if (event) {
    event.stopPropagation()
    event.preventDefault()
  }
  zoomTitle.value = '数据拟合曲线'
  zoomDrawFn.value = drawFitChartZoom
  zoomWidth.value = 900
  zoomHeight.value = 600
  showZoomModal.value = true
}

const closeZoomModal = () => {
  showZoomModal.value = false
}

const drawDiffractionPatternZoom = (ctx, width, height) => {
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, width, height)
  
  const wavelength = props.params.wavelength * 1e-9
  const wavelengthNm = props.params.wavelength
  const spotColor = wavelengthToRgb(wavelengthNm)
  
  const yCenter = height / 2
  const xCenter = width / 2
  
  const xMin = -15 / 1000
  const xMax = 15 / 1000
  
  const stripeHeight = height * 0.85
  const stripeWidth = focusComplete.value ? 3 : 8
  
  for (let m = -5; m <= 5; m++) {
    const xM = fringePosition(m, wavelength, props.params.frequency, props.params.concentration, props.params.distance)
    
    let mIntensity
    if (m === 0) {
      mIntensity = 1.0
    } else {
      mIntensity = Math.max(0.05, Math.pow(0.6, Math.abs(m)))
    }
    
    const px = xCenter + (xM / (xMax - xMin)) * width
    
    const r = Math.round(spotColor.r * 255)
    const g = Math.round(spotColor.g * 255)
    const b = Math.round(spotColor.b * 255)
    
    const yStart = yCenter - stripeHeight / 2
    const yEnd = yCenter + stripeHeight / 2
    
    const outerGlowGradient = ctx.createLinearGradient(px - stripeWidth * 6, yStart, px + stripeWidth * 6, yStart)
    outerGlowGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`)
    outerGlowGradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.15})`)
    outerGlowGradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.3})`)
    outerGlowGradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.15})`)
    outerGlowGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
    ctx.strokeStyle = outerGlowGradient
    ctx.lineWidth = stripeWidth * 10
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(px, yStart)
    ctx.lineTo(px, yEnd)
    ctx.stroke()
    
    const middleGlowGradient = ctx.createLinearGradient(px - stripeWidth * 3, yStart, px + stripeWidth * 3, yStart)
    middleGlowGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0)`)
    middleGlowGradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.4})`)
    middleGlowGradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.6})`)
    middleGlowGradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.4})`)
    middleGlowGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
    ctx.strokeStyle = middleGlowGradient
    ctx.lineWidth = stripeWidth * 5
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(px, yStart)
    ctx.lineTo(px, yEnd)
    ctx.stroke()
    
    const verticalGradient = ctx.createLinearGradient(px, yStart, px, yEnd)
    verticalGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.1})`)
    verticalGradient.addColorStop(0.2, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.4})`)
    verticalGradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.8})`)
    verticalGradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${mIntensity})`)
    verticalGradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.8})`)
    verticalGradient.addColorStop(0.8, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.4})`)
    verticalGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.1})`)
    ctx.strokeStyle = verticalGradient
    ctx.lineWidth = stripeWidth * 3
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(px, yStart)
    ctx.lineTo(px, yEnd)
    ctx.stroke()
    
    const radialGradient = ctx.createRadialGradient(px, yCenter, 0, px, yCenter, stripeHeight / 2)
    radialGradient.addColorStop(0, `rgba(${r + 30}, ${g + 30}, ${b + 30}, ${mIntensity})`)
    radialGradient.addColorStop(0.3, `rgba(${r + 15}, ${g + 15}, ${b + 15}, ${mIntensity * 0.8})`)
    radialGradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.5})`)
    radialGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
    ctx.fillStyle = radialGradient
    ctx.fillRect(px - stripeWidth, yStart, stripeWidth * 2, stripeHeight)
    
    const coreGradient = ctx.createLinearGradient(px, yStart, px, yEnd)
    coreGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.3})`)
    coreGradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.7})`)
    coreGradient.addColorStop(0.45, `rgba(${r + 20}, ${g + 20}, ${b + 20}, ${mIntensity})`)
    coreGradient.addColorStop(0.5, `rgba(255, 255, 255, ${mIntensity})`)
    coreGradient.addColorStop(0.55, `rgba(${r + 20}, ${g + 20}, ${b + 20}, ${mIntensity})`)
    coreGradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.7})`)
    coreGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${mIntensity * 0.3})`)
    ctx.strokeStyle = coreGradient
    ctx.lineWidth = stripeWidth
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(px, yStart)
    ctx.lineTo(px, yEnd)
    ctx.stroke()
    
    if (mIntensity > 0.6) {
      const brightCoreGradient = ctx.createLinearGradient(px, yStart, px, yEnd)
      brightCoreGradient.addColorStop(0, `rgba(255, 255, 255, 0)`)
      brightCoreGradient.addColorStop(0.45, `rgba(255, 255, 255, ${mIntensity * 0.5})`)
      brightCoreGradient.addColorStop(0.5, `rgba(255, 255, 255, ${mIntensity * 0.7})`)
      brightCoreGradient.addColorStop(0.55, `rgba(255, 255, 255, ${mIntensity * 0.4})`)
      brightCoreGradient.addColorStop(1, `rgba(255, 255, 255, 0)`)
      ctx.strokeStyle = brightCoreGradient
      ctx.lineWidth = stripeWidth * 0.6
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(px, yStart)
      ctx.lineTo(px, yEnd)
      ctx.stroke()
    }
  }
  
  ctx.strokeStyle = '#374151'
  ctx.lineWidth = 1
  ctx.setLineDash([5, 5])
  ctx.beginPath()
  ctx.moveTo(0, yCenter)
  ctx.lineTo(width, yCenter)
  ctx.stroke()
  
  ctx.strokeStyle = '#4b5563'
  ctx.lineWidth = 2
  ctx.setLineDash([])
  ctx.beginPath()
  ctx.moveTo(xCenter, 0)
  ctx.lineTo(xCenter, height)
  ctx.stroke()
  
  for (let m = -3; m <= 3; m++) {
    const pos = fringePosition(m, wavelength, props.params.frequency, props.params.concentration, props.params.distance) * 1000
    const px = xCenter + (pos / 15) * (width / 2)
    
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(px, 0)
    ctx.lineTo(px, height)
    ctx.stroke()
  }
  ctx.setLineDash([])
  
  if (focusComplete.value) {
    for (let m = -2; m <= 2; m++) {
      const pos = fringePosition(m, wavelength, props.params.frequency, props.params.concentration, props.params.distance) * 1000
      const px = xCenter + (pos / 15) * (width / 2)
      
      ctx.fillStyle = 'rgba(0,0,0,0.8)'
      ctx.fillRect(px - 35, yCenter + 15, 70, 28)
      
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px Microsoft YaHei'
      ctx.textAlign = 'center'
      ctx.fillText(`${m}级`, px, yCenter + 34)
    }
    
    drawCursorsZoom(ctx, width, height)
  }
}

const drawIntensityCurveZoom = (ctx, width, height) => {
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(0, 0, width, height)
  
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(40, 40, width - 80, height - 100)
  
  ctx.shadowColor = 'rgba(0,0,0,0.05)'
  ctx.shadowBlur = 10
  ctx.shadowOffsetY = 5
  
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  for (let i = 0; i <= 5; i++) {
    const y = height * 0.08 + (i / 5) * height * 0.84
    ctx.beginPath()
    ctx.moveTo(40, y)
    ctx.lineTo(width - 40, y)
    ctx.stroke()
  }
  for (let i = 0; i <= 6; i++) {
    const x = 40 + (i / 6) * (width - 80)
    ctx.beginPath()
    ctx.moveTo(x, height * 0.08)
    ctx.lineTo(x, height * 0.92)
    ctx.stroke()
  }
  ctx.setLineDash([])
  
  ctx.shadowColor = 'rgba(59, 130, 246, 0.3)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 0
  
  ctx.strokeStyle = '#1e40af'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(40, height * 0.92)
  ctx.lineTo(width - 40, height * 0.92)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(40, height * 0.92)
  ctx.lineTo(40, height * 0.08)
  ctx.stroke()
  
  ctx.shadowColor = 'transparent'
  
  const wavelength = props.params.wavelength * 1e-9
  const wavelengthNm = props.params.wavelength
  const spotColor = wavelengthToRgb(wavelengthNm)
  
  const xMin = -15 / 1000
  const xMax = 15 / 1000
  const xResolution = 800
  
  const dataPoints = []
  for (let i = 0; i <= xResolution; i++) {
    const x = xMin + (i / xResolution) * (xMax - xMin)
    let intensity = intensityDistribution(x, wavelength, props.params.frequency, props.params.concentration, props.params.distance, props.params.gratingWidth)
    
    if (!focusComplete.value) {
      const noise = (Math.random() - 0.5) * 0.16
      intensity = Math.max(0, Math.min(1, intensity + noise))
    }
    
    dataPoints.push({ x, y: intensity })
  }
  
  const scaleX = (width - 80) / (xMax - xMin)
  const scaleY = height * 0.84
  
  const r = Math.round(spotColor.r * 255)
  const g = Math.round(spotColor.g * 255)
  const b = Math.round(spotColor.b * 255)
  
  const fillGradient = ctx.createLinearGradient(0, height * 0.08, 0, height * 0.92)
  fillGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.2)`)
  fillGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
  
  ctx.fillStyle = fillGradient
  ctx.beginPath()
  ctx.moveTo(40, height * 0.92)
  
  dataPoints.forEach((point, i) => {
    const px = 40 + (point.x - xMin) * scaleX
    const py = height - (point.y * scaleY + height * 0.08)
    ctx.lineTo(px, py)
  })
  
  ctx.lineTo(width - 40, height * 0.92)
  ctx.closePath()
  ctx.fill()
  
  ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  
  dataPoints.forEach((point, i) => {
    const px = 40 + (point.x - xMin) * scaleX
    const py = height - (point.y * scaleY + height * 0.08)
    
    if (i === 0) {
      ctx.moveTo(px, py)
    } else {
      ctx.lineTo(px, py)
    }
  })
  ctx.stroke()
  
  for (let m = -3; m <= 3; m++) {
    const pos = fringePosition(m, wavelength, props.params.frequency, props.params.concentration, props.params.distance)
    const px = 40 + (pos - xMin) * scaleX
    
    if (focusComplete.value) {
      ctx.strokeStyle = m === 0 ? '#dc2626' : '#1e40af'
      ctx.lineWidth = m === 0 ? 2 : 1.5
      ctx.setLineDash(m === 0 ? [] : [6, 4])
      
      ctx.beginPath()
      ctx.moveTo(px, height * 0.08)
      ctx.lineTo(px, height * 0.92)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }
  
  ctx.fillStyle = '#64748b'
  ctx.font = '11px Microsoft YaHei'
  ctx.textAlign = 'right'
  for (let i = 0; i <= 5; i++) {
    const y = height * 0.08 + (i / 5) * height * 0.84
    ctx.fillText((1 - i / 5).toFixed(1), 35, y + 4)
  }
  
  ctx.fillStyle = '#334155'
  ctx.font = 'bold 14px Microsoft YaHei'
  ctx.textAlign = 'center'
  ctx.fillText('位置 (mm)', width / 2, height - 25)
  
  ctx.save()
  ctx.translate(30, height / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.fillText('归一化光强', 0, 0)
  ctx.restore()
  
  ctx.fillStyle = '#1e293b'
  ctx.font = 'bold 16px Microsoft YaHei'
  ctx.textAlign = 'center'
  
  if (focusComplete.value) {
    ctx.fillText('衍射光强分布曲线', width / 2, 25)
  } else {
    ctx.fillStyle = '#dc2626'
    ctx.fillText('衍射光强分布曲线 (对焦未完成)', width / 2, 25)
  }
  
  ctx.fillStyle = '#64748b'
  ctx.font = '12px Microsoft YaHei'
  ctx.textAlign = 'center'
  const labelPositions = [-10, -5, 0, 5, 10]
  labelPositions.forEach(pos => {
    const px = 40 + ((pos / 1000 - xMin) / (xMax - xMin)) * (width - 80)
    ctx.fillText(pos.toString(), px, height - 40)
  })
}

const drawFitChartZoom = (ctx, width, height) => {
  ctx.fillStyle = '#f8fafc'
  ctx.fillRect(0, 0, width, height)
  
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(60, 40, width - 120, height - 100)
  
  ctx.shadowColor = 'rgba(0,0,0,0.05)'
  ctx.shadowBlur = 10
  ctx.shadowOffsetY = 5
  
  ctx.strokeStyle = '#e2e8f0'
  ctx.lineWidth = 1
  ctx.setLineDash([4, 4])
  for (let i = 0; i <= 5; i++) {
    const y = 50 + (i / 5) * (height - 110)
    ctx.beginPath()
    ctx.moveTo(60, y)
    ctx.lineTo(width - 60, y)
    ctx.stroke()
  }
  
  for (let i = 0; i <= 6; i++) {
    const x = 60 + (i / 6) * (width - 120)
    ctx.beginPath()
    ctx.moveTo(x, 50)
    ctx.lineTo(x, height - 60)
    ctx.stroke()
  }
  ctx.setLineDash([])
  
  ctx.shadowColor = 'rgba(59, 130, 246, 0.3)'
  ctx.shadowBlur = 8
  
  ctx.strokeStyle = '#334155'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(60, height - 60)
  ctx.lineTo(width - 60, height - 60)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(60, height - 60)
  ctx.lineTo(60, 50)
  ctx.stroke()
  
  ctx.shadowColor = 'transparent'
  
  if (!props.records || props.records.length === 0) {
    ctx.fillStyle = '#94a3b8'
    ctx.font = '14px Microsoft YaHei'
    ctx.textAlign = 'center'
    ctx.fillText('请先测量数据，然后点击"执行拟合"按钮', width / 2, height / 2)
    return
  }
  
  let points, xLabel, yLabel, stats
  
  if (fitTab.value === 'frequency') {
    points = props.records.map(r => ({
      x: r.frequency,
      y: r.spacing
    })).filter(p => p.x > 0 && p.y > 0 && !isNaN(p.x) && !isNaN(p.y))
    xLabel = '超声频率 f (MHz)'
    yLabel = '条纹间距 D (mm)'
  } else if (fitTab.value === 'wavelength') {
    points = props.records.map(r => ({
      x: r.wavelength,
      y: r.spacing
    })).filter(p => p.x > 0 && p.y > 0 && !isNaN(p.x) && !isNaN(p.y))
    xLabel = '光波长 λ (nm)'
    yLabel = '条纹间距 D (mm)'
  } else {
    points = props.records.map(r => ({
      x: r.concentration,
      y: r.speed
    })).filter(p => p.x >= 0 && p.y > 0 && !isNaN(p.x) && !isNaN(p.y) && p.y < 2000)
    xLabel = '液体浓度 (wt%)'
    yLabel = '声速 v (m/s)'
  }
  
  if (points.length === 0) {
    ctx.fillStyle = '#94a3b8'
    ctx.font = '14px Microsoft YaHei'
    ctx.textAlign = 'center'
    ctx.fillText('有效数据不足', width / 2, height / 2)
    return
  }
  
  ctx.fillStyle = '#334155'
  ctx.font = 'bold 14px Microsoft YaHei'
  ctx.textAlign = 'center'
  ctx.fillText(xLabel, width / 2, height - 20)
  ctx.save()
  ctx.translate(30, height / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.fillText(yLabel, 0, 0)
  ctx.restore()
  
  const xMin = Math.min(...points.map(p => p.x)) * 0.95
  const xMax = Math.max(...points.map(p => p.x)) * 1.05
  
  let yMin, yMax
  
  if (fitTab.value === 'frequency' || fitTab.value === 'wavelength') {
    const yRange = Math.max(...points.map(p => p.y)) - Math.min(...points.map(p => p.y))
    const avgY = (Math.max(...points.map(p => p.y)) + Math.min(...points.map(p => p.y))) / 2
    const padding = yRange * 0.5
    yMin = avgY - padding
    yMax = avgY + padding
    if (yMin < 0) yMin = 0
  } else {
    yMin = Math.min(...points.map(p => p.y)) - 20
    yMax = Math.max(...points.map(p => p.y)) + 20
    if (yMin < 1400) yMin = 1400
    if (yMax > 1800) yMax = 1800
  }
  
  const scaleX = (width - 120) / (xMax - xMin)
  const scaleY = (height - 110) / (yMax - yMin)
  
  ctx.fillStyle = '#94a3b8'
  ctx.font = '11px Microsoft YaHei'
  ctx.textAlign = 'right'
  for (let i = 0; i <= 5; i++) {
    const y = 50 + (i / 5) * (height - 110)
    const val = yMax - (i / 5) * (yMax - yMin)
    if (fitTab.value === 'concentration') {
      ctx.fillText(val.toFixed(0), 55, y + 3)
    } else {
      ctx.fillText(val.toFixed(2), 55, y + 3)
    }
  }
  
  ctx.fillStyle = '#94a3b8'
  ctx.font = '11px Microsoft YaHei'
  ctx.textAlign = 'center'
  for (let i = 0; i <= 6; i++) {
    const x = 60 + (i / 6) * (width - 120)
    const val = xMin + (i / 6) * (xMax - xMin)
    if (fitTab.value === 'wavelength') {
      ctx.fillText(val.toFixed(0), x, height - 35)
    } else if (fitTab.value === 'concentration') {
      ctx.fillText(val.toFixed(2), x, height - 35)
    } else {
      ctx.fillText(val.toFixed(1), x, height - 35)
    }
  }
  
  const colors = {
    frequency: { fill: '#3b82f6', stroke: '#1d4ed8' },
    wavelength: { fill: '#a855f7', stroke: '#7c3aed' },
    concentration: { fill: '#22c55e', stroke: '#16a34a' }
  }
  
  const color = colors[fitTab.value] || colors.frequency
  
  ctx.fillStyle = color.fill
  ctx.strokeStyle = color.stroke
  ctx.lineWidth = 2
  ctx.shadowColor = `${color.stroke}40`
  ctx.shadowBlur = 6
  points.forEach(p => {
    const px = 60 + (p.x - xMin) * scaleX
    const py = height - 60 - (p.y - yMin) * scaleY
    ctx.beginPath()
    ctx.arc(px, py, 8, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  })
  ctx.shadowColor = 'transparent'
  
  if (points.length >= 2) {
    const sumX = points.reduce((acc, p) => acc + p.x, 0)
    const sumY = points.reduce((acc, p) => acc + p.y, 0)
    const sumXY = points.reduce((acc, p) => acc + p.x * p.y, 0)
    const sumX2 = points.reduce((acc, p) => acc + p.x * p.x, 0)
    const n = points.length
    
    const denom = n * sumX2 - sumX * sumX
    let slope, intercept
    if (Math.abs(denom) > 1e-10) {
      slope = (n * sumXY - sumX * sumY) / denom
      intercept = (sumY - slope * sumX) / n
      
      ctx.strokeStyle = color.stroke
      ctx.lineWidth = 2
      ctx.setLineDash([5, 3])
      ctx.beginPath()
      ctx.moveTo(60, height - 60 - ((intercept + slope * xMin - yMin)) * scaleY)
      ctx.lineTo(width - 60, height - 60 - ((intercept + slope * xMax - yMin)) * scaleY)
      ctx.stroke()
      ctx.setLineDash([])
      
      stats = { slope, intercept, n }
    }
  }
  
  ctx.fillStyle = '#334155'
  ctx.font = 'bold 13px Microsoft YaHei'
  ctx.textAlign = 'left'
  
  if (fitTab.value === 'frequency') {
    ctx.fillText(`实验公式: D = (2kλL/v) × f`, 70, 25)
    ctx.fillText(`固定: 波长=${props.params.wavelength}nm, 浓度=${props.params.concentration}wt%`, 70, 48)
  } else if (fitTab.value === 'wavelength') {
    ctx.fillText(`实验公式: D = (2kfL/v) × λ`, 70, 25)
    ctx.fillText(`固定: 频率=${props.params.frequency}MHz, 浓度=${props.params.concentration}wt%`, 70, 48)
  } else {
    ctx.fillText(`实验公式: v = 2kλfL / D`, 70, 25)
    ctx.fillText(`固定: 波长=${props.params.wavelength}nm, 频率=${props.params.frequency}MHz`, 70, 48)
  }
  
  const n = points.length
  ctx.fillText(`数据点数: ${n}`, 70, 71)
  
  if (fitTab.value === 'concentration') {
    const avgSpeed = avgY
    const speeds = points.map(p => p.y)
    const minSpeed = Math.min(...speeds)
    const maxSpeed = Math.max(...speeds)
    const stdDev = Math.sqrt(speeds.reduce((acc, v) => acc + Math.pow(v - avgSpeed, 2), 0) / points.length)
    ctx.fillText(`平均声速: ${avgSpeed.toFixed(2)} m/s`, 70, 94)
    ctx.fillText(`声速范围: ${minSpeed.toFixed(1)} ~ ${maxSpeed.toFixed(1)} m/s`, 70, 117)
    ctx.fillText(`标准差: ±${stdDev.toFixed(2)} m/s`, 70, 140)
  }
  
  if (stats) {
    if (fitTab.value === 'frequency') {
      ctx.fillText(`拟合直线: D = ${stats.slope.toFixed(4)} × f`, 70, 94)
      const calcV = (2 * props.params.wavelength * props.params.distance) / stats.slope
      ctx.fillText(`计算声速: v = ${calcV.toFixed(2)} m/s`, 70, 117)
    } else if (fitTab.value === 'wavelength') {
      ctx.fillText(`拟合直线: D = ${stats.slope.toFixed(6)} × λ`, 70, 94)
      const calcV = (2 * props.params.frequency * props.params.distance) / stats.slope
      ctx.fillText(`计算声速: v = ${calcV.toFixed(2)} m/s`, 70, 117)
    } else {
      ctx.fillText(`拟合直线: v = ${stats.slope.toFixed(2)} × c + ${stats.intercept.toFixed(1)}`, 70, 140)
    }
  }
}

const drawCursorsZoom = (ctx, width, height) => {
  const wavelength = props.params.wavelength * 1e-9
  const xCenter = width / 2
  const yCenter = height / 2
  
  cursors.value.forEach((cursor, index) => {
    if (cursor.x !== null) {
      const px = xCenter + (cursor.x / 15) * (width / 2)
      const color = index === 0 ? '#ef4444' : '#22c55e'
      
      ctx.strokeStyle = color
      ctx.lineWidth = 1
      ctx.setLineDash([4, 3])
      ctx.beginPath()
      ctx.moveTo(px, 0)
      ctx.lineTo(px, height)
      ctx.stroke()
      ctx.setLineDash([])
      
      const ringRadius = 15
      const innerRadius = 10
      
      ctx.beginPath()
      ctx.arc(px, yCenter - 40, ringRadius, 0, Math.PI * 2)
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.stroke()
      
      ctx.beginPath()
      ctx.arc(px, yCenter - 40, innerRadius, 0, Math.PI * 2)
      ctx.strokeStyle = color
      ctx.lineWidth = 1
      ctx.globalAlpha = 0.5
      ctx.stroke()
      ctx.globalAlpha = 1
      
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2
        const outerX = px + Math.cos(angle) * ringRadius
        const outerY = yCenter - 40 + Math.sin(angle) * ringRadius
        const innerX = px + Math.cos(angle) * (ringRadius - (i % 3 === 0 ? 5 : 3))
        const innerY = yCenter - 40 + Math.sin(angle) * (ringRadius - (i % 3 === 0 ? 5 : 3))
        
        ctx.beginPath()
        ctx.moveTo(outerX, outerY)
        ctx.lineTo(innerX, innerY)
        ctx.strokeStyle = color
        ctx.lineWidth = i % 3 === 0 ? 2 : 1
        ctx.stroke()
      }
      
      ctx.fillStyle = color
      ctx.font = 'bold 12px Microsoft YaHei'
      ctx.textAlign = 'center'
      ctx.fillText(`游标${index + 1}`, px, yCenter - 65)
      
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 11px Microsoft YaHei'
      ctx.fillText(`${cursor.x.toFixed(3)}`, px, yCenter - 35)
    }
  })
  
  if (cursors.value[0].x !== null && cursors.value[1].x !== null) {
    const px1 = xCenter + (cursors.value[0].x / 15) * (width / 2)
    const px2 = xCenter + (cursors.value[1].x / 15) * (width / 2)
    
    ctx.fillStyle = 'rgba(255, 255, 0, 0.15)'
    ctx.fillRect(Math.min(px1, px2), 0, Math.abs(px1 - px2), height)
    
    ctx.fillStyle = '#eab308'
    ctx.font = 'bold 14px Microsoft YaHei'
    ctx.textAlign = 'center'
    const spacingVal = Math.abs(cursors.value[0].x - cursors.value[1].x) / 2
    ctx.fillText(`条纹间距: ${spacingVal.toFixed(4)} mm`, width / 2, height - 25)
  }
}

const toggleCursor = (index) => {
  if (activeCursor.value === index) {
    activeCursor.value = null
  } else {
    activeCursor.value = index
  }
  drawDiffractionPattern()
}

const handleMainCanvasClick = (event) => {
  const canvas = mainCanvas.value
  if (!canvas) return
  
  if (activeCursor.value === null) return
  
  const rect = canvas.getBoundingClientRect()
  const x = event.clientX - rect.left
  const width = canvas.width
  const xCenter = width / 2
  
  const pos = ((x - xCenter) / (width / 2)) * 15
  
  const cursorIndex = activeCursor.value
  activeCursor.value = null
  
  cursors.value[cursorIndex] = { m: cursorIndex === 0 ? 1 : -1, x: pos }
  
  if (cursorIndex === 0) {
    plus1Position.value = pos.toFixed(4)
  } else {
    minus1Position.value = pos.toFixed(4)
  }
  
  drawDiffractionPattern()
  showNotification(`游标${cursorIndex + 1}已放置在 ${pos.toFixed(4)} mm`, 'success')
}

const drawCursors = (ctx, width, height) => {
  const wavelength = props.params.wavelength * 1e-9
  const xCenter = width / 2
  const yCenter = height / 2
  
  cursors.value.forEach((cursor, index) => {
    if (cursor.x !== null) {
      const px = xCenter + (cursor.x / 15) * (width / 2)
      const color = index === 0 ? '#ef4444' : '#22c55e'
      
      ctx.strokeStyle = color
      ctx.lineWidth = 1
      ctx.setLineDash([4, 2])
      ctx.beginPath()
      ctx.moveTo(px, 0)
      ctx.lineTo(px, height)
      ctx.stroke()
      ctx.setLineDash([])
      
      const ringRadius = 10
      const innerRadius = 7
      
      ctx.beginPath()
      ctx.arc(px, yCenter - 25, ringRadius, 0, Math.PI * 2)
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.stroke()
      
      ctx.beginPath()
      ctx.arc(px, yCenter - 25, innerRadius, 0, Math.PI * 2)
      ctx.strokeStyle = color
      ctx.lineWidth = 1
      ctx.globalAlpha = 0.5
      ctx.stroke()
      ctx.globalAlpha = 1
      
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2
        const outerX = px + Math.cos(angle) * ringRadius
        const outerY = yCenter - 25 + Math.sin(angle) * ringRadius
        const innerX = px + Math.cos(angle) * (ringRadius - 3)
        const innerY = yCenter - 25 + Math.sin(angle) * (ringRadius - 3)
        
        ctx.beginPath()
        ctx.moveTo(outerX, outerY)
        ctx.lineTo(innerX, innerY)
        ctx.strokeStyle = color
        ctx.lineWidth = 1
        ctx.stroke()
      }
      
      ctx.fillStyle = color
      ctx.font = 'bold 9px Microsoft YaHei'
      ctx.textAlign = 'center'
      ctx.fillText(`${cursor.x.toFixed(3)}`, px, yCenter - 25)
    }
  })
}

const adjustCursor = (index, delta) => {
  if (cursors.value[index].x === null) {
    cursors.value[index].x = 0
  }
  cursors.value[index].x = parseFloat((cursors.value[index].x + delta).toFixed(4))
  
  if (index === 0) {
    plus1Position.value = cursors.value[index].x.toFixed(4)
  } else {
    minus1Position.value = cursors.value[index].x.toFixed(4)
  }
  
  drawDiffractionPattern()
}

const saveRecord = () => {
  if (spacing.value === 0) return
  
  const error = (Math.random() - 0.5) * 0.01
  const measuredSpacing = spacing.value + error
  
  const baseVs = getSoundSpeed(localParams.liquidTypeId || 'nacl', localParams.concentration, localParams.temperature)
  
  const speedError = (Math.random() - 0.5) * 3
  let finalSpeed = baseVs + speedError
  
  if (finalSpeed <= 0 || isNaN(finalSpeed)) {
    finalSpeed = baseVs
  }
  
  const newRecord = {
    wavelength: localParams.wavelength,
    frequency: localParams.frequency,
    concentration: localParams.concentration,
    temperature: localParams.temperature,
    liquidTypeId: localParams.liquidTypeId,
    spacing: measuredSpacing,
    speed: finalSpeed,
    experimentMode: fitTab.value
  }
  
  const newRecords = [...(props.records || []), newRecord]
  emit('update:records', newRecords)
  plus1Position.value = ''
  minus1Position.value = ''
}

const saveToArchive = () => {
  if (!props.records || props.records.length === 0) {
    ElMessage.warning('没有找到实验数据，请先测量数据')
    return
  }
  
  const result = saveArchive(props.records || [])
  if (result.success) {
    ElMessage.success('存档创建成功！')
  } else {
    ElMessage.error('创建失败：' + result.message)
  }
}

const getModeLabel = (mode) => {
  const labels = {
    wavelength: '🌈 波长',
    frequency: '📡 频率',
    concentration: '📊 浓度',
    temperature: '🌡️ 温度'
  }
  return labels[mode] || mode || '-'
}

const getOriginalIndex = (record) => {
  return (props.records || []).findIndex(r => r === record)
}

const deleteRecord = (index) => {
  const newRecords = props.records.filter((_, i) => i !== index)
  emit('update:records', newRecords)
}

const clearAllRecords = () => {
  emit('update:records', [])
  plus1Position.value = ''
  minus1Position.value = ''
  const ctx = fitCanvas.value?.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#f3f4f6'
    ctx.fillRect(0, 0, fitCanvas.value.width, fitCanvas.value.height)
    ctx.fillStyle = '#9ca3af'
    ctx.font = '12px Microsoft YaHei'
    ctx.textAlign = 'center'
    ctx.fillText('请先测量数据，然后点击"数据拟合"按钮', fitCanvas.value.width / 2, fitCanvas.value.height / 2)
  }
}

const exportExcel = () => {
  if (!props.records || props.records.length === 0) {
    showNotification('没有数据可导出', 'warning')
    return
  }
  
  let csv = '序号,波长(nm),频率(MHz),浓度(wt%),间距(mm),声速(m/s)\n'
  props.records.forEach((record, index) => {
    csv += `${index + 1},${record.wavelength.toFixed(2)},${record.frequency.toFixed(1)},${record.concentration ? record.concentration.toFixed(5) : '-'},${record.spacing.toFixed(4)},${record.speed.toFixed(1)}\n`
  })
  
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `超声光栅实验数据_${new Date().toLocaleDateString().replace(/\//g, '-')}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  showNotification('数据导出成功', 'success')
}

onMounted(() => {
  nextTick(() => {
    const mainCanvasEl = mainCanvas.value
    const intCanvas = intensityCanvas.value
    const fitCanvasEl = fitCanvas.value
    
    if (mainCanvasEl) {
      const rect = mainCanvasEl.parentElement.getBoundingClientRect()
      mainCanvasEl.width = rect.width
      mainCanvasEl.height = rect.height * 0.65
      drawDiffractionPattern()
    }
    
    if (intCanvas) {
      const rect = intCanvas.parentElement.getBoundingClientRect()
      intCanvas.width = rect.width
      intCanvas.height = rect.height * 0.35
      drawIntensityCurve()
    }
    
    if (fitCanvasEl) {
      const rect = fitCanvasEl.parentElement.getBoundingClientRect()
      fitCanvasEl.width = rect.width
      fitCanvasEl.height = rect.height - 40
      drawFitChart()
    }
  })
  
  watch(() => props.params, () => {
    drawDiffractionPattern()
    drawIntensityCurve()
  }, { deep: true })
})

onActivated(() => {
  Object.assign(localParams, props.params)
})

onDeactivated(() => {})

onUnmounted(() => {})
</script>

<style scoped>
.measurement-view {
  display: flex;
  height: 100%;
  gap: 0;
}

.left-panel {
  width: 30%;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-right: 1px solid #e5e7eb;
  overflow: hidden;
}

.panel-section {
  margin: 8px;
  background-color: #ffffff;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  overflow: visible;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-bottom: 1px solid #e5e7eb;
  flex-wrap: wrap;
  gap: 10px;
}

.status-indicators {
  display: flex;
  gap: 8px;
}

.temp-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
  border-radius: 20px;
  border: 1px solid #bfdbfe;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
}

.temp-icon {
  font-size: 16px;
}

.temp-value {
  font-size: 13px;
  font-weight: bold;
  color: #1d4ed8;
}

.distance-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-radius: 20px;
  border: 1px solid #bbf7d0;
  box-shadow: 0 2px 4px rgba(34, 197, 94, 0.1);
}

.distance-icon {
  font-size: 16px;
}

.distance-value {
  font-size: 13px;
  font-weight: bold;
  color: #166534;
}

.section-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
  z-index: 10;
  position: relative;
}

.section-title {
  font-size: 14px;
  font-weight: bold;
  color: #1f2937;
}

.params-section {
  flex: 1;
  min-height: 400px;
}

.params-tabs {
  display: flex;
  padding: 10px 15px 0;
  gap: 4px;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
}

.param-tab {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-bottom: none;
  background: #f9fafb;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.param-tab:hover {
  background: #f3f4f6;
  color: #374151;
}

.param-tab.active {
  background: #ffffff;
  color: #2563eb;
  border-color: #3b82f6;
  border-bottom: 2px solid #ffffff;
  margin-bottom: -1px;
  box-shadow: 0 -2px 4px rgba(59, 130, 246, 0.1);
}

.params-grid {
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.param-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.param-label {
  font-size: 12px;
  font-weight: bold;
  color: #4b5563;
}

.btn-temp-fit {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 500;
  color: #fff;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  vertical-align: middle;
}

.btn-temp-fit:hover {
  background: linear-gradient(135deg, #d97706, #b45309);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(245, 158, 11, 0.4);
}

.param-unit {
  font-size: 11px;
  color: #6b7280;
  margin-top: 2px;
}

.fixed-param-value {
  font-size: 14px;
  font-weight: bold;
  color: #22c55e;
  padding: 4px 8px;
  background-color: #f0fdf4;
  border-radius: 4px;
  text-align: center;
}

.section-footer {
  padding: 10px 15px;
  border-top: 1px solid #e5e7eb;
}

.btn-run {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-run:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(37, 99, 235, 0.3);
}

.btn-reset {
  background-color: #f3f4f6;
  color: #4b5563;
  border: 1px solid #d1d5db;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  width: 100%;
}

.btn-reset:hover {
  background-color: #e5e7eb;
}

.fit-section {
  flex: 1;
  min-height: 500px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.fit-tabs {
  flex-shrink: 0;
}

.fit-canvas-container {
  flex: 1;
  position: relative;
  padding: 10px;
  min-height: 350px;
}

.fit-canvas {
  width: 100%;
  height: 100%;
  border-radius: 4px;
}

.fit-tabs {
  display: flex;
  gap: 8px;
  padding: 0 15px;
  margin-bottom: 8px;
}

.fit-tab {
  flex: 1;
  padding: 8px 12px;
  background-color: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s;
}

.fit-tab:hover {
  background-color: #e2e8f0;
  color: #334155;
}

.fit-tab.active {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  border-color: #3b82f6;
  color: white;
}

.btn-fit {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.no-data-hint {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.9);
}

.no-data-hint span {
  font-size: 32px;
  margin-bottom: 10px;
}

.no-data-hint p {
  margin: 5px 0;
  font-size: 12px;
  color: #6b7280;
}

.center-panel {
  width: 45%;
  background-color: #f5f7fa;
  padding: 8px;
}

.plot-container {
  background-color: #000000;
  border-radius: 8px;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.plot-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #1a1a1a;
}

.plot-title {
  font-size: 14px;
  font-weight: bold;
  color: #ffffff;
}

.plot-controls {
  display: flex;
  gap: 8px;
}

.btn-control {
  background-color: #374151;
  color: #9ca3af;
  border: none;
  padding: 5px 12px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-control:hover {
  background-color: #4b5563;
  color: #ffffff;
}

.plot-canvas-wrapper {
  flex: 1;
  position: relative;
}

.main-canvas {
  width: 100%;
  height: 65%;
  display: block;
}

.intensity-canvas {
  width: 100%;
  height: 35%;
  display: block;
  border-top: 1px solid #374151;
}

.plot-status {
  padding: 6px 15px;
  font-size: 11px;
  color: #ef4444;
  background-color: #1a1a1a;
}

.plot-status.focused {
  color: #22c55e;
}

.right-panel {
  width: 25%;
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border-left: 1px solid #e5e7eb;
  overflow-y: auto;
}

.measurement-section {
  margin: 8px;
  padding-bottom: 20px;
}

.measurement-grid {
  display: flex;
  gap: 10px;
  padding: 15px;
}

.measure-item {
  flex: 1;
}

.measure-label {
  font-size: 11px;
  font-weight: bold;
  color: #4b5563;
  display: block;
  margin-bottom: 8px;
}

.btn-input {
  width: 100%;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  padding: 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-input:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(59, 130, 246, 0.3);
}

.measure-results {
  padding: 0 15px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background-color: #f8fafc;
  border-radius: 4px;
}

.result-label {
  font-size: 11px;
  font-weight: bold;
  color: #4b5563;
}

.cursor-selector {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  padding: 10px;
  background: #f1f5f9;
  border-radius: 6px;
}

.cursor-select-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  border: 2px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  font-size: 11px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.cursor-select-btn:hover {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.cursor-select-btn.active {
  border-color: #3b82f6;
  background: #eff6ff;
  color: #2563eb;
}

.cursor-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.cursor-indicator.red {
  background: #ef4444;
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.5);
}

.cursor-indicator.green {
  background: #22c55e;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
}

.cursor-status {
  text-align: center;
  padding: 6px 10px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 4px;
  font-size: 11px;
  color: #2563eb;
  margin-bottom: 10px;
}

.cursor-control {
  display: flex;
  align-items: center;
  gap: 4px;
}

.cursor-btn {
  width: 28px;
  height: 28px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: linear-gradient(180deg, #f9fafb, #f3f4f6);
  color: #374151;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.cursor-btn:hover {
  background: linear-gradient(180deg, #eff6ff, #dbeafe);
  border-color: #93c5fd;
  color: #2563eb;
}

.cursor-btn:active {
  transform: scale(0.95);
}

.result-input {
  width: 100px;
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  color: #1f2937;
}

.result-value {
  font-size: 12px;
  font-weight: bold;
  color: #2563eb;
}

.measure-actions {
  display: flex;
  gap: 8px;
  padding: 15px;
}

.btn-calculate {
  flex: 1;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
  border: none;
  padding: 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-save {
  flex: 1;
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
  border: none;
  padding: 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.records-section {
  flex: 1;
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

.btn-clear {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-clear:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
}

.btn-export {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-save-archive {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
  border: 1px solid #6d28d9;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  z-index: 100;
  position: relative;
  min-width: 80px;
  overflow: visible;
}

.btn-save-archive:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
  background: linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%);
}

.btn-save-archive:active {
  transform: translateY(0);
}

.record-tabs {
  display: flex;
  gap: 8px;
  padding: 8px 10px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.record-tab {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  color: #64748b;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.record-tab:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.record-tab.active {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  color: white;
  border-color: #2563eb;
}

.record-tab .tab-count {
  font-size: 11px;
  opacity: 0.8;
}

.mode-badge-small {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
}

.mode-badge-small.wavelength {
  background: #fef3c7;
  color: #92400e;
}

.mode-badge-small.frequency {
  background: #dbeafe;
  color: #1e40af;
}

.mode-badge-small.concentration {
  background: #dcfce7;
  color: #166534;
}

.mode-badge-small.temperature {
  background: #fce7f3;
  color: #9d174d;
}

.analysis-tabs {
  display: flex;
  gap: 8px;
  padding: 8px 10px;
  background: #f8fafc;
  border-bottom: 1px solid #e5e7eb;
}

.analysis-tab {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: white;
  color: #64748b;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.analysis-tab:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.analysis-tab.active {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border-color: #7c3aed;
}

.records-table-container {
  flex: 1;
  padding: 10px;
  overflow-x: auto;
  overflow-y: auto;
  max-height: 300px;
}

.records-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.records-table th {
  background-color: #f1f5f9;
  padding: 10px 8px;
  text-align: center;
  font-weight: bold;
  color: #4b5563;
  border-bottom: 2px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 1;
}

.records-table td {
  padding: 10px 8px;
  text-align: center;
  border-bottom: 1px solid #f1f5f9;
}

.records-table tr:hover {
  background-color: #f8fafc;
}

.empty-row {
  color: #9ca3af;
}

.btn-delete {
  background-color: #fee2e2;
  color: #dc2626;
  border: none;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-delete:hover {
  background-color: #fecaca;
}

.zoom-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.zoom-modal-content {
  background-color: white;
  border-radius: 12px;
  width: 80vw;
  max-height: 80vh;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.zoom-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: linear-gradient(135deg, #374151 0%, #1f2937 100%);
  color: white;
  border-radius: 12px 12px 0 0;
}

.zoom-modal-title {
  font-size: 18px;
  font-weight: bold;
}

.zoom-modal-close {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 5px;
}

.zoom-modal-body {
  padding: 20px;
  overflow: auto;
  max-height: calc(80vh - 60px);
}

.records-table-large {
  width: 100%;
  border-collapse: collapse;
  font-size: 16px;
}

.records-table-large th {
  background-color: #f1f5f9;
  padding: 15px 20px;
  text-align: center;
  font-weight: bold;
  color: #4b5563;
  border-bottom: 2px solid #e5e7eb;
  font-size: 16px;
}

.records-table-large td {
  padding: 15px 20px;
  text-align: center;
  border-bottom: 1px solid #f1f5f9;
  font-size: 15px;
}

.results-section {
  padding-bottom: 15px;
}

.results-grid {
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 6px;
}

.custom-message {
  position: fixed;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  z-index: 1000;
  animation: fadeIn 0.3s ease;
}

.custom-message.success {
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
}

.custom-message.warning {
  background: linear-gradient(135deg, #f39c12 0%, #f1c40f 100%);
  color: white;
}

.custom-message.info {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

.btn-analyze {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-analyze:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(6, 182, 212, 0.3);
}

.analysis-content {
  padding: 12px;
}

.analysis-result {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.analysis-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 8px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-label {
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
}

.summary-value {
  font-size: 14px;
  font-weight: bold;
  color: #1f2937;
}

.summary-value.error-high {
  color: #dc2626;
}

.analysis-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-section {
  padding: 10px;
  background-color: #fafafa;
  border-radius: 6px;
}

.detail-section h4 {
  margin: 0 0 8px 0;
  font-size: 13px;
  font-weight: bold;
  color: #374151;
}

.detail-section p {
  margin: 4px 0;
  font-size: 12px;
  color: #6b7280;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 10px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  padding: 8px;
  background-color: #ffffff;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.stat-label {
  font-size: 11px;
  color: #6b7280;
  margin-bottom: 2px;
}

.stat-value {
  font-size: 13px;
  font-weight: bold;
  color: #1f2937;
}

.consistency-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 8px;
}

.consistency-badge.优秀 {
  background-color: #dcfce7;
  color: #166534;
}

.consistency-badge.良好 {
  background-color: #d1fae5;
  color: #065f46;
}

.consistency-badge.一般 {
  background-color: #fef3c7;
  color: #92400e;
}

.consistency-badge.较差 {
  background-color: #fee2e2;
  color: #991b1b;
}

.outlier-warning {
  padding: 6px 10px;
  background-color: #fef3c7;
  border-radius: 4px;
  font-size: 11px;
  color: #92400e;
  margin-bottom: 8px;
}

.normal-range {
  padding: 6px 10px;
  background-color: #eff6ff;
  border-radius: 4px;
  font-size: 11px;
  color: #1e40af;
}

.validation-result {
  font-size: 13px;
  font-weight: bold;
  margin-bottom: 8px !important;
}

.validation-result.pass {
  color: #16a34a;
}

.validation-result.fail {
  color: #dc2626;
}

.suggestion-box {
  display: flex;
  align-items: flex-start;
  padding: 10px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border-radius: 6px;
  border-left: 4px solid #0ea5e9;
}

.suggestion-icon {
  font-size: 16px;
  margin-right: 8px;
}

.suggestion-text {
  font-size: 12px;
  color: #0c4a6e;
  line-height: 1.5;
}

.no-analysis-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  text-align: center;
}

.no-analysis-hint span {
  font-size: 32px;
  margin-bottom: 8px;
}

.no-analysis-hint p {
  margin: 4px 0;
  font-size: 12px;
  color: #9ca3af;
}

.experiment-mode-info {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  background-color: #f0f9ff;
  border-bottom: 1px solid #e0f2fe;
  font-size: 9px;
  flex-wrap: wrap;
  gap: 6px;
}

.mode-badge {
  font-size: 12px;
}

.mode-variable {
  color: #dc2626;
  font-weight: 600;
}

.mode-divider {
  color: #94a3b8;
  font-size: 8px;
}

.mode-fixed {
  color: #059669;
}

.mode-title {
  font-size: 13px;
  font-weight: bold;
  color: #1e40af;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.fit-params {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.fit-param-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  background-color: #ffffff;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.fit-param-label {
  font-size: 11px;
  color: #6b7280;
}

.fit-param-value {
  font-size: 12px;
  font-weight: bold;
  color: #1f2937;
}

.fit-param-value.good {
  color: #16a34a;
}

.fit-param-value.bad {
  color: #dc2626;
}

.fit-formula {
  margin-top: 8px;
  padding: 8px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-radius: 4px;
  font-size: 11px;
  color: #166534;
  font-family: 'Courier New', monospace;
}
</style>