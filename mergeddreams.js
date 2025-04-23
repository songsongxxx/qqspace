document.addEventListener("DOMContentLoaded", () => {
    displayProcessedDream(); // Display the first processed dream

    document.getElementById("nextDreamBtn").addEventListener("click", () => {
        displayProcessedDream(); // Show the next processed dream
    });
});

// Function to display one processed dream at a time
function displayProcessedDream() {
    const processedText = JSON.parse(localStorage.getItem("processedTextFragments"));
    const processedAudio = JSON.parse(localStorage.getItem("processedAudioFragments"));

    if (!processedText || !processedAudio) {
        document.getElementById("processedText").textContent = "No processed dreams available.";
        return;
    }

    // Get a random processed text and audio fragment
    const randomTextIndex = Math.floor(Math.random() * processedText.length);
    const randomAudioIndex = Math.floor(Math.random() * processedAudio.length);

    // Display the random text
    document.getElementById("processedText").textContent = processedText[randomTextIndex];

    // Display the random audio
    const audioElem = document.createElement('audio');
    audioElem.src = processedAudio[randomAudioIndex];
    audioElem.controls = true;  // Enable controls for playback
    document.getElementById("processedAudio").innerHTML = ''; // Clear previous audio
    document.getElementById("processedAudio").appendChild(audioElem);
}
