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
        text: "'Somna Spores,' neural spores shed quietly from villagers’ bodies, float briefly through the air, seeking hosts whose minds match their rhythm.",
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
  