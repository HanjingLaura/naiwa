// Lazy-loaded three.js GLB viewer (only fetched when a 3D exhibit is opened)
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
export function mountViewer(el: HTMLElement, url: string): () => void {
  const w = el.clientWidth, h = el.clientHeight;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio)); renderer.setSize(w, h); renderer.outputColorSpace = THREE.SRGBColorSpace;
  el.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xffe6a0, 2.2));
  const dl = new THREE.DirectionalLight(0xffffff, 2); dl.position.set(2, 4, 3); scene.add(dl);
  const cam = new THREE.PerspectiveCamera(35, w / h, 0.01, 1000);
  const ctl = new OrbitControls(cam, renderer.domElement); ctl.enableDamping = true; ctl.autoRotate = true; ctl.autoRotateSpeed = 2;
  let mixer: THREE.AnimationMixer | null = null; const clock = new THREE.Clock(); let raf = 0;
  new GLTFLoader().load(url, g => {
    const obj = g.scene; scene.add(obj);
    const box = new THREE.Box3().setFromObject(obj); const size = box.getSize(new THREE.Vector3()).length(); const c = box.getCenter(new THREE.Vector3());
    obj.position.sub(c); cam.position.set(0, size * 0.15, size * 1.6); cam.near = size / 100; cam.far = size * 100; cam.updateProjectionMatrix(); ctl.target.set(0, 0, 0);
    if (g.animations.length) { mixer = new THREE.AnimationMixer(obj); mixer.clipAction(g.animations[0]).play(); }
    el.dataset.loaded = '1';
  }, undefined, e => { el.dataset.error = String(e); el.insertAdjacentHTML('beforeend', '<p class="err">模型加载失败</p>'); });
  const loop = () => { raf = requestAnimationFrame(loop); mixer?.update(clock.getDelta()); ctl.update(); renderer.render(scene, cam); };
  loop();
  return () => { cancelAnimationFrame(raf); ctl.dispose(); renderer.dispose(); renderer.domElement.remove(); };
}
