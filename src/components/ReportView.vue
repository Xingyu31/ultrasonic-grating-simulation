<template>
  <div class="report-overlay" @click.self="$emit('close')">
    <div class="report-container">
      <div class="report-header">
        <div class="report-title">
          <span class="report-icon">📄</span>
          <span class="report-title-text">超声光栅虚拟仿真实验平台 - 实验报告</span>
        </div>
        <button class="report-close" @click="$emit('close')">✕</button>
      </div>
      
      <div class="report-tabs">
        <button 
          v-for="tab in reportTabs" 
          :key="tab.id"
          class="report-tab" 
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span>{{ tab.name }}</span>
        </button>
      </div>
      
      <div class="report-body">
        <div v-if="activeTab === 'main'" class="report-pdf">
          <div class="pdf-header">
            <h1 class="pdf-title">超声光栅衍射虚拟仿真实验报告</h1>
            <div class="pdf-info">
              <span>实验日期：{{ currentDate }}</span>
              <span>环境温度：{{ props.params.temperature }}°C</span>
            </div>
          </div>
          
          <div class="pdf-section" v-for="(mode, index) in reportModes" :key="mode.id" :id="'section-' + mode.id">
            <div class="section-header">
              <span class="section-number">第{{ index + 1 }}部分</span>
              <h2 class="section-title">{{ mode.title }}</h2>
              <div class="section-actions">
                <span class="section-status" :class="getSectionStatus(mode.id)">
                  {{ getSectionStatusText(mode.id) }}
                </span>
                <button class="btn-save-section" @click="saveSection(mode)">💾 保存此部分</button>
              </div>
            </div>
            
            <div class="section-content">
              <div class="subsection">
                <h3>一、实验目的</h3>
                <ol class="objective-list">
                  <li v-for="(item, i) in mode.objectives" :key="i">{{ item }}</li>
                </ol>
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
                <div v-if="getModeRecords(mode.id).length > 0">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>序号</th>
                        <th>波长(nm)</th>
                        <th>频率(MHz)</th>
                        <th>浓度(wt%)</th>
                        <th>间距(mm)</th>
                        <th>声速(m/s)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(record, idx) in getModeRecords(mode.id)" :key="idx">
                        <td>{{ idx + 1 }}</td>
                        <td>{{ record.wavelength.toFixed(2) }}</td>
                        <td>{{ record.frequency.toFixed(1) }}</td>
                        <td>{{ record.concentration ? record.concentration.toFixed(5) : '-' }}</td>
                        <td>{{ record.spacing.toFixed(4) }}</td>
                        <td>{{ record.speed.toFixed(1) }}</td>
                      </tr>
                      <tr class="summary-row">
                        <td colspan="5" class="summary-label">声速平均值</td>
                        <td class="summary-value">{{ getAverageSpeed(mode.id).toFixed(1) }}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div class="data-summary">
                    <p>共 {{ getModeRecords(mode.id).length }} 组实验数据</p>
                  </div>
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
                      <span class="analysis-label">百分误差</span>
                      <span class="analysis-value" :class="{ error: Math.abs(getRelativeError(mode.id)) > 5 }">
                        {{ getRelativeError(mode.id).toFixed(2) }}%
                      </span>
                    </div>
                    <div class="analysis-item">
                      <span class="analysis-label">数据标准差</span>
                      <span class="analysis-value">{{ toOneSigDigit(getStdDev(mode.id)) }} m/s</span>
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
            <p>超声光栅虚拟仿真实验平台 V4.0</p>
            <p>Generated at {{ currentDate }}</p>
          </div>
        </div>
        
        <div v-else-if="activeTab === 'temperature'" class="report-pdf">
          <div class="pdf-header">
            <h1 class="pdf-title">纯水下温度调节实验报告</h1>
            <div class="pdf-info">
              <span>实验日期：{{ currentDate }}</span>
              <span>实验溶液：纯水</span>
            </div>
          </div>
          
          <div class="pdf-section temperature-section">
            <div class="section-header">
              <span class="section-number">温度实验</span>
              <h2 class="section-title">温度对声速的影响</h2>
              <span class="section-status" :class="getTemperatureStatus()">
                {{ getTemperatureStatusText() }}
              </span>
            </div>
            
            <div class="section-content">
              <div class="subsection">
                <h3>一、实验目的</h3>
                <ol class="objective-list">
                  <li>了解超声光栅的形成原理与Raman–Nath衍射条件</li>
                  <li>掌握利用超声光栅测量液体中声速的方法</li>
                  <li>学会用线性拟合与统计检验处理实验数据</li>
                  <li>研究纯水中温度变化对超声声速的影响，验证声速与温度的定量关系</li>
                </ol>
              </div>
              
              <div class="subsection">
                <h3>二、实验原理</h3>
                <p>液体中的超声声速与温度密切相关。在纯水中，声速随温度升高而增大，遵循以下经验公式：</p>
                <div class="formula-box">
                  v(T) = 1398 + 3.46 × T m/s
                </div>
                <p>其中 v(T) 为温度T时的声速，T为摄氏温度。在20°C时，纯水中声速约为1467.2 m/s，温度每升高1°C，声速约增加3.46 m/s。</p>
              </div>
              
              <div class="subsection">
                <h3>三、实验数据记录</h3>
                <div v-if="getTemperatureRecords().length > 0">
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>序号</th>
                        <th>温度 (°C)</th>
                        <th>频率 (MHz)</th>
                        <th>波长 (nm)</th>
                        <th>条纹间距 (mm)</th>
                        <th>实测声速 (m/s)</th>
                        <th>理论声速 (m/s)</th>
                        <th>百分误差 (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(record, idx) in getTemperatureRecords()" :key="idx">
                        <td>{{ idx + 1 }}</td>
                        <td>{{ record.temperature ? record.temperature.toFixed(1) : '-' }}</td>
                        <td>{{ record.frequency.toFixed(1) }}</td>
                        <td>{{ record.wavelength.toFixed(1) }}</td>
                        <td>{{ record.spacing.toFixed(4) }}</td>
                        <td>{{ record.speed.toFixed(1) }}</td>
                        <td>{{ getTheoreticalTempSpeed(record.temperature).toFixed(1) }}</td>
                        <td>{{ getTempError(record).toFixed(2) }}</td>
                      </tr>
                      <tr class="summary-row">
                        <td colspan="5" class="summary-label">平均值</td>
                        <td class="summary-value">{{ getTemperatureAvgSpeed().toFixed(1) }}</td>
                        <td class="summary-value">{{ getTemperatureAvgTheoSpeed().toFixed(1) }}</td>
                        <td class="summary-value">{{ getTemperatureOverallError().toFixed(2) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div v-else class="no-data">
                  <span>🌡️</span>
                  <p>暂无温度实验数据，请先在测量页面进行温度调节实验</p>
                </div>
              </div>
              
              <div class="subsection" v-if="getTemperatureRecords().length >= 3">
                <h3>四、数据处理与分析</h3>
                <div class="analysis-box">
                  <div class="analysis-item">
                    <span class="analysis-label">温度范围</span>
                    <span class="analysis-value">{{ getTempRange() }} °C</span>
                  </div>
                  <div class="analysis-item">
                    <span class="analysis-label">实测声速范围</span>
                    <span class="analysis-value">{{ getSpeedRange() }} m/s</span>
                  </div>
                  <div class="analysis-item">
                    <span class="analysis-label">平均声速温度系数</span>
                    <span class="analysis-value">{{ getTempCoefficient().toFixed(3) }} m/s·°C</span>
                  </div>
                  <div class="analysis-item">
                    <span class="analysis-label">理论温度系数</span>
                    <span class="analysis-value">3.460 m/s·°C</span>
                  </div>
                  <div class="analysis-item">
                    <span class="analysis-label">百分误差</span>
                    <span class="analysis-value" :class="{ error: Math.abs(getTemperatureOverallError()) > 5 }">
                      {{ getTemperatureOverallError().toFixed(2) }}%
                    </span>
                  </div>
                  <div class="analysis-item">
                    <span class="analysis-label">数据一致性</span>
                    <span class="analysis-value" :class="getTemperatureConsistency().toLowerCase()">
                      {{ getTemperatureConsistency() }}
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="subsection">
                <h3>五、实验结论</h3>
                <div v-if="getTemperatureRecords().length >= 3" class="conclusion-box">
                  <p>{{ getTemperatureConclusion() }}</p>
                </div>
                <div v-else class="no-conclusion">
                  <p>完成至少3组温度测量后自动生成结论</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="pdf-footer">
            <div class="footer-line"></div>
            <p>超声光栅虚拟仿真实验平台 V4.0</p>
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
        <button class="tool-btn archive-btn" @click="showArchiveManager = true">
          <span>📚</span> 报告存档
        </button>
        <button class="tool-btn close-btn" @click="$emit('close')">
          <span>✕</span> 关闭
        </button>
      </div>
      
      <div v-if="showArchiveManager" class="archive-manager">
        <div class="archive-manager-header">
          <span class="archive-manager-title">📚 实验报告存档管理</span>
          <button class="archive-manager-close" @click="showArchiveManager = false">✕</button>
        </div>
        <div class="archive-manager-body">
          <div class="archive-actions">
            <button class="btn-create-archive" @click="createReportArchive">📁 创建当前报告存档</button>
          </div>
          <div v-if="reportArchives.length > 0" class="archive-list">
            <div v-for="archive in reportArchives" :key="archive.id" class="archive-item">
              <div class="archive-item-info">
                <div class="archive-item-name">{{ archive.name }}</div>
                <div class="archive-item-meta">
                  <span>📅 {{ formatTime(archive.createdAt) }}</span>
                  <span>📊 {{ archive.records.length }}组数据</span>
                  <span>🎯 {{ archive.mode === 'temperature' ? '温度调节' : getModeName(archive.mode) }}</span>
                </div>
              </div>
              <div class="archive-item-actions">
                <button class="btn-view" @click="viewArchive(archive)">查看</button>
                <button class="btn-delete" @click="deleteArchive(archive.id)">删除</button>
              </div>
            </div>
          </div>
          <div v-else class="archive-empty">
            <span>📚</span>
            <p>暂无存档记录</p>
            <p class="hint">点击上方按钮创建当前实验报告的存档</p>
          </div>
        </div>
      </div>
      
      <div v-if="viewingArchive" class="archive-viewer">
        <div class="archive-viewer-header">
          <span>📖 查看存档: {{ viewingArchive.name }}</span>
          <button @click="viewingArchive = null">返回</button>
        </div>
        <div class="archive-viewer-body">
          <div class="data-table-container" v-if="viewingArchive.records.length > 0">
            <table class="data-table">
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
                <tr v-for="(record, idx) in viewingArchive.records" :key="idx">
                  <td>{{ idx + 1 }}</td>
                  <td>{{ record.wavelength?.toFixed(1) }}</td>
                  <td>{{ record.frequency?.toFixed(1) }}</td>
                  <td>{{ record.temperature?.toFixed(1) }}</td>
                  <td>{{ record.concentration?.toFixed(5) }}</td>
                  <td>{{ record.spacing?.toFixed(4) }}</td>
                  <td>{{ record.speed?.toFixed(1) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="archive-summary">
            <p>存档时间: {{ formatTime(viewingArchive.createdAt) }}</p>
            <p>数据组数: {{ viewingArchive.records.length }}</p>
            <p>实验模式: {{ viewingArchive.mode === 'temperature' ? '温度调节' : getModeName(viewingArchive.mode) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getReportArchives, saveReportArchive, deleteReportArchive } from '../utils/reportArchive'

const toOneSigDigit = (x) => {
  if (x === 0) return 0
  const mag = Math.floor(Math.log10(Math.abs(x)))
  const factor = Math.pow(10, -mag)
  return Math.round(x * factor) / factor
}

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

const activeTab = ref('main')

const reportTabs = [
  { id: 'main', name: '主实验报告', icon: '📊' },
  { id: 'temperature', name: '温度调节报告', icon: '🌡️' }
]

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

const liquidTypesData = {
  'pure-water': {
    baseSpeed: 1480,
    speedFactor: 0,
    temperatureFormula: (t) => 1398 + 3.46 * t
  },
  'nacl': {
    baseSpeed: 1482.3,
    speedFactor: 4.945
  },
  'ethylene-glycol': {
    baseSpeed: 1500,
    speedFactor: 10
  },
  'glycerol': {
    baseSpeed: 1480,
    speedFactor: 12
  },
  'sugar': {
    baseSpeed: 1480,
    speedFactor: 5.5
  },
  'alcohol': {
    baseSpeed: 1480,
    speedFactor: -2.5
  }
}

const getFlowchartDesc = (modeId) => {
  const records = getModeRecords(modeId)
  if (records.length === 0) return ''
  
  const firstRecord = records[0]
  const liquidName = props.params.liquidType || '氯化钠溶液'
  
  switch (modeId) {
    case 'wavelength':
      return `实验条件：频率 f = ${firstRecord.frequency.toFixed(1)} MHz，浓度 c = ${firstRecord.concentration ? firstRecord.concentration.toFixed(2) : '-'} wt%（${liquidName}）`
    case 'frequency':
      return `实验条件：波长 λ = ${firstRecord.wavelength.toFixed(1)} nm，浓度 c = ${firstRecord.concentration ? firstRecord.concentration.toFixed(2) : '-'} wt%（${liquidName}）`
    case 'concentration':
      return `实验条件：波长 λ = ${firstRecord.wavelength.toFixed(1)} nm，频率 f = ${firstRecord.frequency.toFixed(1)} MHz（${liquidName}）`
    default:
      return ''
  }
}

const getModeFormula = (modeId) => {
  const records = getModeRecords(modeId)
  if (records.length === 0) return '暂无实验数据'
  
  const firstRecord = records[0]
  const distance = props.params.distance || 0.3
  
  if (modeId === 'wavelength') {
    return `声速公式：v = 2kλfL / D = 2 × 1 × λ × ${(firstRecord.frequency * 1e6).toFixed(0)} × ${(distance * 1000).toFixed(0)} / D`
  }
  if (modeId === 'frequency') {
    return `声速公式：v = 2kλfL / D = 2 × 1 × ${firstRecord.wavelength.toFixed(1)} × f × ${(distance * 1000).toFixed(0)} / D`
  }
  if (modeId === 'concentration') {
    const liquidTypeId = props.params.liquidTypeId || 'nacl'
    const liquidData = liquidTypesData[liquidTypeId] || liquidTypesData['nacl']
    return `声速公式：v = ${liquidData.baseSpeed} + ${liquidData.speedFactor} × c`
  }
  return ''
}

const getModePrinciple = (modeId) => {
  const records = getModeRecords(modeId)
  if (records.length === 0) return '暂无实验数据'
  
  const firstRecord = records[0]
  const liquidName = props.params.liquidType || '氯化钠溶液'
  
  if (modeId === 'wavelength') {
    return `根据超声光栅衍射原理，光栅方程为 λₛsinθₖ = kλ，当θₖ很小时，sinθₖ ≈ tanθₖ = Dₖ/(2L)，可得 D = 2kλL/λₛ。由于λₛ = v/f（v为声速，f为超声频率），代入得 D = 2kλLf/v。实验中固定频率 f = ${firstRecord.frequency.toFixed(1)} MHz，浓度 c = ${firstRecord.concentration ? firstRecord.concentration.toFixed(2) : '-'} wt%（${liquidName}），改变入射光波长 λ，测量条纹间距 D，验证声速 v 与波长无关。`
  }
  if (modeId === 'frequency') {
    return `根据超声光栅衍射原理，光栅常数λₛ = v/f，代入光栅方程得 D = 2kλLf/v。实验中固定波长 λ = ${firstRecord.wavelength.toFixed(1)} nm，浓度 c = ${firstRecord.concentration ? firstRecord.concentration.toFixed(2) : '-'} wt%（${liquidName}），改变超声频率 f，测量条纹间距 D，验证声速 v 与频率无关。`
  }
  if (modeId === 'concentration') {
    const liquidTypeId = props.params.liquidTypeId || 'nacl'
    const liquidData = liquidTypesData[liquidTypeId] || liquidTypesData['nacl']
    return `液体中的声速与浓度有关，当浓度增加时，液体密度和弹性模量发生变化，导致声速改变。实验表明，在一定浓度范围内，声速与浓度呈线性关系：v = v₀ + kc，其中v₀为基准声速（${liquidData.baseSpeed} m/s），k为比例系数（约${liquidData.speedFactor} m/s·wt%）。实验中固定波长 λ = ${firstRecord.wavelength.toFixed(1)} nm，频率 f = ${firstRecord.frequency.toFixed(1)} MHz，改变浓度 c，测量声速 v。`
  }
  return ''
}

const reportModes = [
  {
    id: 'wavelength',
    title: '光波长对衍射条纹的影响',
    objectives: [
      '了解超声光栅的形成原理与Raman–Nath衍射条件',
      '掌握利用超声光栅测量液体中声速的方法',
      '学会用线性拟合与统计检验处理实验数据',
      '研究固定超声频率和液体浓度时，入射光波长与衍射条纹间距的关系，验证声速与波长无关'
    ],
    principle: computed(() => getModePrinciple('wavelength')),
    formula: computed(() => getModeFormula('wavelength')),
    xLabel: '波长 (nm)',
    yLabel: '条纹间距 (mm)',
    xField: 'wavelength',
    yField: 'spacing'
  },
  {
    id: 'frequency',
    title: '超声频率对衍射条纹的影响',
    objectives: [
      '了解超声光栅的形成原理与Raman–Nath衍射条件',
      '掌握利用超声光栅测量液体中声速的方法',
      '学会用线性拟合与统计检验处理实验数据',
      '研究固定入射光波长和液体浓度时，超声频率与衍射条纹间距的关系，验证声速与频率无关'
    ],
    principle: computed(() => getModePrinciple('frequency')),
    formula: computed(() => getModeFormula('frequency')),
    xLabel: '频率 (MHz)',
    yLabel: '条纹间距 (mm)',
    xField: 'frequency',
    yField: 'spacing'
  },
  {
    id: 'concentration',
    title: '液体浓度对声速的影响',
    objectives: [
      '了解超声光栅的形成原理与Raman–Nath衍射条件',
      '掌握利用超声光栅测量液体中声速的方法',
      '学会用线性拟合与统计检验处理实验数据',
      '研究固定入射光波长和超声频率时，液体浓度与声速的关系，验证声速随浓度线性变化'
    ],
    principle: computed(() => getModePrinciple('concentration')),
    formula: computed(() => getModeFormula('concentration')),
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
  const liquidTypeId = props.params.liquidTypeId || 'nacl'
  const concentration = props.params.concentration || 0
  const temperature = props.params.temperature || 20
  
  const liquidData = liquidTypesData[liquidTypeId] || liquidTypesData['nacl']
  
  if (liquidTypeId === 'pure-water') {
    if (liquidData.temperatureFormula) {
      return liquidData.temperatureFormula(temperature)
    }
    return liquidData.baseSpeed
  }
  
  if (modeId === 'concentration') {
    const records = getModeRecords(modeId)
    if (records.length > 0) {
      const avgConcentration = records.reduce((acc, r) => acc + r.concentration, 0) / records.length
      return liquidData.baseSpeed + avgConcentration * liquidData.speedFactor
    }
    return liquidData.baseSpeed
  }
  
  return liquidData.baseSpeed + concentration * liquidData.speedFactor
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
  const absStdDev = Math.sqrt(variance)
  return absStdDev
}

const getConsistency = (modeId) => {
  const avg = getAverageSpeed(modeId)
  const absStdDev = getStdDev(modeId)
  const cv = avg > 0 ? (absStdDev / avg) * 100 : 0
  
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
    return `通过改变入射光波长（${Math.min(...records.map(r => r.wavelength))}~${Math.max(...records.map(r => r.wavelength))} nm），测量得到声速平均值为 ${avgSpeed.toFixed(1)} m/s，理论声速为 ${theoSpeed.toFixed(1)} m/s，百分误差为 ${Math.abs(error).toFixed(2)}%。数据一致性为${consistency}，实验结果表明声速与入射光波长无关，符合理论预期。`
  }
  
  if (modeId === 'frequency') {
    return `通过改变超声频率（${Math.min(...records.map(r => r.frequency))}~${Math.max(...records.map(r => r.frequency))} MHz），测量得到声速平均值为 ${avgSpeed.toFixed(1)} m/s，理论声速为 ${theoSpeed.toFixed(1)} m/s，百分误差为 ${Math.abs(error).toFixed(2)}%。数据一致性为${consistency}，实验结果表明声速与超声频率无关，符合理论预期。`
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
    const intercept = avgSpeed - slope * sumX / n
    
    const liquidTypeId = props.params.liquidTypeId || 'nacl'
    const liquidData = liquidTypesData[liquidTypeId] || liquidTypesData['nacl']
    const theoSlope = liquidData.speedFactor
    const theoIntercept = liquidData.baseSpeed
    const slopeError = Math.abs(((slope - theoSlope) / theoSlope) * 100)
    
    return `通过改变液体浓度（${Math.min(...concentrations).toFixed(2)}~${Math.max(...concentrations).toFixed(2)} wt%），测量得到声速平均值为 ${avgSpeed.toFixed(1)} m/s。线性拟合得到声速与浓度的关系为 v = ${slope.toFixed(2)} × c + ${intercept.toFixed(1)}。理论公式为 v = ${theoIntercept} + ${theoSlope} × c，拟合斜率与理论值的偏差为 ${slopeError.toFixed(2)}%。实验结果表明声速随浓度线性变化，符合理论预期。`
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
  a.download = `超声光栅实验报告_${activeTab.value === 'temperature' ? '温度调节' : '主实验'}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.html`
  a.click()
  URL.revokeObjectURL(url)
}

const saveSection = (mode) => {
  const sectionElement = document.getElementById(`section-${mode.id}`)
  if (!sectionElement) return
  
  const sectionContent = sectionElement.outerHTML
  const wrapper = document.createElement('div')
  wrapper.innerHTML = `
    <div style="font-family: 'Microsoft YaHei', sans-serif; padding: 40px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #1e40af; margin: 0;">超声光栅衍射虚拟仿真实验报告</h1>
        <p style="color: #64748b; margin: 10px 0 0;">生成时间: ${new Date().toLocaleString('zh-CN')}</p>
      </div>
      ${sectionContent}
    </div>
  `
  
  const blob = new Blob([wrapper.innerHTML], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${mode.title}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.html`
  a.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success(`"${mode.title}"部分保存成功！`)
}

const getTemperatureRecords = () => {
  return props.records.filter(r => r.experimentMode === 'temperature' || r.temperature !== undefined && r.temperature !== null && r.concentration === 0)
}

const getTheoreticalTempSpeed = (temperature) => {
  if (!temperature) return 1398
  return 1398 + 3.46 * temperature
}

const getTempError = (record) => {
  const theoSpeed = getTheoreticalTempSpeed(record.temperature)
  if (theoSpeed === 0) return 0
  return ((record.speed - theoSpeed) / theoSpeed) * 100
}

const getTemperatureAvgSpeed = () => {
  const records = getTemperatureRecords()
  if (records.length === 0) return 0
  return records.reduce((acc, r) => acc + r.speed, 0) / records.length
}

const getTemperatureAvgTheoSpeed = () => {
  const records = getTemperatureRecords()
  if (records.length === 0) return 0
  return records.reduce((acc, r) => acc + getTheoreticalTempSpeed(r.temperature), 0) / records.length
}

const getTemperatureOverallError = () => {
  const records = getTemperatureRecords()
  if (records.length === 0) return 0
  const avgSpeed = getTemperatureAvgSpeed()
  const avgTheoSpeed = getTemperatureAvgTheoSpeed()
  if (avgTheoSpeed === 0) return 0
  return ((avgSpeed - avgTheoSpeed) / avgTheoSpeed) * 100
}

const getTempRange = () => {
  const records = getTemperatureRecords()
  if (records.length === 0) return '-'
  const temps = records.map(r => r.temperature).filter(t => t !== undefined && t !== null)
  if (temps.length === 0) return '-'
  return `${Math.min(...temps).toFixed(1)} ~ ${Math.max(...temps).toFixed(1)}`
}

const getSpeedRange = () => {
  const records = getTemperatureRecords()
  if (records.length === 0) return '-'
  const speeds = records.map(r => r.speed)
  return `${Math.min(...speeds).toFixed(1)} ~ ${Math.max(...speeds).toFixed(1)}`
}

const getTempCoefficient = () => {
  const records = getTemperatureRecords()
  if (records.length < 2) return 0
  const temps = records.map(r => r.temperature)
  const speeds = records.map(r => r.speed)
  const n = records.length
  const sumX = temps.reduce((acc, v) => acc + v, 0)
  const sumY = speeds.reduce((acc, v) => acc + v, 0)
  const sumXY = temps.reduce((acc, v, i) => acc + v * speeds[i], 0)
  const sumX2 = temps.reduce((acc, v) => acc + v * v, 0)
  const denom = n * sumX2 - sumX * sumX
  return denom > 0 ? (n * sumXY - sumX * sumY) / denom : 0
}

const getTemperatureConsistency = () => {
  const records = getTemperatureRecords()
  if (records.length < 2) return '待测量'
  const avg = getTemperatureAvgSpeed()
  const variance = records.reduce((acc, r) => acc + Math.pow(r.speed - avg, 2), 0) / records.length
  const stdDev = Math.sqrt(variance)
  const cv = avg > 0 ? (stdDev / avg) * 100 : 0
  if (cv < 0.3) return '优秀'
  if (cv < 0.5) return '良好'
  if (cv < 1.0) return '一般'
  return '较差'
}

const getTemperatureConclusion = () => {
  const records = getTemperatureRecords()
  const avgSpeed = getTemperatureAvgSpeed()
  const avgTheoSpeed = getTemperatureAvgTheoSpeed()
  const error = getTemperatureOverallError()
  const coefficient = getTempCoefficient()
  const consistency = getTemperatureConsistency()
  const temps = records.map(r => r.temperature).filter(t => t !== undefined && t !== null)
  
  return `在纯水中进行温度调节实验，温度范围为 ${Math.min(...temps).toFixed(1)}~${Math.max(...temps).toFixed(1)}°C。测量得到声速平均值为 ${avgSpeed.toFixed(1)} m/s，理论声速为 ${avgTheoSpeed.toFixed(1)} m/s，百分误差为 ${Math.abs(error).toFixed(2)}%。通过线性拟合得到声速温度系数为 ${coefficient.toFixed(3)} m/s·°C，与理论值 3.460 m/s·°C 的偏差为 ${Math.abs(((coefficient - 3.46) / 3.46) * 100).toFixed(2)}%。数据一致性为${consistency}，实验结果表明纯水中声速随温度线性增加，符合理论预期。`
}

const getTemperatureStatus = () => {
  const records = getTemperatureRecords()
  if (records.length >= 3) return 'completed'
  if (records.length > 0) return 'partial'
  return 'empty'
}

const getTemperatureStatusText = () => {
  const records = getTemperatureRecords()
  if (records.length >= 3) return '✓ 已完成'
  if (records.length > 0) return `◐ ${records.length}组数据`
  return '○ 未开始'
}

const showArchiveManager = ref(false)
const reportArchives = ref([])
const viewingArchive = ref(null)

const loadArchives = () => {
  reportArchives.value = getReportArchives()
}

const createReportArchive = () => {
  if (!props.records || props.records.length === 0) {
    ElMessage.warning('暂无实验数据，无法创建存档')
    return
  }
  
  ElMessageBox.prompt('请输入存档名称', '创建报告存档', {
    confirmButtonText: '创建',
    cancelButtonText: '取消',
    inputValue: `报告存档 ${new Date().toLocaleString('zh-CN')}`,
    inputValidator: (value) => {
      if (!value || !value.trim()) {
        return '存档名称不能为空'
      }
      return true
    }
  }).then(({ value }) => {
    const currentMode = activeTab.value === 'temperature' ? 'temperature' : 'wavelength'
    const archive = saveReportArchive(value, props.records, props.params, currentMode)
    if (archive) {
      ElMessage.success('存档创建成功')
      loadArchives()
    } else {
      ElMessage.error('存档创建失败')
    }
  }).catch(() => {})
}

const viewArchive = (archive) => {
  viewingArchive.value = archive
}

const deleteArchive = (id) => {
  ElMessageBox.confirm('确定要删除这个存档吗？', '删除确认', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    if (deleteReportArchive(id)) {
      ElMessage.success('存档已删除')
      loadArchives()
      if (viewingArchive.value?.id === id) {
        viewingArchive.value = null
      }
    }
  }).catch(() => {})
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN')
}

const getModeName = (mode) => {
  const modes = {
    wavelength: '光波长影响',
    frequency: '超声频率影响',
    concentration: '液体浓度影响',
    temperature: '温度调节'
  }
  return modes[mode] || mode
}

loadArchives()
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
  overflow: hidden;
}

.report-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
}

.report-tabs {
  display: flex;
  background: #f1f5f9;
  border-bottom: 2px solid #e2e8f0;
}

.report-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 20px;
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  font-size: 15px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.3s;
}

.report-tab:hover {
  background: #e2e8f0;
  color: #334155;
}

.report-tab.active {
  background: #fff;
  color: #1e40af;
  border-bottom-color: #3b82f6;
}

.tab-icon {
  font-size: 18px;
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

.section-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-status {
  font-size: 13px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 12px;
}

.btn-save-section {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-save-section:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-save-section:active {
  transform: translateY(0);
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

.objective-list {
  padding-left: 24px;
  margin: 10px 0;
}

.objective-list li {
  font-size: 14px;
  line-height: 1.8;
  color: #4b5563;
  margin-bottom: 6px;
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

.archive-btn {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.archive-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(245, 158, 11, 0.4);
}

.archive-manager {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 3000;
}

.archive-manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: linear-gradient(135deg, #78350f 0%, #92400e 100%);
  border-radius: 12px 12px 0 0;
}

.archive-manager-title {
  font-size: 18px;
  font-weight: bold;
  color: white;
}

.archive-manager-close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 24px;
  cursor: pointer;
}

.archive-manager-body {
  background: white;
  padding: 20px;
  min-width: 500px;
  max-width: 700px;
  max-height: 500px;
  overflow-y: auto;
  border-radius: 0 0 12px 12px;
}

.archive-actions {
  margin-bottom: 20px;
}

.btn-create-archive {
  padding: 12px 24px;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-create-archive:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.archive-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.archive-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  transition: all 0.2s;
}

.archive-item:hover {
  background: #f3f4f6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.archive-item-info {
  flex: 1;
}

.archive-item-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 6px;
}

.archive-item-meta {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #6b7280;
}

.archive-item-actions {
  display: flex;
  gap: 8px;
}

.btn-view, .btn-delete {
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-view {
  background: #3b82f6;
  color: white;
}

.btn-view:hover {
  background: #2563eb;
}

.btn-delete {
  background: #ef4444;
  color: white;
}

.btn-delete:hover {
  background: #dc2626;
}

.archive-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  color: #6b7280;
}

.archive-empty span {
  font-size: 48px;
  margin-bottom: 10px;
}

.archive-empty p {
  margin: 5px 0;
}

.archive-empty .hint {
  font-size: 13px;
  color: #9ca3af;
}

.archive-viewer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  z-index: 3100;
  display: flex;
  flex-direction: column;
}

.archive-viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
  color: white;
}

.archive-viewer-header button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.archive-viewer-header button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.archive-viewer-body {
  flex: 1;
  background: white;
  padding: 30px;
  overflow-y: auto;
}

.archive-viewer-body .data-table-container {
  margin-bottom: 20px;
}

.archive-summary {
  padding: 15px;
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 8px;
}

.archive-summary p {
  margin: 5px 0;
  color: #0369a1;
  font-size: 14px;
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
