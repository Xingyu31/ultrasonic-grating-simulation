<template>
  <div class="telescope-container">
    <div class="telescope-body">
      <div class="telescope-tube">
        <div class="tube-main"></div>
        <div class="tube-objective">
          <div class="objective-lens"></div>
        </div>
        <div class="tube-eyepiece">
          <div class="eyepiece-lens"></div>
        </div>
      </div>
      <div class="telescope-focus">
        <div class="focus-ring"></div>
      </div>
      <div class="telescope-mount"></div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.telescope-container {
  position: relative;
  width: 140px;
  height: 100px;
}

.telescope-body {
  position: absolute;
  top: 10px;
  left: 0;
  width: 100%;
  height: 60px;
}

.telescope-tube {
  position: absolute;
  left: 10px;
  top: 15px;
  width: 120px;
  height: 30px;
}

.tube-main {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #4b5563, #6b7280, #4b5563);
  border-radius: 15px;
  box-shadow: 0 3px 8px rgba(0,0,0,0.3);
}

.tube-objective {
  position: absolute;
  left: -3px;
  top: -3px;
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #374151, #1f2937);
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0,0,0,0.4);
}

.objective-lens {
  position: absolute;
  top: 3px;
  left: 3px;
  right: 3px;
  bottom: 3px;
  background: radial-gradient(circle, rgba(147, 197, 253, 0.4), rgba(59, 130, 246, 0.2));
  border-radius: 50%;
  border: 2px solid rgba(147, 197, 253, 0.3);
}

.tube-eyepiece {
  position: absolute;
  right: -2px;
  top: 2px;
  width: 26px;
  height: 26px;
  background: linear-gradient(135deg, #6b7280, #9ca3af);
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.eyepiece-lens {
  position: absolute;
  top: 4px;
  left: 4px;
  right: 4px;
  bottom: 4px;
  background: rgba(255,255,255,0.1);
  border-radius: 50%;
}

.telescope-focus {
  position: absolute;
  right: 25px;
  top: 20px;
}

.focus-ring {
  width: 25px;
  height: 25px;
  background: linear-gradient(135deg, #d1d5db, #9ca3af);
  border-radius: 50%;
  border: 2px solid #6b7280;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  position: relative;
}

.focus-ring::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 15px;
  height: 15px;
  background: linear-gradient(135deg, #e5e7eb, #d1d5db);
  border-radius: 50%;
}

.telescope-mount {
  position: absolute;
  bottom: 5px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 15px;
  background: #374151;
  border-radius: 3px;
}
</style>