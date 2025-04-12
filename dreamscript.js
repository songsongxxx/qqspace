// dreamscript.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';


// 🪪 替换为你自己的 Supabase 项目地址和 Key
const supabaseUrl = 'https://uytyxroguktgsymkkoke.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5dHl4cm9ndWt0Z3N5bWtrb2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NDc2MDQsImV4cCI6MjA1ODIyMzYwNH0.Yn6-gOjT3ZRJvAaO-czhb0IME5JP5g2IEi97TbAA_BU';
const supabase = createClient(supabaseUrl, supabaseKey);


let mediaRecorder;
let allChunks = [];
let recordingStream;


// 保存文字 + Base64音频到 Supabase xx
export async function saveBubbleToSupabase(text, audioBase64 = null) {
    console.log("📤 上传内容：", { text, hasAudio: !!audioBase64 });

    const { data, error } = await supabase
        .from('dreams')
        .insert([
            { text: text, audio_url: audioBase64, created_at: new Date().toISOString() }
        ], { returning: 'representation' }); // 返回插入的内容

    if (error) {
        console.error("❌ 存储失败:", error.message);
    } else {
        console.log("✅ 已存入 Supabase:", data);
        // ✅ 新增：立即生成泡泡
        if (!error) {
            console.log("✅ 已存入 Supabase:", data);
            const bubbleText = text || "🎵 变声录音";
            createAndAppendBubble(bubbleText, audioBase64); // 直接用传入的数据生成泡泡
        }
    }
}



// 录音处理
export function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        recordingStream = stream;
        allChunks = [];
        mediaRecorder = new MediaRecorder(stream);
        mediaRecorder.ondataavailable = e => e.data.size > 0 && allChunks.push(e.data);
        mediaRecorder.onstop = async () => {
            const fullBlob = new Blob(allChunks, { type: 'audio/webm' });
            if (fullBlob.size === 0) return;

            const text = document.getElementById("bubbleText")?.value.trim() || "";
            processAudioWithTone(fullBlob, text);
        };
        mediaRecorder.start();
    });
}

export function stopRecording() {
    if (mediaRecorder && recordingStream) {
        mediaRecorder.stop();
        recordingStream.getTracks().forEach(t => t.stop());
    }
}

// Tone.js 变声处理 ➜ 转为 Base64 存储    xxx
async function processAudioWithTone(audioBlob, text = "") {
    await Tone.start();
    const arrayBuffer = await audioBlob.arrayBuffer();
    const originalBuffer = await Tone.context.decodeAudioData(arrayBuffer);

    const pitch = parseFloat(document.getElementById("pitchSlider").value);
    const reverbT = parseFloat(document.getElementById("reverbSlider").value);
    const bit = parseInt(document.getElementById("bitSlider").value);
    const delayT = parseFloat(document.getElementById("delaySlider").value);

    const offlineDuration = originalBuffer.duration + 1;

    const rendered = await Tone.Offline(({ transport }) => {
        const player = new Tone.Player(originalBuffer).toDestination();

        // 在离线上下文中创建新的音效节点
        const pitchShift = new Tone.PitchShift({ pitch }).toDestination();
        const bitCrusher = new Tone.BitCrusher(bit).toDestination();
        const feedbackDelay = new Tone.FeedbackDelay(delayT).toDestination();
        const reverb = new Tone.Reverb({ decay: reverbT }).toDestination();

        // 链接音频处理链条（使用新上下文的节点）
        player.connect(pitchShift);
        pitchShift.connect(bitCrusher);
        bitCrusher.connect(feedbackDelay);
        feedbackDelay.connect(reverb);
        reverb.toDestination();

        player.start(0);
        transport.start();
    }, offlineDuration);

    const processedBlob = await bufferToBlob(rendered);
    const base64 = await blobToBase64(processedBlob);

    // 存入数据库
    await saveBubbleToSupabase(text || "🎵 变声录音", base64);
    
    // ✅ 立即在页面添加泡泡
    createAndAppendBubble(text || "🎵 变声录音", base64);
    
}


// 创建泡泡的地方
function createAndAppendBubble(text, audioBase64) {
    const bubble = createBubble(null, text, audioBase64);
    document.getElementById("bubbleContainer").appendChild(bubble);
}


// 加载泡泡
export async function loadBubbles() {
    const container = document.getElementById("bubbleContainer");
    const { data, error } = await supabase
        .from("dreams")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);

    if (error) {
        console.error("❌ 读取失败:", error.message);
        return;
    }

    console.log("📦 Supabase 返回数据:", data);

    data.forEach(entry => {
        console.log("🧼 正在创建泡泡:", entry.id, entry.text, entry.audio_url);

        if (!entry.audio_url && entry.text) {
            console.warn("⚠️ 只发现了文字泡泡（无音频）");
        }

        const bubble = createBubble(entry.id, entry.text, entry.audio_url);
        container.appendChild(bubble);
    });   
}

export function createBubble(id, text, audioBase64 = null) {
    const bubble = document.createElement("div");
    bubble.classList.add("bubble");

    bubble.style.position = "absolute";
    bubble.style.zIndex = "1000";
    bubble.style.background = "rgba(255,255,255,0.85)";
    bubble.style.border = "1px solid black";
    bubble.style.borderRadius = "8px";
    bubble.style.padding = "8px";
    bubble.style.fontFamily = "'Press Start 2P', monospace";

    if (!audioBase64) {
        const textElem = document.createElement("div");
        textElem.textContent = text;
        bubble.appendChild(textElem);
    } else {
        const audio = document.createElement("audio");
        audio.src = audioBase64;
        audio.controls = true;
        audio.style.width = "120px";
        bubble.appendChild(audio);
    }
    

    const del = document.createElement("button");
    del.textContent = "X";
    del.style.marginLeft = "5px";
    del.onclick = () => deleteBubble(id, bubble);
    bubble.appendChild(del);

    bubble.style.left = `${Math.random() * (window.innerWidth - 140)}px`;
    bubble.style.top = `${Math.random() * (window.innerHeight - 80)}px`;

    console.log("🧪 audioBase64 preview:", audioBase64?.substring?.(0, 30));

    return bubble;
}


// Updated function to delete a bubble from both the page and Supabase
async function deleteBubble(id, bubbleElement) {
    if (!id) {
        console.error("❌ Invalid ID, cannot delete bubble!");
        return; // Exit the function if ID is invalid
    }

    try {
        console.log("🗑 Deleting doc ID:", id);

        // Delete the bubble from Supabase
        const { error } = await supabase
            .from('dreams') // Your Supabase table name
            .delete()
            .eq('id', id); // Use the correct field to match the record ID

        if (error) {
            console.error("❌ Failed to delete from Supabase:", error.message);
            return; // If the deletion fails, do not remove the bubble from the page
        }

        // If deletion from Supabase was successful, remove the bubble from the page
        bubbleElement.remove();
        console.log("✅ Successfully deleted bubble from Supabase and removed from page.");
    } catch (error) {
        console.error("❌ Failed to delete bubble:", error);
    }
}


// 小工具：blob 转 base64 xxx
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (reader.result) resolve(reader.result);
            else reject("⚠️ FileReader 读取失败");
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// 小工具：音频缓冲区转 blob（WAV）
async function bufferToBlob(audioBuffer) {
    const numOfChannels = audioBuffer.numberOfChannels;
    const length = audioBuffer.length * numOfChannels * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];

    const writeStr = (v, offset, str) => {
        for (let i = 0; i < str.length; i++) v.setUint8(offset + i, str.charCodeAt(i));
    };

    writeStr(view, 0, "RIFF");
    view.setUint32(4, length - 8, true);
    writeStr(view, 8, "WAVE");
    writeStr(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numOfChannels, true);
    view.setUint32(24, audioBuffer.sampleRate, true);
    view.setUint32(28, audioBuffer.sampleRate * 2 * numOfChannels, true);
    view.setUint16(32, numOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeStr(view, 36, "data");
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

    return new Blob([view], { type: "audio/wav" });
}







// 🚀 初始化 Firebase


// **监听 Firestore，并生成泡泡（但不存入 Firestore）**



/*async function bufferToBlob(audioBuffer) {
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
        recordingStream = stream;
        allChunks = []; // 重置
        mediaRecorder = new MediaRecorder(stream);
        isRecording = true;

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                allChunks.push(event.data);
                console.log("📦 录音片段大小:", event.data.size);
            }
        };

        mediaRecorder.onstop = async () => {

            console.log("🛑 录音结束，拼接音频...");
            const fullBlob = new Blob(allChunks, { type: 'audio/webm' });

            if (fullBlob.size === 0) {
                console.error("❌ 拼接后音频为空");
                return;
            }
            const userText = document.getElementById("bubbleText")?.value.trim();
            console.log("📤 用户输入文字：", userText);
            // ✅ 现在才传入 fullBlob 和 userText
            processAudioWithTone(fullBlob, userText);

        };

        mediaRecorder.start(5000); // 每 5 秒自动触发 ondataavailable
        console.log("🎙 开始录音，使用 chunk 模式");
    }).catch(err => {
        console.error("❌ 获取音频失败:", err);
    });
}



// 🎤 停止录音
export function stopRecording() {
    if (mediaRecorder && isRecording) {
        isRecording = false;
        mediaRecorder.stop();
        recordingStream.getTracks().forEach(track => track.stop()); // 释放资源
        console.log("🛑 停止录音并关闭麦克风");
    } else {
        console.warn("⚠️ 没有正在进行的录音");
    }
}

// 🎤 让网页加载 Firestore 里的 Base64 音频
export async function testToneEffect() {
    await Tone.start(); // 确保 AudioContext 启动

    // 创建合成器或基本声音源
    const synth = new Tone.Synth().toDestination();

    // 效果链条（和录音时一致）
    const pitchShift = new Tone.PitchShift(parseFloat(document.getElementById("pitchSlider").value));
    const bitCrusher = new Tone.BitCrusher(parseInt(document.getElementById("bitSlider").value));
    const delay = new Tone.FeedbackDelay(parseFloat(document.getElementById("delaySlider").value));
    const reverb = new Tone.Reverb({ decay: parseFloat(document.getElementById("reverbSlider").value) });

    // 链接效果
    synth.chain(pitchShift, bitCrusher, delay, reverb, Tone.Destination);

    // 播放音符（你可以改成任意声音）
    synth.triggerAttackRelease("C4", "1n");
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
async function processAudioWithTone(audioBlob, text = ""){

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

    const userPitch = parseFloat(document.getElementById("pitchSlider").value);
    const userReverbTime = parseFloat(document.getElementById("reverbSlider").value);
    const userBitDepth = parseInt(document.getElementById("bitSlider").value);
    const userDelayTime = parseFloat(document.getElementById("delaySlider").value);

    const offlineDuration = originalBuffer.duration + 2;
    const renderedBuffer = await Tone.Offline(() => {
        const player = new Tone.Player(originalBuffer);
    
        // ✅ 创建 pitchShift 变调器
        const pitchShift = new Tone.PitchShift();
        pitchShift.pitch = userPitch;
    
        const reverb = new Tone.Reverb({ decay: userReverbTime });
        const bitCrusher = new Tone.BitCrusher(userBitDepth);
        const feedbackDelay = new Tone.FeedbackDelay({ delayTime: userDelayTime });
    
        // LFO
        const reverbWetLFO = new Tone.LFO({
            frequency: 0.1,
            min: 0.0,
            max: 1.0,
        });
        reverbWetLFO.connect(reverb.wet).start();
    
        const delayFeedbackLFO = new Tone.LFO({
            frequency: 0.2,
            min: 0.1,
            max: 0.9,
        });
        delayFeedbackLFO.connect(feedbackDelay.feedback).start();
    
        // ✅ 链接音频处理链条
        player.connect(pitchShift);
        pitchShift.connect(bitCrusher);
        bitCrusher.connect(feedbackDelay);
        feedbackDelay.connect(reverb);
        reverb.toDestination();
    
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
    storeAudioInFirestore(processedAudioBlob, text);
}




//存储 Base64 到 Firestore
async function storeAudioInFirestore(audioBlob, text = "") {
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
                text: text || "🎵 变声录音",
                audioBase64: base64Audio,
                timestamp: new Date()
            });

            console.log("✅ Firestore 存入成功，文档 ID:", docRef.id);
        } catch (error) {
            console.error("❌ Firestore 存储失败:", error);
        }
    };
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
};*/