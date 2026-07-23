<template>
  <div class="collimator-container">
    <div class="collimator-body">
      <div class="collimator-tube">
        <div class="tube-inner"></div>
        <div class="tube-flange"></div>
      </div>
      <div class="collimator-slit">
        <div class="slit-frame">
          <div class="slit-opening"></div>
        </div>
      </div>
      <div class="collimator-focus">
        <div class="focus-knob"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.collimator-container {
  position: relative;
  width: 180px;
  height: 100px;
}

.collimator-body {
  position: absolute;
  top: 10px;
  left: 0;
  width: 100%;
  height: 60px;
}

.collimator-tube {
  position: absolute;
  left: 0;
  top: 10px;
  width: 140px;
  height: 40px;
  background: linear-gradient(90deg, #4b5563, #6b7280, #4b5563);
  border-radius: 5px;
  box-shadow: 0 3px 8px rgba(0,0,0,0.3);
}

.tube-inner {
  position: absolute;
  left: 5px;
  top: 5px;
  right: 5px;
  bottom: 5px;
  background: #1f2937;
  border-radius: 3px;
}

.tube-flange {
  position: absolute;
  right: -5px;
  top: 0;
  width: 15px;
  height: 100%;
  background: linear-gradient(90deg, #6b7280, #9ca3af);
  border-radius: 0 5px 5px 0;
}

.collimator-slit {
  position: absolute;
  right: 15px;
  top: 15px;
  width: 25px;
  height: 30px;
}

.slit-frame {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #374151, #1f2937);
  border-radius: 3px;
  padding: 5px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
}

.slit-opening {
  width: 100%;
  height: 100%;
  background: #000;
  border-radius: 1px;
  position: relative;
}

.slit-opening::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 2px;
  background: rgba(255,255,255,0.3);
}

.collimator-focus {
  position: absolute;
  bottom: -5px;
  right: 20px;
}

.focus-knob {
  width: 20px;
  height: 20px;
  background: linear-gradient(135deg, #d1d5db, #9ca3af);
  border-radius: 50%;
  border: 2px solid #6b7280;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}
</style>