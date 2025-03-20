import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    doc,
    deleteDoc,
    getDocs // <-- this is important
} from "https://www.gstatic.com/firebasejs/9.6.7/firebase-firestore.js";


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
console.log("✅ Firebase 初始化完成");

let mediaRecorder;
let audioChunks = [];

// **监听 Firestore，并生成泡泡（但不存入 Firestore）**
onSnapshot(collection(db, "dream_bubbles"), (snapshot) => {
    snapshot.docChanges().forEach(change => {
      if (change.type === "added") {
        // retrieve doc id + data
        const docId = change.doc.id;           // <--- doc ID from Firestore
        const data = change.doc.data();
  
        console.log("📌 Firestore 新增数据:", data);
  
        createBubble(docId, data.text, data.audioBase64);
      }
    });
  });
  

async function bufferToBlob(audioBuffer) {
    console.log("🔄 进入 `bufferToBlob()`，开始处理音频...");
    let processedBlob = await bufferToWavBlob(audioBuffer);
    return processedBlob;
}

function bufferToWavBlob(audioBuffer) {
    return new Promise(resolve => {
        console.log("📌 直接使用 JavaScript 处理 WAV，不使用 Worker");

        // 获取音频数据
        let numOfChannels = audioBuffer.numberOfChannels,
            length = audioBuffer.length * numOfChannels * 2 + 44,
            buffer = new ArrayBuffer(length),
            view = new DataView(buffer),
            channels = [];

        let sampleRate = audioBuffer.sampleRate;

        // 写入 WAV 头部
        let writeString = function (view, offset, string) {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(view, 0, "RIFF");
        view.setUint32(4, 32 + length, true);
        writeString(view, 8, "WAVE");
        writeString(view, 12, "fmt ");
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numOfChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2 * numOfChannels, true);
        view.setUint16(32, numOfChannels * 2, true);
        view.setUint16(34, 16, true);
        writeString(view, 36, "data");
        view.setUint32(40, length - 44, true);

        for (let i = 0; i < numOfChannels; i++) {
            channels.push(audioBuffer.getChannelData(i));
        }

        let offset = 44;
        for (let i = 0; i < audioBuffer.length; i++) {
            for (let j = 0; j < numOfChannels; j++) {
                let sample = Math.max(-1, Math.min(1, channels[j][i]));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
            }
        }

        // 创建 WAV Blob
        let blob = new Blob([view], { type: "audio/wav" });
        console.log("✅ WAV 处理完成，大小:", blob.size);
        resolve(blob);
    });
}



// 🎤 **存入 Firestore**
export async function saveBubbleToFirestore(text, audioBase64 = null) {
    if (!text || text.trim() === "") {
        console.error("❌ 不能存入空白文本！");
        return;
    }

    console.log("📤 尝试存入 Firestore:", { text, audioBase64 });

    try {
        const docRef = await addDoc(collection(db, "dream_bubbles"), {
            text: text,
            audioBase64: audioBase64,
            timestamp: new Date()
        });

        console.log("✅ 文档成功存入 Firestore，ID:", docRef.id);
    } catch (error) {
        console.error("❌ Firestore 存储失败:", error);
    }
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


// 🎵 让 `dreamscript.js` 作为一个 ES6 模块
export function createBubble(docId, text, audioBase64 = null) {
    if (!text || typeof text !== "string" || text.trim() === "") {
        console.error("❌ createBubble() 失败：text 不能为空");
        return;
    }

    console.log("🟢 生成泡泡，文本:", text, " docId:", docId);

    const bubble = document.createElement("div");
    bubble.classList.add("bubble");

    // We'll store the docId in bubble.dataset for easy reference
    bubble.dataset.docId = docId;

    // If there's no audio, show text
    if (!audioBase64) {
        bubble.textContent = text;
    } else {
        // If there's audio, create an <audio> element
        const audioElement = document.createElement("audio");
        audioElement.src = audioBase64;
        audioElement.controls = true;
        audioElement.style.width = "120px";
        bubble.appendChild(audioElement);
    }

    // (Optional) add a small "Delete" button or an "X" in the corner
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "X";         // or an icon of your choice
    deleteBtn.style.marginLeft = "5px";  // simple styling
    deleteBtn.addEventListener("click", (event) => {
        event.stopPropagation(); // so we don't trigger bubble clicks
        deleteBubbleDoc(docId, bubble);
    });
    bubble.appendChild(deleteBtn);

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

    // 🎈 Assign random animation properties
    const duration = Math.random() * 5 + 3; // Random duration between 3-8 seconds
    const delay = Math.random() * 2; // Random delay between 0-2 seconds
    bubble.style.animation = `float ${duration}s infinite ease-in-out`;
    bubble.style.animationDelay = `${delay}s`;
    

    // ✅ 只添加一次
    document.getElementById("bubbleContainer").appendChild(bubble);

    // ✅ 只调用一次漂浮动画
    // moveBubble(bubble);

    // ✅ 60 秒后泡泡破裂
    //setTimeout(() => decayBubble(bubble, text, audioBase64), 60000);

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
            processAudioWithTone(audioBlob);
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

    // Grab all docs in "dream_bubbles"
    const querySnapshot = await getDocs(collection(db, "dream_bubbles"));
    querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        const docId = docSnap.id; // <-- define docId here!
        
        console.log("📌 Firestore 数据:", data, "DocId:", docId);

        // Now call createBubble with the actual docId
        createBubble(docId, data.text, data.audioBase64);
    });

    console.log("✅ 所有泡泡已加载完成");
}

// 🎵 Tone.js 变声并播放
async function processAudioWithTone(audioBlob) {
    console.log("🔄 Entering processAudioWithTone, decoding...");
  
    if (!audioBlob || audioBlob.size === 0) {
      console.error("❌ No audio data found!");
      return;
    }
  
    await Tone.start(); // Make sure Tone.js is started
  
    // 1) Decode into an AudioBuffer
    let arrayBuffer = await audioBlob.arrayBuffer();
    let originalBuffer = await Tone.context.decodeAudioData(arrayBuffer);
    console.log("✅ Decoded user recording into an AudioBuffer.");
  
    // 2) Generate random effect parameters 
    //    (Even bigger ranges than before)
    const randomPitch = Math.floor(Math.random() * 48) - 24;   // ±24 semitones
    const randomReverbTime = Math.random() * 8 + 2;           // 2–10 seconds reverb
    const randomBitDepth = Math.floor(Math.random() * 6) + 2; // 2–7 bits
    const randomDelayTime = 0.1 + Math.random() * 0.5;        // 0.1–0.6 seconds
    const randomChorusRate = 0.5 + Math.random() * 5;         // 0.5–5 Hz
  
    // We'll also randomize some LFO frequencies:
    const pitchLfoFreq = 0.1 + Math.random() * 0.4;           // 0.1–0.5 Hz
    const pitchLfoFreq2 = 0.3 + Math.random() * 0.7;          // 0.3–1.0 Hz
    const reverbWetLfoFreq = 0.05 + Math.random() * 0.25;     // 0.05–0.3 Hz
    const chorusDepthLfoFreq = 0.2 + Math.random() * 0.5;     // 0.2–0.7 Hz
    const delayFeedbackLfoFreq = 0.3 + Math.random() * 0.8;   // 0.3–1.1 Hz
  
    // 3) Offline Render
    const offlineDuration = originalBuffer.duration + 2; // +2s so we get reverb tails
    const renderedBuffer = await Tone.Offline(() => {
      // A) Create the Player in offline context
      const player = new Tone.Player(originalBuffer);
  
      // B) Create effect nodes
      const pitchShift = new Tone.PitchShift(randomPitch);
      const chorus = new Tone.Chorus({
        frequency: randomChorusRate,
        delayTime: 2.5,
        depth: 0.5,
      }).start();
  
      const bitCrusher = new Tone.BitCrusher(randomBitDepth);
      const feedbackDelay = new Tone.FeedbackDelay({
        delayTime: randomDelayTime,
        feedback: 0.5,
      });
      const reverb = new Tone.Reverb({ decay: randomReverbTime });
      // Must generate impulse if we set a custom decay
      reverb.generate();
  
      // ──────────────────────────────────────────────
      // C) CREATE MULTIPLE LFOs FOR EXTREME MODULATION
  
      // 1) Two LFOs for pitchShift.pitch
      //    - They will sum if we route them both via an Add node
      const addNode = new Tone.Add(); // Sums up the signals
      const pitchLFO1 = new Tone.LFO({
        frequency: pitchLfoFreq,
        min: randomPitch - 12,
        max: randomPitch + 12,
      });
      const pitchLFO2 = new Tone.LFO({
        frequency: pitchLfoFreq2,
        min: -8,
        max: 8,
      });
      // Connect them to the addNode
      pitchLFO1.connect(addNode.addend);
      pitchLFO2.connect(addNode);
      addNode.connect(pitchShift.pitch);
      pitchLFO1.start();
      pitchLFO2.start();
  
      // 2) LFO for Reverb.wet
      const reverbWetLFO = new Tone.LFO({
        frequency: reverbWetLfoFreq,
        min: 0.0,
        max: 1.0,
      });
      reverbWetLFO.connect(reverb.wet);
      reverbWetLFO.start();
  
      // 3) LFO for Chorus.depth
      const chorusDepthLFO = new Tone.LFO({
        frequency: chorusDepthLfoFreq,
        min: 0.0,
        max: 1.0,
      });
      chorusDepthLFO.connect(chorus.depth);
      chorusDepthLFO.start();
  
      // 4) LFO for FeedbackDelay.feedback
      const delayFeedbackLFO = new Tone.LFO({
        frequency: delayFeedbackLfoFreq,
        min: 0.1,
        max: 0.9,
      });
      delayFeedbackLFO.connect(feedbackDelay.feedback);
      delayFeedbackLFO.start();
  
      // ──────────────────────────────────────────────
      // D) Chain them: Player -> pitchShift -> chorus -> bitCrusher -> delay -> reverb -> Dest
      player.connect(pitchShift);
      pitchShift.connect(chorus);
      chorus.connect(bitCrusher);
      bitCrusher.connect(feedbackDelay);
      feedbackDelay.connect(reverb);
      reverb.toDestination();
  
      // E) Start playback in the offline context
      player.start(0);
      Tone.Transport.start();
    }, offlineDuration);
  
    console.log("✅ Offline rendering complete. Duration:", renderedBuffer.duration);
  
    // 4) Convert renderedBuffer to WAV
    const processedAudioBlob = await bufferToBlob(renderedBuffer);
    if (!processedAudioBlob || processedAudioBlob.size === 0) {
      console.error("❌ Offline rendering produced an empty blob!");
      return;
    }
    console.log("✅ Got a processed WAV blob from offline render:", processedAudioBlob.size, "bytes");
  
    // 5) Store the processed audio in Firestore
    storeAudioInFirestore(processedAudioBlob);
  }
  



//存储 Base64 到 Firestore
async function storeAudioInFirestore(audioBlob) {
    console.log("📢 进入 storeAudioInFirestore...");

    if (!audioBlob || audioBlob.size === 0) {
        console.error("❌ 录音文件为空，无法存入 Firestore！");
        return;
    }

    let reader = new FileReader();
    reader.readAsDataURL(audioBlob);

    reader.onloadend = async function () {
        const base64Audio = reader.result;

        if (!base64Audio) {
            console.error("❌ Base64 转换失败，录音不会存入 Firestore！");
            return;
        }

        try {
            console.log("🚀 尝试存入 Firestore...");
            const docRef = await addDoc(collection(db, "dream_bubbles"), {
                text: "🎵 变声录音",
                audioBase64: base64Audio,
                timestamp: new Date()
            });

            console.log("✅ Firestore 存入成功，文档 ID:", docRef.id);
        } catch (error) {
            console.error("❌ Firestore 存储失败:", error);
        }
    };
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

//helper function to delete bubbles
async function deleteBubbleDoc(docId, bubbleElement) {
    try {
      console.log("🗑 Deleting doc ID:", docId);
      await deleteDoc(doc(db, "dream_bubbles", docId));
      console.log("✅ Successfully deleted doc:", docId);
  
      // Remove the bubble from the page
      bubbleElement.remove();
    } catch (error) {
      console.error("❌ Failed to delete doc:", docId, error);
    }
  }

// 🔄 页面加载完成
window.onload = function () {
    console.log("📌 页面加载完成，开始监听 Firestore 数据...");
    loadBubbles();
};
