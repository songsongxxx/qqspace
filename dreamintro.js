let currentScene = 0;
let mixer;
let buttonUnlocked = false; // 模型按钮是否可点
let redirectReady = false; // ✅ 是否准备跳转 dream.html
// 🎵 白噪音
let noise, noiseVolume;


async function startBackgroundNoise() {
    if (!noise) {
        await Tone.start(); // 开启音频上下文
        noise = new Tone.Noise('white').start();
        noiseVolume = new Tone.Volume(-35).toDestination(); // 设置小音量
        noise.connect(noiseVolume);
        console.log("🌬️ 白噪音已开始");
    }
}


async function speakText(text) {
  // 🪐 每次说话的时候，确保白噪音也有
  if (!noise) {
      await Tone.start(); // 开启 Tone.js 音频上下文（如果没启动）
      
      // 创建白噪音
      noise = new Tone.Noise('white').start();

      // 低通滤波，让声音柔软
      const filter = new Tone.Filter(800, "lowpass").toDestination();

      // 音量控制
      noiseVolume = new Tone.Volume(-20).connect(filter);

      // 连接
      noise.connect(noiseVolume);

      // 加一个 LFO，让音量忽大忽小
      const lfo = new Tone.LFO({
          frequency: 0.1, // 很慢的起伏
          min: -20,
          max: -5
      }).start();
      lfo.connect(noiseVolume.volume);

      console.log("🌫️ Whisper 背景声已启动");
  }

  // 📖 用 speechSynthesis 读文本（可以小小声）
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.pitch = 12;   // 提高一点点，偏小女生
  utterance.rate = 1;   // 慢慢说
  utterance.volume = 1;  // 小小声，避免盖过whisper噪音
  speechSynthesis.cancel(); // 取消之前的朗读
  speechSynthesis.speak(utterance);

  console.log("📖 开始朗读:", text.slice(0, 20) + "...");
}



const scenes = [
    {
        text: "",
        image: "/dreamimages/sigil.gif",  // GitHub URL for image
        delay: 0 // 秒（测试用）
    },
    {
        text: "By day the village is translucent, shifting gently in the light. Reality appears only at night. Days feel thin, like diluted memories, humming softly at the edges. When darkness falls, dreams settle into homes, streets, and skin.",
        image: "/dreamimages/george.gif",  // GitHub URL for image
        delay: 5 // 秒
    },
    {
        text: "You are new here and sleepless. You don’t remember why you came. The line between dream and daylight blurs, and slowly, the dreams of others seep into your skin.",
        image: "/dreamimages/HOUSEGIF.gif",  // GitHub URL for image
        delay: 5 // 秒
    },
    {
        text: "'Somna Spores,' neural spores shed quietly from villagers’ bodies, float briefly through the air, seeking hosts whose minds match their rhythm. Inside you, Somna Spores weave patiently, layering through your flesh, stretching quietly across time.",
        image: "/dreamimages/somna_spores.png",  // GitHub URL for image
        delay: 5 // 秒
    },
    {
        text: "You feel them coax your skin inward, your cells swelling gently, opening channels. A mouse sleeps on floating moss. A baby drifts through a weightless river, skin dissolving softly into the water.",
        image: "/dreamimages/Somna Spores.mp4",  // GitHub URL for image
        delay: 5 // 秒
    },
    {
        text: "Skin might be the ultimate vessel of empathy—you don’t know. But you've become a container for dreams. Sensations gather within you until your boundaries blur, and you no longer know which feelings are yours, and which belong to others.",
        image: "/dreamimages/SORR.png",  // GitHub URL for image
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
// 修改这里
const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
scene.add(ambientLight);

// 可选：加一个轻微的补光
const hintLight = new THREE.PointLight(0xffffff, 0, 5); // 把 distance 改成 5
hintLight.position.set(0, 0.3, 1); // 离模型近一点
scene.add(hintLight);

// Load .glb button    /dreamimages/furbyanimation.glb
const loader = new THREE.GLTFLoader();
let buttonMesh;


loader.load('dreamimages/icon1.glb', (gltf) => {
  buttonMesh = gltf.scene;
  // ✅ 缩放到合适大小
  buttonMesh.scale.set(0.3, 0.3, 0.3);

  // ✅ 位置居中 y x z
  buttonMesh.position.set(0, 0.1, 0);

  // ✅ 如果模型自身有偏移，可试试居中几何体（可选）
  buttonMesh.traverse(function (child) {
    if (child.isMesh) {
      child.geometry.center();  // 居中子网格几何体
    }
  });

  scene.add(buttonMesh);// ✅ 初始化动画播放器
  if (gltf.animations && gltf.animations.length > 0) {
    mixer = new THREE.AnimationMixer(buttonMesh);

    gltf.animations.forEach((clip) => {
      mixer.clipAction(clip).play();
    });

    console.log("🎥 播放动画", gltf.animations);
  } else {
    console.warn("🚫 模型中没有动画");
  }
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

    // 加上这一句，驱动动画播放
    if (mixer) mixer.update(0.016); // 或用 deltaTime 更平滑

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
  } else {
    // ✅ 最后一幕：跳转
    const button = document.getElementById("next-button");
    button.textContent = "The dream fades away";
    button.disabled = true;
    button.classList.remove("active");

    // ✅ 加一个淡出效果
    document.body.style.transition = "opacity 1s ease";
    document.body.style.opacity = 0;

    setTimeout(() => {
      window.location.href = "dream.html";
    }, 1000);
  }
}


function updateStory() {
    const scene = scenes[currentScene];

    // Fade out the current image and text
    const imageElement = document.getElementById("scene-image");
    const textElement = document.getElementById("story-text");
    const button = document.getElementById("next-button");
    
    const imageUrl = scene.image.toLowerCase(); // 统一为小写方便判断

    if (imageUrl.endsWith(".mp4")) {
        const video = document.createElement("video");
        video.src = scene.image;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.style.width = "100%";
        video.style.height = "auto";
        video.style.objectFit = "cover";
    
        imageElement.replaceWith(video);
        video.id = "scene-image";
    } else if (
        imageUrl.endsWith(".png") ||
        imageUrl.endsWith(".jpg") ||
        imageUrl.endsWith(".jpeg") ||
        imageUrl.endsWith(".gif")
    ) {
        // 如果已经是 <img>，直接改 src，否则重新创建一个 img
        if (imageElement.tagName.toLowerCase() === "img") {
            imageElement.src = scene.image;
        } else {
            const img = document.createElement("img");
            img.src = scene.image;
            img.alt = "Scene Image";
            img.style.width = "100%";
            img.style.height = "auto";
            img.style.objectFit = "cover";
    
            imageElement.replaceWith(img);
            img.id = "scene-image";
        }
    }

  
    // Fade out
    imageElement.style.opacity = 0;
    textElement.style.opacity = 0;

    button.disabled = true;
      button.classList.remove("active");
      button.textContent = `Waiting ${scene.delay} seconds...`;

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
    buttonUnlocked = true; // ✅ 模型现在可点击了！
    hintLight.intensity = 4;
    hintLight.color.set("0xffffff"); // 试试亮一点的粉紫色

    button.classList.add("active");
    button.textContent = "wwWwwait seconds➤";
    
  } else {
    button.textContent = `Waiting ${remaining} seconds...`;
  }
}, 1000);

 // 新增：🔊 每次切换场景时朗读文本
    if (scene.text && scene.text.trim() !== "") {
        speakText(scene.text);
    }

}


document.getElementById("next-button").addEventListener("click", () => {
    if (document.getElementById("next-button").disabled) return;

    if (currentScene < scenes.length - 1) {
      currentScene++;
      updateStory();
    } else {
      document.getElementById("next-button").textContent = "The dream fades away";
      document.getElementById("next-button").disabled = true;
      document.getElementById("next-button").classList.remove("active");

       // ✅ 加一个柔和的淡出 + 页面跳转
    setTimeout(() => {
      document.body.style.transition = "opacity 1s ease";
      document.body.style.opacity = 0;

      setTimeout(() => {
        window.location.href = "dream.html";
      }, 1000); // 1秒后跳转
    }, 1000); // 再延迟1秒

    }
  });

  function onClick(event) {
    const bounds = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
    mouse.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
  
    const intersects = raycaster.intersectObjects(scene.children, true);
    if (intersects.length > 0 && buttonUnlocked) {
      nextScene(); // ✅ 只有在模型被允许点击时才继续
      buttonUnlocked = false; // ✅ 马上锁回去，避免连点
    }
    hintLight.intensity = 0;

    
  }

// Initialize the story
window.onload = () => {
    updateStory();
  };
  
  document.getElementById("loader").style.opacity = 0;
setTimeout(() => {
  document.getElementById("loader").style.display = "none";
}, 500);



// 页面加载完就准备播放（尽量不等用户点击）
window.addEventListener('load', async () => {
  try {
      await startBackgroundNoise();
  } catch (e) {
      console.warn('⚠️ 自动播放被浏览器拦截，需要用户手动触发！');
      // 等用户第一次交互后再触发
      document.addEventListener('click', async () => {
          await startBackgroundNoise();
      }, { once: true });
  }
});