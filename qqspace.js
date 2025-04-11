// qqspace.js
// ✅ 使用 ES module CDN
import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';
import { FBXLoader } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/controls/OrbitControls.js';

let mixer;

const controlsElement = document.querySelector('#controls');

// 不再动态设置 top，只确保 z-index 足够
controlsElement.style.zIndex = 10;


// 初始化 Three.js 场景
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// 渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.0001; // 默认是 1，可以调成 0.8～1.2


const animateMixers = [];
const clock = new THREE.Clock();

// 坐标轴
const axesHelper = new THREE.AxesHelper(100); // 参数表示长度，可调
scene.add(axesHelper);

// 修改所有轴的颜色为红色
axesHelper.material.vertexColors = false;
axesHelper.material.color.set(0xff0000); // 红色

// 添加光照
// scene.add(new THREE.AmbientLight(0xffffff, 1));
// const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
// directionalLight.position.set(50, 100, 70);
// scene.add(directionalLight);


const pivot = new THREE.Group();
scene.add(pivot);




// 创建 OrbitControls 控制器
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 0, 0); // 默认看向中心
controls.update();


// sample加载模型

// 添加一个调试球体
//const tempSphere = new THREE.Mesh(
   // new THREE.SphereGeometry(5, 32, 32),
   // new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true })
  //);
  //scene.add(tempSphere);
  
  // 设置相机位置并看向球体
  //camera.position.set(0, 0, 20); // 后退 20
  //camera.lookAt(0, 0, 0);
  
  scene.add(new THREE.AxesHelper(5));


  // 加载模型
const loader = new FBXLoader();
loader.load('hurtmicee.fbx', function (object) {
    const model = object; 

   // 获取模型中心和大小
   const box = new THREE.Box3().setFromObject(model);
   const center = new THREE.Vector3();
   const size = new THREE.Vector3();
   box.getCenter(center);
   box.getSize(size);

   // ✅ 缩放到合适大小
   model.scale.set(0.2, 0.2, 0.2);

     // ✅ 还原材质
  model.traverse(child => {
    if (child.isMesh) {
      child.material.transparent = true;
      child.material.opacity = 1;
      child.material.depthWrite = true;
      child.material.side = THREE.DoubleSide;
    }
  });

   // ✅ 把模型移到原点（模型居中） x y? z
   model.position.set(-50, 220, -200);
   model.position.sub(center);

   // ✅ 加入场景（pivot 可保留）
   pivot.add(model);

     // ✅ 动画部分
  if (object.animations && object.animations.length > 0) {
    mixer = new THREE.AnimationMixer(model);
    object.animations.forEach(clip => {
      mixer.clipAction(clip).play();
    });
  }

   // ✅ 相机对准模型中心
   camera.position.set(0, 0, Math.max(size.x, size.y, size.z) * 2);
   camera.lookAt(0, 0, 0);
    

  // ✅ 自动聚焦镜头
  camera.position.set(0, 10, 410); // 镜头往后一点
  camera.lookAt(0, 0, 0);

  
  // ✅ OrbitControls 聚焦模型
  controls.target.set(0, 0, 0); // 或 controls.target.copy(center);
  controls.update();

    console.log("✅ Model Loaded & Centered:", model);
    animate();
}, undefined, function (error) {
    console.error("❌ GLB 加载失败:", error);
});

// 动画循环
function animate() {
    requestAnimationFrame(animate);
    if (mixer) mixer.update(clock.getDelta());
    //pivot.rotation.y += 0.01; // 旋转模型
    controls.update(); // 🔁 必须更新控制器
    renderer.render(scene, camera);
}

// 监听窗口大小变化
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
