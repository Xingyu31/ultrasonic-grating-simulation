<template>
  <div class="app-container">
    <WelcomePage v-if="!experimentStarted" @start="startExperiment" />
    
    <template v-else>
      <div class="title-bar">
        <div class="title-left">
          <span class="app-icon">🔬</span>
          <div class="title-text">
            <span class="app-title">超声光栅虚拟仿真实验平台</span>
            <span v-if="currentView === 'simulation' && simulationMode === '3d'" class="mode-label">实物仪器实操仿真模式 (3D)</span>
            <span v-if="currentView === 'simulation' && simulationMode === '2d'" class="mode-label">实物仪器实操仿真模式 (2D - 存档)</span>
            <span v-if="currentView === 'archiveMeasure'" class="mode-label">🔍 未知浓度测量模式</span>
          </div>
          <span class="version-badge">V4.1</span>
        </div>
        <div class="title-right">
          <button class="nav-btn" :class="{ active: currentView === 'measurement' }"
                  @click="goToMeasurement">
            <span>📊</span> 测量界面
          </button>
          <button class="nav-btn" :class="{ active: currentView === 'simulation' }"
                  @click="goToSimulation3D">
            <span>🔧</span> 仪器仿真
          </button>
          <button class="archive-btn" @click="openArchiveList">
            <span>📁</span> 存档测量
          </button>
          <button class="report-btn" @click="openReport">
            <span>📄</span> 实验报告
          </button>
          <button v-if="currentView === 'simulation'" class="exit-btn" @click="exitFullScreen">✕ 退出全屏</button>
        </div>
      </div>
      
      <div class="main-content">
        <KeepAlive include="MeasurementView">
          <MeasurementView v-if="currentView === 'measurement'"
                           :params="params"
                           :records="experimentRecords"
                           :experimentMode="experimentMode"
                           @update:params="updateParams"
                           @update:records="updateRecords"
                           @update:mode="setExperimentMode" />
        </KeepAlive>
        
        <SimulationView v-if="currentView === 'simulation' && simulationMode === '3d'"
                        :params="params"
                        :experimentMode="experimentMode"
                        @update:params="updateParams"
                        @update:mode="setExperimentMode"
                        @addRecord="handleAddRecord"
                        @switch-view="currentView = $event" />
        <ArchiveSimulationView v-else-if="currentView === 'simulation' && simulationMode === '2d'"
                               :params="params"
                               :experimentMode="experimentMode"
                               @update:params="updateParams"
                               @update:mode="setExperimentMode"
                               @openMeasure="returnToArchiveMeasure" />
        
        <ArchiveMeasureView v-if="currentView === 'archiveMeasure'"
                            :archive="selectedArchive"
                            :params="params"
                            @exit="exitArchiveMeasure"
                            @openInstrument="openInstrumentFromArchive" />
      </div>
      
      <ReportView v-if="showReport"
                  :records="experimentRecords"
                  :params="params"
                  @close="closeReport" />
      
      <ArchiveList v-if="showArchiveList" @close="closeArchiveList" @select="selectArchive" />
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import MeasurementView from './components/MeasurementView.vue'
import SimulationView from './components/SimulationView.vue'
import Instrument3DScene from './components/Instrument3DScene.vue'
import ArchiveSimulationView from './components/ArchiveSimulationView.vue'
import WelcomePage from './components/WelcomePage.vue'
import ReportView from './components/ReportView.vue'
import ArchiveList from './components/ArchiveList.vue'
import ArchiveMeasureView from './components/ArchiveMeasureView.vue'
import { saveRecords, clearRecords, saveParams, clearParams, saveMode, loadMode } from './utils/recordStorage'

const experimentStarted = ref(false)
const currentView = ref('simulation')
const showReport = ref(false)
const showArchiveList = ref(false)
const experimentMode = ref('wavelength')
const selectedArchive = ref(null)
// 明确区分仿真入口：'3d' = 测量界面进入，'2d' = 存档测量界面进入
const simulationMode = ref('3d')

const startExperiment = () => {
  experimentStarted.value = true
}

const params = reactive({
  concentration: 7.7404479578,
  wavelength: 600.79051383,
  frequency: 8.0,
  amplitude: 50,
  distance: 0.3,
  gratingWidth: 0.0003,
  temperature: 20,
  liquidType: '氯化钠溶液',
  liquidTypeId: 'nacl'
})

const experimentRecords = ref([])

onMounted(() => {
  // 每次进入网址时清除上次的实验记录和参数，使用固定的默认参数
  clearRecords()
  clearParams()
  experimentRecords.value = []
  // params 保持固定的默认值，不加载上次保存的参数
  const savedMode = loadMode()
  if (savedMode) {
    experimentMode.value = savedMode
  }
})

watch(experimentRecords, (newRecords) => {
  saveRecords(newRecords)
}, { deep: true })

watch(params, (newParams) => {
  saveParams(newParams)
}, { deep: true })

watch(experimentMode, (newMode) => {
  saveMode(newMode)
})

const updateParams = (newParams) => {
  Object.assign(params, newParams)
}

const updateRecords = (records) => {
  experimentRecords.value = records
}

const handleAddRecord = (record) => {
  experimentRecords.value = [...experimentRecords.value, record]
}

const exitFullScreen = () => {
  if (document.fullscreenElement) {
    document.exitFullscreen()
  }
}

const setExperimentMode = (mode) => {
  experimentMode.value = mode
}

// 从测量界面进入 3D 仿真
const goToSimulation3D = () => {
  simulationMode.value = '3d'
  selectedArchive.value = null
  currentView.value = 'simulation'
}

// 返回测量界面（清除存档状态，确保 3D/2D 完全隔离）
const goToMeasurement = () => {
  simulationMode.value = '3d'
  selectedArchive.value = null
  currentView.value = 'measurement'
}

const openReport = () => {
  showReport.value = true
}

const closeReport = () => {
  showReport.value = false
}

const openArchiveList = () => {
  showArchiveList.value = true
}

const closeArchiveList = () => {
  showArchiveList.value = false
}

const selectArchive = (archive) => {
  selectedArchive.value = archive
  showArchiveList.value = false
  currentView.value = 'archiveMeasure'
}

// 退出存档测量 → 回到测量界面（3D 模式）
const exitArchiveMeasure = () => {
  simulationMode.value = '3d'
  selectedArchive.value = null
  currentView.value = 'measurement'
}

// 从存档测量界面进入 2D 仿真
const openInstrumentFromArchive = () => {
  simulationMode.value = '2d'
  currentView.value = 'simulation'
}

// 从 2D 仿真返回存档测量界面
const returnToArchiveMeasure = (fromSimulationParams) => {
  if (fromSimulationParams) {
    Object.assign(params, fromSimulationParams)
  }
  simulationMode.value = '2d'
  currentView.value = 'archiveMeasure'
}
</script>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: #f7f8fa;
  font-family: 'Microsoft YaHei', sans-serif;
}

.title-bar {
  height: 45px;
  background: linear-gradient(135deg, #4a5568 0%, #2d3748 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.15);
  z-index: 100;
}

.title-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-icon {
  font-size: 22px;
}

.title-text {
  display: flex;
  flex-direction: column;
}

.app-title {
  font-size: 16px;
  font-weight: bold;
  color: #ffffff;
  letter-spacing: 2px;
}

.mode-label {
  font-size: 11px;
  color: rgba(255,255,255,0.6);
}

.version-badge {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  font-size: 11px;
  font-weight: bold;
  padding: 3px 8px;
  border-radius: 10px;
}

.title-right {
  display: flex;
  gap: 8px;
}

.nav-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  background-color: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.8);
}

.nav-btn:hover {
  background-color: rgba(255,255,255,0.2);
  color: white;
}

.nav-btn.active {
  background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.4);
}

.archive-btn {
  background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.archive-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(243, 156, 18, 0.4);
}

.report-btn {
  background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.report-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(39, 174, 96, 0.4);
}

.exit-btn {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.exit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(231, 76, 60, 0.4);
}

.main-content {
  height: calc(100vh - 45px);
  overflow: hidden;
}
</style>
