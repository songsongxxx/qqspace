// dreamscript.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';


// 🪪 替换为你自己的 Supabase 项目地址和 Key
const supabaseUrl = 'https://uytyxroguktgsymkkoke.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5dHl4cm9ndWt0Z3N5bWtrb2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NDc2MDQsImV4cCI6MjA1ODIyMzYwNH0.Yn6-gOjT3ZRJvAaO-czhb0IME5JP5g2IEi97TbAA_BU';
const supabase = createClient(supabaseUrl, supabaseKey);


export async function fetchDreamBubbles() {
    const { data, error } = await supabase
        .from("dreams")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("❌ 读取 Supabase 失败:", error.message);
        return [];
    }
    return data || [];
}

let dreamsData = []; // 全局存储一次fetch的内容

document.addEventListener("DOMContentLoaded", async () => {
    dreamsData = await fetchDreamBubbles();

    if (dreamsData.length === 0) {
        document.getElementById("processedText").textContent = "No dreams found.";
        document.getElementById("processedAudio").textContent = "No dreams audio.";
        return;
    }

    displayProcessedDream();

    const nextBtn = document.getElementById("nextDreamBtn");
    let audioStarted = false; // 是否已经启动 AudioContext

    nextBtn.addEventListener("click", async () => {
        if (!audioStarted) {
            await Tone.start();
            audioStarted = true;
            console.log("🔊 AudioContext started");
        }
        displayProcessedDream();
    });
});

async function displayProcessedDream() {
    if (!dreamsData.length) {
        console.warn("⚠️ dreamsData为空");
        return;
    }

    const textContainer = document.getElementById("processedText");
    const audioContainer = document.getElementById("processedAudio");

    textContainer.innerHTML = '';
    audioContainer.innerHTML = '';

    const randomEntry = dreamsData[Math.floor(Math.random() * dreamsData.length)];

    // 🎈 填文字
    const selectedText = randomEntry.text || "No text available.";
    const textElem = document.createElement("div");
    textElem.textContent = selectedText;
    textContainer.appendChild(textElem);

    // 🎵 找音频
    let selectedAudio = randomEntry.audio_url;

    if (!selectedAudio) {
        console.warn("⚠️ 当前dream没有音频，正在寻找其他有音频的dream");

        // 从 dreamsData 里找一个有 audio_url 的
        const found = dreamsData.find(entry => entry.audio_url);
        if (found) {
            selectedAudio = found.audio_url;
            console.log("✅ 找到了替代音频");
        } else {
            console.warn("❌ 整个 dreams 里都找不到音频了");
        }
    }

    if (!selectedAudio) {
        const warningElem = document.createElement("div");
        warningElem.textContent = "⚠️ 当前没有可用音频";
        audioContainer.appendChild(warningElem);
        return;
    }

    try {
        let arrayBuffer;
        if (selectedAudio.startsWith("data:")) {
            arrayBuffer = base64ToArrayBuffer(selectedAudio);
        } else if (selectedAudio.startsWith("blob:")) {
            const response = await fetch(selectedAudio);
            arrayBuffer = await response.arrayBuffer();
        } else {
            console.error("❗未知音频格式");
            return;
        }

        const fullAudio = await Tone.context.decodeAudioData(arrayBuffer);

        const totalDuration = fullAudio.duration;
        const clipDuration = Math.min(5, totalDuration);
        const startTime = Math.random() * (totalDuration - clipDuration);

        console.log(`🎯 Random audio clip: start at ${startTime.toFixed(2)}s`);

        const sampleRate = fullAudio.sampleRate;
        const channels = fullAudio.numberOfChannels;
        const startSample = Math.floor(startTime * sampleRate);
        const clipSamples = Math.floor(clipDuration * sampleRate);

        const clippedBuffer = Tone.context.createBuffer(channels, clipSamples, sampleRate);
        for (let channel = 0; channel < channels; channel++) {
            const fullData = fullAudio.getChannelData(channel);
            const clipData = clippedBuffer.getChannelData(channel);
            for (let i = 0; i < clipSamples; i++) {
                clipData[i] = fullData[startSample + i] || 0;
            }
        }

        const clipBlob = await bufferToWavBlob(clippedBuffer);
        const clipUrl = URL.createObjectURL(clipBlob);

        const audioElem = document.createElement("audio");
        audioElem.src = clipUrl;
        audioElem.controls = true;
        audioElem.preload = "auto";

        audioElem.addEventListener('loadedmetadata', () => {
            console.log(`✅ 剪辑片段长度: ${audioElem.duration.toFixed(2)}秒`);
        });

        audioContainer.appendChild(audioElem);

    } catch (err) {
        console.error("❌ 处理音频时出错:", err);
        const errorElem = document.createElement("div");
        errorElem.textContent = "⚠️ 音频处理失败";
        audioContainer.appendChild(errorElem);
    }
}




// 工具函数
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

