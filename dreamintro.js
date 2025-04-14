let currentScene = 0;

const scenes = [
    {
        text: "Welcome to the story! Click to begin.",
        image: "https://raw.githubusercontent.com/username/repository-name/main/images/start.jpg",  // GitHub URL for image
    },
    {
        text: "You find yourself standing in a dark forest. The air is thick with mystery. What's your next move?",
        image: "https://raw.githubusercontent.com/username/repository-name/main/images/forest.jpg",  // GitHub URL for image
    },
    {
        text: "A sudden gust of wind whispers your name. You turn and see a glowing light ahead.",
        image: "https://raw.githubusercontent.com/username/repository-name/main/images/forest_light.jpg",  // GitHub URL for image
    },
    {
        text: "You step forward, and the light envelops you, transporting you to a new world.",
        image: "https://raw.githubusercontent.com/username/repository-name/main/images/new_world.jpg",  // GitHub URL for image
    },
    {
        text: "The end of the journey... or is it just the beginning?",
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
        imageElement.style.opacity = 1;
        textElement.style.opacity = 1;
    }, 1000); // Matches the fade-out transition time
}

// Initialize the story
updateStory();
