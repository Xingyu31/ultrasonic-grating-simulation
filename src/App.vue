<template>
  <div class="app-container">
    <WelcomePage v-if="!experimentStarted" @start="startExperiment" />
    
    <template v-else>
      <div class="title-bar">
        <div class="title-left">
          <span class="app-icon">🔬</span>
          <div class="title-text">
            <span class="app-title">超声光栅衍射虚拟仿真实验</span>
            <span v-if="currentView === 'simulation'" class="mode-label">实物仪器实操仿真模式</span>
            <span v-if="currentView === 'archiveMeasure'" class="mode-label">🔍 未知浓度测量模式</span>
          </div>
          <span class="version-badge">V3.0</span>
        </div>
        <div class="title-right">
          <button class="nav-btn" :class="{ active: currentView === 'measurement' }"
                  @click="currentView = 'measurement'">
            <span>📊</span> 测量界面
          </button>
          <button class="nav-btn" :class="{ active: currentView === 'simulation' }"
                  @click="currentView = 'simulation'">
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
        <KeepAlive>
          <MeasurementView v-if="currentView === 'measurement'"
                           :params="params"
                           :records="experimentRecords"
                           :experimentMode="experimentMode"
                           @update:params="updateParams"
                           @update:records="updateRecords"
                           @update:mode="setExperimentMode" />
          
          <SimulationView v-else-if="currentView === 'simulation' && !selectedArchive"
                          :params="params"
                          :experimentMode="experimentMode"
                          @update:params="updateParams"
                          @update:mode="setExperimentMode"
                          @addRecord="handleAddRecord"
                          @switch-view="currentView = $event" />
          <ArchiveSimulationView v-else-if="currentView === 'simulation' && selectedArchive"
                                 :params="params"
                                 :experimentMode="experimentMode"
                                 @update:params="updateParams"
                                 @update:mode="setExperimentMode"
                                 @openMeasure="returnToArchiveMeasure" />
        </KeepAlive>
        
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
import { ref, reactive } from 'vue'
import MeasurementView from './components/MeasurementView.vue'
import SimulationView from './components/SimulationView.vue'
import Instrument3DScene from './components/Instrument3DScene.vue'
import ArchiveSimulationView from './components/ArchiveSimulationView.vue'
import WelcomePage from './components/WelcomePage.vue'
import ReportView from './components/ReportView.vue'
import ArchiveList from './components/ArchiveList.vue'
import ArchiveMeasureView from './components/ArchiveMeasureView.vue'

const experimentStarted = ref(false)
const currentView = ref('simulation')
const showReport = ref(false)
const showArchiveList = ref(false)
const experimentMode = ref('wavelength')
const selectedArchive = ref(null)

const startExperiment = () => {
  experimentStarted.value = true
}

const params = reactive({
  concentration: 7.7404479578,
  wavelength: 600.79051383,
  frequency: 8.0,
  amplitude: 50,
  distance: 0.3,
  gratingWidth: 0.01,
  temperature: 20,
  liquidType: '氯化钠溶液',
  liquidTypeId: 'nacl'
})

const experimentRecords = ref([])

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

const exitArchiveMeasure = () => {
  currentView.value = 'simulation'
  selectedArchive.value = null
}

const openInstrumentFromArchive = () => {
  currentView.value = 'simulation'
}

const returnToArchiveMeasure = (fromSimulationParams) => {
  if (fromSimulationParams) {
    Object.assign(params, fromSimulationParams)
  }
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