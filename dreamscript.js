let mediaRecorder;
let audioChunks = [];

function createBubble() {
    const text = document.getElementById("bubbleText").value.trim();
    const imageFile = document.getElementById("imageUpload").files[0];
    if (!text && !imageFile) {
        alert("Please enter text or upload an image.");
        return;
    }
    let imageURL = null;
    if (imageFile) {
        imageURL = URL.createObjectURL(imageFile);
    }
    generateBubble(text, null, imageURL);
}


function generateBubble(text, audioURL = null, imageURL = null) {
    if (!text && !audioURL && !imageURL) return;

    const bubble = document.createElement("div");
    bubble.classList.add("bubble");

    if (text) {
        bubble.textContent = text;
    }

    if (audioURL) {
        const audio = document.createElement("audio");
        audio.src = audioURL;
        audio.controls = true;
        bubble.textContent = "";
        bubble.appendChild(audio);
    }

    if (imageURL) {
        const img = document.createElement("img");
        img.src = imageURL;
        bubble.textContent = "";
        bubble.appendChild(img);
    }

    const x = Math.random() * (window.innerWidth - 100);
    const y = Math.random() * (window.innerHeight - 100);
    bubble.style.left = `${x}px`;
    bubble.style.top = `${y}px`;

    document.getElementById("bubbleContainer").appendChild(bubble);
    document.getElementById("bubbleText").value = "";
    document.getElementById("imageUpload").value = "";


    moveBubble(bubble);
    setTimeout(() => decayBubble(bubble, text, audioURL, imageURL), 60000);
}

function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const audioURL = URL.createObjectURL(audioBlob);
                generateBubble(null, audioURL);
            };

            mediaRecorder.start();
            document.querySelector("button[onclick='stopRecording()']").disabled = false;
        });
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
        document.querySelector("button[onclick='stopRecording()']").disabled = true;
    }
}

function moveBubble(bubble) {
    let x = parseFloat(bubble.style.left);
    let y = parseFloat(bubble.style.top);
    let speedX = (Math.random() - 0.5) * 1;
    let speedY = (Math.random() - 0.5) * 1;

    function animate() {
        x += speedX;
        y += speedY;

        if (x <= 0 || x + bubble.offsetWidth >= window.innerWidth) speedX *= -1;
        if (y <= 0 || y + bubble.offsetHeight >= window.innerHeight) speedY *= -1;

        bubble.style.left = `${x}px`;
        bubble.style.top = `${y}px`;

        requestAnimationFrame(animate);
    }

    animate();
}

function decayBubble(bubble, text, audioURL, imageURL) {
    bubble.remove();

    if (text) {
        text.split(" ").forEach(word => {
            let junk = document.createElement("div");
            junk.classList.add("junk");
            junk.textContent = word;
            document.getElementById("junkyard").appendChild(junk);
        });
    }

    if (audioURL) {
        let junkAudio = document.createElement("div");
        junkAudio.classList.add("junk");
        junkAudio.textContent = "[音频数据损坏]";
        document.getElementById("junkyard").appendChild(junkAudio);
    }

    if (imageURL) {
        let junkImage = document.createElement("div");
        junkImage.classList.add("junk");
        junkImage.textContent = "[损坏的图片]";
        document.getElementById("junkyard").appendChild(junkImage);
    }
}

// 保存文本到 localStorage
function saveText() {
    const text = document.getElementById("bubbleText").value;
    localStorage.setItem("savedText", text);
}

// 页面加载时恢复文本
window.onload = function () {
    const savedText = localStorage.getItem("savedText");
    if (savedText) {
        document.getElementById("bubbleText").value = savedText;
    }
};
