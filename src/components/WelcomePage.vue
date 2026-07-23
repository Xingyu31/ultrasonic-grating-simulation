<template>
  <div class="welcome-page">
    <div class="welcome-bg"></div>
    <div class="welcome-content">
      <div class="welcome-header">
        <div class="logo-container">
          <span class="logo-icon">🔬</span>
        </div>
        <h1 class="welcome-title">超声光栅衍射虚拟仿真实验</h1>
        <p class="welcome-subtitle">Ultrasonic Grating Diffraction Virtual Simulation Experiment</p>
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
            <span class="principle-formula highlight">v = 2kλfL/D<sub>k</sub></span>
          </div>
          <div class="principle-description">
            <p>超声波在液体中以弹性纵波形式传播，形成超声光栅。当平行光通过超声光栅时发生衍射，通过测量第k级衍射条纹间距D<sub>k</sub>，结合已知波长λ、超声频率f和光栅到屏的距离L，即可计算出超声波在液体中的传播速度v。</p>
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
        <span class="version">Version 3.0</span>
        <span class="copyright">© 2024 超声光栅衍射虚拟仿真实验</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineEmits(['start'])

const showIntro = ref(false)
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
  padding: 40px;
}

.welcome-header {
  text-align: center;
  margin-bottom: 40px;
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

.welcome-features {
  display: flex;
  gap: 30px;
  margin-bottom: 40px;
  flex-wrap: wrap;
  justify-content: center;
}

.feature-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 24px 32px;
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
  border-radius: 20px;
  padding: 30px 40px;
  margin-bottom: 40px;
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