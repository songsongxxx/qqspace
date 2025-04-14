let currentScene = 0;

const scenes = [
    {
        text: "(sigil)",
        image: "https://raw.githubusercontent.com/songsongxxx/qqspace/main/dreamimages/sigil.png",  // GitHub URL for image
        delay: 3 // 秒（测试用）
    },
    {
        text: "By day the village is translucent, shifting gently in the light. Reality appears only at night. Days feel thin, like diluted memories, humming softly at the edges. When darkness falls, dreams settle into homes, streets, and skin.",
        image: "https://raw.githubusercontent.com/songsongxxx/qqspace/main/dreamimages/9.png",  // GitHub URL for image
        delay: 5 // 秒
    },
    {
        text: "You are new here and sleepless. You don’t remember why you came. The line between dream and daylight blurs, and slowly, the dreams of others seep into your skin.",
        image: "https://raw.githubusercontent.com/username/repository-name/main/images/forest_light.jpg",  // GitHub URL for image
        delay: 5 // 秒
    },
    {
        text: "'Somna Spores,' neural spores shed quietly from villagers’ bodies, float briefly through the air, seeking hosts whose minds match their rhythm. Inside you, Somna Spores weave patiently, layering through your flesh, stretching quietly across time.",
        image: "https://raw.githubusercontent.com/songsongxxx/qqspace/main/dreamimages/somna_spores.png",  // GitHub URL for image
        delay: 5 // 秒
    },
    {
        text: "You feel them coax your skin inward, your cells swelling gently, opening channels. A mouse sleeps on floating moss. A baby drifts through a weightless river, skin dissolving softly into the water.",
        image: "https://raw.githubusercontent.com/username/repository-name/main/images/end.jpg",  // GitHub URL for image
        delay: 5 // 秒
    },
    {
        text: "Skin might be the ultimate vessel of empathy—you don’t know. But you've become a container for dreams. Sensations gather within you until your boundaries blur, and you no longer know which feelings are yours, and which belong to others.",
        image: "https://raw.githubusercontent.com/username/repository-name/main/images/end.jpg",  // GitHub URL for image
        delay: 5 // 秒
    }
];


// button Scene setup
const container = document.getElementById('glb-button-container');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
camera.position.z = 2;

const renderer = new THREE.WebGLRenderer({ alpha: true });
renderer.setClearColor(0x000000, 0); // 第二个参数是透明度（0 = 完全透明）
renderer.setSize(container.clientWidth, container.clientHeight);
container.appendChild(renderer.domElement);

// Light
const light = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(light);

// Load .glb button
const loader = new THREE.GLTFLoader();
let buttonMesh;

loader.load('/dreamimages/furbyanimation.glb', (gltf) => {
  buttonMesh = gltf.scene;
  // ✅ 缩放到合适大小
  buttonMesh.scale.set(0.003, 0.003, 0.003);

  // ✅ 位置居中
  buttonMesh.position.set(0, 0, 0);

  // ✅ 如果模型自身有偏移，可试试居中几何体（可选）
  buttonMesh.traverse(function (child) {
    if (child.isMesh) {
      child.geometry.center();  // 居中子网格几何体
    }
  });

  scene.add(buttonMesh);
}, undefined, (error) => {
  console.error(error);
});

// Hover / click
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onClick(event) {
  const bounds = renderer.domElement.getBoundingClientRect();
  mouse.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  mouse.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(scene.children, true);
  if (intersects.length > 0) {
    const nextBtn = document.getElementById("next-button");
    if (!nextBtn.disabled) {
      nextScene(); // 调用原有逻辑
    }
  }
}

renderer.domElement.addEventListener('click', onClick);

// Animate
function animate() {
  requestAnimationFrame(animate);
  if (buttonMesh) {
    buttonMesh.rotation.y += 0.01;
  }
  renderer.render(scene, camera);
}
animate();



function nextScene() {
    if (currentScene < scenes.length - 1) {
        currentScene++;
        updateStory();
    }
}

function updateStory() {
    const scene = scenes[currentScene];

    // Fade out the current image and text
    const imageElement = document.getElementById("scene-image");
    const textElement = document.getElementById("story-text");
    const button = document.getElementById("next-button");
    
    // Fade out
    imageElement.style.opacity = 0;
    textElement.style.opacity = 0;

    button.disabled = true;
      button.classList.remove("active");
      button.textContent = `请等待 ${scene.delay} 秒...`;

    // Wait for fade-out to finish before changing content
    setTimeout(() => {
        imageElement.src = scene.image;
        textElement.textContent = scene.text;
    
        setTimeout(() => {
            imageElement.style.opacity = 1;
            textElement.style.opacity = 1;
        }, 100); // 100ms 确保文字设置后再淡入
    }, 1000);
    

     // 启动倒计时，激活按钮
     let remaining = scene.delay;
     const countdown = setInterval(() => {
       remaining--;
       if (remaining <= 0) {
         clearInterval(countdown);
         button.disabled = false;
         button.classList.add("active");
         button.textContent = "继续故事 ➤";
       } else {
         button.textContent = `请等待 ${remaining} 秒...`;
       }
     }, 1000);

}

document.getElementById("next-button").addEventListener("click", () => {
    if (document.getElementById("next-button").disabled) return;

    if (currentScene < scenes.length - 1) {
      currentScene++;
      updateStory();
    } else {
      document.getElementById("next-button").textContent = "故事已结束";
      document.getElementById("next-button").disabled = true;
      document.getElementById("next-button").classList.remove("active");
    }
  });

// Initialize the story
window.onload = () => {
    updateStory();
  };
  