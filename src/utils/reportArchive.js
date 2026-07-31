const REPORT_ARCHIVES_KEY = 'ultrasonic_grating_report_archives'

export const getReportArchives = () => {
  try {
    const data = localStorage.getItem(REPORT_ARCHIVES_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export const saveReportArchive = (name, records, params, mode) => {
  try {
    const archive = {
      id: Date.now().toString(),
      name: name || `存档 ${new Date().toLocaleString('zh-CN')}`,
      createdAt: Date.now(),
      records: records || [],
      params: params || {},
      mode: mode || 'wavelength'
    }
    
    const archives = getReportArchives()
    archives.unshift(archive)
    
    localStorage.setItem(REPORT_ARCHIVES_KEY, JSON.stringify(archives))
    
    return archive
  } catch (e) {
    console.error('Failed to save report archive:', e)
    return null
  }
}

export const deleteReportArchive = (id) => {
  try {
    const archives = getReportArchives().filter(a => a.id !== id)
    localStorage.setItem(REPORT_ARCHIVES_KEY, JSON.stringify(archives))
    return true
  } catch (e) {
    console.error('Failed to delete report archive:', e)
    return false
  }
}

export const getReportArchiveById = (id) => {
  const archives = getReportArchives()
  return archives.find(a => a.id === id)
}

export const clearAllReportArchives = () => {
  try {
    localStorage.removeItem(REPORT_ARCHIVES_KEY)
    return true
  } catch (e) {
    console.error('Failed to clear report archives:', e)
    return false
  }
}
