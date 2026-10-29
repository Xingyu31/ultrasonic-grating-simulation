// 赋分状态与实时提示
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { computeScores } from './scoring'

export const scoreState = reactive({
  events: {},
  records: [],
  params: {},
  items: [],
  total: 0,
  grade: '待提高',
  gradeType: 'fail',
  suggestions: [],
  active: false,
  lastScores: {}
})

const fmt = (n) => (Math.round(n * 10) / 10).toString()

export const refreshScores = (notify = true) => {
  const result = computeScores(scoreState.records, scoreState.params, scoreState.events)
  result.items.forEach((item) => {
    const prev = scoreState.lastScores[item.id] || 0
    const diff = Math.round((item.score - prev) * 10) / 10
    if (scoreState.active && notify && diff > 0) {
      ElMessage({
        message: `+${fmt(diff)}分｜步骤${item.id} ${item.name}：${item.detail}`,
        type: 'success',
        duration: 2400,
        showClose: true,
        grouping: true
      })
    } else if (scoreState.active && notify && diff < 0) {
      ElMessage({
        message: `−${fmt(-diff)}分｜步骤${item.id} ${item.name}：${item.detail}`,
        type: 'warning',
        duration: 2800,
        showClose: true,
        grouping: true
      })
    }
    scoreState.lastScores[item.id] = item.score
  })
  scoreState.items = result.items
  scoreState.total = result.total
  scoreState.grade = result.grade
  scoreState.gradeType = result.gradeType
  scoreState.suggestions = result.suggestions
  scoreState.active = true
}

export const setScoreContext = (records, params) => {
  scoreState.records = records || []
  scoreState.params = params || {}
  refreshScores()
}

// 标记某一步骤已完成并立即结算提示
export const markStep = (id) => {
  if (scoreState.events[id]) return
  scoreState.events[id] = true
  refreshScores()
}

export const resetScores = () => {
  scoreState.events = {}
  scoreState.lastScores = {}
  scoreState.active = false
  refreshScores(false)
}
