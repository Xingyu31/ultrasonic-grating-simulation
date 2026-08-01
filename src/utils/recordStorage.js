const RECORDS_KEY = 'ultrasonic_grating_records'
const PARAMS_KEY = 'ultrasonic_grating_params'
const MODE_KEY = 'ultrasonic_grating_mode'

export const saveRecords = (records) => {
  try {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records))
    return true
  } catch (e) {
    console.error('Failed to save records:', e)
    return false
  }
}

export const loadRecords = () => {
  try {
    const data = localStorage.getItem(RECORDS_KEY)
    return data ? JSON.parse(data) : []
  } catch (e) {
    console.error('Failed to load records:', e)
    return []
  }
}

export const clearRecords = () => {
  try {
    localStorage.removeItem(RECORDS_KEY)
    return true
  } catch (e) {
    console.error('Failed to clear records:', e)
    return false
  }
}

export const saveParams = (params) => {
  try {
    localStorage.setItem(PARAMS_KEY, JSON.stringify(params))
    return true
  } catch (e) {
    console.error('Failed to save params:', e)
    return false
  }
}

export const clearParams = () => {
  try {
    localStorage.removeItem(PARAMS_KEY)
    return true
  } catch (e) {
    console.error('Failed to clear params:', e)
    return false
  }
}

export const loadParams = () => {
  try {
    const data = localStorage.getItem(PARAMS_KEY)
    return data ? JSON.parse(data) : null
  } catch (e) {
    console.error('Failed to load params:', e)
    return null
  }
}

export const saveMode = (mode) => {
  try {
    localStorage.setItem(MODE_KEY, mode)
    return true
  } catch (e) {
    console.error('Failed to save mode:', e)
    return false
  }
}

export const loadMode = () => {
  try {
    return localStorage.getItem(MODE_KEY) || 'wavelength'
  } catch (e) {
    console.error('Failed to load mode:', e)
    return 'wavelength'
  }
}

export const getReportSnapshot = () => {
  return {
    records: loadRecords(),
    params: loadParams(),
    mode: loadMode(),
    timestamp: Date.now()
  }
}
