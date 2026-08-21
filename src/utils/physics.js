export const WATER_TEMPERATURE_RANGE = Object.freeze({ min: 0, max: 80 })

export const RESONANT_FREQUENCIES_MHZ = Object.freeze([4, 5, 6, 8, 10, 12, 15])

export const ACOUSTIC_ALGORITHM_SUMMARY = Object.freeze([
  '纯水声速采用 0-80 °C 多项式近似，覆盖水温升高后声速变化趋缓的转折区。',
  '盐溶液默认在 20 °C 下用 v = 1482.3 + 4.945c 近似，浓度越高声速越大。',
  '衍射条纹用 D = 2kλfL / v 计算，k=1；波长和频率增大使条纹间距增大，声速增大使条纹间距减小。',
  '声强曲线由单缝包络 sinc² 与声光相位调制项叠加，超声振幅用于调制高级次亮度。'
])

const clamp = (value, min, max) => Math.min(max, Math.max(min, Number(value) || 0))

export const snapToResonantFrequency = (frequency) => {
  const value = Number(frequency)
  if (!Number.isFinite(value)) return RESONANT_FREQUENCIES_MHZ[0]
  return RESONANT_FREQUENCIES_MHZ.reduce((closest, candidate) => {
    return Math.abs(candidate - value) < Math.abs(closest - value) ? candidate : closest
  }, RESONANT_FREQUENCIES_MHZ[0])
}

export const getResonanceMarks = () => {
  return RESONANT_FREQUENCIES_MHZ.reduce((marks, frequency) => {
    marks[frequency] = `${frequency}MHz`
    return marks
  }, {})
}

export const waterSoundSpeed = (temperature) => {
  const t = clamp(temperature, WATER_TEMPERATURE_RANGE.min, WATER_TEMPERATURE_RANGE.max)
  return 1402.388
    + 5.0383 * t
    - 5.8109e-2 * t ** 2
    + 3.3432e-4 * t ** 3
    - 1.47797e-6 * t ** 4
    + 3.1419e-9 * t ** 5
}

export const liquidConfigs = Object.freeze({
  'pure-water': {
    id: 'pure-water',
    name: '纯水（0 wt% NaCl）',
    baseSpeed: 1482.3,
    speedFactor: 0,
    minConcentration: 0,
    maxConcentration: 0,
    minTemperature: WATER_TEMPERATURE_RANGE.min,
    maxTemperature: WATER_TEMPERATURE_RANGE.max,
    temperatureFormula: waterSoundSpeed
  },
  nacl: {
    id: 'nacl',
    name: '氯化钠溶液',
    baseSpeed: 1482.3,
    speedFactor: 4.945,
    minConcentration: 0,
    maxConcentration: 26.47,
    temperatureFormula: null
  },
  'ethylene-glycol': { id: 'ethylene-glycol', name: '乙二醇溶液', baseSpeed: 1500, speedFactor: 10 },
  glycerol: { id: 'glycerol', name: '甘油溶液', baseSpeed: 1480, speedFactor: 12 },
  sugar: { id: 'sugar', name: '蔗糖溶液', baseSpeed: 1480, speedFactor: 5.5 },
  alcohol: { id: 'alcohol', name: '酒精溶液', baseSpeed: 1480, speedFactor: -2.5 },
  hcl: { id: 'hcl', name: '盐酸溶液', baseSpeed: 1480, speedFactor: 8 },
  naoh: { id: 'naoh', name: '氢氧化钠溶液', baseSpeed: 1480, speedFactor: 7 }
})

export const getSoundSpeed = (liquidTypeId = 'nacl', concentration = 0, temperature = 20) => {
  const config = liquidConfigs[liquidTypeId] || liquidConfigs.nacl

  if (config.temperatureFormula) {
    return config.temperatureFormula(temperature)
  }

  if (config.tableData) {
    const tableData = config.tableData
    if (concentration <= tableData[0].wt) return tableData[0].speed
    if (concentration >= tableData[tableData.length - 1].wt) return tableData[tableData.length - 1].speed

    for (let i = 0; i < tableData.length - 1; i += 1) {
      const current = tableData[i]
      const next = tableData[i + 1]
      if (concentration >= current.wt && concentration <= next.wt) {
        const ratio = (concentration - current.wt) / (next.wt - current.wt)
        return current.speed + ratio * (next.speed - current.speed)
      }
    }
  }

  return config.baseSpeed + concentration * config.speedFactor
}

export const computeUltrasonicWavelength = (frequencyMhz, soundSpeed) => {
  const frequencyHz = Math.max(0.001, Number(frequencyMhz) || 0) * 1e6
  return soundSpeed / frequencyHz
}

export const computeFringePosition = ({ order = 1, wavelengthNm, frequencyMhz, distanceM, soundSpeed }) => {
  const opticalWavelengthM = wavelengthNm * 1e-9
  const acousticWavelengthM = computeUltrasonicWavelength(frequencyMhz, soundSpeed)
  return order * opticalWavelengthM * distanceM / acousticWavelengthM
}

export const computeFringeSpacing = ({ order = 1, wavelengthNm, frequencyMhz, distanceM, soundSpeed }) => {
  const plus = computeFringePosition({ order, wavelengthNm, frequencyMhz, distanceM, soundSpeed })
  const minus = computeFringePosition({ order: -order, wavelengthNm, frequencyMhz, distanceM, soundSpeed })
  return Math.abs(plus - minus)
}

export const computeDiffractionIntensity = ({
  x,
  wavelengthNm,
  frequencyMhz,
  distanceM,
  gratingWidthM,
  soundSpeed,
  amplitude = 50
}) => {
  const opticalWavelengthM = wavelengthNm * 1e-9
  const acousticWavelengthM = computeUltrasonicWavelength(frequencyMhz, soundSpeed)
  const k = 2 * Math.PI / opticalWavelengthM
  const characteristicScale = gratingWidthM / 5
  const u = k * characteristicScale * x / (2 * distanceM)
  const beta = k * acousticWavelengthM / 2
  const sinc = Math.abs(u) < 1e-9 ? 1 : Math.sin(u) / u
  const envelope = sinc ** 2
  const modulationDepth = 0.35 + 0.65 * clamp(amplitude, 0, 100) / 100
  const interference = (1 - modulationDepth) + modulationDepth * Math.cos(beta * x / distanceM) ** 2

  return envelope * interference
}

export const simulateMeasurement = ({
  wavelengthNm,
  frequencyMhz,
  distanceM,
  liquidTypeId,
  concentration,
  temperature,
  spacingNoiseRatio = 0.0025,
  speedNoise = 1.5
}) => {
  const baseSpeed = getSoundSpeed(liquidTypeId, concentration, temperature)
  const finalSpeed = baseSpeed + (Math.random() - 0.5) * speedNoise * 2
  const idealSpacing = computeFringeSpacing({
    wavelengthNm,
    frequencyMhz,
    distanceM,
    soundSpeed: finalSpeed
  })
  const measuredSpacing = idealSpacing + (Math.random() - 0.5) * spacingNoiseRatio * 2 * idealSpacing

  return {
    baseSpeed,
    speed: finalSpeed,
    spacingM: measuredSpacing,
    spacingMm: measuredSpacing * 1000,
    plus1Mm: (measuredSpacing * 1000) / 2,
    minus1Mm: -(measuredSpacing * 1000) / 2,
    snappedFrequencyMhz: Number(frequencyMhz) || RESONANT_FREQUENCIES_MHZ[0]
  }
}
