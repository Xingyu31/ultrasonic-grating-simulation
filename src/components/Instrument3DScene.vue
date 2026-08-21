<template>
  <div class="instrument-3d-scene" ref="containerRef">
    <div class="canvas-container" ref="canvasContainerRef"></div>
    <div class="scene-overlay" v-if="showOverlay">
      <div class="overlay-content">
        <span class="loading-text">加载3D仪器模型...</span>
      </div>
    </div>
    <div class="instrument-info" v-if="selectedInstrument">
      <div class="info-header">
        <span class="info-title">{{ selectedInstrument.name }}</span>
        <button class="info-close" @click="selectedInstrument = null">✕</button>
      </div>
      <div class="info-body">
        <div v-for="(value, key) in selectedInstrument.info" :key="key" class="info-item">
          <span class="info-label">{{ key }}</span>
          <span class="info-value">{{ value }}</span>
        </div>
      </div>
      <div class="info-actions">
        <button v-if="selectedInstrument.id === 'computer'" class="action-btn" @click="openComputer">打开计算机</button>
        <button v-if="selectedInstrument.id === 'generator'" class="action-btn" @click="openGenerator">参数设置</button>
        <button v-if="selectedInstrument.id === 'laser'" class="action-btn" @click="toggleLaser">激光开关</button>
        <button v-if="selectedInstrument.id === 'telescope'" class="action-btn" @click="openTelescope">调焦</button>
        <button v-if="selectedInstrument.id === 'cell'" class="action-btn" @click="openCell">溶液信息</button>
        <button v-if="selectedInstrument.id === 'ccd'" class="action-btn" @click="openCCD">相机参数</button>
      </div>
      <div class="instrument-controls">
        <button class="control-btn-small" :class="{ active: isMoving }" @click="toggleMove">移动</button>
        <button class="control-btn-small" :class="{ active: isRotating }" @click="toggleRotate">旋转</button>
        <button class="control-btn-small" @click="adjustInstrumentHeight(0.06)">升高</button>
        <button class="control-btn-small" @click="adjustInstrumentHeight(-0.06)">降低</button>
        <button class="control-btn-small" @click="fixInstrument" :disabled="fixedInstruments.includes(selectedInstrument.id)">
          {{ fixedInstruments.includes(selectedInstrument.id) ? '已固定' : '固定' }}
        </button>
        <button class="control-btn-small" @click="removeInstrument">移除</button>
      </div>
    </div>
    <div class="alignment-hud" v-if="showAlignment" :class="alignmentStatus.level">
      <div class="alignment-title">等高共轴状态</div>
      <div class="alignment-state">{{ alignmentStatus.text }}</div>
      <div class="alignment-detail">{{ alignmentStatus.detail }}</div>
      <div class="alignment-tip">{{ alignmentStatus.tip }}</div>
    </div>
    <div class="camera-controls">
      <button class="control-btn" @click="resetCamera">⟲ 复位</button>
      <button class="control-btn" @click="alignOpticalAxis">共轴复位</button>
      <button class="control-btn" @click="rotateView(-1)">◀</button>
      <button class="control-btn" @click="rotateView(1)">▶</button>
      <button class="control-btn" @click="toggleAutoRotate">🔄</button>
      <button class="control-btn" @click="showInstrumentPanel = true">📦 仪器库</button>
    </div>
    <div class="instrument-panel" v-if="showInstrumentPanel">
      <div class="panel-header">
        <span>仪器库</span>
        <button class="panel-close" @click="showInstrumentPanel = false">✕</button>
      </div>
      <div class="panel-content">
        <div 
          v-for="inst in availableInstruments" 
          :key="inst.id" 
          class="instrument-item"
          :class="{ used: usedInstruments.includes(inst.id), visible: instruments[inst.id]?.visible }"
          draggable="true"
          @dragstart="onDragStart($event, inst)"
          @dragend="onDragEnd"
          @click="showInstrument(inst.id)"
        >
          <span class="inst-icon">{{ inst.icon }}</span>
          <span class="inst-name">{{ inst.name }}</span>
        </div>
      </div>
    </div>
    <div 
      class="drop-zone" 
      :class="{ active: draggingInstrument }"
      @dragover.prevent="onDragOver"
      @drop="onDrop"
      @dragleave="onDragLeave"
    >
      <span v-if="draggingInstrument">拖放到此处放置仪器</span>
    </div>
  </div>
</template>

<script setup>import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ElMessage } from 'element-plus';
const props = defineProps({
 params: {
 type: Object,
 required: true
 },
 experimentMode: {
 type: String,
 default: 'wavelength'
 },
 isArchiveMode: {
 type: Boolean,
 default: false
 }
});
const emit = defineEmits(['openComputer', 'openGenerator', 'toggleLaser', 'openLaser', 'openTelescope', 'openCell', 'openCCD', 'updateParams', 'scene-ready']);
const containerRef = ref(null);
const canvasContainerRef = ref(null);
const showOverlay = ref(true);
const selectedInstrument = ref(null);
let scene = null;
let camera = null;
let renderer = null;
let controls = null;
let isOrbitInteracting = false;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const isDragging = ref(false);
const autoRotate = ref(false);
const showInstrumentPanel = ref(true);
let instruments = {};
const laserOn = ref(false);
let laserBeam = null;
const LASER_BEAM_LENGTH = 24.4;
const availableInstruments = ref([
 { id: 'laser', name: '氦氖激光器', icon: '🔴' },
 { id: 'collimator', name: '平行光管', icon: '🔭' },
 { id: 'cell', name: '超声光栅池', icon: '📦' },
 { id: 'generator', name: '超声波发生器', icon: '⚡' },
 { id: 'telescope', name: '测量望远镜', icon: '🔍' },
 { id: 'ccd', name: 'CCD相机', icon: '📷' },
 { id: 'computer', name: '控制计算机', icon: '🖥️' }
]);
const usedInstruments = ref([]);
const draggingInstrument = ref(null);
let droppedInstrumentPosition = { x: 0, y: 0, z: 0 };
const selectedInstrument3D = ref(null);
const isRotating = ref(false);
const isScaling = ref(false);
const isMoving = ref(false);
const instrumentScale = ref(1);
const fixedInstruments = ref([]);
let instrumentDragPlane = null;
const OPTICAL_AXIS_Y = 2.75;
const OPTICAL_AXIS_Z = 0;
const opticalCenterOffsets = {
 laser: { y: 1.4, z: 0 },
 collimator: { y: 0, z: 0 },
 cell: { y: 0, z: 0 },
 telescope: { y: 0, z: 0 },
 ccd: { y: 0.1, z: 0 }
};
const targetRotationsY = {
 laser: 0,
 collimator: Math.PI / 2,
 cell: 0,
 telescope: Math.PI / 2,
 ccd: 0
};
const alignmentStatus = ref({
 level: 'good',
 text: '初始已接近等高共轴',
 detail: '最大高度差 0.0，横向偏差 0.0',
 tip: '只需微调旋转或对焦即可进入测量。'
});
const showAlignment = ref(true);
let alignmentTimer = null;
const startAlignmentTimer = () => {
 showAlignment.value = true;
 if (alignmentTimer) {
 clearTimeout(alignmentTimer);
 }
 alignmentTimer = setTimeout(() => {
 showAlignment.value = false;
 }, 10000);
};
const initScene = () => {
 if (!canvasContainerRef.value)
 return;
 scene = new THREE.Scene();
 scene.background = new THREE.Color(0x6a7a9a);
 scene.fog = new THREE.Fog(0x6a7a9a, 30, 60);
 camera = new THREE.PerspectiveCamera(60, canvasContainerRef.value.clientWidth / canvasContainerRef.value.clientHeight, 0.1, 100);
 camera.position.set(8, 6, 10);
 renderer = new THREE.WebGLRenderer({ antialias: true });
 renderer.setSize(canvasContainerRef.value.clientWidth, canvasContainerRef.value.clientHeight);
 renderer.setPixelRatio(window.devicePixelRatio);
 renderer.shadowMap.enabled = true;
 renderer.shadowMap.type = THREE.PCFSoftShadowMap;
 renderer.outputColorSpace = THREE.SRGBColorSpace;
 renderer.toneMapping = THREE.ACESFilmicToneMapping;
 renderer.toneMappingExposure = 1.05;
 canvasContainerRef.value.appendChild(renderer.domElement);
 const canvas = renderer.domElement;
 canvas.style.position = 'absolute';
 canvas.style.top = '0';
 canvas.style.left = '0';
 canvas.style.width = '100%';
 canvas.style.height = '100%';
 canvas.style.display = 'block';
 canvas.style.zIndex = '1';
 controls = new OrbitControls(camera, canvas);
 controls.enableDamping = true;
 controls.dampingFactor = 0.05;
 controls.autoRotate = autoRotate.value;
 controls.autoRotateSpeed = 0.5;
 controls.minDistance = 5;
 controls.maxDistance = 25;
 controls.maxPolarAngle = Math.PI / 2.2;
 controls.enablePan = true;
 controls.panSpeed = 1.0;
 controls.keyPanSpeed = 0.1;
 controls.addEventListener('start', () => {
 isOrbitInteracting = true;
 document.body.style.cursor = 'grabbing';
 });
 controls.addEventListener('end', () => {
 isOrbitInteracting = false;
 document.body.style.cursor = 'default';
 });
 setupLights();
 setupTable();
 setupOpticalRail();
 createInstruments();
 showOverlay.value = false;
 emit('scene-ready');
 animate();
};
const setupLights = () => {
 const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
 scene.add(ambientLight);
 const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
 directionalLight.position.set(10, 15, 10);
 scene.add(directionalLight);
 const fillLight = new THREE.DirectionalLight(0x6ab0ff, 0.5);
 fillLight.position.set(-10, 8, -10);
 scene.add(fillLight);
 const backLight = new THREE.DirectionalLight(0xffffff, 0.4);
 backLight.position.set(0, 5, -15);
 scene.add(backLight);
 const spotLight = new THREE.SpotLight(0xffffff, 0.8);
 spotLight.position.set(0, 12, 5);
 spotLight.target.position.set(0, 0, 0);
 scene.add(spotLight);
 scene.add(spotLight.target);
};
const setupTable = () => {
 const tableGroup = new THREE.Group();
 const tableTopMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.7, metalness: 0.1 });
 const tableLegMaterial = new THREE.MeshStandardMaterial({ color: 0x5C4A3A, roughness: 0.8, metalness: 0.2 });
 const tableTopGeometry = new THREE.BoxGeometry(80, 0.5, 40.0);
 const tableTop = new THREE.Mesh(tableTopGeometry, tableTopMaterial);
 tableTop.position.y = 0;
 tableTop.castShadow = true;
 tableTop.receiveShadow = true;
 tableGroup.add(tableTop);
 const legGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.8);
 const legPositions = [
 [-39.5, -0.6, 19.7],
 [39.5, -0.6, 19.7],
 [-39.5, -0.6, -19.7],
 [39.5, -0.6, -19.7]
 ];
 legPositions.forEach(pos => {
 const leg = new THREE.Mesh(legGeometry, tableLegMaterial);
 leg.position.set(pos[0], pos[1], pos[2]);
 leg.castShadow = true;
 tableGroup.add(leg);
 });
 const tableEdgeGeometry = new THREE.BoxGeometry(80, 0.25, 0.3);
 const tableEdge1 = new THREE.Mesh(tableEdgeGeometry, tableLegMaterial);
 tableEdge1.position.set(0, 0.25, 19.85);
 tableGroup.add(tableEdge1);
 const tableEdge2 = new THREE.Mesh(tableEdgeGeometry, tableLegMaterial);
 tableEdge2.position.set(0, 0.25, -19.85);
 tableGroup.add(tableEdge2);
 const tableEdge3 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 40), tableLegMaterial);
 tableEdge3.position.set(-39.85, 0.25, 0);
 tableGroup.add(tableEdge3);
 const tableEdge4 = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 40), tableLegMaterial);
 tableEdge4.position.set(39.85, 0.25, 0);
 tableGroup.add(tableEdge4);
 scene.add(tableGroup);
 const floorGeometry = new THREE.PlaneGeometry(160, 100);
 const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x6B7B8B, roughness: 0.8, metalness: 0.1 });
 const floor = new THREE.Mesh(floorGeometry, floorMaterial);
 floor.rotation.x = -Math.PI / 2;
 floor.position.y = -0.6;
 floor.receiveShadow = true;
 scene.add(floor);
};
const setupOpticalRail = () => {
 const railGroup = new THREE.Group();
 const railMaterial = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.32, metalness: 0.85 });
 const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0x00FFFF, transparent: true, opacity: 0.55 });
 const railLength = 29;
 [-0.48, 0.48].forEach(z => {
 const rail = new THREE.Mesh(new THREE.BoxGeometry(railLength, 0.08, 0.08), railMaterial);
 rail.position.set(-3, 0.32, z);
 rail.castShadow = true;
 rail.receiveShadow = true;
 railGroup.add(rail);
 });
 const axisGuide = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, railLength, 16), highlightMaterial);
 axisGuide.rotation.z = Math.PI / 2;
 axisGuide.position.set(-3, OPTICAL_AXIS_Y, OPTICAL_AXIS_Z);
 railGroup.add(axisGuide);
 for (let i = -15; i <= 9; i += 4) {
 const tick = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.55, 0.05), highlightMaterial);
 tick.position.set(i, OPTICAL_AXIS_Y, OPTICAL_AXIS_Z);
 railGroup.add(tick);
 }
 scene.add(railGroup);
 instruments.axisGuide = railGroup;
};
const createLaser = () => {
 const laserGroup = new THREE.Group();
 const aluminumMaterial = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, roughness: 0.3, metalness: 0.9 });
 const blackMaterial = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.6, metalness: 0.3 });
 const redMaterial = new THREE.MeshStandardMaterial({ color: 0xDC2626, roughness: 0.4, metalness: 0.6 });
 const bodyGeometry = new THREE.CylinderGeometry(0.35, 0.35, 1.5, 32);
 const body = new THREE.Mesh(bodyGeometry, aluminumMaterial);
 body.position.y = 0.75;
 body.castShadow = true;
 laserGroup.add(body);
 const headGeometry = new THREE.CylinderGeometry(0.25, 0.18, 0.5, 32);
 const head = new THREE.Mesh(headGeometry, aluminumMaterial);
 head.position.y = 1.45;
 head.castShadow = true;
 laserGroup.add(head);
 const lensCapGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.12, 32);
 const lensCapMaterial = new THREE.MeshStandardMaterial({
 color: laserOn.value ? 0xFF6B6B : 0x64748B,
 emissive: laserOn.value ? 0xFF4444 : 0x000000,
 emissiveIntensity: laserOn.value ? 1.0 : 0,
 roughness: 0.1,
 metalness: 0.9
 });
 const lensCap = new THREE.Mesh(lensCapGeometry, lensCapMaterial);
 lensCap.position.y = 1.4;
 lensCap.castShadow = true;
 laserGroup.add(lensCap);
 const standPostGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2.0, 16);
 const standPost = new THREE.Mesh(standPostGeometry, aluminumMaterial);
 standPost.position.set(0, -0.5, 0);
 standPost.castShadow = true;
 laserGroup.add(standPost);
 const heightAdjusterGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.6, 16);
 const heightAdjuster = new THREE.Mesh(heightAdjusterGeometry, blackMaterial);
 heightAdjuster.position.set(0, -0.8, 0);
 heightAdjuster.castShadow = true;
 laserGroup.add(heightAdjuster);
 const baseGeometry = new THREE.BoxGeometry(1.8, 0.3, 1.2);
 const base = new THREE.Mesh(baseGeometry, blackMaterial);
 base.position.y = -1.25;
 base.castShadow = true;
 laserGroup.add(base);
 const feetGeometry = new THREE.CylinderGeometry(0.12, 0.15, 0.1, 16);
 const foot1 = new THREE.Mesh(feetGeometry, aluminumMaterial);
 foot1.position.set(-0.7, -1.4, 0.4);
 laserGroup.add(foot1);
 const foot2 = new THREE.Mesh(feetGeometry, aluminumMaterial);
 foot2.position.set(0.7, -1.4, 0.4);
 laserGroup.add(foot2);
 const foot3 = new THREE.Mesh(feetGeometry, aluminumMaterial);
 foot3.position.set(-0.7, -1.4, -0.4);
 laserGroup.add(foot3);
 const foot4 = new THREE.Mesh(feetGeometry, aluminumMaterial);
 foot4.position.set(0.7, -1.4, -0.4);
 laserGroup.add(foot4);
 laserGroup.position.set(-15, 1.35, 0);
 laserGroup.userData = {
 id: 'laser',
 name: '氦氖激光器',
 info: {
 型号: 'HN-100',
 波长: `${props.params.wavelength.toFixed(1)} nm`,
 功率: '10 mW',
 状态: laserOn.value ? '开启' : '关闭'
 }
 };
 scene.add(laserGroup);
 instruments.laser = laserGroup;
 createLaserBeam();
};
const createLaserBeam = () => {
 const beamGroup = new THREE.Group();
 const beamLength = LASER_BEAM_LENGTH;
 const beamGeometry = new THREE.CylinderGeometry(0.022, 0.022, beamLength, 24);
 const beamMaterial = new THREE.MeshBasicMaterial({
 color: 0xff4444,
 transparent: true,
 opacity: laserOn.value ? 0.95 : 0
 });
 const beam = new THREE.Mesh(beamGeometry, beamMaterial);
 beam.rotation.z = Math.PI / 2;
 beam.position.set(beamLength / 2, 0, 0);
 beamGroup.add(beam);
 const glowGeometry = new THREE.CylinderGeometry(0.085, 0.085, beamLength, 24);
 const glowMaterial = new THREE.MeshBasicMaterial({
 color: 0xff6b6b,
 transparent: true,
 opacity: laserOn.value ? 0.38 : 0
 });
 const glow = new THREE.Mesh(glowGeometry, glowMaterial);
 glow.rotation.z = Math.PI / 2;
 glow.position.set(beamLength / 2, 0, 0);
 beamGroup.add(glow);
 beamGroup.position.set(0, 1.4, 0);
 laserBeam = beamGroup;
 scene.add(laserBeam);
};
const toggleLaserState = () => {
 laserOn.value = !laserOn.value;
 const lensCap = instruments.laser?.children.find(c => c.geometry?.type === 'CylinderGeometry' && c.material?.emissive);
 if (lensCap) {
 lensCap.material.color.set(laserOn.value ? 0xff6b6b : 0x4a5568);
 lensCap.material.emissive.set(laserOn.value ? 0xff6b6b : 0x000000);
 lensCap.material.emissiveIntensity = laserOn.value ? 0.8 : 0;
 }
 if (laserBeam) {
 laserBeam.children.forEach(child => {
 if (child.material) {
 child.material.opacity = laserOn.value ? (child === laserBeam.children[0] ? 0.95 : 0.38) : 0;
 }
 });
 }
 if (instruments.axisGuide) {
 instruments.axisGuide.visible = !laserOn.value;
 }
 if (laserOn.value) {
 ElMessage.success('激光已开启');
 }
 else {
 ElMessage.info('激光已关闭');
 }
};
const createCollimator = () => {
 const collimatorGroup = new THREE.Group();
 const blackMaterial = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.5, metalness: 0.6 });
 const aluminumMaterial = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, roughness: 0.3, metalness: 0.9 });
 const brassMaterial = new THREE.MeshStandardMaterial({ color: 0xCD7F32, roughness: 0.4, metalness: 0.7 });
 const tubeGeometry = new THREE.CylinderGeometry(0.55, 0.55, 3.0, 32);
 const tube = new THREE.Mesh(tubeGeometry, blackMaterial);
 tube.rotation.x = Math.PI / 2;
 tube.castShadow = true;
 collimatorGroup.add(tube);
 const innerTubeGeometry = new THREE.CylinderGeometry(0.48, 0.48, 3.0, 32);
 const innerTube = new THREE.Mesh(innerTubeGeometry, aluminumMaterial);
 innerTube.rotation.x = Math.PI / 2;
 innerTube.position.z = 0.01;
 collimatorGroup.add(innerTube);
 const saddleGeometry = new THREE.BoxGeometry(0.6, 1.0, 1.0);
 const saddle = new THREE.Mesh(saddleGeometry, aluminumMaterial);
 saddle.position.set(0, -0.45, 0);
 saddle.castShadow = true;
 collimatorGroup.add(saddle);
 const clampGeometry = new THREE.BoxGeometry(0.2, 0.8, 1.1);
 const clamp1 = new THREE.Mesh(clampGeometry, brassMaterial);
 clamp1.position.set(-0.35, -0.45, 0);
 clamp1.castShadow = true;
 collimatorGroup.add(clamp1);
 const clamp2 = new THREE.Mesh(clampGeometry, brassMaterial);
 clamp2.position.set(0.35, -0.45, 0);
 clamp2.castShadow = true;
 collimatorGroup.add(clamp2);
 const postGeometry = new THREE.CylinderGeometry(0.25, 0.25, 2.8, 16);
 const post = new THREE.Mesh(postGeometry, aluminumMaterial);
 post.position.set(0, -1.8, 0);
 post.castShadow = true;
 collimatorGroup.add(post);
 const heightAdjusterGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.8, 16);
 const heightAdjuster = new THREE.Mesh(heightAdjusterGeometry, blackMaterial);
 heightAdjuster.position.set(0, -2.1, 0);
 heightAdjuster.castShadow = true;
 collimatorGroup.add(heightAdjuster);
 const baseGeometry = new THREE.BoxGeometry(2.0, 0.35, 1.4);
 const base = new THREE.Mesh(baseGeometry, blackMaterial);
 base.position.y = -2.575;
 base.castShadow = true;
 collimatorGroup.add(base);
 const feetGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.12, 16);
 const foot1 = new THREE.Mesh(feetGeometry, aluminumMaterial);
 foot1.position.set(-0.8, -2.75, 0.5);
 collimatorGroup.add(foot1);
 const foot2 = new THREE.Mesh(feetGeometry, aluminumMaterial);
 foot2.position.set(0.8, -2.75, 0.5);
 collimatorGroup.add(foot2);
 const foot3 = new THREE.Mesh(feetGeometry, aluminumMaterial);
 foot3.position.set(-0.8, -2.75, -0.5);
 collimatorGroup.add(foot3);
 const foot4 = new THREE.Mesh(feetGeometry, aluminumMaterial);
 foot4.position.set(0.8, -2.75, -0.5);
 collimatorGroup.add(foot4);
 collimatorGroup.position.set(-11.5, OPTICAL_AXIS_Y, OPTICAL_AXIS_Z);
 collimatorGroup.rotation.y = targetRotationsY.collimator;
 collimatorGroup.userData = {
 id: 'collimator',
 name: '平行光管',
 info: {
 焦距: '300 mm',
 口径: '50 mm',
 用途: '产生平行光束'
 }
 };
 scene.add(collimatorGroup);
 instruments.collimator = collimatorGroup;
};
const createCell = () => {
 const cellGroup = new THREE.Group();
 const glassMaterial = new THREE.MeshStandardMaterial({
 color: 0xE0F7FF,
 transparent: true,
 opacity: 0.45,
 roughness: 0.1,
 metalness: 0.15,
 emissive: 0x0891B2,
 emissiveIntensity: 0.25
 });
 const liquidMaterial = new THREE.MeshStandardMaterial({
 color: props.isArchiveMode ? 0xFFD54F : 0x60A5FA,
 transparent: true,
 opacity: 0.65,
 roughness: 0.05,
 metalness: 0.05,
 emissive: props.isArchiveMode ? 0xF59E0B : 0x2563EB,
 emissiveIntensity: 0.15
 });
 const aluminumMaterial = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, roughness: 0.3, metalness: 0.9 });
 const blackMaterial = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.5, metalness: 0.6 });
 const cellGeometry = new THREE.BoxGeometry(2.0, 1.4, 1.7);
 const cell = new THREE.Mesh(cellGeometry, glassMaterial);
 cell.castShadow = true;
 cell.receiveShadow = true;
 cellGroup.add(cell);
 const liquidGeometry = new THREE.BoxGeometry(1.85, 1.25, 1.55);
 const liquid = new THREE.Mesh(liquidGeometry, liquidMaterial);
 liquid.position.y = 0;
 cellGroup.add(liquid);
 const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x64748B, roughness: 0.4, metalness: 0.8 });
 const frameThickness = 0.08;
 const sideFrameGeometry = new THREE.BoxGeometry(frameThickness, 1.4, 1.7);
 const sideFrame1 = new THREE.Mesh(sideFrameGeometry, frameMaterial);
 sideFrame1.position.set(-0.96, 0, 0);
 sideFrame1.castShadow = true;
 cellGroup.add(sideFrame1);
 const sideFrame2 = new THREE.Mesh(sideFrameGeometry, frameMaterial);
 sideFrame2.position.set(0.96, 0, 0);
 sideFrame2.castShadow = true;
 cellGroup.add(sideFrame2);
 const topFrameGeometry = new THREE.BoxGeometry(2.0, frameThickness, 1.7);
 const topFrame = new THREE.Mesh(topFrameGeometry, frameMaterial);
 topFrame.position.y = 0.74;
 topFrame.castShadow = true;
 cellGroup.add(topFrame);
 const bottomFrameGeometry = new THREE.BoxGeometry(2.0, frameThickness, 1.7);
 const bottomFrame = new THREE.Mesh(bottomFrameGeometry, frameMaterial);
 bottomFrame.position.y = -0.74;
 bottomFrame.castShadow = true;
 cellGroup.add(bottomFrame);
 const transducerGeometry = new THREE.BoxGeometry(1.75, 0.06, 0.1);
 const transducerMaterial = new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.6, metalness: 0.8 });
 const transducerTop = new THREE.Mesh(transducerGeometry, transducerMaterial);
 transducerTop.position.set(0, 0.67, 0.82);
 transducerTop.castShadow = true;
 cellGroup.add(transducerTop);
 const transducerBottom = new THREE.Mesh(transducerGeometry, transducerMaterial);
 transducerBottom.position.set(0, -0.67, 0.82);
 transducerBottom.castShadow = true;
 cellGroup.add(transducerBottom);
 const transducerLabelGeometry = new THREE.PlaneGeometry(0.6, 0.15);
 const transducerLabelMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 1, metalness: 0 });
 const transducerLabel = new THREE.Mesh(transducerLabelGeometry, transducerLabelMaterial);
 transducerLabel.position.set(0, 0, 0.86);
 cellGroup.add(transducerLabel);
 const standPostGeometry = new THREE.CylinderGeometry(0.18, 0.18, 1.5, 16);
 const standPost1 = new THREE.Mesh(standPostGeometry, aluminumMaterial);
 standPost1.position.set(-0.7, -1.45, 0);
 standPost1.castShadow = true;
 cellGroup.add(standPost1);
 const standPost2 = new THREE.Mesh(standPostGeometry, aluminumMaterial);
 standPost2.position.set(0.7, -1.45, 0);
 standPost2.castShadow = true;
 cellGroup.add(standPost2);
 const heightAdjusterGeometry = new THREE.CylinderGeometry(0.32, 0.32, 0.7, 16);
 const heightAdjuster1 = new THREE.Mesh(heightAdjusterGeometry, blackMaterial);
 heightAdjuster1.position.set(-0.7, -1.8, 0);
 heightAdjuster1.castShadow = true;
 cellGroup.add(heightAdjuster1);
 const heightAdjuster2 = new THREE.Mesh(heightAdjusterGeometry, blackMaterial);
 heightAdjuster2.position.set(0.7, -1.8, 0);
 heightAdjuster2.castShadow = true;
 cellGroup.add(heightAdjuster2);
 const baseGeometry = new THREE.BoxGeometry(2.5, 0.35, 1.8);
 const base = new THREE.Mesh(baseGeometry, blackMaterial);
 base.position.y = -2.2;
 base.castShadow = true;
 cellGroup.add(base);
 const feetGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.12, 16);
 const foot1 = new THREE.Mesh(feetGeometry, aluminumMaterial);
 foot1.position.set(-0.9, -2.38, 0.6);
 cellGroup.add(foot1);
 const foot2 = new THREE.Mesh(feetGeometry, aluminumMaterial);
 foot2.position.set(0.9, -2.38, 0.6);
 cellGroup.add(foot2);
 const foot3 = new THREE.Mesh(feetGeometry, aluminumMaterial);
 foot3.position.set(-0.9, -2.38, -0.6);
 cellGroup.add(foot3);
 const foot4 = new THREE.Mesh(feetGeometry, aluminumMaterial);
 foot4.position.set(0.9, -2.38, -0.6);
 cellGroup.add(foot4);
 cellGroup.position.set(-7.2, OPTICAL_AXIS_Y, OPTICAL_AXIS_Z);
 cellGroup.userData = {
 id: 'cell',
 name: '超声光栅池',
 info: {
 溶液类型: props.params.liquidType,
 浓度: props.isArchiveMode ? '未知' : `${props.params.concentration.toFixed(2)} wt%`,
 温度: `${props.params.temperature.toFixed(1)}°C`
 }
 };
 scene.add(cellGroup);
 instruments.cell = cellGroup;
};
const createTelescope = () => {
 const telescopeGroup = new THREE.Group();
 const blackMaterial = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.5, metalness: 0.6 });
 const aluminumMaterial = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, roughness: 0.3, metalness: 0.9 });
 const brassMaterial = new THREE.MeshStandardMaterial({ color: 0xCD7F32, roughness: 0.4, metalness: 0.7 });
 const greenMaterial = new THREE.MeshStandardMaterial({ color: 0x10B981, roughness: 0.3, metalness: 0.5 });
 const mainTubeGeometry = new THREE.CylinderGeometry(0.55, 0.5, 4.5, 32);
 const mainTube = new THREE.Mesh(mainTubeGeometry, blackMaterial);
 mainTube.rotation.x = Math.PI / 2;
 mainTube.castShadow = true;
 telescopeGroup.add(mainTube);
 const innerTubeGeometry = new THREE.CylinderGeometry(0.48, 0.43, 4.5, 32);
 const innerTube = new THREE.Mesh(innerTubeGeometry, aluminumMaterial);
 innerTube.rotation.x = Math.PI / 2;
 innerTube.position.z = 0.01;
 telescopeGroup.add(innerTube);
 const saddleGeometry = new THREE.BoxGeometry(0.6, 1.0, 1.0);
 const saddle = new THREE.Mesh(saddleGeometry, aluminumMaterial);
 saddle.position.set(0, -0.45, 0);
 saddle.castShadow = true;
 telescopeGroup.add(saddle);
 const clampGeometry = new THREE.BoxGeometry(0.2, 0.8, 1.1);
 const clamp1 = new THREE.Mesh(clampGeometry, brassMaterial);
 clamp1.position.set(-0.35, -0.45, 0);
 clamp1.castShadow = true;
 telescopeGroup.add(clamp1);
 const clamp2 = new THREE.Mesh(clampGeometry, brassMaterial);
 clamp2.position.set(0.35, -0.45, 0);
 clamp2.castShadow = true;
 telescopeGroup.add(clamp2);
 const postGeometry = new THREE.CylinderGeometry(0.25, 0.25, 2.8, 16);
 const post = new THREE.Mesh(postGeometry, aluminumMaterial);
 post.position.set(0, -1.8, 0);
 post.castShadow = true;
 telescopeGroup.add(post);
 const heightAdjusterGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.8, 16);
 const heightAdjuster = new THREE.Mesh(heightAdjusterGeometry, blackMaterial);
 heightAdjuster.position.set(0, -2.1, 0);
 heightAdjuster.castShadow = true;
 telescopeGroup.add(heightAdjuster);
 const baseGeometry = new THREE.BoxGeometry(2.0, 0.35, 1.4);
 const base = new THREE.Mesh(baseGeometry, blackMaterial);
 base.position.y = -2.575;
 base.castShadow = true;
 telescopeGroup.add(base);
 const feetGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.12, 16);
 const foot1 = new THREE.Mesh(feetGeometry, aluminumMaterial);
 foot1.position.set(-0.8, -2.75, 0.5);
 telescopeGroup.add(foot1);
 const foot2 = new THREE.Mesh(feetGeometry, aluminumMaterial);
 foot2.position.set(0.8, -2.75, 0.5);
 telescopeGroup.add(foot2);
 const foot3 = new THREE.Mesh(feetGeometry, aluminumMaterial);
 foot3.position.set(-0.8, -2.75, -0.5);
 telescopeGroup.add(foot3);
 const foot4 = new THREE.Mesh(feetGeometry, aluminumMaterial);
 foot4.position.set(0.8, -2.75, -0.5);
 telescopeGroup.add(foot4);
 telescopeGroup.position.set(2.6, OPTICAL_AXIS_Y, OPTICAL_AXIS_Z);
 telescopeGroup.rotation.y = targetRotationsY.telescope;
 telescopeGroup.userData = {
 id: 'telescope',
 name: '测量望远镜',
 info: {
 放大倍数: '20×',
 物镜焦距: '300 mm',
 目镜焦距: '15 mm'
 }
 };
 scene.add(telescopeGroup);
 instruments.telescope = telescopeGroup;
};
const createGenerator = () => {
 const generatorGroup = new THREE.Group();
 const caseMaterial = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.3 });
 const panelMaterial = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.8, metalness: 0.1 });
 const aluminumMaterial = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, roughness: 0.3, metalness: 0.9 });
 const darkGrayMaterial = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5, metalness: 0.4 });
 const bodyGeometry = new THREE.BoxGeometry(2.2, 1.4, 1.0);
 const body = new THREE.Mesh(bodyGeometry, caseMaterial);
 body.castShadow = true;
 generatorGroup.add(body);
 const panelGeometry = new THREE.PlaneGeometry(2.0, 1.2);
 const panel = new THREE.Mesh(panelGeometry, panelMaterial);
 panel.position.set(0, 0, 0.501);
 generatorGroup.add(panel);
 const displayGeometry = new THREE.BoxGeometry(0.7, 0.45, 0.04);
 const displayMaterial = new THREE.MeshStandardMaterial({
 color: 0x34D399,
 emissive: 0x065F46,
 emissiveIntensity: 0.4,
 roughness: 0.1,
 metalness: 0.3
 });
 const display = new THREE.Mesh(displayGeometry, displayMaterial);
 display.position.set(0, 0.4, 0.51);
 generatorGroup.add(display);
 const displayBezelGeometry = new THREE.BoxGeometry(0.78, 0.53, 0.02);
 const displayBezel = new THREE.Mesh(displayBezelGeometry, aluminumMaterial);
 displayBezel.position.set(0, 0.4, 0.505);
 generatorGroup.add(displayBezel);
 const knobGeometry = new THREE.CylinderGeometry(0.15, 0.12, 0.1, 32);
 const knobMaterial = new THREE.MeshStandardMaterial({ color: 0x64748B, roughness: 0.4, metalness: 0.7 });
 const knob1 = new THREE.Mesh(knobGeometry, knobMaterial);
 knob1.position.set(-0.6, -0.25, 0.51);
 knob1.castShadow = true;
 generatorGroup.add(knob1);
 const knob2 = new THREE.Mesh(knobGeometry, knobMaterial);
 knob2.position.set(0.6, -0.25, 0.51);
 knob2.castShadow = true;
 generatorGroup.add(knob2);
 const buttonGeometry = new THREE.CylinderGeometry(0.08, 0.06, 0.04, 32);
 const buttonMaterial = new THREE.MeshStandardMaterial({ color: props.params.amplitude > 0 ? 0x4ADE80 : 0xEF4444, emissive: props.params.amplitude > 0 ? 0x166534 : 0x7F1D1D, emissiveIntensity: 0.6 });
 const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
 button.position.set(0, -0.35, 0.51);
 button.castShadow = true;
 generatorGroup.add(button);
 const indicatorLightGeometry = new THREE.SphereGeometry(0.04, 16, 16);
 const indicatorMaterial = new THREE.MeshStandardMaterial({ color: props.params.amplitude > 0 ? 0xFFD700 : 0x64748B, emissive: props.params.amplitude > 0 ? 0x8B4513 : 0x000000, emissiveIntensity: props.params.amplitude > 0 ? 0.8 : 0 });
 const indicator = new THREE.Mesh(indicatorLightGeometry, indicatorMaterial);
 indicator.position.set(0, -0.15, 0.51);
 generatorGroup.add(indicator);
 const labelMaterial = new THREE.MeshStandardMaterial({ color: 0xF1F5F9, roughness: 1, metalness: 0 });
 const freqLabelGeometry = new THREE.PlaneGeometry(0.3, 0.1);
 const freqLabel = new THREE.Mesh(freqLabelGeometry, labelMaterial);
 freqLabel.position.set(-0.45, -0.35, 0.505);
 generatorGroup.add(freqLabel);
 const ampLabelGeometry = new THREE.PlaneGeometry(0.3, 0.1);
 const ampLabel = new THREE.Mesh(ampLabelGeometry, labelMaterial);
 ampLabel.position.set(0.45, -0.35, 0.505);
 generatorGroup.add(ampLabel);
 const baseGeometry = new THREE.BoxGeometry(1.8, 0.2, 0.9);
 const base = new THREE.Mesh(baseGeometry, darkGrayMaterial);
 base.position.y = -0.8;
 base.castShadow = true;
 generatorGroup.add(base);
 const feetGeometry = new THREE.CylinderGeometry(0.1, 0.13, 0.08, 16);
 const foot1 = new THREE.Mesh(feetGeometry, aluminumMaterial);
 foot1.position.set(-0.7, -0.94, 0.3);
 generatorGroup.add(foot1);
 const foot2 = new THREE.Mesh(feetGeometry, aluminumMaterial);
 foot2.position.set(0.7, -0.94, 0.3);
 generatorGroup.add(foot2);
 const foot3 = new THREE.Mesh(feetGeometry, aluminumMaterial);
 foot3.position.set(-0.7, -0.94, -0.3);
 generatorGroup.add(foot3);
 const foot4 = new THREE.Mesh(feetGeometry, aluminumMaterial);
 foot4.position.set(0.7, -0.94, -0.3);
 generatorGroup.add(foot4);
 generatorGroup.position.set(-3, 0.9, 2.0);
 generatorGroup.userData = {
 id: 'generator',
 name: '超声波发生器',
 info: {
 频率: `${props.params.frequency.toFixed(1)} MHz`,
 功率: `${props.params.amplitude}%`,
 型号: 'SG-500'
 }
 };
 scene.add(generatorGroup);
 instruments.generator = generatorGroup;
};
const createCCD = () => {
 const ccdGroup = new THREE.Group();
 const blackMaterial = new THREE.MeshStandardMaterial({ color: 0x1F2937, roughness: 0.4, metalness: 0.7 });
 const aluminumMaterial = new THREE.MeshStandardMaterial({ color: 0xB0B0B0, roughness: 0.3, metalness: 0.9 });
 const darkGrayMaterial = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.5, metalness: 0.7 });
 const lensMaterial = new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.05, metalness: 0.9, emissive: 0x1E3A5F, emissiveIntensity: 0.5 });
 const cyanAccent = new THREE.MeshStandardMaterial({ color: 0x06B6D4, roughness: 0.1, metalness: 0.9, emissive: 0x0891B2, emissiveIntensity: 0.6 });
 const silverMaterial = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, roughness: 0.2, metalness: 0.95 });
 const bodyGeometry = new THREE.BoxGeometry(1.5, 1.0, 1.3);
 const body = new THREE.Mesh(bodyGeometry, blackMaterial);
 body.castShadow = true;
 body.receiveShadow = true;
 ccdGroup.add(body);
 const topRibGeometry = new THREE.BoxGeometry(1.48, 0.04, 1.28);
 const topRib = new THREE.Mesh(topRibGeometry, darkGrayMaterial);
 topRib.position.y = 0.52;
 topRib.castShadow = true;
 ccdGroup.add(topRib);
 const bottomRibGeometry = new THREE.BoxGeometry(1.48, 0.04, 1.28);
 const bottomRib = new THREE.Mesh(bottomRibGeometry, darkGrayMaterial);
 bottomRib.position.y = -0.52;
 bottomRib.castShadow = true;
 ccdGroup.add(bottomRib);
 const lensHousingGeometry = new THREE.BoxGeometry(0.35, 0.5, 0.45);
 const lensHousing = new THREE.Mesh(lensHousingGeometry, darkGrayMaterial);
 lensHousing.position.set(-0.85, 0.1, 0);
 lensHousing.castShadow = true;
 ccdGroup.add(lensHousing);
 const lensBarrelGeometry = new THREE.CylinderGeometry(0.2, 0.22, 0.3, 32);
 const lensBarrel = new THREE.Mesh(lensBarrelGeometry, blackMaterial);
 lensBarrel.rotation.z = Math.PI / 2;
 lensBarrel.position.set(-1.03, 0.1, 0);
 lensBarrel.castShadow = true;
 ccdGroup.add(lensBarrel);
 const lensGeometry = new THREE.CylinderGeometry(0.16, 0.16, 0.03, 32);
 const lens = new THREE.Mesh(lensGeometry, lensMaterial);
 lens.rotation.z = Math.PI / 2;
 lens.position.set(-1.195, 0.1, 0);
 ccdGroup.add(lens);
 const lensRingGeometry = new THREE.TorusGeometry(0.17, 0.015, 8, 32);
 const lensRing = new THREE.Mesh(lensRingGeometry, cyanAccent);
 lensRing.position.set(-1.21, 0.1, 0);
 lensRing.rotation.y = Math.PI / 2;
 ccdGroup.add(lensRing);
 const screenGeometry = new THREE.BoxGeometry(0.02, 0.55, 0.7);
 const screenMaterial = new THREE.MeshStandardMaterial({ color: 0x0A0A0A, roughness: 0.1, metalness: 0.2, emissive: 0x1a2744, emissiveIntensity: 0.3 });
 const screen = new THREE.Mesh(screenGeometry, screenMaterial);
 screen.position.set(0.75, 0.1, 0);
 ccdGroup.add(screen);
 const screenBezelGeometry = new THREE.BoxGeometry(0.03, 0.6, 0.75);
 const screenBezel = new THREE.Mesh(screenBezelGeometry, aluminumMaterial);
 screenBezel.position.set(0.74, 0.1, 0);
 screenBezel.castShadow = true;
 ccdGroup.add(screenBezel);
 const buttonArrayGeometry = new THREE.CylinderGeometry(0.025, 0.02, 0.015, 16);
 for (let i = 0; i < 3; i++) {
 const btn = new THREE.Mesh(buttonArrayGeometry, silverMaterial);
 btn.position.set(0.55, 0.52, -0.3 + i * 0.1);
 btn.rotation.x = Math.PI / 2;
 ccdGroup.add(btn);
 }
 const statusLightGeometry = new THREE.SphereGeometry(0.03, 16, 16);
 const statusLight = new THREE.Mesh(statusLightGeometry, new THREE.MeshStandardMaterial({ color: 0x22C55E, emissive: 0x166534, emissiveIntensity: 0.9 }));
 statusLight.position.set(0.65, 0.53, 0.48);
 ccdGroup.add(statusLight);
 const tripodMountGeometry = new THREE.BoxGeometry(0.5, 0.06, 0.4);
 const tripodMount = new THREE.Mesh(tripodMountGeometry, darkGrayMaterial);
 tripodMount.position.y = -0.55;
 tripodMount.castShadow = true;
 ccdGroup.add(tripodMount);
 const tripodGroup = new THREE.Group();
 const columnGeometry = new THREE.CylinderGeometry(0.06, 0.08, 2.0, 16);
 const column = new THREE.Mesh(columnGeometry, aluminumMaterial);
 column.position.y = -1.5;
 column.castShadow = true;
 tripodGroup.add(column);
 const baseGeometry = new THREE.BoxGeometry(0.6, 0.06, 0.5);
 const base = new THREE.Mesh(baseGeometry, darkGrayMaterial);
 base.position.y = -2.5;
 base.castShadow = true;
 tripodGroup.add(base);
 const footGeom = new THREE.BoxGeometry(0.5, 0.04, 0.4);
 const foot = new THREE.Mesh(footGeom, aluminumMaterial);
 foot.position.y = -2.55;
 foot.castShadow = true;
 tripodGroup.add(foot);
 ccdGroup.add(tripodGroup);
 ccdGroup.position.set(8.8, OPTICAL_AXIS_Y - opticalCenterOffsets.ccd.y, OPTICAL_AXIS_Z);
 ccdGroup.userData = {
 id: 'ccd',
 name: 'CCD相机',
 info: {
 型号: 'SONY ICX429AL',
 像素: '1360 × 1024',
 像元尺寸: '6.45 μm'
 }
 };
 scene.add(ccdGroup);
 instruments.ccd = ccdGroup;
};
const createComputer = () => {
 const computerGroup = new THREE.Group();
 const blackMaterial = new THREE.MeshStandardMaterial({ color: 0x1E293B, roughness: 0.6, metalness: 0.3 });
 const silverMaterial = new THREE.MeshStandardMaterial({ color: 0x94A3B8, roughness: 0.4, metalness: 0.6 });
 const screenMaterial = new THREE.MeshStandardMaterial({
 color: 0x0F172A,
 emissive: 0x0A1628,
 emissiveIntensity: 0.15,
 roughness: 0.1,
 metalness: 0.1
 });
 const aluminumMaterial = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, roughness: 0.3, metalness: 0.9 });
 const woodMaterial = new THREE.MeshStandardMaterial({ color: 0x8B7355, roughness: 0.7, metalness: 0.1 });
 const screenGeometry = new THREE.BoxGeometry(3.2, 1.9, 0.1);
 const screen = new THREE.Mesh(screenGeometry, blackMaterial);
 screen.position.y = 1.3;
 screen.castShadow = true;
 computerGroup.add(screen);
 const displayGeometry = new THREE.BoxGeometry(2.9, 1.6, 0.03);
 const display = new THREE.Mesh(displayGeometry, screenMaterial);
 display.position.set(0, 1.3, 0.06);
 display.castShadow = true;
 computerGroup.add(display);
 const bezelGeometry = new THREE.BoxGeometry(3.35, 2.05, 0.08);
 const bezel = new THREE.Mesh(bezelGeometry, silverMaterial);
 bezel.position.y = 1.3;
 bezel.castShadow = true;
 computerGroup.add(bezel);
 const standGeometry = new THREE.BoxGeometry(0.5, 0.9, 0.18);
 const stand = new THREE.Mesh(standGeometry, silverMaterial);
 stand.position.y = 0.45;
 stand.castShadow = true;
 computerGroup.add(stand);
 const baseGeometry = new THREE.BoxGeometry(1.6, 0.18, 0.25);
 const base = new THREE.Mesh(baseGeometry, silverMaterial);
 base.position.y = 0;
 base.castShadow = true;
 computerGroup.add(base);
 const keyboardGeometry = new THREE.BoxGeometry(2.2, 0.1, 0.9);
 const keyboardMaterial = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.2 });
 const keyboard = new THREE.Mesh(keyboardGeometry, keyboardMaterial);
 keyboard.position.set(0, 0.25, 1.0);
 keyboard.castShadow = true;
 computerGroup.add(keyboard);
 const keysGeometry = new THREE.BoxGeometry(1.5, 0.03, 0.6);
 const keysMaterial = new THREE.MeshStandardMaterial({ color: 0x475569 });
 const keys = new THREE.Mesh(keysGeometry, keysMaterial);
 keys.position.set(0, 0.21, 0.7);
 computerGroup.add(keys);
 const mouseGeometry = new THREE.BoxGeometry(0.15, 0.05, 0.09);
 const mouse = new THREE.Mesh(mouseGeometry, keyboardMaterial);
 mouse.position.set(0.9, 0.21, 1.0);
 mouse.castShadow = true;
 computerGroup.add(mouse);
 const monitorStandGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.4);
 const monitorStand = new THREE.Mesh(monitorStandGeometry, aluminumMaterial);
 monitorStand.position.set(0, 0.1, 0);
 monitorStand.castShadow = true;
 computerGroup.add(monitorStand);
 const towerGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.4);
 const tower = new THREE.Mesh(towerGeometry, blackMaterial);
 tower.position.set(-1.5, 0.5, 1.2);
 tower.castShadow = true;
 computerGroup.add(tower);
 const towerBezel = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.1, 0.02), aluminumMaterial);
 towerBezel.position.set(-1.28, 0.5, 1.41);
 computerGroup.add(towerBezel);
 const powerButton = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 16), new THREE.MeshStandardMaterial({ color: 0xEF4444, emissive: 0x7F1D1D, emissiveIntensity: 0.6 }));
 powerButton.position.set(-1.25, 0.8, 1.41);
 computerGroup.add(powerButton);
 const deskGeometry = new THREE.BoxGeometry(3.5, 0.1, 1.4);
 const desk = new THREE.Mesh(deskGeometry, woodMaterial);
 desk.position.y = -0.05;
 desk.castShadow = true;
 computerGroup.add(desk);
 const feetGeometry = new THREE.CylinderGeometry(0.12, 0.15, 0.1, 16);
 const foot1 = new THREE.Mesh(feetGeometry, aluminumMaterial);
 foot1.position.set(-1.4, -0.1, 0.6);
 computerGroup.add(foot1);
 const foot2 = new THREE.Mesh(feetGeometry, aluminumMaterial);
 foot2.position.set(1.4, -0.1, 0.6);
 computerGroup.add(foot2);
 const foot3 = new THREE.Mesh(feetGeometry, aluminumMaterial);
 foot3.position.set(-1.4, -0.1, -0.6);
 computerGroup.add(foot3);
 const foot4 = new THREE.Mesh(feetGeometry, aluminumMaterial);
 foot4.position.set(1.4, -0.1, -0.6);
 computerGroup.add(foot4);
 computerGroup.position.set(15, 0.7, 0);
 computerGroup.userData = {
 id: 'computer',
 name: '控制计算机',
 info: {
 用途: '数据采集与处理',
 功能: '显示衍射图样、计算数据'
 }
 };
 scene.add(computerGroup);
 instruments.computer = computerGroup;
};
const createInstruments = () => {
 createLaser();
 createCollimator();
 createCell();
 createGenerator();
 createTelescope();
 createCCD();
 createComputer();
 usedInstruments.value = [];
 updateCellGeneratorConnection();
 alignOpticalAxis(false);
 Object.values(instruments).forEach(inst => {
 if (inst && inst.visible !== undefined && inst !== instruments.axisGuide) {
 inst.visible = false;
 }
 });
 if (instruments.connection) {
 instruments.connection.visible = false;
 }
 if (instruments.axisGuide) {
 instruments.axisGuide.visible = true;
 }
 updateAlignmentStatus();
};

const createCellGeneratorConnection = (cellPos, generatorPos) => {
 const connectionGroup = new THREE.Group();
 const wireMaterial = new THREE.MeshStandardMaterial({ color: 0x1F2937, roughness: 0.6, metalness: 0.3 });
 const terminalMaterial = new THREE.MeshStandardMaterial({ color: 0xB45309, roughness: 0.3, metalness: 0.8 });
 const metalMaterial = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, roughness: 0.2, metalness: 0.95 });
 const cellTerminalLocalPos = new THREE.Vector3(0, 0, 0.95);
 const generatorTerminalLocalPos = new THREE.Vector3(0, 0.6, 0.45);
 const cellTerminalPos = new THREE.Vector3().addVectors(cellPos, cellTerminalLocalPos);
 const generatorTerminalPos = new THREE.Vector3().addVectors(generatorPos, generatorTerminalLocalPos);
 const cellTerminalBase = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.06, 16), metalMaterial);
 cellTerminalBase.position.copy(cellTerminalPos);
 cellTerminalBase.rotation.x = Math.PI / 2;
 connectionGroup.add(cellTerminalBase);
 const cellTerminalInsulator = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 12), terminalMaterial);
 cellTerminalInsulator.position.set(cellTerminalPos.x + 0.07, cellTerminalPos.y, cellTerminalPos.z);
 cellTerminalInsulator.rotation.x = Math.PI / 2;
 connectionGroup.add(cellTerminalInsulator);
 const genTerminalBase = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.06, 16), metalMaterial);
 genTerminalBase.position.copy(generatorTerminalPos);
 genTerminalBase.rotation.y = Math.PI / 2;
 connectionGroup.add(genTerminalBase);
 const genTerminalInsulator = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 12), terminalMaterial);
 genTerminalInsulator.position.set(generatorTerminalPos.x - 0.07, generatorTerminalPos.y, generatorTerminalPos.z);
 genTerminalInsulator.rotation.y = Math.PI / 2;
 connectionGroup.add(genTerminalInsulator);
 const wireStart = new THREE.Vector3(cellTerminalPos.x + 0.11, cellTerminalPos.y, cellTerminalPos.z);
 const wireEnd = new THREE.Vector3(generatorTerminalPos.x - 0.11, generatorTerminalPos.y, generatorTerminalPos.z);
 const wireDirection = new THREE.Vector3().subVectors(wireEnd, wireStart);
 const wireLength = wireDirection.length();
 const wireMid = new THREE.Vector3().addVectors(wireStart, wireEnd).multiplyScalar(0.5);
 const wireGeometry = new THREE.CylinderGeometry(0.015, 0.015, wireLength, 12);
 const wire = new THREE.Mesh(wireGeometry, wireMaterial);
 wire.position.copy(wireMid);
 const upAxis = new THREE.Vector3(0, 1, 0);
 wire.quaternion.setFromUnitVectors(upAxis, wireDirection.clone().normalize());
 wire.castShadow = true;
 connectionGroup.add(wire);
 const connectorHeadGeom = new THREE.CylinderGeometry(0.025, 0.02, 0.06, 12);
 const connectorHead1 = new THREE.Mesh(connectorHeadGeom, metalMaterial);
 connectorHead1.position.copy(wireStart);
 connectorHead1.quaternion.copy(wire.quaternion);
 connectionGroup.add(connectorHead1);
 const connectorHead2 = new THREE.Mesh(connectorHeadGeom, metalMaterial);
 connectorHead2.position.copy(wireEnd);
 connectorHead2.quaternion.copy(wire.quaternion);
 connectionGroup.add(connectorHead2);
 return connectionGroup;
};
const updateCellGeneratorConnection = () => {
 if (!instruments.cell || !instruments.generator) {
 if (instruments.connection) {
 instruments.connection.visible = false;
 }
 return;
 }
 if (!instruments.connection) {
 instruments.connection = createCellGeneratorConnection(instruments.cell.position, instruments.generator.position);
 scene.add(instruments.connection);
 } else {
 scene.remove(instruments.connection);
 instruments.connection = createCellGeneratorConnection(instruments.cell.position, instruments.generator.position);
 scene.add(instruments.connection);
 }
 const cellVisible = instruments.cell.visible;
 const generatorVisible = instruments.generator.visible;
 instruments.connection.visible = cellVisible && generatorVisible;
};

const hideAllInstruments = () => {
 for (const key in instruments) {
 if (instruments[key]) {
 instruments[key].visible = false;
 }
 }
};
const getOpticalCenter = (id) => {
 const instrument = instruments[id];
 const offset = opticalCenterOffsets[id];
 if (!instrument || !offset || !instrument.visible) return null;
 return {
 id,
 x: instrument.position.x,
 y: instrument.position.y + offset.y * instrument.scale.y,
 z: instrument.position.z + offset.z * instrument.scale.z,
 rotationY: instrument.rotation.y
 };
};
const angleDelta = (angle, target) => {
 const twoPi = Math.PI * 2;
 return Math.abs((((angle - target) + Math.PI) % twoPi + twoPi) % twoPi - Math.PI);
};
const updateAlignmentStatus = () => {
 startAlignmentTimer();
 const centers = ['laser', 'collimator', 'cell', 'telescope', 'ccd'].map(getOpticalCenter).filter(Boolean);
 if (centers.length < 3) {
 alignmentStatus.value = {
 level: 'warn',
 text: '光路仪器未完全显示',
 detail: '请至少显示激光、超声池和接收端。',
 tip: '从仪器库点击仪器名称即可显示。'
 };
 return;
 }
 const yErrors = centers.map(center => Math.abs(center.y - OPTICAL_AXIS_Y));
 const zErrors = centers.map(center => Math.abs(center.z - OPTICAL_AXIS_Z));
 const rotationErrors = centers.map(center => angleDelta(center.rotationY, targetRotationsY[center.id] ?? 0));
 const maxY = Math.max(...yErrors);
 const maxZ = Math.max(...zErrors);
 const maxRotation = Math.max(...rotationErrors);
 const detail = `最大高度差 ${maxY.toFixed(2)}，横向偏差 ${maxZ.toFixed(2)}，旋转偏差 ${maxRotation.toFixed(2)} rad`;
 if (maxY < 0.08 && maxZ < 0.08 && maxRotation < 0.08) {
 alignmentStatus.value = {
 level: 'good',
 text: '已等高共轴',
 detail,
 tip: '可以直接开启激光并进入参数调节。'
 };
 } else if (maxY < 0.22 && maxZ < 0.22 && maxRotation < 0.18) {
 alignmentStatus.value = {
 level: 'near',
 text: '接近等高共轴',
 detail,
 tip: '选中偏离仪器，用升高/降低或旋转做细微调整。'
 };
 } else {
 alignmentStatus.value = {
 level: 'warn',
 text: '需要重新校准',
 detail,
 tip: '点击底部“共轴复位”，或逐个移动仪器回到红色参考轴。'
 };
 }
};
const alignOpticalAxis = (notify = true) => {
 const placements = {
 laser: { x: -15.5, y: OPTICAL_AXIS_Y - opticalCenterOffsets.laser.y, z: OPTICAL_AXIS_Z },
 collimator: { x: -11.5, y: OPTICAL_AXIS_Y - opticalCenterOffsets.collimator.y, z: OPTICAL_AXIS_Z },
 cell: { x: -7.2, y: OPTICAL_AXIS_Y - opticalCenterOffsets.cell.y, z: OPTICAL_AXIS_Z },
 telescope: { x: 2.6, y: OPTICAL_AXIS_Y - opticalCenterOffsets.telescope.y, z: OPTICAL_AXIS_Z },
 ccd: { x: 8.8, y: OPTICAL_AXIS_Y - opticalCenterOffsets.ccd.y, z: OPTICAL_AXIS_Z },
 generator: { x: -4.7, y: 0.9, z: 2.2 },
 computer: { x: 15, y: 0.7, z: 0 }
 };
 Object.entries(placements).forEach(([id, position]) => {
 if (!instruments[id]) return;
 instruments[id].position.set(position.x, position.y, position.z);
 instruments[id].rotation.set(0, targetRotationsY[id] ?? 0, 0);
 instruments[id].visible = true;
 });
 updateCellGeneratorConnection();
 updateAlignmentStatus();
 if (notify) {
 ElMessage.success('光路已恢复到等高共轴初始状态');
 }
};

const showInstrument = (instId) => {
 if (instruments[instId]) {
 instruments[instId].visible = true;
 if (!usedInstruments.value.includes(instId)) {
 usedInstruments.value.push(instId);
 }
 if (instId === 'cell' && instruments.generator) {
 instruments.generator.visible = true;
 if (!usedInstruments.value.includes('generator')) {
 usedInstruments.value.push('generator');
 }
 }
 if (instId === 'generator' && instruments.cell) {
 instruments.cell.visible = true;
 if (!usedInstruments.value.includes('cell')) {
 usedInstruments.value.push('cell');
 }
 }
 if (instruments.connection) {
 instruments.connection.visible = instruments.cell?.visible && instruments.generator?.visible;
 }
 updateAlignmentStatus();
 ElMessage.success(`已显示${instruments[instId].userData.name}`);
 }
};
const onDragStart = (e, inst) => {
 if (usedInstruments.value.includes(inst.id)) {
 e.preventDefault();
 return;
 }
 draggingInstrument.value = inst;
 e.dataTransfer.effectAllowed = 'move';
 e.dataTransfer.setData('text/plain', inst.id);
};
const onDragEnd = () => {
 draggingInstrument.value = null;
};
const onDragOver = (e) => {
 e.preventDefault();
 e.dataTransfer.dropEffect = 'move';
};
const onDragLeave = (e) => {
 e.preventDefault();
};
const onDrop = (e) => {
 e.preventDefault();
 if (!draggingInstrument.value)
 return;
 const instId = e.dataTransfer.getData('text/plain');
 if (usedInstruments.value.includes(instId))
 return;
 const rect = canvasContainerRef.value.getBoundingClientRect();
 const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
 const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
 raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
 const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.25);
 const intersectPoint = new THREE.Vector3();
 raycaster.ray.intersectPlane(plane, intersectPoint);
 if (intersectPoint) {
 droppedInstrumentPosition = {
 x: Math.round(intersectPoint.x * 2) / 2,
 y: 0.65,
 z: Math.round(intersectPoint.z * 2) / 2
 };
 addInstrumentToScene(instId, droppedInstrumentPosition);
 usedInstruments.value.push(instId);
 updateAlignmentStatus();
 }
 draggingInstrument.value = null;
};
const addInstrumentToScene = (instId, position) => {
 switch (instId) {
 case 'laser':
 createLaserAt(position);
 break;
 case 'collimator':
 createCollimatorAt(position);
 break;
 case 'cell':
 createCellAt(position);
 if (!usedInstruments.value.includes('generator')) {
 createGeneratorAt({ x: position.x + 3, y: 0.25, z: 0 });
 usedInstruments.value.push('generator');
 }
 break;
 case 'generator':
 createGeneratorAt(position);
 if (!usedInstruments.value.includes('cell')) {
 createCellAt({ x: position.x - 3, y: 2.3, z: 0 });
 usedInstruments.value.push('cell');
 }
 break;
 case 'telescope':
 createTelescopeAt(position);
 break;
 case 'ccd':
 createCCDAt(position);
 break;
 case 'computer':
 createComputerAt(position);
 break;
 }
 updateCellGeneratorConnection();
 updateAlignmentStatus();
};
const createLaserAt = (pos) => {
 const laserGroup = new THREE.Group();
 const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.6, metalness: 0.8 });
 const metalMaterial = new THREE.MeshStandardMaterial({ color: 0x718096, roughness: 0.3, metalness: 0.9 });
 const bodyGeometry = new THREE.CylinderGeometry(0.25, 0.25, 1.2, 32);
 const body = new THREE.Mesh(bodyGeometry, baseMaterial);
 body.position.y = 0.4;
 body.castShadow = true;
 laserGroup.add(body);
 const headGeometry = new THREE.CylinderGeometry(0.18, 0.12, 0.4, 32);
 const head = new THREE.Mesh(headGeometry, metalMaterial);
 head.position.y = 1.1;
 head.castShadow = true;
 laserGroup.add(head);
 const lensCapGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 32);
 const lensCapMaterial = new THREE.MeshStandardMaterial({
 color: laserOn.value ? 0xff6b6b : 0x4a5568,
 emissive: laserOn.value ? 0xff6b6b : 0x000000,
 emissiveIntensity: laserOn.value ? 0.8 : 0,
 roughness: 0.1,
 metalness: 0.9
 });
 const lensCap = new THREE.Mesh(lensCapGeometry, lensCapMaterial);
 lensCap.position.y = 1.34;
 lensCap.castShadow = true;
 laserGroup.add(lensCap);
 const mountGeometry = new THREE.BoxGeometry(0.2, 0.35, 0.2);
 const mount = new THREE.Mesh(mountGeometry, baseMaterial);
 mount.position.y = 0.2;
 mount.castShadow = true;
 laserGroup.add(mount);
 const baseGeometry = new THREE.BoxGeometry(0.6, 0.15, 0.4);
 const base = new THREE.Mesh(baseGeometry, baseMaterial);
 base.position.y = -0.075;
 base.castShadow = true;
 laserGroup.add(base);
 laserGroup.position.set(pos.x, pos.y, pos.z);
 laserGroup.userData = {
 id: 'laser',
 name: '氦氖激光器',
 info: {
 型号: 'HN-100',
 波长: `${props.params.wavelength.toFixed(1)} nm`,
 功率: '10 mW',
 状态: laserOn.value ? '开启' : '关闭'
 }
 };
 scene.add(laserGroup);
 instruments.laser = laserGroup;
 createLaserBeamAt(pos);
};
const createLaserBeamAt = (pos) => {
 const beamGroup = new THREE.Group();
 const beamLength = LASER_BEAM_LENGTH;
 const beamGeometry = new THREE.CylinderGeometry(0.022, 0.022, beamLength, 24);
 const beamMaterial = new THREE.MeshBasicMaterial({
 color: 0xff4444,
 transparent: true,
 opacity: laserOn.value ? 0.95 : 0
 });
 const beam = new THREE.Mesh(beamGeometry, beamMaterial);
 beam.rotation.z = Math.PI / 2;
 beam.position.set(beamLength / 2, 0, 0);
 beamGroup.add(beam);
 const glowGeometry = new THREE.CylinderGeometry(0.085, 0.085, beamLength, 24);
 const glowMaterial = new THREE.MeshBasicMaterial({
 color: 0xff6b6b,
 transparent: true,
 opacity: laserOn.value ? 0.38 : 0
 });
 const glow = new THREE.Mesh(glowGeometry, glowMaterial);
 glow.rotation.z = Math.PI / 2;
 glow.position.set(beamLength / 2, 0, 0);
 beamGroup.add(glow);
 beamGroup.position.set(pos.x, pos.y + 1.4, pos.z);
 laserBeam = beamGroup;
 scene.add(laserBeam);
};
const createCollimatorAt = (pos) => {
 const collimatorGroup = new THREE.Group();
 const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.5, metalness: 0.8 });
 const tubeGeometry = new THREE.CylinderGeometry(0.25, 0.25, 1.2, 32);
 const tube = new THREE.Mesh(tubeGeometry, bodyMaterial);
 tube.rotation.x = Math.PI / 2;
 collimatorGroup.add(tube);
 const mountGeometry = new THREE.BoxGeometry(0.3, 0.4, 0.3);
 const mount = new THREE.Mesh(mountGeometry, bodyMaterial);
 mount.position.set(0, -0.2, 0);
 collimatorGroup.add(mount);
 const baseGeometry = new THREE.BoxGeometry(0.8, 0.15, 0.5);
 const base = new THREE.Mesh(baseGeometry, bodyMaterial);
 base.position.y = -0.575;
 collimatorGroup.add(base);
 collimatorGroup.position.set(pos.x, pos.y, pos.z);
 collimatorGroup.rotation.y = targetRotationsY.collimator;
 collimatorGroup.userData = {
 id: 'collimator',
 name: '平行光管',
 info: {
 焦距: '300 mm',
 口径: '50 mm',
 用途: '产生平行光束'
 }
 };
 scene.add(collimatorGroup);
 instruments.collimator = collimatorGroup;
};
const createCellAt = (pos) => {
 const cellGroup = new THREE.Group();
 const glassMaterial = new THREE.MeshStandardMaterial({
 color: 0xe0f7ff,
 roughness: 0.1,
 metalness: 0.1,
 transparent: true,
 opacity: 0.6,
 side: THREE.DoubleSide
 });
 const frameMaterial = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.5, metalness: 0.8 });
 const cellGeometry = new THREE.BoxGeometry(1.0, 0.6, 0.8);
 const cell = new THREE.Mesh(cellGeometry, glassMaterial);
 cell.castShadow = true;
 cell.receiveShadow = true;
 cellGroup.add(cell);
 const frameGeometry = new THREE.BoxGeometry(1.08, 0.68, 0.88);
 const frame = new THREE.Mesh(frameGeometry, frameMaterial);
 frame.castShadow = true;
 cellGroup.add(frame);
 const transducerMaterial = new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: 0.7, metalness: 0.9 });
 const transducerGeometry = new THREE.BoxGeometry(0.1, 0.55, 0.75);
 const transducerTop = new THREE.Mesh(transducerGeometry, transducerMaterial);
 transducerTop.position.set(0, 0.285, 0.375);
 transducerTop.castShadow = true;
 cellGroup.add(transducerTop);
 const transducerBottom = new THREE.Mesh(transducerGeometry, transducerMaterial);
 transducerBottom.position.set(0, -0.285, 0.375);
 transducerBottom.castShadow = true;
 cellGroup.add(transducerBottom);
 const baseGeometry = new THREE.BoxGeometry(1.0, 0.2, 1.0);
 const base = new THREE.Mesh(baseGeometry, frameMaterial);
 base.position.y = -0.5;
 base.castShadow = true;
 cellGroup.add(base);
 cellGroup.position.set(pos.x, pos.y, pos.z);
 cellGroup.userData = {
 id: 'cell',
 name: '超声光栅池',
 info: {
 溶液类型: props.params.liquidType,
 浓度: props.isArchiveMode ? '未知' : `${props.params.concentration.toFixed(2)} wt%`,
 温度: `${props.params.temperature.toFixed(1)}°C`
 }
 };
 scene.add(cellGroup);
 instruments.cell = cellGroup;
};
const createGeneratorAt = (pos) => {
 const generatorGroup = new THREE.Group();
 const caseMaterial = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.6, metalness: 0.3 });
 const panelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: 0.8, metalness: 0.1 });
 const metalMaterial = new THREE.MeshStandardMaterial({ color: 0x718096, roughness: 0.4, metalness: 0.9 });
 const bodyGeometry = new THREE.BoxGeometry(1.2, 0.8, 0.6);
 const body = new THREE.Mesh(bodyGeometry, caseMaterial);
 body.castShadow = true;
 generatorGroup.add(body);
 const panelGeometry = new THREE.BoxGeometry(0.8, 0.5, 0.02);
 const panel = new THREE.Mesh(panelGeometry, panelMaterial);
 panel.position.set(0, 0.15, 0.301);
 generatorGroup.add(panel);
 const displayGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.01);
 const displayMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, roughness: 0.1, metalness: 0.5, emissive: 0x004400, emissiveIntensity: 0.5 });
 const display = new THREE.Mesh(displayGeometry, displayMaterial);
 display.position.set(0, 0.25, 0.302);
 generatorGroup.add(display);
 const knobGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.04, 16);
 const knob1 = new THREE.Mesh(knobGeometry, metalMaterial);
 knob1.position.set(-0.2, -0.1, 0.301);
 knob1.rotation.x = Math.PI / 2;
 generatorGroup.add(knob1);
 const knob2 = new THREE.Mesh(knobGeometry, metalMaterial);
 knob2.position.set(0.2, -0.1, 0.301);
 knob2.rotation.x = Math.PI / 2;
 generatorGroup.add(knob2);
 const powerButtonGeometry = new THREE.SphereGeometry(0.04, 16, 16);
 const powerButton = new THREE.Mesh(powerButtonGeometry, new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.5, metalness: 0.8 }));
 powerButton.position.set(0.35, 0.25, 0.301);
 generatorGroup.add(powerButton);
 const baseGeometry = new THREE.BoxGeometry(1.4, 0.2, 0.8);
 const base = new THREE.Mesh(baseGeometry, metalMaterial);
 base.position.y = -0.5;
 base.castShadow = true;
 generatorGroup.add(base);
 generatorGroup.position.set(pos.x, pos.y, pos.z);
 generatorGroup.userData = {
 id: 'generator',
 name: '超声波发生器',
 info: {
 频率: `${props.params.frequency.toFixed(1)} MHz`,
 功率: `${props.params.amplitude}%`,
 型号: 'SG-500'
 }
 };
 scene.add(generatorGroup);
 instruments.generator = generatorGroup;
};
const createTelescopeAt = (pos) => {
 const telescopeGroup = new THREE.Group();
 const metalMaterial = new THREE.MeshStandardMaterial({ color: 0x718096, roughness: 0.3, metalness: 0.9 });
 const blackMaterial = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.5, metalness: 0.6 });
 const mainTubeGeometry = new THREE.CylinderGeometry(0.3, 0.28, 2.5, 32);
 const mainTube = new THREE.Mesh(mainTubeGeometry, blackMaterial);
 mainTube.rotation.x = Math.PI / 2;
 telescopeGroup.add(mainTube);
 const mountGeometry = new THREE.BoxGeometry(0.3, 0.4, 0.2);
 const mount = new THREE.Mesh(mountGeometry, blackMaterial);
 mount.position.y = -0.2;
 telescopeGroup.add(mount);
 const baseGeometry = new THREE.BoxGeometry(0.8, 0.15, 0.5);
 const base = new THREE.Mesh(baseGeometry, metalMaterial);
 base.position.y = -0.575;
 telescopeGroup.add(base);
 telescopeGroup.position.set(pos.x, pos.y, pos.z);
 telescopeGroup.rotation.y = targetRotationsY.telescope;
 telescopeGroup.userData = {
 id: 'telescope',
 name: '测量望远镜',
 info: {
 放大倍数: '20×',
 物镜焦距: '300 mm',
 目镜焦距: '15 mm'
 }
 };
 scene.add(telescopeGroup);
 instruments.telescope = telescopeGroup;
};
const createCCDAt = (pos) => {
 const ccdGroup = new THREE.Group();
 const blackMaterial = new THREE.MeshStandardMaterial({ color: 0x1F2937, roughness: 0.4, metalness: 0.7 });
 const aluminumMaterial = new THREE.MeshStandardMaterial({ color: 0xB0B0B0, roughness: 0.3, metalness: 0.9 });
 const darkGrayMaterial = new THREE.MeshStandardMaterial({ color: 0x374151, roughness: 0.5, metalness: 0.7 });
 const lensMaterial = new THREE.MeshStandardMaterial({ color: 0x0F172A, roughness: 0.05, metalness: 0.9, emissive: 0x1E3A5F, emissiveIntensity: 0.5 });
 const cyanAccent = new THREE.MeshStandardMaterial({ color: 0x06B6D4, roughness: 0.1, metalness: 0.9, emissive: 0x0891B2, emissiveIntensity: 0.6 });
 const bodyGeometry = new THREE.BoxGeometry(0.75, 0.5, 0.65);
 const body = new THREE.Mesh(bodyGeometry, blackMaterial);
 body.castShadow = true;
 ccdGroup.add(body);
 const topRibGeometry = new THREE.BoxGeometry(0.74, 0.02, 0.64);
 const topRib = new THREE.Mesh(topRibGeometry, darkGrayMaterial);
 topRib.position.y = 0.26;
 topRib.castShadow = true;
 ccdGroup.add(topRib);
 const lensHousingGeometry = new THREE.BoxGeometry(0.18, 0.25, 0.22);
 const lensHousing = new THREE.Mesh(lensHousingGeometry, darkGrayMaterial);
 lensHousing.position.set(-0.43, 0.05, 0);
 lensHousing.castShadow = true;
 ccdGroup.add(lensHousing);
 const lensBarrelGeometry = new THREE.CylinderGeometry(0.1, 0.11, 0.15, 32);
 const lensBarrel = new THREE.Mesh(lensBarrelGeometry, blackMaterial);
 lensBarrel.rotation.z = Math.PI / 2;
 lensBarrel.position.set(-0.52, 0.05, 0);
 lensBarrel.castShadow = true;
 ccdGroup.add(lensBarrel);
 const lensGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.015, 32);
 const lens = new THREE.Mesh(lensGeometry, lensMaterial);
 lens.rotation.z = Math.PI / 2;
 lens.position.set(-0.605, 0.05, 0);
 ccdGroup.add(lens);
 const lensRingGeometry = new THREE.TorusGeometry(0.09, 0.008, 8, 32);
 const lensRing = new THREE.Mesh(lensRingGeometry, cyanAccent);
 lensRing.position.set(-0.615, 0.05, 0);
 lensRing.rotation.y = Math.PI / 2;
 ccdGroup.add(lensRing);
 const screenGeometry = new THREE.BoxGeometry(0.01, 0.28, 0.35);
 const screenMaterial = new THREE.MeshStandardMaterial({ color: 0x0A0A0A, roughness: 0.1, metalness: 0.2, emissive: 0x1a2744, emissiveIntensity: 0.3 });
 const screen = new THREE.Mesh(screenGeometry, screenMaterial);
 screen.position.set(0.38, 0.05, 0);
 ccdGroup.add(screen);
 const screenBezelGeometry = new THREE.BoxGeometry(0.015, 0.3, 0.38);
 const screenBezel = new THREE.Mesh(screenBezelGeometry, aluminumMaterial);
 screenBezel.position.set(0.375, 0.05, 0);
 screenBezel.castShadow = true;
 ccdGroup.add(screenBezel);
 const tripodMountGeometry = new THREE.BoxGeometry(0.25, 0.03, 0.2);
 const tripodMount = new THREE.Mesh(tripodMountGeometry, darkGrayMaterial);
 tripodMount.position.y = -0.28;
 tripodMount.castShadow = true;
 ccdGroup.add(tripodMount);
 const tripodGroup = new THREE.Group();
 const columnGeometry = new THREE.CylinderGeometry(0.03, 0.04, 1.3, 16);
 const column = new THREE.Mesh(columnGeometry, aluminumMaterial);
 column.position.y = -0.95;
 column.castShadow = true;
 tripodGroup.add(column);
 const baseGeometry = new THREE.BoxGeometry(0.3, 0.03, 0.25);
 const base = new THREE.Mesh(baseGeometry, darkGrayMaterial);
 base.position.y = -1.6;
 base.castShadow = true;
 tripodGroup.add(base);
 ccdGroup.add(tripodGroup);
 ccdGroup.position.set(pos.x, pos.y, pos.z);
 ccdGroup.userData = {
 id: 'ccd',
 name: 'CCD相机',
 info: {
 像素: '130万',
 分辨率: '1280×1024',
 接口: 'USB 2.0'
 }
 };
 scene.add(ccdGroup);
 instruments.ccd = ccdGroup;
};
const createComputerAt = (pos) => {
 const computerGroup = new THREE.Group();
 const caseMaterial = new THREE.MeshStandardMaterial({ color: 0x2d3748, roughness: 0.5, metalness: 0.8 });
 const screenMaterial = new THREE.MeshStandardMaterial({ color: 0x1a365d, roughness: 0.1, metalness: 0.2, emissive: 0x0a1929, emissiveIntensity: 0.3 });
 const standMaterial = new THREE.MeshStandardMaterial({ color: 0x4a5568, roughness: 0.6, metalness: 0.8 });
 const screenGeometry = new THREE.BoxGeometry(1.8, 1.1, 0.08);
 const screen = new THREE.Mesh(screenGeometry, caseMaterial);
 screen.castShadow = true;
 computerGroup.add(screen);
 const displayGeometry = new THREE.BoxGeometry(1.6, 0.9, 0.02);
 const display = new THREE.Mesh(displayGeometry, screenMaterial);
 display.position.z = 0.05;
 display.castShadow = true;
 computerGroup.add(display);
 const standGeometry = new THREE.BoxGeometry(0.2, 0.3, 0.8);
 const stand = new THREE.Mesh(standGeometry, standMaterial);
 stand.position.y = -0.55;
 stand.castShadow = true;
 computerGroup.add(stand);
 const baseGeometry = new THREE.BoxGeometry(0.8, 0.05, 1.2);
 const base = new THREE.Mesh(baseGeometry, standMaterial);
 base.position.y = -0.725;
 base.castShadow = true;
 computerGroup.add(base);
 const deskGeometry = new THREE.BoxGeometry(2.0, 0.08, 1.2);
 const deskMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3728, roughness: 0.7, metalness: 0.1 });
 const desk = new THREE.Mesh(deskGeometry, deskMaterial);
 desk.position.y = -0.04;
 desk.castShadow = true;
 computerGroup.add(desk);
 computerGroup.position.set(pos.x, pos.y, pos.z);
 computerGroup.userData = {
 id: 'computer',
 name: '控制计算机',
 info: {
 用途: '数据采集与处理',
 功能: '显示衍射图样、计算数据'
 }
 };
 scene.add(computerGroup);
 instruments.computer = computerGroup;
};
let previousMousePosition = { x: 0, y: 0 };
const onMouseDown = (e) => {
 isDragging.value = false;
 previousMousePosition = { x: e.clientX, y: e.clientY };
};
const onMouseMove = (e) => {
 if (!controls)
 return;
 if (isMoving.value && selectedInstrument3D.value && !fixedInstruments.value.includes(selectedInstrument3D.value.userData.id)) {
 updateMousePosition(e);
 raycaster.setFromCamera(mouse, camera);
 instrumentDragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -selectedInstrument3D.value.position.y);
 const intersectPoint = new THREE.Vector3();
 raycaster.ray.intersectPlane(instrumentDragPlane, intersectPoint);
 if (intersectPoint) {
 selectedInstrument3D.value.position.x = intersectPoint.x;
 selectedInstrument3D.value.position.z = intersectPoint.z;
 updateCellGeneratorConnection();
 updateAlignmentStatus();
 }
 return;
 }
 if (isRotating.value && selectedInstrument3D.value && !fixedInstruments.value.includes(selectedInstrument3D.value.userData.id)) {
 const deltaX = e.clientX - previousMousePosition.x;
 selectedInstrument3D.value.rotation.y += deltaX * 0.01;
 previousMousePosition = { x: e.clientX, y: e.clientY };
 updateAlignmentStatus();
 return;
 }
 if (isScaling.value && selectedInstrument3D.value && !fixedInstruments.value.includes(selectedInstrument3D.value.userData.id)) {
 const deltaY = e.clientY - previousMousePosition.y;
 const scaleChange = 1 - deltaY * 0.005;
 const newScale = Math.max(0.1, selectedInstrument3D.value.scale.x * scaleChange);
 selectedInstrument3D.value.scale.set(newScale, newScale, newScale);
 previousMousePosition = { x: e.clientX, y: e.clientY };
 updateAlignmentStatus();
 return;
 }
 if (!isOrbitInteracting) {
 updateMousePosition(e);
 checkIntersection();
 }
};
const onMouseUp = () => {
 isDragging.value = false;
};
const updateMousePosition = (e) => {
 if (!canvasContainerRef.value)
 return;
 const rect = canvasContainerRef.value.getBoundingClientRect();
 mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
 mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
};
const checkIntersection = () => {
 if (!camera || !scene)
 return;
 raycaster.setFromCamera(mouse, camera);
 const instrumentMeshes = [];
 Object.values(instruments).forEach(group => {
 group.traverse(child => {
 if (child.isMesh) {
 instrumentMeshes.push(child);
 }
 });
 });
 const intersects = raycaster.intersectObjects(instrumentMeshes);
 if (intersects.length > 0) {
 let parent = intersects[0].object;
 while (parent && !parent.userData.id) {
 parent = parent.parent;
 }
 if (parent && parent.userData.id) {
 containerRef.value.style.cursor = 'pointer';
 }
 else {
 containerRef.value.style.cursor = 'auto';
 }
 }
 else {
 containerRef.value.style.cursor = 'auto';
 }
};
const onClick = (e) => {
 updateMousePosition(e);
 raycaster.setFromCamera(mouse, camera);
 const instrumentMeshes = [];
 Object.values(instruments).forEach(group => {
 group.traverse(child => {
 if (child.isMesh) {
 instrumentMeshes.push(child);
 }
 });
 });
 const intersects = raycaster.intersectObjects(instrumentMeshes);
 if (intersects.length > 0) {
 let parent = intersects[0].object;
 while (parent && !parent.userData.id) {
 parent = parent.parent;
 }
 if (parent && parent.userData.id) {
 const data = { ...parent.userData };
 data.info = { ...parent.userData.info };
 selectedInstrument.value = data;
 selectedInstrument3D.value = parent;
 isMoving.value = false;
 isRotating.value = false;
 isScaling.value = false;
 }
 }
 else {
 selectedInstrument.value = null;
 selectedInstrument3D.value = null;
 isMoving.value = false;
 isRotating.value = false;
 isScaling.value = false;
 }
};
const onDoubleClick = (e) => {
 updateMousePosition(e);
 raycaster.setFromCamera(mouse, camera);
 const instrumentMeshes = [];
 Object.values(instruments).forEach(group => {
 group.traverse(child => {
 if (child.isMesh) {
 instrumentMeshes.push(child);
 }
 });
 });
 const intersects = raycaster.intersectObjects(instrumentMeshes);
 if (intersects.length > 0) {
 let parent = intersects[0].object;
 while (parent && !parent.userData.id) {
 parent = parent.parent;
 }
 if (parent && parent.userData.id) {
 const instId = parent.userData.id;
 selectedInstrument.value = null;
 switch (instId) {
 case 'laser':
 emit('openLaser');
 break;
 case 'collimator':
 emit('openTelescope');
 break;
 case 'cell':
 emit('openCell');
 break;
 case 'generator':
 emit('openGenerator');
 break;
 case 'telescope':
 emit('openTelescope');
 break;
 case 'ccd':
 emit('openCCD');
 break;
 case 'computer':
 emit('openComputer');
 break;
 }
 ElMessage.success(`已打开${parent.userData.name}参数调节`);
 }
 }
};
const onWheel = (e) => {
 if (selectedInstrument3D.value && !fixedInstruments.value.includes(selectedInstrument3D.value.userData.id)) {
 e.preventDefault();
 e.stopPropagation();
 if (controls) {
 controls.enableZoom = false;
 }
 const delta = e.deltaY > 0 ? -0.05 : 0.05;
 const currentScale = selectedInstrument3D.value.scale.x;
 const newScale = Math.max(0.1, currentScale + delta);
 selectedInstrument3D.value.scale.set(newScale, newScale, newScale);
 updateAlignmentStatus();
 }
 else if (controls) {
 controls.enableZoom = true;
 }
};
const resetCamera = () => {
 if (!controls || !camera)
 return;
 camera.position.set(8, 6, 10);
 controls.target.set(0, 0, 0);
 controls.update();
};
const rotateView = (direction) => {
 if (!controls)
 return;
 controls.autoRotateSpeed = direction * 2;
 setTimeout(() => {
 controls.autoRotateSpeed = autoRotate.value ? 0.5 : 0;
 }, 2000);
};
const toggleAutoRotate = () => {
 autoRotate.value = !autoRotate.value;
 if (controls) {
 controls.autoRotate = autoRotate.value;
 controls.autoRotateSpeed = autoRotate.value ? 0.5 : 0;
 }
};
const toggleMove = () => {
 isMoving.value = !isMoving.value;
 isRotating.value = false;
 isScaling.value = false;
 if (isMoving.value) {
 ElMessage.info('进入移动模式，拖动鼠标移动仪器，点击空白处退出');
 }
 else {
 ElMessage.info('已退出移动模式');
 }
};
const toggleRotate = () => {
 isRotating.value = !isRotating.value;
 isMoving.value = false;
 isScaling.value = false;
 if (isRotating.value) {
 ElMessage.info('进入旋转模式，拖动鼠标旋转仪器，点击空白处退出');
 }
 else {
 ElMessage.info('已退出旋转模式');
 }
};
const adjustInstrumentHeight = (delta) => {
 if (!selectedInstrument.value || !selectedInstrument3D.value) {
 ElMessage.info('请先单击选择需要调高的仪器');
 return;
 }
 if (fixedInstruments.value.includes(selectedInstrument3D.value.userData.id)) {
 ElMessage.warning('仪器已固定，请先解除固定后再调高');
 return;
 }
 selectedInstrument3D.value.position.y = Math.max(0.4, Math.min(4.2, selectedInstrument3D.value.position.y + delta));
 updateCellGeneratorConnection();
 updateAlignmentStatus();
 ElMessage.info(delta > 0 ? '已升高选中仪器' : '已降低选中仪器');
};
const toggleScale = () => {
 isScaling.value = !isScaling.value;
 isMoving.value = false;
 isRotating.value = false;
 if (isScaling.value) {
 ElMessage.info('进入缩放模式，拖动鼠标调整仪器大小，点击空白处退出');
 }
 else {
 ElMessage.info('已退出缩放模式');
 }
};
const fixInstrument = () => {
 if (!selectedInstrument.value || !selectedInstrument3D.value)
 return;
 const id = selectedInstrument.value.id;
 if (fixedInstruments.value.includes(id)) {
 fixedInstruments.value = fixedInstruments.value.filter(i => i !== id);
 ElMessage.info('仪器已解除固定');
 }
 else {
 fixedInstruments.value.push(id);
 ElMessage.success('仪器已固定');
 }
};
const removeInstrument = () => {
 if (!selectedInstrument.value || !selectedInstrument3D.value)
 return;
 const id = selectedInstrument.value.id;
 scene.remove(selectedInstrument3D.value);
 delete instruments[id];
 usedInstruments.value = usedInstruments.value.filter(i => i !== id);
 fixedInstruments.value = fixedInstruments.value.filter(i => i !== id);
 selectedInstrument.value = null;
 selectedInstrument3D.value = null;
 updateCellGeneratorConnection();
 updateAlignmentStatus();
 ElMessage.info('仪器已移除');
};
const animate = () => {
 requestAnimationFrame(animate);
 if (controls) {
 controls.update();
 }
 if (renderer && scene && camera) {
 renderer.render(scene, camera);
 }
};
const handleResize = () => {
 if (!canvasContainerRef.value || !camera || !renderer)
 return;
 camera.aspect = canvasContainerRef.value.clientWidth / canvasContainerRef.value.clientHeight;
 camera.updateProjectionMatrix();
 renderer.setSize(canvasContainerRef.value.clientWidth, canvasContainerRef.value.clientHeight);
};
const openComputer = () => {
 selectedInstrument.value = null;
 emit('openComputer');
};
const openGenerator = () => {
 selectedInstrument.value = null;
 emit('openGenerator');
};
const toggleLaser = () => {
 toggleLaserState();
 emit('toggleLaser');
};
const openTelescope = () => {
 selectedInstrument.value = null;
 emit('openTelescope');
};
const openCell = () => {
 selectedInstrument.value = null;
 emit('openCell');
};
const openCCD = () => {
 selectedInstrument.value = null;
 emit('openCCD');
};
onMounted(() => {
 initScene();
 window.addEventListener('resize', handleResize);
 canvasContainerRef.value?.addEventListener('mousedown', onMouseDown);
 canvasContainerRef.value?.addEventListener('mousemove', onMouseMove);
 canvasContainerRef.value?.addEventListener('mouseup', onMouseUp);
 canvasContainerRef.value?.addEventListener('mouseleave', onMouseUp);
 canvasContainerRef.value?.addEventListener('wheel', onWheel, { passive: false });
 canvasContainerRef.value?.addEventListener('click', onClick);
 canvasContainerRef.value?.addEventListener('dblclick', onDoubleClick);
});
onUnmounted(() => {
 window.removeEventListener('resize', handleResize);
 canvasContainerRef.value?.removeEventListener('mousedown', onMouseDown);
 canvasContainerRef.value?.removeEventListener('mousemove', onMouseMove);
 canvasContainerRef.value?.removeEventListener('mouseup', onMouseUp);
 canvasContainerRef.value?.removeEventListener('mouseleave', onMouseUp);
 canvasContainerRef.value?.removeEventListener('wheel', onWheel);
 canvasContainerRef.value?.removeEventListener('click', onClick);
 canvasContainerRef.value?.removeEventListener('dblclick', onDoubleClick);
 if (alignmentTimer) {
 clearTimeout(alignmentTimer);
 }
 if (renderer) {
 renderer.dispose();
 }
});
defineExpose({
 toggleLaserState,
 laserOn
});
</script>

<style scoped>
.instrument-3d-scene {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.canvas-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  overflow: hidden;
}

.scene-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(26, 26, 46, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
}

.overlay-content {
  text-align: center;
}

.loading-text {
  font-size: 18px;
  color: #f1f5f9;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.instrument-info {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 280px;
  background: rgba(30, 41, 59, 0.95);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  z-index: 20;
  overflow: hidden;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #475569;
}

.info-title {
  font-size: 16px;
  font-weight: bold;
  color: #f1f5f9;
}

.info-close {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 20px;
  cursor: pointer;
}

.info-close:hover {
  color: #fff;
}

.info-body {
  padding: 15px 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #334155;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: #94a3b8;
  font-size: 13px;
}

.info-value {
  color: #f1f5f9;
  font-size: 13px;
  font-weight: 500;
}

.info-actions {
  padding: 15px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-btn {
  width: 100%;
  padding: 10px;
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.action-btn:hover {
 background: #2563eb;
}

.instrument-controls {
 padding: 12px 15px;
 display: grid;
 grid-template-columns: repeat(3, 1fr);
 gap: 8px;
 border-top: 1px solid #334155;
}

.control-btn-small {
 padding: 10px 8px;
 background: rgba(71, 85, 105, 0.8);
 color: #f1f5f9;
 border: 1px solid #475569;
 border-radius: 8px;
 cursor: pointer;
 font-size: 13px;
 font-weight: 500;
 text-align: center;
 transition: all 0.2s;
}

.control-btn-small:hover {
 background: #475569;
 transform: scale(1.05);
}

.control-btn-small.active {
 background: #3b82f6;
 border-color: #3b82f6;
 box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
}

.control-btn-small:disabled {
 opacity: 0.5;
 cursor: not-allowed;
 transform: none;
}

.alignment-hud {
  position: absolute;
  top: 20px;
  left: 220px;
  width: 300px;
  z-index: 19;
  padding: 12px 14px;
  border: 1px solid rgba(148, 163, 184, 0.32);
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.78);
  color: #e2e8f0;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.22);
  backdrop-filter: blur(10px);
}

.alignment-hud.good {
  border-color: rgba(34, 197, 94, 0.5);
  background: rgba(6, 78, 59, 0.76);
}

.alignment-hud.near {
  border-color: rgba(251, 191, 36, 0.58);
  background: rgba(120, 53, 15, 0.76);
}

.alignment-hud.warn {
  border-color: rgba(248, 113, 113, 0.62);
  background: rgba(127, 29, 29, 0.78);
}

.alignment-title {
  font-size: 12px;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.72);
  margin-bottom: 4px;
}

.alignment-state {
  font-size: 16px;
  font-weight: 800;
  margin-bottom: 6px;
}

.alignment-detail,
.alignment-tip {
  font-size: 12px;
  line-height: 1.45;
  color: rgba(241, 245, 249, 0.84);
}

.alignment-tip {
  margin-top: 4px;
}

.camera-controls {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  z-index: 20;
}

.control-btn {
  padding: 10px 15px;
  background: rgba(30, 41, 59, 0.9);
  color: #f1f5f9;
  border: 1px solid #475569;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
}

.control-btn:hover {
  background: #475569;
}

.instrument-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 180px;
  background: rgba(30, 41, 59, 0.95);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  z-index: 20;
  overflow: hidden;
}

.panel-header {
  padding: 12px 15px;
  background: linear-gradient(135deg, #475569 0%, #334155 100%);
  color: #f1f5f9;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-close {
  background: none;
  border: none;
  color: #94a3b8;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.panel-close:hover {
  color: #fff;
}

.panel-content {
  padding: 10px;
  max-height: 300px;
  overflow-y: auto;
}

.instrument-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin-bottom: 5px;
  background: rgba(51, 65, 85, 0.5);
  border-radius: 8px;
  cursor: grab;
  transition: all 0.2s;
}

.instrument-item:hover {
  background: rgba(71, 85, 105, 0.8);
  transform: translateX(5px);
}

.instrument-item.used {
  background: rgba(34, 197, 94, 0.2);
  border: 1px solid rgba(34, 197, 94, 0.5);
}

.instrument-item.used:hover {
  transform: none;
}

.instrument-item.visible {
  background: rgba(34, 197, 94, 0.3);
  border: 1px solid rgba(34, 197, 94, 0.7);
}

.inst-icon {
  font-size: 20px;
}

.inst-name {
  color: #e2e8f0;
  font-size: 13px;
}

.drop-zone {
 position: absolute;
 top: 0;
 left: 0;
 width: 100%;
 height: 100%;
 border: 3px dashed transparent;
 border-radius: 12px;
 background: transparent;
 display: flex;
 justify-content: center;
 align-items: center;
 z-index: 5;
 pointer-events: none;
}

.drop-zone.active {
 pointer-events: auto;
}

.drop-zone.active {
 border-color: rgba(59, 130, 246, 0.5);
 background: rgba(59, 130, 246, 0.05);
}

.drop-zone span {
  color: #3b82f6;
  font-size: 18px;
  font-weight: bold;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}
</style>
