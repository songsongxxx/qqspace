// dreamscript.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';


// 🪪 替换为你自己的 Supabase 项目地址和 Key
const supabaseUrl = 'https://uytyxroguktgsymkkoke.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5dHl4cm9ndWt0Z3N5bWtrb2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NDc2MDQsImV4cCI6MjA1ODIyMzYwNH0.Yn6-gOjT3ZRJvAaO-czhb0IME5JP5g2IEi97TbAA_BU';
const supabase = createClient(supabaseUrl, supabaseKey);


let mediaRecorder;
let allChunks = [];
let recordingStream;

 // 开始实时试音变声
let mic, pitchShift, bitCrusher, delay, reverb;
let isTesting = false;


document.getElementById("testToneBtn").addEventListener("click", async () => {
    if (!isTesting) {
        // 第一次点击：开启试音
        await Tone.start();
        mic = new Tone.UserMedia();

        pitchShift = new Tone.PitchShift({
            pitch: parseFloat(document.getElementById("pitchSlider").value)
        }).toDestination();
        bitCrusher = new Tone.BitCrusher(parseInt(document.getElementById("bitSlider").value)).toDestination();
        delay = new Tone.FeedbackDelay(parseFloat(document.getElementById("delaySlider").value)).toDestination();
        reverb = new Tone.Reverb({ decay: parseFloat(document.getElementById("reverbSlider").value) }).toDestination();

        mic.connect(pitchShift);
        pitchShift.connect(bitCrusher);
        bitCrusher.connect(delay);
        delay.connect(reverb);
        reverb.toDestination();

        await mic.open();
        console.log("🎧 开始试音");
        isTesting = true;
        document.getElementById("testToneBtn").textContent = "🛑 停止试音";
    } else {
        // 第二次点击：关闭试音
        mic.close();
        mic.disconnect();
        pitchShift.disconnect();
        bitCrusher.disconnect();
        delay.disconnect();
        reverb.disconnect();
        isTesting = false;
        console.log("🛑 已关闭试音");
        document.getElementById("testToneBtn").textContent = "🔊 试听变声效果";
    }
});


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








