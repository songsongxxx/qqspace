let currentScene = 0;

const scenes = [
    {
        text: "(sigil)",
        image: "https://raw.githubusercontent.com/username/repository-name/main/images/start.jpg",  // GitHub URL for image
    },
    {
        text: "By day the village is translucent, shifting gently in the light. Reality appears only at night. Days feel thin, like diluted memories, humming softly at the edges. When darkness falls, dreams settle into homes, streets, and skin.",
        image: "https://raw.githubusercontent.com/username/repository-name/main/images/forest.jpg",  // GitHub URL for image
    },
    {
        text: "You are new here and sleepless. You don’t remember why you came. The line between dream and daylight blurs, and slowly, the dreams of others seep into your skin.",
        image: "https://raw.githubusercontent.com/username/repository-name/main/images/forest_light.jpg",  // GitHub URL for image
    },
    {
        text: "'Somna Spores,' neural spores shed quietly from villagers’ bodies, float briefly through the air, seeking hosts whose minds match their rhythm.",
        image: "https://raw.githubusercontent.com/username/repository-name/main/images/new_world.jpg",  // GitHub URL for image
    },
    {
        text: "You feel them coax your skin inward, your cells swelling gently, opening channels. A mouse sleeps on floating moss. A baby drifts through a weightless river, skin dissolving softly into the water.",
        image: "https://raw.githubusercontent.com/username/repository-name/main/images/end.jpg",  // GitHub URL for image
    },
    {
        text: "Skin might be the ultimate vessel of empathy—you don’t know. But you've become a container for dreams. Sensations gather within you until your boundaries blur, and you no longer know which feelings are yours, and which belong to others.",
        image: "https://raw.githubusercontent.com/username/repository-name/main/images/end.jpg",  // GitHub URL for image
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
    
    imageElement.style.opacity = 0;
    textElement.style.opacity = 0;

    // Wait for fade-out to finish before changing content
    setTimeout(() => {
        imageElement.src = scene.image;
        textElement.textContent = scene.text;

        // Fade in the new image and text
        setTimeout(() => {
            imageElement.style.opacity = 1;
            textElement.style.opacity = 1;
        }, 10); // Tiny delay to ensure text fades in after image
    }, 1000); // Matches the fade-out transition time
}

// Initialize the story
updateStory();
