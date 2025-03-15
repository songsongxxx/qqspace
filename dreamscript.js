import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-storage.js";

// 🔥 你的 Firebase 配置（替换为你的 Firebase 项目信息）
const firebaseConfig = {
    apiKey: "AIzaSyCa4PyEJPxS6Yavfc-f-SxlYvq_6yOUngQ",
    authDomain: "dream-fde5e.firebaseapp.com",
    projectId: "dream-fde5e",
    storageBucket: "dream-fde5e.appspot.com",  // ✅ 确保这里是 `.appspot.com`
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

// 🎈 创建泡泡
async function createBubble() {
    const text = document.getElementById("bubbleText").value.trim();
    const imageFile = document.getElementById("imageUpload").files[0];

    if (!text && !imageFile) {
        alert("Please enter text or upload an image.");
        return;
    }

    let imageURL = null;
    if (imageFile) {
        imageURL = await uploadImageToFirebase(imageFile); // 🔄 确保上传到 Firebase
    }

    const docRef = await addDoc(collection(db, "dreams"), {
        text: text || null,
        imageURL: imageURL || null,
        timestamp: new Date()
    });

    console.log("✅ 数据已存储，ID:", docRef.id);
    generateBubble(text, null, imageURL);
}

// 🎨 生成泡泡
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

// 📤 上传图片到 Firebase
async function uploadImageToFirebase(file) {
    const storageRef = ref(storage, `dream_images/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    console.log("🖼️ 图片上传成功，URL:", url);
    return url;
}

// 🔄 读取存储的梦境
async function loadDreams() {
    const q = query(collection(db, "dreams"));
    const querySnapshot = await getDocs(q);

    document.getElementById("bubbleContainer").innerHTML = ""; // 清空泡泡

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        generateBubble(data.text, null, data.imageURL);
    });
}

// 🗑 清理 3 天前的泡泡
async function cleanOldDreams() {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const q = query(collection(db, "dreams"), where("timestamp", "<", threeDaysAgo));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
        console.log(`🗑 已删除 3 天前的泡泡: ${doc.id}`);
    });
}

// 🎤 开始录音
function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = event => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const audioURL = URL.createObjectURL(audioBlob);
                generateBubble(null, audioURL);

                // 🔴 可选：你可以把音频文件上传到 Firebase
                // const storageRef = ref(storage, `audio_files/${Date.now()}.wav`);
                // await uploadBytes(storageRef, audioBlob);
                // const audioDownloadURL = await getDownloadURL(storageRef);
                // generateBubble(null, audioDownloadURL);
            };

            mediaRecorder.start();
            document.querySelector("button[onclick='stopRecording()']").disabled = false;
        });
}

// 🎤 停止录音
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
        document.querySelector("button[onclick='stopRecording()']").disabled = true;
    }
}

// 💨 让泡泡运动
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

// ⏳ 自动执行的任务
window.onload = function () {
    loadDreams();
    cleanOldDreams();
};

// 🔗 绑定到 `window`，让 HTML `onclick` 可以调用
window.createBubble = createBubble;
window.startRecording = startRecording;
window.stopRecording = stopRecording;
window.loadDreams = loadDreams;
