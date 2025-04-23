document.addEventListener("DOMContentLoaded", () => {
    displayProcessedDream(); // Display the first processed dream

    document.getElementById("nextDreamBtn").addEventListener("click", () => {
        displayProcessedDream(); // Show the next processed dream
    });
});

function displayProcessedDream() {
    const processedText = JSON.parse(localStorage.getItem("processedTextFragments"));
    const processedAudio = localStorage.getItem("processedAudioFragments");

    if (!processedText || processedText.length === 0) {
        document.getElementById("processedText").textContent = "No processed dream text found.";
        return;
    }

    if (!processedAudio) {
        document.getElementById("processedAudio").textContent = "No audio available.";
        return;
    }

    // Randomly pick one sentence from the processedText array
    const randomTextIndex = Math.floor(Math.random() * processedText.length);
    const selectedText = processedText[randomTextIndex];

    document.getElementById("processedText").textContent = selectedText;

    // Display the reconstructed audio
    const audioElem = document.createElement("audio");
    audioElem.src = processedAudio;
    audioElem.controls = true;

    const audioContainer = document.getElementById("processedAudio");
    audioContainer.innerHTML = ''; // Clear previous audio
    audioContainer.appendChild(audioElem);
}

document.addEventListener("DOMContentLoaded", () => {
    displayProcessedDream();

    document.getElementById("nextDreamBtn").addEventListener("click", () => {
        displayProcessedDream(); // Show a new randomized dream on click
    });
});
