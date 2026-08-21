<template>
  <div class="welcome-page">
    <div class="welcome-bg"></div>
    <div class="welcome-content">
      <div class="welcome-header">
        <div class="logo-container">
          <span class="logo-icon">🔬</span>
        </div>
        <h1 class="welcome-title">超声光栅虚拟仿真实验平台</h1>
        <p class="welcome-subtitle">Ultrasonic Grating Diffraction Virtual Simulation Experiment</p>
      </div>

      <div class="interaction-demo">
        <canvas ref="interactionCanvas" class="interaction-canvas"></canvas>
        <button class="demo-play-btn" @click="startInteractionDemo">
          {{ demoActive ? '重新演示' : '动画演示' }}
        </button>
      </div>
      
      <div class="welcome-features">
        <div class="feature-card">
          <span class="feature-icon">📊</span>
          <div class="feature-content">
            <h3>数据测量</h3>
            <p>精确测量衍射光斑位置，自动计算条纹间距</p>
          </div>
        </div>
        <div class="feature-card">
          <span class="feature-icon">🔧</span>
          <div class="feature-content">
            <h3>仪器仿真</h3>
            <p>真实模拟超声光栅实验仪器操作流程</p>
          </div>
        </div>
        <div class="feature-card">
          <span class="feature-icon">📈</span>
          <div class="feature-content">
            <h3>曲线拟合</h3>
            <p>基于v=2kλfL/D公式进行声速拟合计算</p>
          </div>
        </div>
      </div>
      
      <div class="welcome-principle">
        <div class="principle-header">
          <span class="principle-icon">📚</span>
          <h2>实验原理</h2>
        </div>
        <div class="principle-content">
          <div class="principle-item">
            <span class="principle-label">光栅方程</span>
            <span class="principle-formula">λ<sub>s</sub>sinθ<sub>k</sub> = kλ</span>
          </div>
          <div class="principle-item">
            <span class="principle-label">近似条件</span>
            <span class="principle-formula">sinθ<sub>k</sub> ≈ tanθ<sub>k</sub> = D<sub>k</sub>/(2L)</span>
          </div>
          <div class="principle-item">
            <span class="principle-label">声速公式</span>
            <span class="principle-formula highlight">v = 2kλfL/D</span>
          </div>
          <div class="principle-description">
            <p>超声波在液体中以弹性纵波形式传播，形成超声光栅。当平行光通过超声光栅时发生衍射，通过测量衍射条纹间距D，结合已知波长λ、超声频率f和光栅到屏的距离L，即可计算出超声波在液体中的传播速度v。</p>
          </div>
        </div>
      </div>
      
      <div class="welcome-buttons">
        <button class="btn-start" @click="$emit('start')">
          <span class="btn-icon">▶</span>
          开始实验
        </button>
        <button class="btn-intro" @click="showIntro = !showIntro">
          <span class="btn-icon">❓</span>
          实验介绍
        </button>
      </div>
      
      <div v-if="showIntro" class="intro-modal">
        <div class="intro-content">
          <div class="intro-header">
            <h3>实验介绍</h3>
            <button class="intro-close" @click="showIntro = false">✕</button>
          </div>
          <div class="intro-body">
            <h4>实验目的</h4>
            <ul>
              <li>了解超声光栅的形成原理</li>
              <li>掌握利用超声光栅测量液体中声速的方法</li>
              <li>学会用线性拟合处理实验数据</li>
            </ul>
            <h4>实验步骤</h4>
            <ol>
              <li>调整实验参数（波长、频率、浓度等）</li>
              <li>运行仿真观察衍射光斑</li>
              <li>使用游标测量+1级和-1级光斑位置</li>
              <li>计算条纹间距并保存数据</li>
              <li>改变频率重复测量（至少3组数据）</li>
              <li>点击数据拟合计算声速</li>
            </ol>
            <h4>注意事项</h4>
            <ul>
              <li>保持入射波长和水槽到光屏距离不变</li>
              <li>测量时确保光斑清晰对焦</li>
              <li>建议测量5-6组不同频率的数据</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div class="welcome-footer">
        <span class="version">Version 4.1</span>
        <span class="copyright">© 2026 超声光栅虚拟仿真实验平台</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

defineEmits(['start'])

const showIntro = ref(false)
const interactionCanvas = ref(null)
const demoActive = ref(false)
const demoFinished = ref(false)
const demoColorIndex = ref(0)
let animationFrame = 0
let demoDpr = 1
let demoStartTime = 0

const startInteractionDemo = () => {
  if (demoFinished.value) {
    demoColorIndex.value = (demoColorIndex.value + 1) % beamThemes.length
  }
  demoActive.value = true
  demoFinished.value = false
  demoStartTime = performance.now()
}

const particlePalette = ['#60a5fa']

const hash01 = (index, salt = 0) => {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

const incomingSeeds = Array.from({ length: 220 }, (_, index) => ({
  phase: (index / 220 + (hash01(index, 1) - 0.5) * 0.008 + 1) % 1,
  lane: index % 2 === 0 ? -1 : 1,
  offset: (hash01(index, 2) - 0.5) * 5.5,
  radius: 1.05 + hash01(index, 3) * 1.65,
  color: particlePalette[index % particlePalette.length]
}))

const cellSeeds = Array.from({ length: 100 }, (_, index) => ({
  x: hash01(index, 4),
  y: hash01(index, 5),
  phase: hash01(index, 6) * Math.PI * 2,
  radius: 1.2 + hash01(index, 7) * 2.1,
  color: particlePalette[(index * 2 + 1) % particlePalette.length]
}))

const diffractionBranches = [
  { value: -0.56, order: 2 },
  { value: -0.42, order: 2 },
  { value: -0.29, order: 1 },
  { value: -0.16, order: 1 },
  { value: 0, order: 0 },
  { value: 0.16, order: 1 },
  { value: 0.29, order: 1 },
  { value: 0.42, order: 2 },
  { value: 0.56, order: 2 }
]

const diffractedSeeds = Array.from({ length: 720 }, (_, index) => ({
  phase: hash01(index, 8),
  branch: diffractionBranches[index % diffractionBranches.length].value,
  order: diffractionBranches[index % diffractionBranches.length].order,
  spread: (hash01(index, 9) - 0.5),
  radius: 1.05 + hash01(index, 10) * 2.35,
  speed: 0.078 + hash01(index, 11) * 0.038,
  color: particlePalette[(index * 5) % particlePalette.length]
}))

const beamThemes = [
  { rgb: '96, 165, 250', core: '#60a5fa', soft: 'rgba(96, 165, 250, ALPHA)', glow: 'rgba(96, 165, 250, 0.88)', spectrum: false },
]

const roundedRect = (ctx, x, y, width, height, radius) => {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + width, y, x + width, y + height, r)
  ctx.arcTo(x + width, y + height, x, y + height, r)
  ctx.arcTo(x, y + height, x, y, r)
  ctx.arcTo(x, y, x + width, y, r)
  ctx.closePath()
}

const resizeInteractionCanvas = () => {
  const canvas = interactionCanvas.value
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
  demoDpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.max(1, Math.floor(rect.width * demoDpr))
  canvas.height = Math.max(1, Math.floor(rect.height * demoDpr))
}

const drawInteractionFrame = (time = 0) => {
  const canvas = interactionCanvas.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  const width = canvas.width / demoDpr
  const height = canvas.height / demoDpr
  const beamTheme = beamThemes[demoColorIndex.value]
  const elapsed = demoActive.value
    ? Math.max(0, (time - demoStartTime) / 1000)
    : (demoFinished.value ? 6.5 : 0)
  const animationVisible = demoActive.value || demoFinished.value
  const motionTime = animationVisible
    ? Math.max(0, (time - demoStartTime) / 1000)
    : 0
  const sourceProgress = Math.min(1, elapsed / 2.35)
  const latticeProgress = Math.min(1, Math.max(0, (elapsed - 1.8) / 0.95))
  const outflowProgress = Math.min(1, Math.max(0, (elapsed - 2.65) / 1.85))
  const screenProgress = Math.min(1, Math.max(0, (elapsed - 4.55) / 1.15))

  ctx.setTransform(demoDpr, 0, 0, demoDpr, 0, 0)
  ctx.imageSmoothingEnabled = true
  ctx.clearRect(0, 0, width, height)

  const bg = ctx.createLinearGradient(0, 0, width, height)
  bg.addColorStop(0, '#081225')
  bg.addColorStop(0.52, '#0d1b35')
  bg.addColorStop(1, '#092b35')
  ctx.fillStyle = bg
  roundedRect(ctx, 0, 0, width, height, 8)
  ctx.fill()

  const centerY = height * 0.52
  const laserX = width * 0.075
  const cellX = width * 0.43
  const cellW = Math.min(220, width * 0.18)
  const cellH = Math.min(116, height * 0.56)
  const cellY = centerY - cellH / 2
  const originX = cellX + cellW
  const screenX = width * 0.855
  const screenW = Math.min(92, width * 0.09)
  const screenH = Math.min(196, height * 0.86)
  const screenY = centerY - screenH / 2
  const innerScreenX = screenX + 8
  const innerScreenRight = screenX + screenW - 10
  const fanRight = screenX - 8

  ctx.save()
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)'
  ctx.lineWidth = 1
  for (let i = 0; i < 8; i += 1) {
    const x = width * 0.10 + i * width * 0.105
    ctx.beginPath()
    ctx.moveTo(x, height * 0.18)
    ctx.lineTo(x, height * 0.84)
    ctx.stroke()
  }
  ctx.restore()

  const sourcePulse = animationVisible
    ? 0.95 + Math.sin(motionTime * 1.25) * 0.05
    : 1

  // The emitter stays clean; the beam itself is carried by moving particles.
  ctx.save()
  const sourceRadius = 24 * sourcePulse
  const sourceGlow = ctx.createRadialGradient(laserX - 3, centerY - 3, 1, laserX, centerY, sourceRadius + 5)
  sourceGlow.addColorStop(0, '#f8fafc')
  sourceGlow.addColorStop(0.18, '#93c5fd')
  sourceGlow.addColorStop(0.48, beamTheme.core)
  sourceGlow.addColorStop(0.78, beamTheme.soft.replace('ALPHA', '0.48'))
  sourceGlow.addColorStop(1, beamTheme.soft.replace('ALPHA', '0'))
  ctx.fillStyle = sourceGlow
  ctx.shadowColor = beamTheme.glow
  ctx.shadowBlur = 14
  ctx.beginPath()
  ctx.arc(laserX, centerY, sourceRadius, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#eff6ff'
  ctx.globalAlpha = 0.72
  ctx.beginPath()
  ctx.arc(laserX - 3, centerY - 3, 5.6 * sourcePulse, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  const emit = (x, y, radius, alpha, color = beamTheme.core) => {
    ctx.fillStyle = color
    ctx.shadowBlur = 0
    ctx.globalAlpha = alpha * 0.2
    ctx.beginPath()
    ctx.arc(x, y, radius * 2.55, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = alpha
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  const trail = (x, y, tailX, tailY, alpha, color = beamTheme.core) => {
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.strokeStyle = color
    ctx.lineWidth = 0.8
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x - tailX, y - tailY)
    ctx.lineTo(x, y)
    ctx.stroke()
    ctx.restore()
  }

  // Dense two-row incoming particle beam, close to the reference video style.
  if (animationVisible && sourceProgress > 0) {
    const beamEnd = laserX + (originX - laserX) * sourceProgress
    const beamStart = laserX + 23
    const beamLength = Math.max(0, beamEnd - beamStart)
    if (beamLength > 0) {
      ctx.save()
      ctx.globalAlpha = 0.08
      ctx.strokeStyle = beamTheme.glow
      ctx.lineWidth = 1.2
      ;[-7, 7].forEach((offset) => {
        ctx.beginPath()
        ctx.moveTo(beamStart, centerY + offset)
        ctx.lineTo(beamEnd, centerY + offset)
        ctx.stroke()
      })
      ctx.restore()
      incomingSeeds.forEach((seed, index) => {
        const travel = (seed.phase + motionTime * 0.14) % 1
        if (travel > sourceProgress) return
        const x = beamStart + beamLength * travel
        const laneY = centerY + seed.lane * 6.6
        const drift = Math.sin(motionTime * 0.9 + index * 0.43) * 0.8
        const y = laneY + seed.offset * 0.42 + drift
        const alpha = 0.5 + 0.38 * Math.min(1, sourceProgress * 1.4)
        trail(x, y, 7 + seed.radius * 2, 0, alpha * 0.16, seed.color)
        emit(x, y, seed.radius, alpha, seed.color)
      })
      if (sourceProgress > 0.84) {
        const entryGlow = Math.min(1, (sourceProgress - 0.84) / 0.16)
        emit(cellX + 8, centerY, 3.8, 0.35 * entryGlow, '#dbeafe')
      }
    }
  }

  // Liquid cell and its oscillating compressions remain visible throughout the demonstration.
  ctx.save()
  const cellGradient = ctx.createLinearGradient(cellX, cellY, cellX + cellW, cellY + cellH)
  cellGradient.addColorStop(0, 'rgba(56, 189, 248, 0.16)')
  cellGradient.addColorStop(0.5, 'rgba(14, 165, 233, 0.36)')
  cellGradient.addColorStop(1, 'rgba(20, 184, 166, 0.18)')
  ctx.fillStyle = cellGradient
  roundedRect(ctx, cellX, cellY, cellW, cellH, 10)
  ctx.fill()
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.7)'
  ctx.lineWidth = 1.5
  ctx.stroke()
  ctx.save()
  roundedRect(ctx, cellX + 2, cellY + 2, cellW - 4, cellH - 4, 8)
  ctx.clip()
  const cellFog = ctx.createRadialGradient(
    cellX + cellW * 0.52,
    cellY + cellH * 0.5,
    4,
    cellX + cellW * 0.52,
    cellY + cellH * 0.5,
    cellW * 0.7
  )
  cellFog.addColorStop(0, 'rgba(191, 219, 254, 0.11)')
  cellFog.addColorStop(1, 'rgba(56, 189, 248, 0)')
  ctx.fillStyle = cellFog
  ctx.fillRect(cellX, cellY, cellW, cellH)
  ctx.restore()
  for (let i = 0; i < 12; i += 1) {
    const bandY = cellY + (i / 12) * cellH
    const phase = Math.sin(motionTime * 3.5 + i * 0.72)
    const alpha = 0.16 + 0.18 * (0.5 + phase * 0.5)
    ctx.fillStyle = `rgba(125, 211, 252, ${alpha.toFixed(2)})`
    ctx.fillRect(cellX + 4, bandY + phase * 1.5, cellW - 8, cellH * 0.045)
  }
  if (latticeProgress > 0) {
    cellSeeds.forEach((seed) => {
      const px = cellX + 10 + seed.x * (cellW - 20)
      const py = cellY + 10 + seed.y * (cellH - 20)
      const wave = Math.sin(motionTime * 3.8 + seed.phase)
      emit(px + wave * 1.35, py + wave * 3.05, seed.radius, 0.52 + latticeProgress * 0.2, seed.color)
    })
  }
  ctx.restore()
  ctx.globalAlpha = 1

  // Dense diffraction cloud. The paths are straight fan branches, not sine curves.
  if (animationVisible && outflowProgress > 0) {
    ctx.save()
    ctx.lineCap = 'round'
    diffractionBranches.forEach((branch, index) => {
      const orderWeight = branch.order === 0 ? 1 : branch.order === 1 ? 0.72 : 0.46
      ctx.strokeStyle = beamTheme.soft.replace('ALPHA', (0.035 + orderWeight * 0.06).toFixed(3))
      ctx.lineWidth = branch.order === 0 ? 1.6 : 0.8
      ctx.beginPath()
      ctx.moveTo(originX, centerY)
      ctx.lineTo(fanRight, centerY + branch.value * height * 0.62)
      ctx.stroke()
    })
    diffractedSeeds.forEach((seed, index) => {
      const travel = (seed.phase + motionTime * seed.speed) % 1
      if (travel <= 0.012 || travel > outflowProgress) return
      const branchY = seed.branch * height * 0.6
      const cloudWidth = (0.8 + travel * 1.45) * seed.spread * height * 0.105
      const x = originX + (fanRight - originX) * travel
      const y = centerY + branchY * Math.pow(travel, 0.84) + cloudWidth
      if (y < height * 0.1 || y > height * 0.9) return
      const orderWeight = seed.order === 0 ? 1 : seed.order === 1 ? 0.72 : 0.46
      const alpha = (0.34 + 0.48 * travel) * orderWeight
      const sizeBoost = seed.order === 0 ? 0.75 : seed.order === 1 ? 0.38 : 0.12
      if (index % 2 === 0) {
        trail(
          x,
          y,
          5 + travel * 7,
          branchY * 0.025,
          alpha * 0.18,
          seed.color
        )
      }
      emit(x, y, seed.radius + sizeBoost, alpha, seed.color)
    })
    ctx.restore()
    ctx.globalAlpha = 1
  }

  // The screen is blank until the first particles actually arrive.
  ctx.save()
  const screenGradient = ctx.createLinearGradient(screenX, screenY, screenX + screenW, screenY + screenH)
  screenGradient.addColorStop(0, '#020617')
  screenGradient.addColorStop(0.5, '#08152d')
  screenGradient.addColorStop(1, '#020617')
  ctx.fillStyle = screenGradient
  roundedRect(ctx, screenX, screenY, screenW, screenH, 10)
  ctx.fill()
  ctx.strokeStyle = 'rgba(191, 219, 254, 0.78)'
  ctx.lineWidth = 1.4
  ctx.stroke()
  ctx.save()
  roundedRect(ctx, screenX + 2, screenY + 2, screenW - 4, screenH - 4, 8)
  ctx.clip()
  const glassSheen = ctx.createLinearGradient(screenX, screenY, screenX + screenW, screenY)
  glassSheen.addColorStop(0, 'rgba(255, 255, 255, 0)')
  glassSheen.addColorStop(0.45, 'rgba(191, 219, 254, 0.09)')
  glassSheen.addColorStop(0.58, 'rgba(255, 255, 255, 0.02)')
  glassSheen.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = glassSheen
  ctx.fillRect(screenX, screenY, screenW, screenH)
  ctx.restore()
  if (screenProgress > 0) {
    const spots = [
      { y: -0.38, size: 0.42, a: 0.34 },
      { y: -0.19, size: 0.66, a: 0.62 },
      { y: 0, size: 1, a: 1 },
      { y: 0.19, size: 0.66, a: 0.62 },
      { y: 0.38, size: 0.42, a: 0.34 }
    ]
    spots.forEach((spot, index) => {
      const x = screenX + screenW * 0.5
      const y = centerY + spot.y * screenH * Math.min(1, screenProgress * 1.4)
      const color = beamTheme.core
      const spotRadius = 13 + spot.size * 12
      const spotGlow = ctx.createRadialGradient(x, y, 0, x, y, spotRadius)
      spotGlow.addColorStop(0, 'rgba(147, 197, 253, 0.94)')
      spotGlow.addColorStop(0.18, 'rgba(96, 165, 250, 0.82)')
      spotGlow.addColorStop(0.48, 'rgba(96, 165, 250, 0.24)')
      spotGlow.addColorStop(1, 'rgba(96, 165, 250, 0)')
      ctx.fillStyle = spotGlow
      ctx.globalAlpha = spot.a * (0.48 + screenProgress * 0.52)
      ctx.beginPath()
      ctx.ellipse(x, y, spotRadius, spotRadius * 0.7, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = color
      ctx.globalAlpha = spot.a * (0.62 + screenProgress * 0.38)
      ctx.beginPath()
      ctx.ellipse(x, y, 2.8 + spot.size * 2.2, 3.8 + spot.size * 3.2, 0, 0, Math.PI * 2)
      ctx.fill()
    })
  }
  ctx.restore()
  ctx.globalAlpha = 1

  if (demoActive.value && elapsed >= 6.35) {
    demoActive.value = false
    demoFinished.value = true
  }
  animationFrame = requestAnimationFrame(drawInteractionFrame)
}

onMounted(() => {
  nextTick(() => {
    resizeInteractionCanvas()
    window.addEventListener('resize', resizeInteractionCanvas)
    animationFrame = requestAnimationFrame(drawInteractionFrame)
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeInteractionCanvas)
  cancelAnimationFrame(animationFrame)
})
</script>

<style scoped>
.welcome-page {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
  font-family: 'Microsoft YaHei', sans-serif;
}

.welcome-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

.welcome-bg::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 20% 20%, rgba(79, 172, 254, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(120, 204, 109, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.02) 0%, transparent 70%);
}

.welcome-content {
  position: relative;
  z-index: 10;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 40px;
}

.welcome-header {
  text-align: center;
  margin-bottom: 18px;
}

.logo-container {
  width: 100px;
  height: 100px;
  margin: 0 auto 20px;
  background: linear-gradient(135deg, rgba(79, 172, 254, 0.3) 0%, rgba(120, 204, 109, 0.3) 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.logo-icon {
  font-size: 48px;
}

.welcome-title {
  font-size: 36px;
  font-weight: bold;
  color: #ffffff;
  margin: 0 0 10px;
  text-shadow: 0 2px 20px rgba(0, 0, 0, 0.3);
  letter-spacing: 4px;
}

.welcome-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
  letter-spacing: 2px;
}

.interaction-demo {
  position: relative;
  width: min(1040px, 94vw);
  height: 240px;
  margin: 0 0 22px;
  border: 1px solid rgba(125, 211, 252, 0.24);
  border-radius: 8px;
  overflow: hidden;
  background: #111827;
  box-shadow: 0 18px 46px rgba(0, 0, 0, 0.22);
}

.interaction-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.demo-play-btn {
  position: absolute;
  left: 18px;
  bottom: 16px;
  z-index: 3;
  min-width: 104px;
  height: 36px;
  padding: 0 16px;
  border: 1px solid rgba(125, 211, 252, 0.42);
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.92), rgba(37, 99, 235, 0.92));
  color: #ffffff;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(14, 165, 233, 0.24);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.demo-play-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 14px 30px rgba(14, 165, 233, 0.34);
}

.demo-label {
  position: absolute;
  top: 10px;
  z-index: 4;
  font-size: 12px;
  font-weight: 700;
  color: rgba(241, 245, 249, 0.74);
}

.demo-label.left { left: 44px; }
.demo-label.center { left: 50%; transform: translateX(-50%); }
.demo-label.right { right: 48px; }

.laser-line {
  position: absolute;
  left: 28px;
  top: 74px;
  width: 41%;
  height: 4px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(248, 113, 113, 0.08), rgba(248, 113, 113, 0.92), rgba(255, 255, 255, 0.95));
  box-shadow: 0 0 18px rgba(248, 113, 113, 0.74);
  animation: laserPulse 1.7s ease-in-out infinite;
}

.laser-line::before {
  content: '';
  position: absolute;
  left: -11px;
  top: -10px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #ef4444;
  box-shadow: 0 0 24px #ef4444;
}

.sound-cell {
  position: absolute;
  left: 44%;
  top: 32px;
  width: 160px;
  height: 92px;
  border: 1px solid rgba(186, 230, 253, 0.58);
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(186, 230, 253, 0.24), rgba(14, 165, 233, 0.2));
  box-shadow: inset 0 0 24px rgba(14, 165, 233, 0.2), 0 0 20px rgba(14, 165, 233, 0.18);
  overflow: hidden;
}

.sound-band {
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(var(--band-index) * 12.5%);
  width: 7%;
  background: linear-gradient(180deg, rgba(34, 211, 238, 0.05), rgba(34, 211, 238, 0.6), rgba(34, 211, 238, 0.05));
  animation: bandPulse 1.6s ease-in-out infinite;
  animation-delay: calc(var(--band-index) * -0.12s);
}

.liquid-particle {
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #fef3c7;
  box-shadow: 0 0 10px rgba(254, 243, 199, 0.9);
  animation: particleOscillate 2.8s ease-in-out infinite;
}

.diffracted-rays {
  position: absolute;
  left: calc(44% + 160px);
  top: 76px;
  width: 220px;
  height: 1px;
}

.ray {
  position: absolute;
  left: 0;
  top: 0;
  width: 210px;
  height: 3px;
  transform-origin: left center;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.95), rgba(34, 197, 94, 0.12));
  box-shadow: 0 0 12px rgba(34, 197, 94, 0.48);
  animation: rayPulse 2s ease-in-out infinite;
}

.ray-center { transform: rotate(0deg); }
.ray-up { transform: rotate(-16deg); opacity: 0.72; }
.ray-down { transform: rotate(16deg); opacity: 0.72; }
.ray-up-soft { transform: rotate(-29deg); opacity: 0.34; }
.ray-down-soft { transform: rotate(29deg); opacity: 0.34; }

.screen-preview {
  position: absolute;
  right: 34px;
  top: 28px;
  width: 66px;
  height: 96px;
  border-radius: 8px;
  border: 1px solid rgba(203, 213, 225, 0.42);
  background: #020617;
  box-shadow: inset 0 0 18px rgba(15, 23, 42, 0.9);
}

.fringe {
  position: absolute;
  top: 16px;
  bottom: 16px;
  width: 3px;
  border-radius: 999px;
  background: rgba(248, 113, 113, 0.86);
  box-shadow: 0 0 12px rgba(248, 113, 113, 0.8);
  animation: fringeGlow 1.8s ease-in-out infinite;
}

.fringe-main { left: 50%; transform: translateX(-50%); background: #ffffff; }
.fringe-side.left { left: 22px; opacity: 0.7; }
.fringe-side.right { right: 22px; opacity: 0.7; }
.fringe-faint.left { left: 10px; opacity: 0.34; }
.fringe-faint.right { right: 10px; opacity: 0.34; }

@keyframes laserPulse {
  0%, 100% { opacity: 0.72; transform: scaleX(0.98); }
  50% { opacity: 1; transform: scaleX(1); }
}

@keyframes bandPulse {
  0%, 100% { opacity: 0.22; transform: scaleX(0.72); }
  50% { opacity: 0.9; transform: scaleX(1.15); }
}

@keyframes particleOscillate {
  0%, 100% { transform: translateY(-8px); opacity: 0.58; }
  50% { transform: translateY(8px); opacity: 1; }
}

@keyframes rayPulse {
  0%, 100% { filter: brightness(0.86); }
  50% { filter: brightness(1.35); }
}

@keyframes fringeGlow {
  0%, 100% { transform: scaleY(0.86); }
  50% { transform: scaleY(1); }
}

.welcome-features {
  display: flex;
  gap: 30px;
  margin-bottom: 24px;
  flex-wrap: wrap;
  justify-content: center;
}

.feature-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 18px 26px;
  display: flex;
  align-items: center;
  gap: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  min-width: 280px;
}

.feature-card:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-5px);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
}

.feature-icon {
  font-size: 32px;
}

.feature-content h3 {
  color: #ffffff;
  margin: 0 0 8px;
  font-size: 18px;
}

.feature-content p {
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
}

.welcome-principle {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 22px 32px;
  margin-bottom: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-width: 800px;
  width: 100%;
}

.principle-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.principle-icon {
  font-size: 24px;
}

.principle-header h2 {
  color: #ffffff;
  margin: 0;
  font-size: 20px;
}

.principle-content {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: flex-start;
}

.principle-item {
  background: rgba(79, 172, 254, 0.1);
  padding: 12px 20px;
  border-radius: 10px;
  border-left: 4px solid #4facfe;
}

.principle-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  display: block;
  margin-bottom: 5px;
}

.principle-formula {
  color: #ffffff;
  font-size: 16px;
  font-family: 'Times New Roman', serif;
  font-weight: bold;
}

.principle-formula.highlight {
  color: #78cc6d;
  font-size: 18px;
}

.principle-description {
  flex: 1;
  min-width: 300px;
}

.principle-description p {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  line-height: 1.8;
  margin: 0;
}

.welcome-buttons {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}

.btn-start {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: #1a1a2e;
  border: none;
  padding: 16px 48px;
  border-radius: 50px;
  font-size: 18px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(79, 172, 254, 0.4);
}

.btn-start:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 30px rgba(79, 172, 254, 0.6);
}

.btn-icon {
  font-size: 16px;
}

.btn-intro {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 16px 32px;
  border-radius: 50px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
}

.btn-intro:hover {
  background: rgba(255, 255, 255, 0.15);
}

.intro-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.intro-content {
  background: #1a1a2e;
  border-radius: 20px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.intro-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.intro-header h3 {
  color: #ffffff;
  margin: 0;
  font-size: 20px;
}

.intro-close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 24px;
  cursor: pointer;
  padding: 4px;
}

.intro-close:hover {
  color: #ffffff;
}

.intro-body {
  padding: 24px;
}

.intro-body h4 {
  color: #4facfe;
  margin: 20px 0 10px;
  font-size: 16px;
}

.intro-body h4:first-child {
  margin-top: 0;
}

.intro-body ul,
.intro-body ol {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  line-height: 2;
  margin: 0;
  padding-left: 20px;
}

.intro-body li {
  margin-bottom: 8px;
}

.welcome-footer {
  text-align: center;
}

.version {
  color: rgba(255, 255, 255, 0.3);
  font-size: 13px;
  margin-right: 20px;
}

.copyright {
  color: rgba(255, 255, 255, 0.3);
  font-size: 13px;
}
</style>
