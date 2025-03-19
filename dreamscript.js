// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    getDocs
} from "https://www.gstatic.com/firebasejs/9.6.7/firebase-firestore.js";
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.6.7/firebase-storage.js";

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
const db = getFirestore(app); // Initialize Firestore
const storage = getStorage(app); // Initialize Firebase Storage
console.log("✅ Firebase 初始化完成");

// **监听 Firestore，并生成泡泡（但不存入 Firestore）**
onSnapshot(collection(db, "dream_bubbles"), (snapshot) => {
    snapshot.docChanges().forEach(change => {
        if (change.type === "added") {
            const data = change.doc.data();
            console.log("📌 Firestore 新增数据:", data);

            if (!data.audioURL && !data.audioBase64) {
                console.warn("⚠️ `audioURL` 和 `audioBase64` 都为空，无法生成音频泡泡！");
            } else {
                createBubble(data.text, data.audioURL || data.audioBase64);
            }
        }
    });
});

// 🎵 让 `dreamscript.js` 作为一个 ES6 模块
export async function createBubble(text, audioData = null) {
    console.log("🟢 createBubble() called with:", { text, audioData });
    if (!text || typeof text !== "string" || text.trim() === "") {
        console.error("❌ createBubble() 失败：text 不能为空");
        return;
    }

    console.log("🟢 生成泡泡，文本:", text);

    const bubble = document.createElement("div");
    bubble.classList.add("bubble");
    bubble.textContent = text;

    if (audioData) {
        console.log("🎵 添加音频泡泡，数据:", audioData);
        bubble.textContent = "";

        const audioElement = document.createElement("audio");
        audioElement.src = audioData; // Handle both Base64 and URL
        audioElement.controls = true;
        audioElement.style.width = "120px";
        bubble.appendChild(audioElement);
    }

    // 🎈 随机位置
    const x = Math.random() * (window.innerWidth - 100);
    const y = Math.random() * (window.innerHeight - 100);
    bubble.style.left = `${x}px`;
    bubble.style.top = `${y}px`;

    // 🎈 Generate unique keyframes for this bubble
    const animationName = `float-${Math.random().toString(36).substring(2, 8)}`;
    const keyframes = `
    @keyframes ${animationName} {
        0% { transform: translate(0, 0); }
        25% { transform: translate(${Math.random() * 50 - 25}px, ${Math.random() * 50 - 25}px); }
        50% { transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px); }
        75% { transform: translate(${Math.random() * 50 - 25}px, ${Math.random() * 50 - 25}px); }
        100% { transform: translate(0, 0); }
    }
`;

    // 🎈 Add the keyframes to a style element
    let styleSheet = document.styleSheets[0];
    if (!styleSheet) {
        const style = document.createElement("style");
        document.head.appendChild(style);
        styleSheet = style.sheet;
    }
    styleSheet.insertRule(keyframes, styleSheet.cssRules.length);

    // 🎈 Assign random animation properties
    const duration = Math.random() * 5 + 3; // Random duration between 3-8 seconds
    const delay = Math.random() * 2; // Random delay between 0-2 seconds
    bubble.style.animation = `${animationName} ${duration}s infinite ease-in-out`;
    bubble.style.animationDelay = `${delay}s`;

    // ✅ 只添加一次
    document.getElementById("bubbleContainer").appendChild(bubble);
}

// 🎤 录音
export function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = []; // ✅ 重新初始化，防止上次录音的数据残留

        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
                console.log("🎙 录音数据已存入 audioChunks，大小:", event.data.size);
            } else {
                console.warn("⚠️ 录音数据为空！");
            }
        };

        mediaRecorder.onstop = async () => {
            console.log("🛑 录音已停止，开始处理音频...");

            if (audioChunks.length === 0) {
                console.error("❌ 没有录音数据，audioChunks 为空！");
                return;
            }

            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            console.log("🎙 录音 Blob 生成，大小:", audioBlob.size);

            if (audioBlob.size === 0) {
                console.error("❌ 录音 Blob 为空，无法处理音频！");
                return;
            }

            // 🚀 让 Tone.js 处理音频
            const processedAudioURL = await processAudioWithEffects(audioBlob);
            await saveBubbleToFirestore("🎵 变声录音", processedAudioURL);
        };

        mediaRecorder.start();
        console.log("🎙 开始录音...");
    }).catch(error => console.error("❌ 录音失败:", error));
}

// 🎤 停止录音
export function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        console.log("🛑 停止录音...");
        mediaRecorder.stop(); // ✅ 确保触发 onstop 事件
    } else {
        console.error("❌ `mediaRecorder` 未启动或已停止，无法停止录音！");
    }
}

// 🎤 让网页加载 Firestore 里的 Base64 音频
export async function loadBubbles() {
    console.log("🔄 正在加载 Firestore 数据...");

    const querySnapshot = await getDocs(collection(db, "dream_bubbles"));
    querySnapshot.forEach(doc => {
        const data = doc.data();

        console.log("📌 Firestore 数据:", data);

        // Handle both old and new structures
        if (data.audioBase64) {
            createBubble(data.text, data.audioBase64); // Old structure
        } else if (data.audioURL) {
            createBubble(data.text, data.audioURL); // New structure
        } else {
            console.warn("⚠️ 文档缺少音频数据:", doc.id);
        }
    });

    console.log("✅ 所有泡泡已加载完成");
}

// 🎵 Tone.js 变声并播放
async function processAudioWithEffects(audioBlob) {
    console.log("🎵 正在处理音频，添加随机效果...");

    // Decode the Blob into an ArrayBuffer
    const arrayBuffer = await audioBlob.arrayBuffer();

    // Decode the audio data
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Create an OfflineAudioContext for rendering
    const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
    );

    // Create a source and connect it to the effects
    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;

    // Apply random effects
    const effects = [
        new Tone.Reverb({ decay: Math.random() * 5 + 1 }).toDestination(), // Random reverb
        new Tone.PitchShift({ pitch: Math.random() * 4 - 2 }).toDestination(), // Random pitch shift (-2 to +2 semitones)
        new Tone.Delay({ delayTime: Math.random() * 0.5 }).toDestination(), // Random delay
        new Tone.Distortion({ distortion: Math.random() * 0.5 }).toDestination() // Random distortion
    ];

    // Randomly select effects to apply
    const selectedEffects = effects.filter(() => Math.random() > 0.5);

    // Connect the effects in series
    let currentNode = source;
    selectedEffects.forEach(effect => {
        currentNode.connect(effect);
        currentNode = effect;
    });
    currentNode.connect(offlineContext.destination);

    // Start the source and render the audio
    source.start(0);
    const renderedBuffer = await offlineContext.startRendering();

    // Convert the rendered buffer to a Blob
    const processedAudioBlob = await bufferToBlob(renderedBuffer);

    // Convert the Blob to a Base64 URL
    const processedAudioURL = URL.createObjectURL(processedAudioBlob);

    // Upload the Blob to Firebase Storage
    const audioURL = await uploadAudioToFirebase(processedAudioBlob, "Processed Audio");

    console.log("✅ 音频处理完成，返回处理后的音频 URL");
    return audioURL;
}

//helper function to convert buffer to blob
async function bufferToBlob(audioBuffer) {
    const offlineContext = new OfflineAudioContext(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
    );

    const source = offlineContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineContext.destination);
    source.start(0);

    const renderedBuffer = await offlineContext.startRendering();

    // Convert the rendered buffer to a WAV Blob
    const wavBlob = await bufferToWavBlob(renderedBuffer);
    return wavBlob;
}

function bufferToWavBlob(audioBuffer) {
    return new Promise(resolve => {
        const numOfChannels = audioBuffer.numberOfChannels;
        const length = audioBuffer.length * numOfChannels * 2 + 44;
        const buffer = new ArrayBuffer(length);
        const view = new DataView(buffer);

        const sampleRate = audioBuffer.sampleRate;

        // Write WAV header
        const writeString = (view, offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(view, 0, "RIFF");
        view.setUint32(4, 36 + audioBuffer.length * numOfChannels * 2, true);
        writeString(view, 8, "WAVE");
        writeString(view, 12, "fmt ");
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numOfChannels * 2, true);
        view.setUint16(32, numOfChannels * 2, true);
        view.setUint16(34, 16, true);
        writeString(view, 36, "data");
        view.setUint32(40, audioBuffer.length * numOfChannels * 2, true);

        // Write interleaved audio data
        let offset = 44;
        for (let i = 0; i < audioBuffer.length; i++) {
            for (let channel = 0; channel < numOfChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
            }
        }

        resolve(new Blob([view], { type: "audio/wav" }));
    });
}

//helper function to upload audio to firebase
async function uploadAudioToFirebase(audioBlob, text) {
    console.log("🚀 正在上传音频到 Firebase Storage...");

    // Create a unique file name
    const fileName = `processed_audio_${Date.now()}.wav`;

    // Create a reference to Firebase Storage
    const storageRef = ref(storage, `audio/${fileName}`);

    // Upload the audio Blob
    await uploadBytes(storageRef, audioBlob);
    console.log("✅ 音频上传成功:", fileName);

    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    console.log("✅ 获取下载 URL:", downloadURL);

    // Save the download URL in Firestore
    await saveBubbleToFirestore(text, downloadURL);

    return downloadURL;
}

// **🔥 点击按钮 → 存入 Firestore**
document.getElementById("bubbleBtn").addEventListener("click", async () => {
    const text = document.getElementById("bubbleText").value.trim();
    if (!text) {
        console.error("❌ 用户输入为空，不存入 Firestore");
        return;
    }

    console.log("📌 用户输入:", text);

    // 🔥 只存入 Firestore，不直接生成泡泡
    await saveBubbleToFirestore(text, null);
});

// 🔄 页面加载完成
window.onload = function () {
    console.log("📌 页面加载完成，开始监听 Firestore 数据...");
    loadBubbles();
};
