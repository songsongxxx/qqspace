import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-app.js";
import { getFirestore, collection, addDoc, query, where, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.7/firebase-storage.js";

// 🔥 你的 Firebase 配置（替换为你的 Firebase 项目信息）
const firebaseConfig = {
    apiKey: "AIzaSyCa4PyEJPxS6Yavfc-f-SxlYvq_6yOUngQ",
    authDomain: "dream-fde5e.firebaseapp.com",
    projectId: "dream-fde5e",
    storageBucket: "dream-fde5e.firebasestorage.app",
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

function createBubble() {
    const text = document.getElementById("bubbleText").value.trim();
    const imageFile = document.getElementById("imageUpload").files[0];

    if (!text && !imageFile) {
        alert("Please enter text or upload an image.");
        return;
    }

    let imageURL = null;
    if (imageFile) {
        imageURL = URL.createObjectURL(imageFile);
    }

    generateBubble(text, null, imageURL);
}

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



async function uploadImageToFirebase(file) {
    const storageRef = ref(storage, `dream_images/${file.name}`);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
}


async function loadDreams() {
    const q = query(collection(db, "dreams"));
    const querySnapshot = await getDocs(q);

    document.getElementById("bubbleContainer").innerHTML = ""; // 清空当前泡泡

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        generateBubble(data.text, null, data.imageURL);
    });
}

// 🔄 页面加载时自动读取泡泡
window.onload = function () {
    loadDreams();
    cleanOldDreams(); // 定期清理 3 天前的泡泡
};


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


