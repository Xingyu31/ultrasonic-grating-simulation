<template>
  <div class="report-overlay" @click.self="$emit('close')">
    <div class="report-container">
      <div class="report-header">
        <div class="report-title">
          <span class="report-icon">📄</span>
          <span class="report-title-text">超声光栅衍射虚拟仿真实验报告</span>
        </div>
        <button class="report-close" @click="$emit('close')">✕</button>
      </div>
      
      <div class="report-body">
        <div class="report-pdf">
          <div class="pdf-header">
            <h1 class="pdf-title">超声光栅衍射虚拟仿真实验报告</h1>
            <div class="pdf-info">
              <span>实验日期：{{ currentDate }}</span>
              <span>环境温度：{{ props.params.temperature }}°C</span>
            </div>
          </div>
          
          <div class="pdf-section" v-for="(mode, index) in reportModes" :key="mode.id">
            <div class="section-header">
              <span class="section-number">第{{ index + 1 }}部分</span>
              <h2 class="section-title">{{ mode.title }}</h2>
              <span class="section-status" :class="getSectionStatus(mode.id)">
                {{ getSectionStatusText(mode.id) }}
              </span>
            </div>
            
            <div class="section-content">
              <div class="subsection">
                <h3>一、实验目的</h3>
                <p>{{ mode.objective }}</p>
              </div>
              
              <div class="subsection">
                <h3>二、实验原理</h3>
                <p>{{ mode.principle }}</p>
                <div class="formula-box">
                  {{ mode.formula }}
                </div>
              </div>
              
              <div class="subsection">
                <h3>三、实验装置与光路图</h3>
                <div class="flowchart-container">
                  <svg :width="600" :height="120" viewBox="0 0 600 120" class="flowchart">
                    <defs>
                      <linearGradient id="beamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" style="stop-color:#dc2626;stop-opacity:0.8" />
                        <stop offset="50%" style="stop-color:#ef4444;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#dc2626;stop-opacity:0.8" />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    
                    <rect x="20" y="50" width="60" height="40" rx="8" fill="#475569" stroke="#94a3b8" stroke-width="2" />
                    <text x="50" y="75" text-anchor="middle" fill="#fff" font-size="12" font-weight="bold">光源</text>
                    
                    <line x1="80" y1="70" x2="120" y2="70" stroke="url(#beamGradient)" stroke-width="4" filter="url(#glow)" />
                    
                    <rect x="120" y="50" width="60" height="40" rx="8" fill="#334155" stroke="#94a3b8" stroke-width="2" />
                    <text x="150" y="75" text-anchor="middle" fill="#fff" font-size="12" font-weight="bold">平行光管</text>
                    
                    <line x1="180" y1="70" x2="220" y2="70" stroke="url(#beamGradient)" stroke-width="4" filter="url(#glow)" />
                    
                    <rect x="220" y="50" width="70" height="40" rx="8" fill="#0f766e" stroke="#38bdf8" stroke-width="2" />
                    <text x="255" y="75" text-anchor="middle" fill="#fff" font-size="11" font-weight="bold">超声光栅水槽</text>
                    
                    <line x1="290" y1="70" x2="330" y2="70" stroke="url(#beamGradient)" stroke-width="4" filter="url(#glow)" />
                    
                    <rect x="330" y="50" width="60" height="40" rx="8" fill="#65a30d" stroke="#a3e635" stroke-width="2" />
                    <text x="360" y="75" text-anchor="middle" fill="#fff" font-size="12" font-weight="bold">望远镜</text>
                    
                    <line x1="390" y1="70" x2="430" y2="70" stroke="url(#beamGradient)" stroke-width="4" filter="url(#glow)" />
                    
                    <rect x="430" y="50" width="60" height="40" rx="8" fill="#7c3aed" stroke="#c4b5fd" stroke-width="2" />
                    <text x="460" y="75" text-anchor="middle" fill="#fff" font-size="12" font-weight="bold">CCD相机</text>
                    
                    <line x1="490" y1="70" x2="530" y2="70" stroke="url(#beamGradient)" stroke-width="4" filter="url(#glow)" />
                    
                    <rect x="530" y="50" width="60" height="40" rx="8" fill="#1e40af" stroke="#60a5fa" stroke-width="2" />
                    <text x="560" y="75" text-anchor="middle" fill="#fff" font-size="12" font-weight="bold">计算机</text>
                    
                    <text x="300" y="115" text-anchor="middle" fill="#64748b" font-size="12">
                      {{ getFlowchartDesc(mode.id) }}
                    </text>
                  </svg>
                </div>
              </div>
              
              <div class="subsection">
                <h3>四、实验数据记录</h3>
                <div v-if="mode.id === 'concentration'" class="liquid-info">
                  <span class="liquid-label">实验溶液：</span>
                  <span class="liquid-value">{{ props.params.liquidType || '氯化钠溶液' }}</span>
                </div>
                <div v-if="getModeRecords(mode.id).length > 0">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>序号</th>
                        <th>{{ mode.xLabel }}</th>
                        <th>{{ mode.yLabel }}</th>
                        <th>声速 (m/s)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(record, idx) in getModeRecords(mode.id)" :key="idx">
                        <td>{{ idx + 1 }}</td>
                        <td>{{ formatValue(record, mode.xField) }}</td>
                        <td>{{ formatValue(record, mode.yField) }}</td>
                        <td>{{ record.speed.toFixed(1) }}</td>
                      </tr>
                      <tr class="summary-row" v-if="mode.id !== 'concentration'">
                        <td colspan="3" class="summary-label">平均值</td>
                        <td class="summary-value">{{ getAverageSpeed(mode.id).toFixed(1) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else class="no-data">
                  <span>📊</span>
                  <p>暂无实验数据，请先完成该方向的实验测量</p>
                </div>
              </div>
              
              <div class="subsection" v-if="mode.id !== 'concentration'">
                <h3>五、数据处理与分析</h3>
                <div v-if="getModeRecords(mode.id).length >= 3">
                  <div class="analysis-box">
                    <div class="analysis-item">
                      <span class="analysis-label">实验测量声速</span>
                      <span class="analysis-value">{{ getAverageSpeed(mode.id).toFixed(2) }} m/s</span>
                    </div>
                    <div class="analysis-item">
                      <span class="analysis-label">理论声速</span>
                      <span class="analysis-value">{{ getTheoreticalSpeed(mode.id).toFixed(2) }} m/s</span>
                    </div>
                    <div class="analysis-item">
                      <span class="analysis-label">相对误差</span>
                      <span class="analysis-value" :class="{ error: Math.abs(getRelativeError(mode.id)) > 5 }">
                        {{ getRelativeError(mode.id).toFixed(2) }}%
                      </span>
                    </div>
                    <div class="analysis-item">
                      <span class="analysis-label">数据标准差</span>
                      <span class="analysis-value">±{{ getStdDev(mode.id).toFixed(2) }} m/s</span>
                    </div>
                    <div class="analysis-item">
                      <span class="analysis-label">数据一致性</span>
                      <span class="analysis-value" :class="getConsistency(mode.id).toLowerCase()">
                        {{ getConsistency(mode.id) }}
                      </span>
                    </div>
                  </div>
                </div>
                <div v-else class="no-analysis">
                  <p>需要至少3组数据才能进行分析</p>
                </div>
              </div>
              
              <div class="subsection">
                <h3>六、实验结论</h3>
                <div v-if="getModeRecords(mode.id).length >= 3" class="conclusion-box">
                  <p>{{ getConclusion(mode.id) }}</p>
                </div>
                <div v-else class="no-conclusion">
                  <p>完成实验测量后自动生成结论</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="pdf-footer">
            <div class="footer-line"></div>
            <p>超声光栅衍射虚拟仿真实验系统 V3.0</p>
            <p>Generated at {{ currentDate }}</p>
          </div>
        </div>
      </div>
      
      <div class="report-toolbar">
        <button class="tool-btn print-btn" @click="printReport">
          <span>🖨️</span> 打印报告
        </button>
        <button class="tool-btn save-btn" @click="saveReport">
          <span>💾</span> 保存报告
        </button>
        <button class="tool-btn close-btn" @click="$emit('close')">
          <span>✕</span> 关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  records: {
    type: Array,
    default: () => []
  },
  params: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close'])

const currentDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
})

const getFlowchartDesc = (modeId) => {
  const f = props.params.frequency || 8.0
  const c = props.params.concentration || 7.74
  const wl = props.params.wavelength || 600.0
  
  switch (modeId) {
    case 'wavelength':
      return `固定参数：频率 f = ${f.toFixed(1)} MHz，浓度 c = ${c.toFixed(2)} wt%`
    case 'frequency':
      return `固定参数：波长 λ = ${wl.toFixed(1)} nm，浓度 c = ${c.toFixed(2)} wt%`
    case 'concentration':
      return `固定参数：波长 λ = ${wl.toFixed(1)} nm，频率 f = ${f.toFixed(1)} MHz`
    default:
      return ''
  }
}

const reportModes = [
  {
    id: 'wavelength',
    title: '光波长对衍射条纹的影响',
    objective: '研究固定超声频率和液体浓度时，入射光波长与衍射条纹间距的关系，验证声速与波长无关。',
    principle: '根据超声光栅衍射原理，光栅方程为 λₛsinθₖ = kλ，当θₖ很小时，sinθₖ ≈ tanθₖ = Dₖ/(2L)，可得 D = 2kλL/λₛ。由于λₛ = v/f（v为声速，f为超声频率），代入得 D = 2kλLf/v。当f和v固定时，D与λ呈严格正比例关系，λ/D = v/(2kLf) 为常数。',
    formula: '声速公式：v = 2kλfL / D',
    xLabel: '波长 (nm)',
    yLabel: '条纹间距 (mm)',
    xField: 'wavelength',
    yField: 'spacing'
  },
  {
    id: 'frequency',
    title: '超声频率对衍射条纹的影响',
    objective: '研究固定入射光波长和液体浓度时，超声频率与衍射条纹间距的关系，验证声速与频率无关。',
    principle: '根据超声光栅衍射原理，光栅常数λₛ = v/f，代入光栅方程得 D = 2kλLf/v。当λ和v固定时，D与f呈严格正比例关系，f/D = v/(2kλL) 为常数。通过改变超声频率，测量对应的衍射条纹间距，验证声速保持恒定。',
    formula: '声速公式：v = 2kλfL / D',
    xLabel: '频率 (MHz)',
    yLabel: '条纹间距 (mm)',
    xField: 'frequency',
    yField: 'spacing'
  },
  {
    id: 'concentration',
    title: '液体浓度对声速的影响',
    objective: '研究固定入射光波长和超声频率时，液体浓度与声速的关系，验证声速随浓度线性变化。',
    principle: '液体中的声速与浓度有关，当浓度增加时，液体密度和弹性模量发生变化，导致声速改变。实验表明，在一定浓度范围内，声速与浓度呈线性关系：v = v₀ + kc，其中v₀为纯水的声速（约1500 m/s），k为比例系数（约10 m/s·wt%）。',
    formula: '声速公式：v = 1500 + 10 × c',
    xLabel: '浓度 (wt%)',
    yLabel: '条纹间距 (mm)',
    xField: 'concentration',
    yField: 'spacing'
  }
]

const getModeRecords = (modeId) => {
  return props.records.filter(r => r.experimentMode === modeId || (!r.experimentMode && modeId === 'wavelength'))
}

const getAverageSpeed = (modeId) => {
  const records = getModeRecords(modeId)
  if (records.length === 0) return 0
  const sum = records.reduce((acc, r) => acc + r.speed, 0)
  return sum / records.length
}

const getTheoreticalSpeed = (modeId) => {
  if (modeId === 'concentration') {
    return 1500 + (props.params.concentration || 0) * 10
  }
  return 1500 + (props.params.concentration || 7.74) * 10
}

const getRelativeError = (modeId) => {
  const expSpeed = getAverageSpeed(modeId)
  const theoSpeed = getTheoreticalSpeed(modeId)
  if (theoSpeed === 0) return 0
  return ((expSpeed - theoSpeed) / theoSpeed) * 100
}

const getStdDev = (modeId) => {
  const records = getModeRecords(modeId)
  if (records.length < 2) return 0
  const avg = getAverageSpeed(modeId)
  const variance = records.reduce((acc, r) => acc + Math.pow(r.speed - avg, 2), 0) / records.length
  return Math.sqrt(variance)
}

const getConsistency = (modeId) => {
  const stdDev = getStdDev(modeId)
  const avg = getAverageSpeed(modeId)
  const cv = avg > 0 ? (stdDev / avg) * 100 : 0
  
  if (cv < 0.3) return '优秀'
  if (cv < 0.5) return '良好'
  if (cv < 1.0) return '一般'
  return '较差'
}

const getConclusion = (modeId) => {
  const records = getModeRecords(modeId)
  const avgSpeed = getAverageSpeed(modeId)
  const theoSpeed = getTheoreticalSpeed(modeId)
  const error = getRelativeError(modeId)
  const consistency = getConsistency(modeId)
  
  if (modeId === 'wavelength') {
    return `通过改变入射光波长（${Math.min(...records.map(r => r.wavelength))}~${Math.max(...records.map(r => r.wavelength))} nm），测量得到声速平均值为 ${avgSpeed.toFixed(1)} m/s，理论声速为 ${theoSpeed.toFixed(1)} m/s，相对误差为 ${Math.abs(error).toFixed(2)}%。数据一致性为${consistency}，实验结果表明声速与入射光波长无关，符合理论预期。`
  }
  
  if (modeId === 'frequency') {
    return `通过改变超声频率（${Math.min(...records.map(r => r.frequency))}~${Math.max(...records.map(r => r.frequency))} MHz），测量得到声速平均值为 ${avgSpeed.toFixed(1)} m/s，理论声速为 ${theoSpeed.toFixed(1)} m/s，相对误差为 ${Math.abs(error).toFixed(2)}%。数据一致性为${consistency}，实验结果表明声速与超声频率无关，符合理论预期。`
  }
  
  if (modeId === 'concentration') {
    const concentrations = records.map(r => r.concentration)
    const speeds = records.map(r => r.speed)
    const n = records.length
    const sumX = concentrations.reduce((acc, v) => acc + v, 0)
    const sumY = speeds.reduce((acc, v) => acc + v, 0)
    const sumXY = concentrations.reduce((acc, v, i) => acc + v * speeds[i], 0)
    const sumX2 = concentrations.reduce((acc, v) => acc + v * v, 0)
    const denom = n * sumX2 - sumX * sumX
    const slope = denom > 0 ? (n * sumXY - sumX * sumY) / denom : 0
    
    return `通过改变液体浓度（${Math.min(...concentrations).toFixed(2)}~${Math.max(...concentrations).toFixed(2)} wt%），测量得到声速平均值为 ${avgSpeed.toFixed(1)} m/s。线性拟合得到声速与浓度的关系为 v = ${slope.toFixed(1)} × c + ${(avgSpeed - slope * sumX / n).toFixed(1)}。理论公式为 v = 10 × c + 1500，拟合斜率与理论值的偏差为 ${Math.abs(((slope - 10) / 10) * 100).toFixed(2)}%。实验结果表明声速随浓度线性变化，符合理论预期。`
  }
  
  return ''
}

const getSectionStatus = (modeId) => {
  const records = getModeRecords(modeId)
  if (records.length >= 3) return 'completed'
  if (records.length > 0) return 'partial'
  return 'empty'
}

const getSectionStatusText = (modeId) => {
  const records = getModeRecords(modeId)
  if (records.length >= 3) return '✓ 已完成'
  if (records.length > 0) return `◐ ${records.length}组数据`
  return '○ 未开始'
}

const formatValue = (record, field) => {
  if (field === 'wavelength') return record.wavelength.toFixed(1)
  if (field === 'frequency') return record.frequency.toFixed(1)
  if (field === 'concentration') return record.concentration.toFixed(4)
  if (field === 'spacing') return record.spacing.toFixed(4)
  return record[field]
}

const printReport = () => {
  window.print()
}

const saveReport = () => {
  const reportContent = document.querySelector('.report-pdf').innerHTML
  const blob = new Blob([reportContent], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `超声光栅衍射实验报告_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.html`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.report-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  overflow-y: auto;
}

.report-container {
  width: 90%;
  max-width: 1000px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
  border-radius: 12px 12px 0 0;
}

.report-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.report-icon {
  font-size: 24px;
}

.report-title-text {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
}

.report-close {
  background: none;
  border: none;
  font-size: 24px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 4px;
  transition: color 0.2s;
}

.report-close:hover {
  color: #fff;
}

.report-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.report-pdf {
  max-width: 800px;
  margin: 0 auto;
  background: #fff;
  padding: 40px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.pdf-header {
  text-align: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #374151;
}

.pdf-title {
  font-size: 24px;
  font-weight: bold;
  color: #1f2937;
  margin: 0 0 10px 0;
}

.pdf-info {
  display: flex;
  justify-content: center;
  gap: 30px;
  font-size: 14px;
  color: #6b7280;
}

.pdf-section {
  margin-bottom: 35px;
  padding-bottom: 25px;
  border-bottom: 1px dashed #d1d5db;
}

.pdf-section:last-child {
  border-bottom: none;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.section-number {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  font-size: 12px;
  font-weight: bold;
  padding: 4px 12px;
  border-radius: 12px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
}

.section-status {
  margin-left: auto;
  font-size: 13px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
}

.section-status.completed {
  background: #dcfce7;
  color: #166534;
}

.section-status.partial {
  background: #fef3c7;
  color: #92400e;
}

.section-status.empty {
  background: #f3f4f6;
  color: #6b7280;
}

.section-content {
  margin-left: 15px;
}

.subsection {
  margin-bottom: 20px;
}

.subsection h3 {
  font-size: 15px;
  font-weight: bold;
  color: #374151;
  margin: 0 0 10px 0;
}

.liquid-info {
  display: inline-flex;
  align-items: center;
  margin-bottom: 12px;
  padding: 8px 14px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 8px;
  border-left: 4px solid #f59e0b;
}

.liquid-label {
  font-size: 14px;
  font-weight: 600;
  color: #78350f;
}

.liquid-value {
  font-size: 14px;
  font-weight: bold;
  color: #92400e;
  margin-left: 6px;
}

.subsection p {
  font-size: 14px;
  line-height: 1.7;
  color: #4b5563;
  margin: 0;
  text-align: justify;
}

.formula-box {
  margin: 12px 0;
  padding: 12px 16px;
  background: #f9fafb;
  border-left: 4px solid #3b82f6;
  border-radius: 0 6px 6px 0;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: 600;
  color: #1e40af;
}

.flowchart-container {
  display: flex;
  justify-content: center;
  margin: 15px 0;
}

.flowchart {
  background: #f8fafc;
  border-radius: 8px;
  padding: 10px;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  font-size: 13px;
}

.data-table th,
.data-table td {
  border: 1px solid #e5e7eb;
  padding: 10px;
  text-align: center;
}

.data-table th {
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  font-weight: bold;
  color: #374151;
}

.data-table tr:hover {
  background: #f9fafb;
}

.summary-row {
  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
}

.summary-label {
  font-weight: bold;
  color: #1e40af;
}

.summary-value {
  font-weight: bold;
  color: #dc2626;
}

.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px;
  background: #f9fafb;
  border-radius: 8px;
}

.no-data span {
  font-size: 32px;
  margin-bottom: 8px;
}

.no-data p {
  font-size: 13px;
  color: #6b7280;
  margin: 4px 0;
}

.analysis-box {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 10px;
}

.analysis-item {
  display: flex;
  justify-content: space-between;
  padding: 10px 14px;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.analysis-label {
  font-size: 13px;
  color: #6b7280;
}

.analysis-value {
  font-size: 13px;
  font-weight: bold;
  color: #1f2937;
}

.analysis-value.error {
  color: #dc2626;
}

.analysis-value.优秀 {
  color: #16a34a;
}

.analysis-value.良好 {
  color: #059669;
}

.analysis-value.一般 {
  color: #d97706;
}

.analysis-value.较差 {
  color: #dc2626;
}

.no-analysis,
.no-conclusion {
  padding: 15px;
  background: #f9fafb;
  border-radius: 6px;
  text-align: center;
  color: #6b7280;
}

.conclusion-box {
  margin-top: 10px;
  padding: 15px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-radius: 8px;
  border-left: 4px solid #16a34a;
}

.conclusion-box p {
  font-size: 14px;
  line-height: 1.7;
  color: #166534;
}

.pdf-footer {
  text-align: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e5e7eb;
}

.footer-line {
  width: 100px;
  height: 2px;
  background: #3b82f6;
  margin: 0 auto 15px auto;
}

.pdf-footer p {
  font-size: 12px;
  color: #9ca3af;
  margin: 4px 0;
}

.report-toolbar {
  display: flex;
  justify-content: center;
  gap: 15px;
  padding: 16px 24px;
  background: #f8fafc;
  border-top: 1px solid #e5e7eb;
  border-radius: 0 0 12px 12px;
}

.tool-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.print-btn {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.print-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(59, 130, 246, 0.4);
}

.save-btn {
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
}

.save-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(39, 174, 96, 0.4);
}

.close-btn {
  background: #f3f4f6;
  color: #6b7280;
}

.close-btn:hover {
  background: #e5e7eb;
}

@media print {
  .report-overlay {
    background: none;
    position: static;
    display: block;
  }
  
  .report-container {
    width: 100%;
    max-width: none;
    box-shadow: none;
    border-radius: 0;
    max-height: none;
  }
  
  .report-header,
  .report-toolbar {
    display: none;
  }
  
  .report-body {
    padding: 0;
    overflow: visible;
  }
  
  .report-pdf {
    border: none;
    padding: 0;
  }
}
</style>
