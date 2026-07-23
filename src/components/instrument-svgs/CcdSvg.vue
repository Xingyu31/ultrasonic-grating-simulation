<template>
  <div class="ccd-container">
    <div class="ccd-body">
      <div class="ccd-box">
        <div class="ccd-screen">
          <div class="screen-content">
            <div class="diffraction-preview">
              <div class="diffraction-line" v-for="i in 5" :key="i" :style="getLineStyle(i)"></div>
            </div>
          </div>
        </div>
        <div class="ccd-lens">
          <div class="lens-glass"></div>
        </div>
        <div class="ccd-indicator" :class="{ active: true }"></div>
      </div>
      <div class="ccd-cable"></div>
    </div>
  </div>
</template>

<script setup>
const getLineStyle = (i) => {
  const positions = [-40, -20, 0, 20, 40]
  const widths = [4, 6, 10, 6, 4]
  const opacities = [0.5, 0.8, 1, 0.8, 0.5]
  return {
    left: `calc(50% + ${positions[i - 1]}px)`,
    width: `${widths[i - 1]}px`,
    opacity: opacities[i - 1]
  }
}
</script>

<style scoped>
.ccd-container {
  position: relative;
  width: 100px;
  height: 120px;
}

.ccd-body {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 90px;
}

.ccd-box {
  position: relative;
  width: 90px;
  height: 80px;
  background: linear-gradient(135deg, #374151, #1f2937);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  padding: 8px;
}

.ccd-screen {
  width: 100%;
  height: 50px;
  background: #0a0a0a;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.screen-content {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.diffraction-preview {
  position: relative;
  width: 100%;
  height: 30px;
}

.diffraction-line {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  height: 20px;
  background: linear-gradient(180deg, #ef4444, #f97316);
  border-radius: 2px;
  box-shadow: 0 0 8px #ef4444;
}

.ccd-lens {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 30px;
  background: linear-gradient(135deg, #4b5563, #374151);
  border-radius: 50%;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
}

.lens-glass {
  position: absolute;
  top: 3px;
  left: 3px;
  right: 3px;
  bottom: 3px;
  background: radial-gradient(circle, rgba(147, 197, 253, 0.3), rgba(59, 130, 246, 0.1));
  border-radius: 50%;
}

.ccd-indicator {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 6px;
  height: 6px;
  background: #374151;
  border-radius: 50%;
}

.ccd-indicator.active {
  background: #22c55e;
  box-shadow: 0 0 8px #22c55e;
}

.ccd-cable {
  position: absolute;
  bottom: 5px;
  right: -20px;
  width: 25px;
  height: 4px;
  background: #6b7280;
  border-radius: 2px;
}
</style>