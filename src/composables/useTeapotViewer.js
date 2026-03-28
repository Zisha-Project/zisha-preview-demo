import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DecalGeometry } from 'three/examples/jsm/geometries/DecalGeometry.js';

/**
 * Three.js 紫砂壶预览（与原先 main.js 行为一致）
 * @param {HTMLElement} container
 */
export function createTeapotViewer(container) {
  let currentModel = null;
  let decalMesh = null;
  let mainMesh = null;
  let currentPatternUrl = null;
  let currentPaintUrl = 'patterns/color/invisible.png';

  let animationId = 0;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0f0f0);

  const camera = new THREE.PerspectiveCamera(
    45,
    container.clientWidth / Math.max(container.clientHeight, 1),
    0.1,
    200
  );
  camera.position.set(0, 5, 15);
  camera.lookAt(0, 0, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

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

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 0, 0);

  const gltfLoader = new GLTFLoader();
  const textureLoader = new THREE.TextureLoader();

  function updateDecal() {
    if (!currentModel || !mainMesh) return;

    if (decalMesh) {
      scene.remove(decalMesh);
      decalMesh.geometry.dispose();
      decalMesh.material.dispose();
      decalMesh = null;
    }

    if (!currentPaintUrl && !currentPatternUrl) return;

    const paintPromise = currentPaintUrl
      ? textureLoader.loadAsync(currentPaintUrl)
      : Promise.resolve(null);
    const normalPromise = currentPatternUrl
      ? textureLoader.loadAsync(currentPatternUrl.replace('.png', '_normal.png'))
      : Promise.resolve(null);

    Promise.all([paintPromise, normalPromise]).then(([paintTexture, normalTexture]) => {
      if (paintTexture) {
        paintTexture.colorSpace = THREE.SRGBColorSpace;
        paintTexture.wrapS = THREE.ClampToEdgeWrapping;
        paintTexture.wrapT = THREE.ClampToEdgeWrapping;
      }

      if (normalTexture) {
        normalTexture.colorSpace = THREE.NoColorSpace;
        normalTexture.wrapS = THREE.ClampToEdgeWrapping;
        normalTexture.wrapT = THREE.ClampToEdgeWrapping;
      }

      const decalMaterial = new THREE.MeshStandardMaterial({
        map: paintTexture,
        normalMap: normalTexture,
        normalScale: new THREE.Vector2(1.0, 1.0),
        transparent: true,
        opacity: 1,
        side: THREE.FrontSide,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        depthWrite: false,
        depthTest: true,
        roughness: mainMesh.material.roughness,
        metalness: mainMesh.material.metalness,
        emissive: mainMesh.material.emissive.clone(),
        emissiveIntensity: mainMesh.material.emissiveIntensity
      });

      decalMaterial.userData.modelColor = mainMesh.material.color.clone();

      decalMaterial.onBeforeCompile = (shader) => {
        shader.uniforms.modelColor = { value: decalMaterial.userData.modelColor };

        shader.fragmentShader = `
        uniform vec3 modelColor;
      ` + shader.fragmentShader;

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <map_fragment>',
          `
        #include <map_fragment>
        float decalAlpha = sampledDiffuseColor.a;
        vec3 decalColor = sampledDiffuseColor.rgb;
        diffuseColor.rgb = mix(modelColor, decalColor, decalAlpha);
        diffuseColor.a = 1.0;
        `
        );

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <alphatest_fragment>',
          ''
        );
      };

      decalMaterial.needsUpdate = true;

      const pos = new THREE.Vector3(10, 1, 1);
      const rot = new THREE.Euler(0, Math.PI / 2, 0);
      const size = new THREE.Vector3(5, 5, 20);

      const decalGeo = new DecalGeometry(mainMesh, pos, rot, size);
      decalMesh = new THREE.Mesh(decalGeo, decalMaterial);
      scene.add(decalMesh);

      renderer.render(scene, camera);
    });
  }

  function loadModel(url) {
    if (currentModel) {
      scene.remove(currentModel);
      currentModel = null;
    }

    if (decalMesh) {
      scene.remove(decalMesh);
      decalMesh.geometry.dispose();
      decalMesh.material.dispose();
      decalMesh = null;
    }

    mainMesh = null;

    gltfLoader.load(url, (gltf) => {
      const model = gltf.scene;

      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z);
      model.scale.set(20 / maxDim, 20 / maxDim, 20 / maxDim);
      model.position.set(0, -5, 0);

      scene.add(model);
      currentModel = model;

      model.traverse((child) => {
        if (child.isMesh && !mainMesh) {
          mainMesh = child;
        }
      });

      const axesHelper = new THREE.AxesHelper(15);
      scene.add(axesHelper);

      controls.update();
      updateDecal();
    });
  }

  function applyPattern(patternUrl) {
    currentPatternUrl = patternUrl;
    updateDecal();
  }

  function applyPaint(paintUrl) {
    currentPaintUrl = paintUrl;
    updateDecal();
  }

  function changeModelColor(colorHex) {
    if (!currentModel) return;
    currentModel.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: colorHex,
          emissive: new THREE.Color(colorHex).multiplyScalar(0.2),
          emissiveIntensity: 0.5,
          roughness: 0.5,
          metalness: 0.0
        });
      }
    });

    updateDecal();
  }

  function clearDecals() {
    currentPatternUrl = null;
    currentPaintUrl = 'patterns/color/invisible.png';
    updateDecal();
  }

  function syncDecalState(patternUrl, paintUrl) {
    currentPatternUrl = patternUrl;
    currentPaintUrl = paintUrl;
    updateDecal();
  }

  function animate() {
    animationId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  }
  animate();

  function onResize() {
    if (!container.isConnected) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }
  window.addEventListener('resize', onResize);

  function dispose() {
    cancelAnimationFrame(animationId);
    window.removeEventListener('resize', onResize);

    if (currentModel) {
      scene.remove(currentModel);
      currentModel.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => m.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
      currentModel = null;
    }

    if (decalMesh) {
      scene.remove(decalMesh);
      decalMesh.geometry.dispose();
      decalMesh.material.dispose();
      decalMesh = null;
    }

    controls.dispose();
    renderer.dispose();
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement);
    }

    mainMesh = null;
  }

  return {
    loadModel,
    changeModelColor,
    applyPattern,
    applyPaint,
    clearDecals,
    syncDecalState,
    dispose,
    onResize
  };
}
