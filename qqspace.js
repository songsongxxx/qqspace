// qqspace.js
// ✅ 使用 ES module CDN
//import * as THREE from 'https://cdn.skypack.dev/three@0.128.0';
//import { FBXLoader } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/loaders/FBXLoader.js';
//import { OrbitControls } from 'https://cdn.skypack.dev/three@0.128.0/examples/jsm/controls/OrbitControls.js';

// ✅ 使用 UNPKG 的 ES 模块 CDN（不能混用其他 CDN）

let mixer;
let smallMixer;

const controlsElement = document.querySelector('#controls');
controlsElement.style.zIndex = 10;

// 初始化 Three.js 场景
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 🌞 添加光照（GLTF 需要光照）
const ambientLight = new THREE.AmbientLight(0xffffff, 1); // 环境光
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7);
scene.add(directionalLight);


// 🎯 加载 GLB 模型
let model; // 在加载之前定义一个全局变量

// ✅ 设置 Draco 解码器
const dracoLoader = new THREE.DRACOLoader();
dracoLoader.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');

// ✅ 设置 GLTF 加载器
const loader = new THREE.GLTFLoader();
loader.setDRACOLoader(dracoLoader);

// ✅ 坐标
const axesHelper = new THREE.AxesHelper(100);
scene.add(axesHelper);


loader.load('hurtmice.glb', function (gltf) {
    model = gltf.scene;

    model.traverse((child) => {
        if (child.isMesh) {
            child.material.transparent = false;
            child.material.opacity = 1;
        }
    });

    const box = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    box.getCenter(center);
    model.position.sub(center);

    const pointLight = new THREE.PointLight(0xffffff, 10);
    pointLight.position.set(0, 5, 0);
    scene.add(pointLight);

    model.position.set(0, 0, 0);
    model.scale.set(1, 1, 1);
    scene.add(model);

    // ✅ 添加一个小模型副本（放在摄像机前方）
    /*const smallModel = model.clone();
    smallModel.scale.set(0.02, 0.02, 0.02);
    smallModel.position.set(0, 0, 0);
    camera.add(smallModel);
    scene.add(camera);
    
    // ✅ 为小模型添加动画
    smallMixer = new THREE.AnimationMixer(smallModel);
    gltf.animations.forEach((clip) => {
      smallMixer.clipAction(clip).play();
    });*/
    

    // ✅ 隐藏 loading 界面
    document.getElementById('loading').style.display = 'none';

    console.log("✅ Model Loaded:", model);
    animate();
}, undefined, function (error) {
    console.error("❌ GLB 加载失败:", error);
});



function animate() {
    requestAnimationFrame(animate);

    // 如果模型已加载，将其旋转
    if (model) {
        model.rotation.y += 0.02; // 每帧绕 Y 轴旋转 0.01 弧度
    }

   //  if (mixer) mixer.update(0.016);        // 原模型的动画
   //  if (smallMixer) smallMixer.update(0.016); // ✅ 小模型的动画

    renderer.render(scene, camera);
}

// 🔄 监听窗口大小调整
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

document.querySelector('#controls').addEventListener('click', () => {
  window.location.href = 'qq_space_darkcave.html';
});

const loadingDiv = document.getElementById('loading');
loadingDiv.style.opacity = 0;
setTimeout(() => {
  loadingDiv.style.display = 'none';
}, 500);


/*// vfx
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
});*/
