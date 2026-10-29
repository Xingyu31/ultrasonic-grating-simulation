// 实验过程赋分引擎（22步，总分100分）
// 事件类步骤由操作触发（events），数据类步骤由实验记录与参数自动判定
import { SCORE_STEPS } from './scoringRules'

const LIQUID_TYPES = {
  'pure-water': { baseSpeed: 1480, speedFactor: 0, temperatureFormula: (t) => 1398 + 3.46 * t },
  nacl: { baseSpeed: 1482.3, speedFactor: 4.945 },
  'ethylene-glycol': { baseSpeed: 1500, speedFactor: 10 },
  glycerol: { baseSpeed: 1480, speedFactor: 12 },
  sugar: { baseSpeed: 1480, speedFactor: 5.5 },
  alcohol: { baseSpeed: 1480, speedFactor: -2.5 }
}

const getTheoreticalSpeed = (record) => {
  const data = LIQUID_TYPES[record.liquidTypeId] || LIQUID_TYPES.nacl
  if (record.liquidTypeId === 'pure-water' && data.temperatureFormula) {
    return data.temperatureFormula(record.temperature || 20)
  }
  return data.baseSpeed + (record.concentration || 0) * data.speedFactor
}

const mean = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length

const linearFit = (xs, ys) => {
  const n = xs.length
  if (n < 2) return null
  const sumX = xs.reduce((a, b) => a + b, 0)
  const sumY = ys.reduce((a, b) => a + b, 0)
  const sumXY = xs.reduce((acc, x, i) => acc + x * ys[i], 0)
  const sumX2 = xs.reduce((acc, x) => acc + x * x, 0)
  const denom = n * sumX2 - sumX * sumX
  if (Math.abs(denom) < 1e-12) return null
  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n
  const meanY = sumY / n
  const sst = ys.reduce((acc, y) => acc + Math.pow(y - meanY, 2), 0)
  const sse = ys.reduce((acc, y, i) => acc + Math.pow(y - (slope * xs[i] + intercept), 2), 0)
  const r2 = sst > 1e-12 ? 1 - sse / sst : 1
  return { slope, intercept, r2 }
}

export const computeScores = (records = [], params = {}, events = {}) => {
  const all = records || []
  const byMode = (m) => all.filter((r) => r.experimentMode === m)
  const concRecs = byMode('concentration')
  const waveRecs = byMode('wavelength')
  const freqRecs = byMode('frequency')
  const hasData = all.length > 0
  const hasPureWater = all.some((r) => r.liquidTypeId === 'pure-water')
  const speedRecs = all.filter((r) => Number.isFinite(r.speed))
  const validSpacing = speedRecs.filter((r) => r.spacing > 0)
  const avgError = speedRecs.length
    ? mean(speedRecs.map((r) => {
        const theo = getTheoreticalSpeed(r)
        return theo > 0 ? (Math.abs(r.speed - theo) / theo) * 100 : 100
      }))
    : 100

  const scores = {}
  const details = {}
  const put = (id, score, detail) => {
    scores[id] = Math.max(0, score)
    details[id] = detail
  }

  // 1~8 仪器搭建与光路调节（事件类）
  const setup = {
    1: ['已进入实验并阅读实验须知', 2],
    2: ['已打开激光器参数面板', 3],
    3: ['已开启激光，光路接通', 4],
    4: ['已打开超声液槽参数面板', 4],
    5: ['已打开信号发生器参数面板', 3],
    6: ['已打开望远镜调焦面板', 4],
    7: ['已打开CCD相机参数面板', 4]
  }
  Object.entries(setup).forEach(([id, [, full]]) => {
    const n = Number(id)
    put(n, events[n] ? full : 0, events[n] ? setup[n][0] : '尚未完成该步骤')
  })
  put(8, events[8] || hasData ? 5 : 0, events[8] || hasData ? '已完成光路校验并采集衍射数据' : '尚未完成光路校验')

  // 9 设置波长
  {
    const wl = params.wavelength
    const valid = wl >= 380 && wl <= 780
    put(
      9,
      events[9] ? (valid ? 3 : 1) : 0,
      !events[9]
        ? '尚未设置入射波长'
        : valid
          ? `已设置入射波长 ${Number(wl).toFixed(1)} nm`
          : `波长 ${Number(wl).toFixed(1)} nm 超出380~780 nm，已按边界处理`
    )
  }

  // 10 设置频率
  {
    const f = params.frequency
    const valid = f >= 4 && f <= 15
    put(
      10,
      events[10] ? (valid ? 5 : 3) : 0,
      !events[10]
        ? '尚未设置超声频率'
        : valid
          ? `已设置超声频率 ${Number(f).toFixed(1)} MHz`
          : '所选频率不在谐振档位范围，已降档计分'
    )
  }

  // 11 纯水仿真
  put(
    11,
    hasPureWater || events[11] ? 4 : hasData ? 2 : 0,
    hasPureWater || events[11] ? '已在纯水模式下运行仿真' : hasData ? '已在其他液体中测量，未做纯水基准' : '尚未运行仿真'
  )

  // 12 调焦保存
  put(12, events[12] || hasData ? 4 : 0, events[12] || hasData ? '已完成调焦并保存图像' : '尚未完成调焦采集')

  // 13 游标测间距
  {
    let score = 0
    let detail = '尚未进行游标测量'
    if (validSpacing.length > 0) {
      if (avgError <= 5) {
        score = 6
        detail = `读数完整，平均百分误差 ${avgError.toFixed(2)}%`
      } else if (avgError <= 10) {
        score = 4
        detail = `读数完整，平均百分误差 ${avgError.toFixed(2)}%，偏差偏大`
      } else {
        score = 2
        detail = `平均百分误差 ${avgError.toFixed(2)}%，请重新对准条纹中心`
      }
    } else if (validSpacing.length === 0 && speedRecs.length > 0) {
      detail = '条纹间距读数无效，请重新用游标对准±1级条纹中心'
    }
    put(13, score, detail)
  }

  // 14 浓度数据
  put(14, Math.min(concRecs.length, 8), `已完成 ${concRecs.length} 组浓度测量，每完成1组得1分`)

  // 15 浓度拟合
  {
    let score = 0
    let detail = '浓度数据不足2组，无法拟合'
    if (concRecs.length >= 2) {
      const fitRecs = concRecs.filter((r) => Number.isFinite(r.speed))
      score = 4
      detail = '已完成浓度-声速线性拟合'
      const fit = linearFit(fitRecs.map((r) => r.concentration), fitRecs.map((r) => r.speed))
      const theoSlope = (LIQUID_TYPES[concRecs[0].liquidTypeId] || LIQUID_TYPES.nacl).speedFactor
      if (fit && Math.abs(theoSlope) > 1e-9) {
        const slopeErr = Math.abs((fit.slope - theoSlope) / theoSlope) * 100
        if (slopeErr <= 10 && fit.r2 >= 0.99) {
          score = 7
          detail = `拟合斜率偏差 ${slopeErr.toFixed(1)}%，相关系数 ${Math.sqrt(fit.r2).toFixed(4)}`
        } else {
          detail = `拟合斜率偏差 ${slopeErr.toFixed(1)}%，相关系数 ${Math.sqrt(fit.r2).toFixed(4)}`
        }
      }
    }
    put(15, score, detail)
  }

  // 16 波长系列
  put(16, Math.min(waveRecs.length, 6), `已完成 ${waveRecs.length} 个波长点，每点1分`)
  // 17 频率系列
  put(17, Math.round(Math.min(freqRecs.length, 8) * 0.75 * 10) / 10, `已完成 ${freqRecs.length} 个频率点，每点0.75分`)
  // 18 不确定度分析
  put(
    18,
    freqRecs.length >= 3 ? 5 : freqRecs.length >= 1 ? 2 : 0,
    freqRecs.length >= 3
      ? `已基于 ${freqRecs.length} 组频率数据完成不确定度分析`
      : freqRecs.length >= 1
        ? '频率数据仅1~2组，分析参考性有限'
        : '尚未开展不确定度分析'
  )

  // 19、20 未知浓度测定与反推
  {
    const ready = events[19] || concRecs.length >= 5
    put(19, ready ? 5 : 0, ready ? '已完成未知浓度测量' : '尚未开展未知浓度测定')
    put(
      20,
      ready ? (avgError <= 5 ? 5 : 3) : 0,
      ready ? `已完成浓度反推，平均百分误差 ${avgError.toFixed(2)}%` : '尚未进行浓度反推'
    )
  }

  // 21 导出报告、22 查看评价
  put(21, events[21] ? 4 : 0, events[21] ? '已导出实验报告' : '尚未导出实验报告')
  put(22, events[22] ? 3 : 0, events[22] ? '已查看评分与改进建议' : '尚未查看智能评价')

  const items = SCORE_STEPS.map((rule) => ({
    id: rule.id,
    name: rule.name,
    full: rule.full,
    score: Math.round((scores[rule.id] || 0) * 10) / 10,
    detail: details[rule.id] || ''
  }))
  const total = Math.round(items.reduce((acc, it) => acc + it.score, 0) * 10) / 10

  let grade = '待提高'
  let gradeType = 'fail'
  if (total >= 90) {
    grade = '优秀'
    gradeType = 'excellent'
  } else if (total >= 80) {
    grade = '良好'
    gradeType = 'good'
  } else if (total >= 70) {
    grade = '中等'
    gradeType = 'medium'
  } else if (total >= 60) {
    grade = '及格'
    gradeType = 'pass'
  }

  const suggestions = []
  if (concRecs.length < 8) suggestions.push('浓度实验建议补足至8组，使标准曲线覆盖0~26.47 wt%全量程')
  if (waveRecs.length < 6) suggestions.push(`波长系列仅完成 ${waveRecs.length} 个点，建议补足6个点以验证光波长不影响声速`)
  if (freqRecs.length < 8) suggestions.push(`频率系列仅完成 ${freqRecs.length} 个点，建议补足8个点以验证间距与频率成反比`)
  if (hasData && !hasPureWater && avgError > 5) suggestions.push('测量误差偏大，建议重新对焦至条纹清晰后再用游标对准±1级条纹中心读数')
  if (suggestions.length === 0) suggestions.push('各步骤完成质量较高，可尝试自主设计参数组合开展探究性实验')

  return { items, total, grade, gradeType, suggestions }
}

export const computeExperimentScore = (records = [], params = {}, events = {}) =>
  computeScores(records, params, events)
