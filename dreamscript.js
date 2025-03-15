import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-storage.js";

// 🔥 Firebase 配置
const firebaseConfig = {
    apiKey: "AIzaSyCa4PyEJPxS6Yavfc-f-SxlYvq_6yOUngQ",
    authDomain: "dream-fde5e.firebaseapp.com",
    projectId: "dream-fde5e",
    storageBucket: "dream-fde5e.appspot.com",
    messagingSenderId: "509764309119",
    appId: "1:509764309119:web:20191ff663598d0eb1ef4a",
    measurementId: "G-7VPXZGEQ00"
};

// 🚀 初始化 Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

let mediaRecorder;
let audioChunks = [];

// 🎵 让 `dreamscript.js` 作为一个 ES6 模块
export function createBubble(text, audioURL = null) {

    if (!text || typeof text !== "string" || text.trim() === "") {
        console.error("❌ createBubble() 参数错误，text 需要是字符串");
        text = "默认泡泡"; // ✅ 使用默认值
    }

    console.log("🟢 生成泡泡，文本:", text); // ✅ 调试用，确保 `text` 正确

    const bubble = document.createElement("div");
    bubble.classList.add("bubble");
    bubble.textContent = text; // ✅ 确保 `text` 正确


    if (audioURL) {
        bubble.textContent = "";
        const playButton = document.createElement("button");
        playButton.classList.add("play-button");
        playButton.innerHTML = "▶";
        playButton.onclick = () => playWithTone(audioURL);

        bubble.appendChild(playButton);
    }

    // 🎈 随机位置
    const x = Math.random() * (window.innerWidth - 100);
    const y = Math.random() * (window.innerHeight - 100);
    bubble.style.left = `${x}px`;
    bubble.style.top = `${y}px`;

    // ✅ 只添加一次
    document.getElementById("bubbleContainer").appendChild(bubble);

    // ✅ 只调用一次漂浮动画
    moveBubble(bubble);

    // ✅ 60 秒后泡泡损坏
    setTimeout(() => decayBubble(bubble, text, audioURL), 60000);
    setTimeout(() => decayBubble(bubble, text, audioURL), 60000);
}

// 🎤 录音
export function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = event => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioURL = URL.createObjectURL(audioBlob);

            console.log("🎵 原始音频 URL:", audioURL);

            // 生成变声泡泡
            createBubble(null, audioURL);
        };

        mediaRecorder.start();
    }).catch(error => console.error("❌ 录音失败:", error));
}

// 🎤 停止录音
export function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
    }
}

// 🎵 Tone.js 变声并播放
export async function playWithTone(audioURL) {
    await Tone.start();

    try {
        let response = await fetch(audioURL);
        let audioData = await response.arrayBuffer();
        let buffer = await Tone.context.decodeAudioData(audioData);

        let player = new Tone.Player(buffer);
        let pitchShift = new Tone.PitchShift(4); // 变高 4 音程
        let reverb = new Tone.Reverb(2); // 2 秒混响

        player.connect(pitchShift);
        pitchShift.connect(reverb);
        reverb.toDestination();

        player.start();

        console.log("🎧 正在播放变声音频...");
    } catch (error) {
        console.error("❌ 变声播放失败: ", error);
    }
}

// 🎈 让泡泡飘动
function moveBubble(bubble) {
    let x = parseFloat(bubble.style.left);
    let y = parseFloat(bubble.style.top);
    let speedX = (Math.random() - 0.5) * 0.5; // 让泡泡左右移动
    let speedY = (Math.random() - 0.5) * 0.5; // 让泡泡上下移动

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

// 🗑 泡泡破裂后碎片掉落
function decayBubble(bubble, text, audioURL) {
    bubble.remove();

    if (text) {
        const words = splitText(text);
        words.forEach(word => {
            let junk = document.createElement("div");
            junk.classList.add("junk");
            junk.textContent = word;
            document.getElementById("junkyard").appendChild(junk);
            randomScatter(junk);
        });
    }

    if (audioURL) {
        const audioElement = document.createElement("audio");
        audioElement.src = audioURL;
        audioElement.controls = true;
        audioElement.style.width = "120px";

        let junkAudio = document.createElement("div");
        junkAudio.classList.add("junk");
        junkAudio.appendChild(audioElement);

        document.getElementById("junkyard").appendChild(junkAudio);
        randomScatter(junkAudio);
    }
}

// 🎇 让碎片散落
function randomScatter(element) {
    element.style.position = "absolute";

    // 让碎片随机掉落到底部
    const x = Math.random() * (window.innerWidth - 50);
    const y = window.innerHeight - Math.random() * 50;

    element.style.left = `${x}px`;
    element.style.top = `${y}px`;

    // 设置随机旋转角度
    element.style.transform = `rotate(${Math.random() * 30 - 15}deg)`;

    // 让碎片从上面慢慢掉落到底部
    element.style.opacity = "0";
    document.body.appendChild(element);

    setTimeout(() => {
        element.style.opacity = "1";
        element.style.transition = "top 0.8s ease-in, opacity 0.8s ease-in";
        element.style.top = `${window.innerHeight - Math.random() * 100}px`;
    }, 100);
}

// 🔄 页面加载完成
window.onload = function () {
    console.log("📌 页面加载完成");
};
