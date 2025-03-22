//---------------------------------------------------
// 1) Import Supabase & create a client
//---------------------------------------------------
import { createClient } from "https://esm.sh/@supabase/supabase-js";

// Your Supabase project details
const supabaseUrl = "https://uytyxroguktgsymkkoke.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5dHl4cm9ndWt0Z3N5bWtrb2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NDc2MDQsImV4cCI6MjA1ODIyMzYwNH0.Yn6-gOjT3ZRJvAaO-czhb0IME5JP5g2IEi97TbAA_BU";
export const supabase = createClient(supabaseUrl, supabaseKey);

// The bucket name for audio
const BUCKET_NAME = "recordings";


//---------------------------------------------------
// 2) Import & init Firebase (for text in Firestore)
//---------------------------------------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-app.js";
import {
    getFirestore,
    collection,
    addDoc,
    onSnapshot,
    doc,
    deleteDoc,
    getDocs
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


//---------------------------------------------------
// 3) Existing Firestore real-time listener
//---------------------------------------------------
onSnapshot(collection(db, "dream_bubbles"), (snapshot) => {
    snapshot.docChanges().forEach(change => {
      if (change.type === "added") {
        const docId = change.doc.id; 
        const data = change.doc.data();
        console.log("📌 Firestore 新增数据:", data);

        // audioBase64 is now a Supabase URL, but your bubble code is unchanged
        createBubble(docId, data.text, data.audioBase64);
      }
    });
});


//---------------------------------------------------
// 4) Buffers → WAV Blob code
//---------------------------------------------------
async function bufferToBlob(audioBuffer) {
    console.log("🔄 进入 `bufferToBlob()`，开始处理音频...");
    let processedBlob = await bufferToWavBlob(audioBuffer);
    return processedBlob;
}

function bufferToWavBlob(audioBuffer) {
    return new Promise(resolve => {
        console.log("📌 直接使用 JavaScript 处理 WAV，不使用 Worker");

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

        let blob = new Blob([view], { type: "audio/wav" });
        console.log("✅ WAV 处理完成，大小:", blob.size);
        resolve(blob);
    });
}


//---------------------------------------------------
// 5) Save text to Firestore
//---------------------------------------------------
export async function saveBubbleToFirestore(text, audioBase64 = null) {
    if (!text || text.trim() === "") {
        console.error("❌ 不能存入空白文本！");
        return;
    }
    console.log("📤 尝试存入 Firestore:", { text, audioBase64 });

    try {
        const docRef = await addDoc(collection(db, "dream_bubbles"), {
            text: text,
            audioBase64: audioBase64, // now possibly a supabase link
            timestamp: new Date()
        });
        console.log("✅ 文档成功存入 Firestore，ID:", docRef.id);
    } catch (error) {
        console.error("❌ Firestore 存储失败:", error);
    }
}

// Firestore text button remains unchanged:
document.getElementById("bubbleBtn").addEventListener("click", async () => {
    const text = document.getElementById("bubbleText").value.trim();
    if (!text) {
        console.error("❌ 用户输入为空，不存入 Firestore");
        return;
    }
    console.log("📌 用户输入:", text);
    await saveBubbleToFirestore(text, null);
});


//---------------------------------------------------
// 6) createBubble
//---------------------------------------------------
export function createBubble(docId, text, audioBase64 = null) {
    if (!text || typeof text !== "string" || text.trim() === "") {
        console.error("❌ createBubble() 失败：text 不能为空");
        return;
    }
    console.log("🟢 生成泡泡，文本:", text, " docId:", docId);

    const bubble = document.createElement("div");
    bubble.classList.add("bubble");
    bubble.dataset.docId = docId;

    if (!audioBase64) {
        bubble.textContent = text;
    } else {
        const audioElement = document.createElement("audio");
        audioElement.src = audioBase64; // now this might be a supabase public URL
        audioElement.controls = true;
        audioElement.style.width = "120px";
        bubble.appendChild(audioElement);
    }

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "X";
    deleteBtn.style.marginLeft = "5px";
    deleteBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        deleteBubbleDoc(docId, bubble);
    });
    bubble.appendChild(deleteBtn);

    const x = Math.random() * (window.innerWidth - 100);
    const y = Math.random() * (window.innerHeight - 100);
    bubble.style.left = `${x}px`;
    bubble.style.top = `${y}px`;

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
    let styleSheet = document.styleSheets[0];
    if (!styleSheet) {
        const style = document.createElement("style");
        document.head.appendChild(style);
        styleSheet = style.sheet;
    }
    const duration = Math.random() * 5 + 3;
    const delay = Math.random() * 2;
    bubble.style.animation = `float ${duration}s infinite ease-in-out`;
    bubble.style.animationDelay = `${delay}s`;

    document.getElementById("bubbleContainer").appendChild(bubble);
}


//---------------------------------------------------
// 7) Recording logic (unchanged)
//---------------------------------------------------
let mediaRecorder;
let audioChunks = [];

export function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

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
            processAudioWithTone(audioBlob);
        };

        mediaRecorder.start();
        console.log("🎙 开始录音...");
    }).catch(error => console.error("❌ 录音失败:", error));
}

export function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
        console.log("🛑 停止录音...");
        mediaRecorder.stop();
    } else {
        console.error("❌ `mediaRecorder` 未启动或已停止，无法停止录音！");
    }
}


//---------------------------------------------------
// 8) Loading existing docs (unchanged for text or supabase links)
//---------------------------------------------------
export async function loadBubbles() {
    console.log("🔄 正在加载 Firestore 数据...");
    const querySnapshot = await getDocs(collection(db, "dream_bubbles"));
    querySnapshot.forEach(docSnap => {
        const data = docSnap.data();
        const docId = docSnap.id;
        console.log("📌 Firestore 数据:", data, "DocId:", docId);
        createBubble(docId, data.text, data.audioBase64);
    });
    console.log("✅ 所有泡泡已加载完成");
}


//---------------------------------------------------
// 9) Tone.js process: EXACT as it was, except final step calls storeAudioInFirestore -> supabase
//---------------------------------------------------
import * as Tone from "https://cdnjs.cloudflare.com/ajax/libs/tone/14.8.49/Tone.min.js";

export async function processAudioWithTone(audioBlob) {
    console.log("🔄 Entering processAudioWithTone, decoding...");
    if (!audioBlob || audioBlob.size === 0) {
      console.error("❌ No audio data found!");
      return;
    }
    await Tone.start();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const originalBuffer = await Tone.context.decodeAudioData(arrayBuffer);
    console.log("✅ Decoded user recording into an AudioBuffer.");

    // ... your original LFOs ...
    const randomPitch = Math.floor(Math.random() * 48) - 24;
    const randomReverbTime = Math.random() * 8 + 2;
    const randomBitDepth = Math.floor(Math.random() * 6) + 2;
    const randomDelayTime = 0.1 + Math.random() * 0.5;
    const randomChorusRate = 0.5 + Math.random() * 5;

    // additional LFO freq
    const pitchLfoFreq = 0.1 + Math.random() * 0.4;
    const pitchLfoFreq2 = 0.3 + Math.random() * 0.7;
    const reverbWetLfoFreq = 0.05 + Math.random() * 0.25;
    const chorusDepthLfoFreq = 0.2 + Math.random() * 0.5;
    const delayFeedbackLfoFreq = 0.3 + Math.random() * 0.8;

    const offlineDuration = originalBuffer.duration + 2;
    const renderedBuffer = await Tone.Offline(() => {
      const player = new Tone.Player(originalBuffer);
      const pitchShift = new Tone.PitchShift(0);
      pitchShift.pitch = randomPitch;
      const chorus = new Tone.Chorus({
        frequency: randomChorusRate,
        delayTime: 2.5,
        depth: 0.5,
      }).start();
      chorus.depth = Math.random();

      const bitCrusher = new Tone.BitCrusher(randomBitDepth);
      const feedbackDelay = new Tone.FeedbackDelay({
        delayTime: randomDelayTime,
        feedback: 0.5,
      });
      const reverb = new Tone.Reverb({ decay: randomReverbTime });
      reverb.generate();

      // reverb LFO, feedback LFO, etc. if you want to keep them
      const reverbWetLFO = new Tone.LFO({
        frequency: reverbWetLfoFreq,
        min: 0.0,
        max: 1.0,
      });
      reverbWetLFO.connect(reverb.wet);
      reverbWetLFO.start();

      const delayFeedbackLFO = new Tone.LFO({
        frequency: delayFeedbackLfoFreq,
        min: 0.1,
        max: 0.9,
      });
      delayFeedbackLFO.connect(feedbackDelay.feedback);
      delayFeedbackLFO.start();

      player.connect(pitchShift);
      pitchShift.connect(chorus);
      chorus.connect(bitCrusher);
      bitCrusher.connect(feedbackDelay);
      feedbackDelay.connect(reverb);
      reverb.toDestination();

      player.start(0);
      Tone.Transport.start();
    }, offlineDuration);

    console.log("✅ Offline rendering complete. Duration:", renderedBuffer.duration);

    const processedAudioBlob = await bufferToBlob(renderedBuffer);
    if (!processedAudioBlob || processedAudioBlob.size === 0) {
      console.error("❌ Offline rendering produced an empty blob!");
      return;
    }
    console.log("✅ Got a processed WAV blob:", processedAudioBlob.size, "bytes");

    // minimal change: call storeAudioInFirestore -> which now does supabase
    storeAudioInFirestore(processedAudioBlob);
}


//---------------------------------------------------
// upload to Supabase, store the URL in Firestore
//---------------------------------------------------
async function uploadToSupabase(audioBlob) {
  const fileName = `recording_${Date.now()}.wav`;
  const file = new File([audioBlob], fileName, { type: 'audio/wav' });

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, { upsert: false });

  if (error) {
    console.error("❌ Supabase upload error:", error.message);
    return null;
  }
  console.log("✅ Supabase upload path:", data.path);

  // If your bucket is public, get a public URL
  const { publicURL } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);
  console.log("🔗 Supabase public URL:", publicURL);
  return publicURL;
}


//---------------------------------------------------
// Overwrite storeAudioInFirestore to do Supabase
//---------------------------------------------------
async function storeAudioInFirestore(audioBlob) {
    console.log("📢 进入 storeAudioInFirestore...");

    if (!audioBlob || audioBlob.size === 0) {
        console.error("❌ 录音文件为空，无法存入 Firestore！");
        return;
    }

    // 1) Upload the final WAV to Supabase
    const supabaseLink = await uploadToSupabase(audioBlob);
    if (!supabaseLink) {
      console.error("❌ Could not upload to supabase!");
      return;
    }

    // 2) Save that link in Firestore under audioBase64
    try {
        console.log("🚀 尝试存入 Firestore with Supabase link...");
        const docRef = await addDoc(collection(db, "dream_bubbles"), {
            text: "🎵 变声录音",
            audioBase64: supabaseLink,  // store supabase link
            timestamp: new Date()
        });
        console.log("✅ Firestore 存入成功，文档 ID:", docRef.id);
    } catch (error) {
        console.error("❌ Firestore 存储失败:", error);
    }
}


//---------------------------------------------------
// 12) Deleting doc
//---------------------------------------------------
async function deleteBubbleDoc(docId, bubbleElement) {
    try {
      console.log("🗑 Deleting doc ID:", docId);
      await deleteDoc(doc(db, "dream_bubbles", docId));
      console.log("✅ Successfully deleted doc:", docId);

      bubbleElement.remove();
    } catch (error) {
      console.error("❌ Failed to delete doc:", docId, error);
    }
}


//---------------------------------------------------
// Page load event
//---------------------------------------------------
window.onload = function () {
    console.log("📌 页面加载完成，开始监听 Firestore 数据...");
};
