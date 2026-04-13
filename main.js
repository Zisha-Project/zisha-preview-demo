import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';

const DEFAULT_MODEL_URL = 'models/model1.glb';
const THEME_STORAGE_KEY = 'zisha-preview-theme';
const SIDEBAR_STORAGE_KEY = 'zisha-preview-sidebar-collapsed';
const THEMES = {
  light: 'light',
  dark: 'dark'
};
const MOBILE_LAYOUT_QUERY = window.matchMedia('(max-width: 900px)');
const CAPACITY_LIMITS = {
  min: 100,
  max: 500,
  step: 10
};
const SCENE_LAYOUTS = {
  desktopExpanded: {
    cameraFov: 45,
    cameraPosition: new THREE.Vector3(16.2, 5.4, 0),
    controlTarget: new THREE.Vector3(2.4, -0.3, 0),
    modelPosition: new THREE.Vector3(2.7, -5, 0),
    modelTargetSize: 12,
    frameOffset: {
      x: 0.26,
      y: 0
    },
    distanceLimits: {
      min: 8,
      max: 30
    }
  },
  desktopCollapsed: {
    cameraFov: 45,
    cameraPosition: new THREE.Vector3(15, 5, 0),
    controlTarget: new THREE.Vector3(0.35, -0.3, 0),
    modelPosition: new THREE.Vector3(0.55, -5, 0),
    modelTargetSize: 12,
    frameOffset: {
      x: 0,
      y: 0
    },
    distanceLimits: {
      min: 8,
      max: 30
    }
  },
  mobile: {
    cameraFov: 52,
    cameraPosition: new THREE.Vector3(20.5, 6.4, 0),
    controlTarget: new THREE.Vector3(0, -0.45, 0),
    modelPosition: new THREE.Vector3(0, -3.2, 0),
    modelTargetSize: 7.2,
    frameOffset: {
      x: 0,
      y: 0.28
    },
    distanceLimits: {
      min: 12,
      max: 40
    }
  }
};
const DECAL_LAYOUT = {
  projectionOffsetRatio: 0.08,
  verticalCenterRatio: 0.45,
  widthRatio: 0.48,
  heightRatio: 0.4,
  depthRatio: 1.9,
  zOffsetRatio: 0,
  sideRotations: {
    right: new THREE.Euler(0, Math.PI / 2, 0),
    left: new THREE.Euler(0, -Math.PI / 2, 0)
  }
};

const state = {
  currentModel: null,
  mainMesh: null,
  decalMesh: null,
  currentPatternUrl: null,
  currentPaintUrl: null,
  currentCapacity: 300,
  theme: document.documentElement.dataset.theme === THEMES.dark ? THEMES.dark : THEMES.light,
  modelLoadToken: 0,
  decalUpdateToken: 0,
  sidebarCollapsed: false,
  isMobileLayout: MOBILE_LAYOUT_QUERY.matches,
  sidebarOpen: true,
  sceneLayoutKey: MOBILE_LAYOUT_QUERY.matches ? 'mobile' : 'desktopExpanded'
};

const textureCache = new Map();

const app = document.getElementById('app');
const sidebar = document.getElementById('sidebar');
const container = document.getElementById('viewer');
const capacityInput = document.getElementById('capacity-input');
const capacityDisplay = document.getElementById('capacity-display');
const clearDecalButton = document.getElementById('clear-decal-btn');
const themeToggle = document.getElementById('theme-toggle');
const sidebarToggle = document.getElementById('sidebar-toggle');
const initialViewerWidth = Math.max(container.clientWidth, 1);
const initialViewerHeight = Math.max(container.clientHeight, 1);
const initialSceneLayout = SCENE_LAYOUTS[state.sceneLayoutKey];
let resizeSyncFrameId = 0;
let resizeSyncUntil = 0;

const scene = new THREE.Scene();
scene.background = new THREE.Color(getSceneBackgroundColor(state.theme));

const camera = new THREE.PerspectiveCamera(
  initialSceneLayout.cameraFov,
  initialViewerWidth / initialViewerHeight,
  0.1,
  200
);
camera.position.copy(initialSceneLayout.cameraPosition);
camera.lookAt(initialSceneLayout.controlTarget);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(initialViewerWidth, initialViewerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);
const MAX_TEXTURE_ANISOTROPY = renderer.capabilities.getMaxAnisotropy();

scene.add(new THREE.AmbientLight(0xffffff, 1));

const dirLight1 = new THREE.DirectionalLight(0xffffff, 2);
dirLight1.position.set(5, 10, 5);
scene.add(dirLight1);

const dirLight2 = new THREE.DirectionalLight(0xffffff, 2);
dirLight2.position.set(-5, 10, -5);
scene.add(dirLight2);

const pointLight = new THREE.PointLight(0xffffff, 2);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

scene.add(new THREE.AxesHelper(15));

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.copy(initialSceneLayout.controlTarget);
controls.minDistance = initialSceneLayout.distanceLimits.min;
controls.maxDistance = initialSceneLayout.distanceLimits.max;

const gltfLoader = new GLTFLoader();
const textureLoader = new THREE.TextureLoader();

function getSceneBackgroundColor(theme) {
  return theme === THEMES.dark ? 0x181411 : 0xf0f0f0;
}

function renderScene() {
  renderer.render(scene, camera);
}

function readSidebarPreference() {
  try {
    return localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
  } catch (error) {
    console.warn('侧栏偏好读取失败', error);
    return false;
  }
}

function saveThemePreference(theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    console.warn('主题偏好保存失败', error);
  }
}

function saveSidebarPreference(isCollapsed) {
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(isCollapsed));
  } catch (error) {
    console.warn('侧栏偏好保存失败', error);
  }
}

function applyTheme(theme) {
  const nextTheme = theme === THEMES.dark ? THEMES.dark : THEMES.light;

  state.theme = nextTheme;
  document.documentElement.dataset.theme = nextTheme;
  scene.background = new THREE.Color(getSceneBackgroundColor(nextTheme));

  if (themeToggle) {
    themeToggle.checked = nextTheme === THEMES.dark;
  }

  saveThemePreference(nextTheme);
  renderScene();
}

function getSceneLayoutKey() {
  if (state.isMobileLayout) {
    return 'mobile';
  }

  return state.sidebarCollapsed ? 'desktopCollapsed' : 'desktopExpanded';
}

function applyCameraLayout(layout) {
  camera.fov = layout.cameraFov;
  camera.position.copy(layout.cameraPosition);
  camera.lookAt(layout.controlTarget);
  camera.updateProjectionMatrix();

  controls.target.copy(layout.controlTarget);
  controls.minDistance = layout.distanceLimits.min;
  controls.maxDistance = layout.distanceLimits.max;
  controls.update();
}

function applyCameraFraming(layout, width, height) {
  const offsetXRatio = Math.max(layout.frameOffset?.x ?? 0, 0);
  const offsetYRatio = Math.max(layout.frameOffset?.y ?? 0, 0);

  if (!offsetXRatio && !offsetYRatio) {
    camera.clearViewOffset();
    return {
      aspectWidth: width,
      aspectHeight: height
    };
  }

  const offsetX = Math.round(width * offsetXRatio);
  const offsetY = Math.round(height * offsetYRatio);
  const fullWidth = width + offsetX;
  const fullHeight = height + offsetY;
  const viewX = 0;
  const viewY = offsetY;

  camera.setViewOffset(fullWidth, fullHeight, viewX, viewY, width, height);

  return {
    aspectWidth: fullWidth,
    aspectHeight: fullHeight
  };
}

function refreshSceneLayout(options = {}) {
  const { force = false } = options;
  const layoutKey = getSceneLayoutKey();
  const layout = SCENE_LAYOUTS[layoutKey];
  const hasLayoutChanged = force || layoutKey !== state.sceneLayoutKey;

  if (hasLayoutChanged) {
    applyCameraLayout(layout);

    if (state.currentModel) {
      scaleModelToTarget(state.currentModel, layout.modelTargetSize);
      state.currentModel.position.copy(layout.modelPosition);
      updateDecal();
    }
  }

  state.sceneLayoutKey = layoutKey;
}

function syncResizeLoop() {
  handleResize();

  if (performance.now() < resizeSyncUntil) {
    resizeSyncFrameId = requestAnimationFrame(syncResizeLoop);
    return;
  }

  resizeSyncFrameId = 0;
}

function requestResizeSync(duration = 420) {
  resizeSyncUntil = performance.now() + duration;

  if (!resizeSyncFrameId) {
    resizeSyncFrameId = requestAnimationFrame(syncResizeLoop);
  }
}

function updateSidebarControls() {
  const isSidebarExpanded = state.isMobileLayout ? state.sidebarOpen : !state.sidebarCollapsed;
  const toggleLabel = state.isMobileLayout
    ? (state.sidebarOpen ? '关闭侧栏' : '打开侧栏')
    : (state.sidebarCollapsed ? '展开侧栏' : '收起侧栏');
  const toggleArrow = state.isMobileLayout
    ? (isSidebarExpanded ? 'v' : '^')
    : (isSidebarExpanded ? '<' : '>');

  app?.classList.toggle('is-mobile', state.isMobileLayout);
  app?.classList.toggle('sidebar-open', state.isMobileLayout ? state.sidebarOpen : !state.sidebarCollapsed);

  document.body.classList.toggle('is-mobile', state.isMobileLayout);
  document.body.classList.toggle('sidebar-open', state.isMobileLayout ? state.sidebarOpen : !state.sidebarCollapsed);
  document.body.classList.toggle('sidebar-collapsed', !state.isMobileLayout && state.sidebarCollapsed);

  if (sidebar) {
    sidebar.setAttribute('aria-hidden', String(!isSidebarExpanded));

    if (isSidebarExpanded) {
      sidebar.removeAttribute('inert');
    } else {
      sidebar.setAttribute('inert', '');
    }
  }

  if (sidebarToggle) {
    sidebarToggle.textContent = toggleArrow;
    sidebarToggle.setAttribute('aria-label', toggleLabel);
    sidebarToggle.setAttribute('aria-expanded', String(isSidebarExpanded));
    sidebarToggle.dataset.state = isSidebarExpanded ? 'expanded' : 'collapsed';
  }

  refreshSceneLayout();
  requestResizeSync();

  requestAnimationFrame(() => {
    handleResize();
  });
}

function closeSidebar() {
  if (state.isMobileLayout) {
    state.sidebarOpen = false;
    updateSidebarControls();
    return;
  }

  state.sidebarCollapsed = true;
  saveSidebarPreference(true);
  updateSidebarControls();
}

function toggleSidebar() {
  if (state.isMobileLayout) {
    state.sidebarOpen = !state.sidebarOpen;
    updateSidebarControls();
    return;
  }

  state.sidebarCollapsed = !state.sidebarCollapsed;
  saveSidebarPreference(state.sidebarCollapsed);
  updateSidebarControls();
}

function syncResponsiveLayout() {
  const nextIsMobileLayout = MOBILE_LAYOUT_QUERY.matches;

  if (nextIsMobileLayout !== state.isMobileLayout) {
    state.isMobileLayout = nextIsMobileLayout;
    state.sidebarOpen = true;
  } else {
    state.isMobileLayout = nextIsMobileLayout;

    if (!nextIsMobileLayout) {
      state.sidebarOpen = true;
    } else if (state.sceneLayoutKey !== 'mobile') {
      state.sidebarOpen = true;
    }
  }

  updateSidebarControls();
}

function getMeshMaterials(mesh) {
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
  return materials.filter(Boolean);
}

function getPrimaryMaterial(mesh) {
  const materials = getMeshMaterials(mesh);

  return materials.find((material) => material.isMeshStandardMaterial)
    ?? materials[0]
    ?? null;
}

function disposeMeshMaterials(mesh) {
  getMeshMaterials(mesh).forEach((material) => {
    material.dispose();
  });
}

function disposeObject3D(object) {
  object.traverse((child) => {
    if (!child.isMesh) {
      return;
    }

    child.geometry?.dispose();
    disposeMeshMaterials(child);
  });
}

function clearDecal() {
  state.decalUpdateToken += 1;

  if (!state.decalMesh) {
    return;
  }

  scene.remove(state.decalMesh);
  disposeObject3D(state.decalMesh);
  state.decalMesh = null;
}

function clearModel() {
  if (!state.currentModel) {
    state.mainMesh = null;
    return;
  }

  scene.remove(state.currentModel);
  disposeObject3D(state.currentModel);
  state.currentModel = null;
  state.mainMesh = null;
}

function findFirstMesh(root) {
  let firstMesh = null;

  root.traverse((child) => {
    if (!firstMesh && child.isMesh) {
      firstMesh = child;
    }
  });

  return firstMesh;
}

function scaleModelToTarget(model, targetSize) {
  model.scale.setScalar(1);
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z) || 1;
  const scale = targetSize / maxDimension;

  model.scale.setScalar(scale);
}

function configureTexture(texture, colorSpace) {
  texture.colorSpace = colorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = MAX_TEXTURE_ANISOTROPY;
  texture.magFilter = THREE.LinearFilter;

  const imageUrl = texture.image?.currentSrc || texture.image?.src || '';
  const isSvg = typeof imageUrl === 'string' && imageUrl.toLowerCase().includes('.svg');

  // if (isSvg) {
  //   texture.generateMipmaps = false;
  //   texture.minFilter = THREE.LinearFilter;
  // } else {
  //   texture.minFilter = THREE.LinearMipmapLinearFilter;
  // }
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;

  texture.needsUpdate = true;
  return texture;
}

async function loadTexture(url, colorSpace) {
  if (!url) {
    return null;
  }

  const cacheKey = `${url}|${colorSpace}`;

  if (!textureCache.has(cacheKey)) {
    textureCache.set(
      cacheKey,
      textureLoader.loadAsync(url)
        .then((texture) => configureTexture(texture, colorSpace))
        .catch((error) => {
          console.error(`贴图加载失败: ${url}`, error);
          textureCache.delete(cacheKey);
          return null;
        })
    );
  }

  return textureCache.get(cacheKey);
}

function getNormalMapUrl(patternUrl) {
  if (!patternUrl) {
    return null;
  }

  return patternUrl.replace(/\.png$/i, '_normal.png');
}

function getDecalTransforms() {
  state.mainMesh.updateWorldMatrix(true, false);

  const box = new THREE.Box3().setFromObject(state.mainMesh);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const squareSize = Math.max(
    1,
    Math.min(
      size.z * DECAL_LAYOUT.widthRatio,
      size.y * DECAL_LAYOUT.heightRatio
    )
  );

  const baseY = box.min.y + size.y * DECAL_LAYOUT.verticalCenterRatio;
  const baseZ = center.z + size.z * DECAL_LAYOUT.zOffsetRatio;
  const depth = Math.max(1, size.x * DECAL_LAYOUT.depthRatio);
  const projectionOffset = size.x * DECAL_LAYOUT.projectionOffsetRatio;

  return [
    {
      position: new THREE.Vector3(box.max.x + projectionOffset, baseY, baseZ),
      rotation: DECAL_LAYOUT.sideRotations.right,
      size: new THREE.Vector3(squareSize, squareSize, depth)
    },
    {
      position: new THREE.Vector3(box.min.x - projectionOffset, baseY, baseZ),
      rotation: DECAL_LAYOUT.sideRotations.left,
      size: new THREE.Vector3(squareSize, squareSize, depth)
    }
  ];
}

function buildDecalMaterial(paintTexture, normalTexture) {
  const mainMaterial = getPrimaryMaterial(state.mainMesh);
  const modelColor = mainMaterial?.color?.clone() ?? new THREE.Color(0xffffff);
  const emissive = mainMaterial?.emissive?.clone() ?? new THREE.Color(0x000000);

  const decalMaterial = new THREE.MeshStandardMaterial({
    map: paintTexture,
    normalMap: normalTexture,
    normalScale: new THREE.Vector2(1, 1),
    transparent: true,
    opacity: 1,
    side: THREE.FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    depthWrite: false,
    depthTest: true,
    roughness: typeof mainMaterial?.roughness === 'number' ? mainMaterial.roughness : 0.5,
    metalness: typeof mainMaterial?.metalness === 'number' ? mainMaterial.metalness : 0,
    emissive,
    emissiveIntensity: typeof mainMaterial?.emissiveIntensity === 'number'
      ? mainMaterial.emissiveIntensity
      : 1
  });

  decalMaterial.userData.modelColor = modelColor;

  decalMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.modelColor = { value: decalMaterial.userData.modelColor };

    shader.fragmentShader = `uniform vec3 modelColor;\n${shader.fragmentShader}`;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `
      vec4 sampledDiffuseColor = vec4(0.0);
      #ifdef USE_MAP
        sampledDiffuseColor = texture2D(map, vMapUv);
        #ifdef DECODE_VIDEO_TEXTURE
          sampledDiffuseColor = sRGBTransferEOTF(sampledDiffuseColor);
        #endif
      #endif

      float decalAlpha = sampledDiffuseColor.a;
      vec3 decalColor = sampledDiffuseColor.rgb;
      diffuseColor.rgb = mix(modelColor, decalColor, decalAlpha);
      diffuseColor.a = 1.0;
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace('#include <alphatest_fragment>', '');
  };

  decalMaterial.needsUpdate = true;
  return decalMaterial;
}

async function updateDecal() {
  if (!state.currentModel || !state.mainMesh) {
    return;
  }

  clearDecal();

  if (!state.currentPatternUrl && !state.currentPaintUrl) {
    return;
  }

  const decalToken = state.decalUpdateToken;
  const [paintTexture, normalTexture] = await Promise.all([
    loadTexture(state.currentPaintUrl, THREE.SRGBColorSpace),
    loadTexture(getNormalMapUrl(state.currentPatternUrl), THREE.NoColorSpace)
  ]);

  if (decalToken !== state.decalUpdateToken || !state.currentModel || !state.mainMesh) {
    return;
  }

  if (!paintTexture && !normalTexture) {
    return;
  }

  const decalGroup = new THREE.Group();

  getDecalTransforms().forEach((decalTransform) => {
    const decalGeometry = new DecalGeometry(
      state.mainMesh,
      decalTransform.position,
      decalTransform.rotation,
      decalTransform.size
    );
    const decalMaterial = buildDecalMaterial(paintTexture, normalTexture);

    decalGroup.add(new THREE.Mesh(decalGeometry, decalMaterial));
  });

  state.decalMesh = decalGroup;
  scene.add(state.decalMesh);
}

function applyPattern(patternUrl) {
  state.currentPatternUrl = patternUrl;
  updateDecal();
}

function applyPaint(paintUrl) {
  state.currentPaintUrl = paintUrl;
  updateDecal();
}

function updateMeshMaterial(material, color, emissiveColor) {
  if (!material) {
    return;
  }

  if (material.color) {
    material.color.copy(color);
  }

  if (material.emissive) {
    material.emissive.copy(emissiveColor);
  }

  if ('emissiveIntensity' in material) {
    material.emissiveIntensity = 0.5;
  }

  if ('roughness' in material) {
    material.roughness = 0.5;
  }

  if ('metalness' in material) {
    material.metalness = 0;
  }

  material.needsUpdate = true;
}

function changeModelColor(colorHex) {
  if (!state.currentModel) {
    return;
  }

  const color = new THREE.Color(colorHex);
  const emissiveColor = color.clone().multiplyScalar(0.2);

  state.currentModel.traverse((child) => {
    if (!child.isMesh) {
      return;
    }

    getMeshMaterials(child).forEach((material) => {
      updateMeshMaterial(material, color, emissiveColor);
    });
  });

  updateDecal();
}

function loadModel(url) {
  const loadToken = ++state.modelLoadToken;

  clearDecal();
  clearModel();

  gltfLoader.load(
    url,
    (gltf) => {
      if (loadToken !== state.modelLoadToken) {
        disposeObject3D(gltf.scene);
        return;
      }

      const model = gltf.scene;

      state.currentModel = model;
      state.mainMesh = findFirstMesh(model);

      scene.add(model);
      refreshSceneLayout({ force: true });
    },
    undefined,
    (error) => {
      if (loadToken === state.modelLoadToken) {
        console.error(`模型加载失败: ${url}`, error);
      }
    }
  );
}

function updateCapacityDisplay() {
  capacityDisplay.textContent = `当前容量：${state.currentCapacity} cc`;
}

function validateAndSetCapacity(value) {
  const parsedValue = Number.parseInt(value, 10);

  if (Number.isNaN(parsedValue)) {
    capacityInput.value = state.currentCapacity;
    return;
  }

  let nextValue = parsedValue;

  if (nextValue < CAPACITY_LIMITS.min) {
    alert(`小心！\n超出最小容量喽～\n已自动调整为 ${CAPACITY_LIMITS.min} cc`);
    nextValue = CAPACITY_LIMITS.min;
  } else if (nextValue > CAPACITY_LIMITS.max) {
    alert(`小心！\n超出最大容量啦～\n已自动调整为 ${CAPACITY_LIMITS.max} cc`);
    nextValue = CAPACITY_LIMITS.max;
  }

  nextValue = Math.round(nextValue / CAPACITY_LIMITS.step) * CAPACITY_LIMITS.step;
  nextValue = THREE.MathUtils.clamp(nextValue, CAPACITY_LIMITS.min, CAPACITY_LIMITS.max);

  state.currentCapacity = nextValue;
  capacityInput.value = nextValue;
  updateCapacityDisplay();
}

function handleModelButtonClick(event) {
  const button = event.target.closest('button[data-model]');

  if (button) {
    loadModel(button.dataset.model);
  }
}

function handleColorButtonClick(event) {
  const button = event.target.closest('button[data-color]');

  if (button) {
    changeModelColor(button.dataset.color);
  }
}

function handlePatternButtonClick(event) {
  const button = event.target.closest('button[data-pattern]');

  if (button) {
    applyPattern(button.dataset.pattern);
  }
}

function handlePaintButtonClick(event) {
  const button = event.target.closest('button[data-paint]');

  if (button) {
    applyPaint(button.dataset.paint);
  }
}

document.querySelector('.model-btns')?.addEventListener('click', handleModelButtonClick);
document.querySelector('.color-area')?.addEventListener('click', handleColorButtonClick);
document.querySelector('.pattern-area')?.addEventListener('click', handlePatternButtonClick);
document.querySelector('.paint-area')?.addEventListener('click', handlePaintButtonClick);

clearDecalButton?.addEventListener('click', () => {
  state.currentPatternUrl = null;
  state.currentPaintUrl = null;
  updateDecal();
});

sidebarToggle?.addEventListener('click', toggleSidebar);

themeToggle?.addEventListener('change', (event) => {
  applyTheme(event.target.checked ? THEMES.dark : THEMES.light);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && state.isMobileLayout && state.sidebarOpen) {
    closeSidebar();
  }
});

state.sidebarCollapsed = readSidebarPreference();

updateCapacityDisplay();
applyTheme(state.theme);
syncResponsiveLayout();

capacityInput.addEventListener('blur', () => {
  validateAndSetCapacity(capacityInput.value);
});

capacityInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    capacityInput.blur();
  }
});

capacityInput.addEventListener('input', () => {
  capacityInput.value = capacityInput.value.replace(/\D/g, '');
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderScene();
}

function handleResize() {
  const nextWidth = Math.max(container.clientWidth, 1);
  const nextHeight = Math.max(container.clientHeight, 1);
  const activeLayout = SCENE_LAYOUTS[state.sceneLayoutKey];
  const framingMetrics = applyCameraFraming(activeLayout, nextWidth, nextHeight);

  camera.aspect = framingMetrics.aspectWidth / framingMetrics.aspectHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(nextWidth, nextHeight, false);
  renderScene();
}

window.addEventListener('resize', handleResize);
window.addEventListener('resize', () => {
  requestResizeSync(520);
});
window.addEventListener('orientationchange', () => {
  requestResizeSync(700);
});

if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    requestResizeSync(700);
  });
}

if (typeof MOBILE_LAYOUT_QUERY.addEventListener === 'function') {
  MOBILE_LAYOUT_QUERY.addEventListener('change', syncResponsiveLayout);
} else if (typeof MOBILE_LAYOUT_QUERY.addListener === 'function') {
  MOBILE_LAYOUT_QUERY.addListener(syncResponsiveLayout);
}

if (typeof ResizeObserver === 'function') {
  const viewerResizeObserver = new ResizeObserver(() => {
    handleResize();
  });

  viewerResizeObserver.observe(container);
}

sidebar?.addEventListener('transitionrun', () => {
  requestResizeSync();
});
sidebar?.addEventListener('transitionend', () => {
  requestResizeSync(180);
});

animate();
loadModel(DEFAULT_MODEL_URL);
