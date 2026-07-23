const ARCHIVE_KEY = 'ultrasonic_grating_archives'

export const saveArchive = (records) => {
  const points = records
    .filter(r => r.concentration !== undefined && r.concentration !== null && !isNaN(r.concentration) && r.concentration >= 0 &&
                 r.speed !== undefined && r.speed !== null && !isNaN(r.speed) && r.speed > 0)
    .map(r => ({
      concentration: r.concentration,
      speed: r.speed
    }))
  
  if (points.length < 3) {
    return { success: false, message: `需要至少3组有效数据才能创建存档，当前只有${points.length}组有效数据` }
  }
  
  const n = points.length
  const sumX = points.reduce((acc, p) => acc + p.concentration, 0)
  const sumY = points.reduce((acc, p) => acc + p.speed, 0)
  const sumXY = points.reduce((acc, p) => acc + p.concentration * p.speed, 0)
  const sumX2 = points.reduce((acc, p) => acc + p.concentration * p.concentration, 0)
  
  const denom = n * sumX2 - sumX * sumX
  if (Math.abs(denom) < 1e-10) {
    return { success: false, message: '数据不足，无法进行拟合' }
  }
  
  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n
  
  const archive = {
    id: Date.now().toString(),
    name: `校准曲线 ${new Date().toLocaleString()}`,
    createdAt: Date.now(),
    points,
    slope,
    intercept,
    recordCount: points.length,
    speedMin: Math.min(...points.map(p => p.speed)),
    speedMax: Math.max(...points.map(p => p.speed)),
    concentrationMin: Math.min(...points.map(p => p.concentration)),
    concentrationMax: Math.max(...points.map(p => p.concentration))
  }
  
  const archives = getArchives()
  archives.unshift(archive)
  
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archives))
  
  return { success: true, message: '存档创建成功', archive }
}

export const getArchives = () => {
  try {
    const data = localStorage.getItem(ARCHIVE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export const getArchiveById = (id) => {
  const archives = getArchives()
  return archives.find(a => a.id === id)
}

export const deleteArchive = (id) => {
  const archives = getArchives().filter(a => a.id !== id)
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archives))
}

export const updateArchiveName = (id, name) => {
  const archives = getArchives()
  const archive = archives.find(a => a.id === id)
  if (archive) {
    archive.name = name
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(archives))
  }
}

export const calculateConcentration = (archive, speed) => {
  if (!archive || !archive.slope) return null
  const concentration = (speed - archive.intercept) / archive.slope
  return concentration
}

export const calculateSpeed = (archive, concentration) => {
  if (!archive || !archive.slope) return null
  return archive.intercept + archive.slope * concentration
}
