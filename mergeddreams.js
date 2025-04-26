// dreamscript.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';


// 🪪 替换为你自己的 Supabase 项目地址和 Key
const supabaseUrl = 'https://uytyxroguktgsymkkoke.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5dHl4cm9ndWt0Z3N5bWtrb2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NDc2MDQsImV4cCI6MjA1ODIyMzYwNH0.Yn6-gOjT3ZRJvAaO-czhb0IME5JP5g2IEi97TbAA_BU';
const supabase = createClient(supabaseUrl, supabaseKey);


// 全局变量
let allWords = [];
let allAudioClips = [];



// 🌟 弹出进入梦境提示
function createDreamOverlay() {
    const overlay = document.createElement("div");
    overlay.id = "dream-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100vw";
    overlay.style.height = "100vh";
    overlay.style.background = "rgba(255, 255, 255, 0.8)";
    overlay.style.backdropFilter = "blur(10px)";
    overlay.style.display = "flex";
    overlay.style.flexDirection = "column";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "9999";
    overlay.style.cursor = "pointer";
    overlay.innerHTML = `<div style="
    font-family: 'PencilPete', sans-serif;
font-weight: bold; /* 让浏览器伪加粗一点点 */
        font-size: 24px;
        color: #444;
        padding: 20px 30px;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 20px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        text-align: center;
        backdrop-filter: blur(8px);
        ">Merge dreams</div>`;

    document.body.appendChild(overlay);

    overlay.addEventListener("click", async () => {
        await Tone.start();
        await startBackgroundNoise();
        overlay.remove(); // 移除提示层
        console.log("🌟 Dream started");
    });
}

// 页面加载完弹出
window.addEventListener("DOMContentLoaded", () => {
    createDreamOverlay();
});


// 🌟 持续的背景白噪音
let backgroundNoise, backgroundFilter;
let isBackgroundNoiseStarted = false;

async function startBackgroundNoise() {
    await Tone.start(); // 启动 Tone.js 音频上下文
    backgroundNoise = new Tone.Noise('white').start();
    backgroundFilter = new Tone.Filter(800, "lowpass").toDestination();
    backgroundNoise.connect(backgroundFilter);
    backgroundNoise.volume.value = -10;
    console.log("🎵 背景白噪音已启动");
}

// 检查并启动白噪音
function ensureBackgroundNoise() {
    if (!isBackgroundNoiseStarted) {
        startBackgroundNoise();
        isBackgroundNoiseStarted = true;
    }
}

// 页面加载完成时，监听第一次用户交互
window.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener("click", ensureBackgroundNoise, { once: true });
    document.body.addEventListener("touchstart", ensureBackgroundNoise, { once: true });
});



document.addEventListener("DOMContentLoaded", async () => {
    const dreams = await fetchDreamBubbles();

    if (!dreams.length) {
        document.getElementById("processedText").textContent = "No dreams found.";
        document.getElementById("processedAudio").textContent = "No dreams audio.";
        return;
    }

    await prepareWordsAndAudio(dreams);

    displayProcessedDream();

    const nextBtn = document.getElementById("nextDreamBtn");
    let audioStarted = false;

    nextBtn.addEventListener("click", async () => {
        if (!audioStarted) {
            await Tone.start();
            audioStarted = true;
        }
        displayProcessedDream();
    });
});

// --- 加载Supabase内容
async function fetchDreamBubbles() {
    const { data, error } = await supabase
        .from("dreams")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("❌ Supabase 读取失败:", error.message);
        return [];
    }
    console.log("📦 Dreams加载成功:", data);
    return data || [];
}

// --- 处理文字 & 音频
async function prepareWordsAndAudio(dreams) {
    // 📝 收集全部单词
    dreams.forEach(dream => {
        if (dream.text) {
            const words = dream.text.trim().split(/\s+/);
            allWords.push(...words);
        }
    });

    allWords = scrambleArray(allWords); // 打乱单词

    // 🎵 收集并切割音频
    for (const dream of dreams) {
        if (dream.audio_url) {
            try {
                let arrayBuffer;
                if (dream.audio_url.startsWith("data:")) {
                    arrayBuffer = base64ToArrayBuffer(dream.audio_url);
                } else {
                    const response = await fetch(dream.audio_url);
                    arrayBuffer = await response.arrayBuffer();
                }

                const audioBuffer = await Tone.context.decodeAudioData(arrayBuffer);

                const clipDuration = 10; // 秒
                const totalClips = Math.floor(audioBuffer.duration / clipDuration);

                for (let i = 0; i < totalClips; i++) {
                    const startSample = i * clipDuration * audioBuffer.sampleRate;
                    const clipSamples = clipDuration * audioBuffer.sampleRate;

                    const clipped = Tone.context.createBuffer(
                        audioBuffer.numberOfChannels,
                        clipSamples,
                        audioBuffer.sampleRate
                    );

                    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
                        const fullData = audioBuffer.getChannelData(channel);
                        const clipData = clipped.getChannelData(channel);

                        for (let j = 0; j < clipSamples; j++) {
                            clipData[j] = fullData[startSample + j] || 0;
                        }
                    }

                    allAudioClips.push(clipped);
                }
            } catch (e) {
                console.error("❌ 音频处理失败:", e);
            }
        }
    }

    console.log("📚 单词总数:", allWords.length);
    console.log("🎧 音频片段数:", allAudioClips.length);
}

// --- 每次显示一小段文字+一小段音频
async function displayProcessedDream() {
    const textContainer = document.getElementById("processedText");
    const audioContainer = document.getElementById("processedAudio");

    textContainer.innerHTML = '';
    audioContainer.innerHTML = '';

    // 📝 随机组合文字
    const groupSize = 7;
    if (allWords.length >= groupSize) {
        const startIndex = Math.floor(Math.random() * (allWords.length - groupSize));
        const sentence = allWords.slice(startIndex, startIndex + groupSize).join(' ');

        const textElem = document.createElement("div");
        textElem.textContent = sentence;
        textContainer.appendChild(textElem);
    } else {
        textContainer.textContent = "⚠️ 不够单词生成句子";
    }

    // 🎵 随机选一段音频片段
    if (allAudioClips.length > 0) {
        const randomClip = allAudioClips[Math.floor(Math.random() * allAudioClips.length)];
        const clipBlob = await bufferToWavBlob(randomClip);
        const clipUrl = URL.createObjectURL(clipBlob);

        const audioElem = document.createElement("audio");
        audioElem.src = clipUrl;
        audioElem.controls = true;
        audioElem.preload = "auto";
        audioElem.autoplay = true;

        audioContainer.appendChild(audioElem);
    } else {
        audioContainer.textContent = "⚠️ 没有音频片段";
    }
}

// --- 小工具
function scrambleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function base64ToArrayBuffer(base64) {
    const base64String = base64.split(',')[1];
    const binaryString = window.atob(base64String);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

function bufferToWavBlob(buffer) {
    const wav = encodeWAV(buffer);
    return new Blob([wav], { type: 'audio/wav' });
}

function encodeWAV(buffer) {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const view = new DataView(new ArrayBuffer(length));
    const sampleRate = buffer.sampleRate;

    function writeString(view, offset, str) {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
        }
    }

    let offset = 0;
    writeString(view, offset, 'RIFF'); offset += 4;
    view.setUint32(offset, length - 8, true); offset += 4;
    writeString(view, offset, 'WAVE'); offset += 4;
    writeString(view, offset, 'fmt '); offset += 4;
    view.setUint32(offset, 16, true); offset += 4;
    view.setUint16(offset, 1, true); offset += 2;
    view.setUint16(offset, numOfChan, true); offset += 2;
    view.setUint32(offset, sampleRate, true); offset += 4;
    view.setUint32(offset, sampleRate * numOfChan * 2, true); offset += 4;
    view.setUint16(offset, numOfChan * 2, true); offset += 2;
    view.setUint16(offset, 16, true); offset += 2;
    writeString(view, offset, 'data'); offset += 4;
    view.setUint32(offset, length - offset - 4, true); offset += 4;

    for (let i = 0; i < buffer.length; i++) {
        for (let channel = 0; channel < numOfChan; channel++) {
            const sample = buffer.getChannelData(channel)[i];
            const s = Math.max(-1, Math.min(1, sample));
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
            offset += 2;
        }
    }

    return view;
}
