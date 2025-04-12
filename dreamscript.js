import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@1.35.0/dist/supabase.js";

// Initialize Supabase with your project's URL and anon key
const supabase = createClient("https://uytyxroguktgsymkkoke.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5dHl4cm9ndWt0Z3N5bWtrb2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NDc2MDQsImV4cCI6MjA1ODIyMzYwNH0.Yn6-gOjT3ZRJvAaO-czhb0IME5JP5g2IEi97TbAA_BU");

let mediaRecorder;
let recordingStream;
let allChunks = [];
let isRecording = false;

// Save bubble to Supabase
export async function saveBubbleToSupabase(text, audioBase64 = null) {
    if (!text || text.trim() === "") {
        console.error("❌ 不能存入空白文本！");
        return;
    }

    console.log("📤 尝试存入 Supabase:", { text, audioBase64 });

    try {
        const { data, error } = await supabase
            .from('dream_bubbles') // The table name in Supabase
            .insert([
                { text: text, audioBase64: audioBase64, timestamp: new Date() }
            ]);

        if (error) {
            console.error("❌ Supabase 存储失败:", error);
        } else {
            console.log("✅ 数据成功存入 Supabase", data);
        }
    } catch (error) {
        console.error("❌ Supabase 存储失败:", error);
    }
}

// Load bubbles from Supabase
export async function loadBubbles() {
    console.log("🔄 正在加载 Supabase 数据...");

    const { data, error } = await supabase
        .from('dream_bubbles') // The table name in Supabase
        .select('*')
        .order('timestamp', { ascending: false }); // Optional: order by timestamp

    if (error) {
        console.error("❌ Supabase 数据加载失败:", error);
        return;
    }

    data.forEach((doc) => {
        console.log("📌 Supabase 数据:", doc);
        createBubble(doc.id, doc.text, doc.audioBase64); // Adjust for Supabase data structure
    });

    console.log("✅ 所有泡泡已加载完成");
}

// Create bubble in the document
export function createBubble(docId, text, audioBase64 = null) {
    if (!text || typeof text !== "string" || text.trim() === "") {
        console.error("❌ createBubble() 失败：text 不能为空");
        return;
    }

    console.log("🟢 生成泡泡，文本:", text, " docId:", docId);

    const bubble = document.createElement("div");
    bubble.classList.add("bubble");

    // Store docId in bubble.dataset for easy reference
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

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "X";
    deleteBtn.style.marginLeft = "5px";
    deleteBtn.addEventListener("click", (event) => {
        event.stopPropagation(); // so we don't trigger bubble clicks
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

// Delete bubble from Supabase
async function deleteBubbleDoc(docId, bubbleElement) {
    try {
        console.log("🗑 Deleting doc ID:", docId);
        const { error } = await supabase
            .from('dream_bubbles')
            .delete()
            .eq('id', docId);

        if (error) {
            console.error("❌ Failed to delete doc:", docId, error);
        } else {
            console.log("✅ Successfully deleted doc:", docId);
            bubbleElement.remove();
        }
    } catch (error) {
        console.error("❌ Failed to delete doc:", docId, error);
    }
}

export function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        recordingStream = stream;
        allChunks = [];
        mediaRecorder = new MediaRecorder(stream);
        isRecording = true;

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                allChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            const fullBlob = new Blob(allChunks, { type: 'audio/webm' });
            if (fullBlob.size === 0) {
                return;
            }
            const userText = document.getElementById("bubbleText")?.value.trim();
            processAudioWithTone(fullBlob, userText);
        };

        mediaRecorder.start(5000);
    }).catch(err => {
        console.error("❌ 获取音频失败:", err);
    });
}

export function stopRecording() {
    if (mediaRecorder && isRecording) {
        isRecording = false;
        mediaRecorder.stop();
        recordingStream.getTracks().forEach(track => track.stop());
    }
}
