<template>
  <div class="score-overlay" @click.self="$emit('close')">
    <div class="score-modal">
      <div class="score-header">
        <div>
          <h2>🎯 实验赋分提示</h2>
          <p>对照22个实验步骤实时评分，完成或修正操作后立即给出得分/扣分提示</p>
        </div>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="score-summary">
        <div class="total-box">
          <span class="total-num">{{ scoreState.total }}</span>
          <span class="total-label">/ 100 分</span>
        </div>
        <div class="grade-box" :class="scoreState.gradeType">{{ scoreState.grade }}</div>
        <div class="summary-stat">
          <div class="stat-line">
            <span>已完成步骤：{{ completedCount }} / 22</span>
            <span>累计得分：{{ scoreState.total }} 分</span>
          </div>
          <div class="progress">
            <div class="progress-inner" :style="{ width: Math.min(scoreState.total, 100) + '%' }"></div>
          </div>
        </div>
      </div>

      <div class="score-table-wrap">
        <table>
          <thead>
            <tr>
              <th class="col-id">序号</th>
              <th class="col-name">实验步骤</th>
              <th class="col-full">满分</th>
              <th class="col-score">得分</th>
              <th class="col-status">状态</th>
              <th class="col-model">赋分标准</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in scoreState.items" :key="item.id" :class="rowClass(item)">
              <td class="col-id">{{ item.id }}</td>
              <td class="step-name">{{ item.name }}</td>
              <td class="col-full">{{ item.full }}</td>
              <td class="step-score">{{ item.score }}</td>
              <td class="col-status">
                <span class="status" :class="statusClass(item)">{{ statusText(item) }}</span>
              </td>
              <td class="step-model">{{ SCORE_STEPS[idx].model }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="4">总分（{{ scoreState.grade }}）</td>
              <td colspan="2" class="foot-score">{{ scoreState.total }} / 100</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div class="suggestions">
        <h3>改进建议</h3>
        <ul>
          <li v-for="(s, i) in scoreState.suggestions" :key="i">{{ s }}</li>
        </ul>
      </div>

      <div class="score-footer">
        <span>评分依据当前实验记录与操作进度自动计算；删除数据或参数越界时会相应扣分。</span>
        <button class="ok-btn" @click="$emit('close')">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { scoreState, markStep } from '../utils/scoreStore'
import { SCORE_STEPS } from '../utils/scoringRules'

defineEmits(['close'])

const completedCount = computed(() => scoreState.items.filter((it) => it.score >= it.full).length)

const statusText = (item) => {
  if (item.score >= item.full) return '已完成'
  if (item.score > 0) return '部分得分'
  return '未完成'
}

const statusClass = (item) => {
  if (item.score >= item.full) return 'done'
  if (item.score > 0) return 'partial'
  return 'none'
}

const rowClass = (item) => ({
  'row-done': item.score >= item.full,
  'row-partial': item.score > 0 && item.score < item.full,
  'row-none': item.score <= 0
})

onMounted(() => {
  markStep(22)
})
</script>

<style scoped>
.score-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3000;
}

.score-modal {
  width: min(960px, 95vw);
  max-height: 90vh;
  background: #ffffff;
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.score-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 18px 24px 12px;
  background: linear-gradient(135deg, #eff6ff, #f8fafc);
  border-bottom: 1px solid #e2e8f0;
}

.score-header h2 {
  margin: 0 0 4px;
  font-size: 19px;
  color: #1e3a8a;
}

.score-header p {
  margin: 0;
  font-size: 12.5px;
  color: #64748b;
}

.close-btn {
  border: none;
  background: transparent;
  font-size: 20px;
  color: #64748b;
  cursor: pointer;
  line-height: 1;
}

.score-summary {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 14px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.total-box {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.total-num {
  font-size: 34px;
  font-weight: 800;
  color: #1d4ed8;
  line-height: 1;
}

.total-label {
  font-size: 13px;
  color: #64748b;
}

.grade-box {
  padding: 5px 14px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  background: #94a3b8;
}

.grade-box.excellent { background: #16a34a; }
.grade-box.good { background: #2563eb; }
.grade-box.medium { background: #d97706; }
.grade-box.pass { background: #ea580c; }
.grade-box.fail { background: #94a3b8; }

.summary-stat {
  flex: 1;
}

.stat-line {
  display: flex;
  justify-content: space-between;
  font-size: 12.5px;
  color: #475569;
  margin-bottom: 6px;
}

.progress {
  height: 8px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.progress-inner {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #22c55e);
  transition: width 0.3s ease;
}

.score-table-wrap {
  overflow-y: auto;
  padding: 0 24px;
  flex: 1;
}

.score-table-wrap table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.score-table-wrap thead th {
  position: sticky;
  top: 0;
  background: #f8fafc;
  color: #334155;
  font-weight: 700;
  padding: 9px 8px;
  border-bottom: 1px solid #cbd5e1;
  z-index: 2;
}

.col-id { width: 44px; text-align: center; }
.col-full { width: 48px; text-align: center; }
.col-score { width: 52px; text-align: center; }
.col-status { width: 84px; text-align: center; }
.col-model { width: 34%; }

.score-table-wrap tbody td {
  padding: 8px;
  border-bottom: 1px solid #eef2f7;
  vertical-align: middle;
}

.step-name {
  color: #1e293b;
  font-weight: 500;
}

.step-score {
  text-align: center;
  font-weight: 700;
  color: #1d4ed8;
}

.step-model {
  color: #64748b;
  line-height: 1.5;
}

.status {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.status.done { background: #dcfce7; color: #15803d; }
.status.partial { background: #fef3c7; color: #b45309; }
.status.none { background: #f1f5f9; color: #94a3b8; }

.row-done { background: #fbfefc; }
.row-partial { background: #fffdf5; }
.row-none { background: #ffffff; }

tfoot td {
  padding: 10px 8px;
  font-weight: 700;
  color: #1e3a8a;
  border-top: 2px solid #cbd5e1;
  background: #f8fafc;
}

.foot-score {
  text-align: right;
  color: #1d4ed8;
}

.suggestions {
  padding: 12px 24px 6px;
  border-top: 1px solid #e2e8f0;
  background: #f8fbff;
}

.suggestions h3 {
  margin: 0 0 6px;
  font-size: 13px;
  color: #1d4ed8;
}

.suggestions ul {
  margin: 0;
  padding-left: 20px;
  max-height: 88px;
  overflow-y: auto;
}

.suggestions li {
  font-size: 12px;
  color: #475569;
  line-height: 1.7;
}

.score-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 24px 16px;
  border-top: 1px solid #e2e8f0;
}

.score-footer span {
  font-size: 11.5px;
  color: #94a3b8;
}

.ok-btn {
  padding: 7px 20px;
  border: none;
  border-radius: 8px;
  background: #2563eb;
  color: #fff;
  font-size: 13px;
  cursor: pointer;
}
</style>
