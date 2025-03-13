// 初始化 Three.js 场景
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 添加光照
scene.add(new THREE.AmbientLight(0xffffff, 1));
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(50, 100, 70);
scene.add(directionalLight);

const pivot = new THREE.Group();
scene.add(pivot);

// 加载模型
const loader = new THREE.GLTFLoader();
loader.load('key.glb', function (gltf) {
    const model = gltf.scene;

    // 计算模型包围盒
    const box = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);

    model.position.sub(center);  // 移动模型到原点
    model.scale.set(1, 1, 1);  // 缩放模型
    model.position.y += 2;  // 调整模型位置
    pivot.add(model);

    // 计算相机位置
    const cameraDistance = Math.max(size.x, size.y, size.z) * 3;
    camera.position.set(0, Math.max(size.x, size.y, size.z), cameraDistance);
 // 动态调整控制面板位置
 const controlsElement = document.querySelector('#controls');
 const modelBottom = model.position.y - (size.y +=2 );  // 计算模型底部的 Y 坐标
 controlsElement.style.top = `${modelBottom + 740}px`;  // 设置 #controls 的 top 值，确保面板位于模型下方

    console.log("✅ Model Loaded & Centered:", model);
    animate();
}, undefined, function (error) {
    console.error("❌ GLB 加载失败:", error);
});

// 动画循环
function animate() {
    requestAnimationFrame(animate);
    pivot.rotation.y += 0.01; // 旋转模型
    renderer.render(scene, camera);
}

// 监听窗口大小变化
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
