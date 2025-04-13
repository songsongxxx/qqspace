// 打字机文字内容
const text = `Daydream

Those "overly sentimental" moments,
Those "insignificant" fragments of time.
I am an emotional trash bin,
Collecting only the daydreams that are not allowed.

In an era of maximum output,
My fantasies have become noise,
And my body, a miscalculation.

I just want to—
Just quietly—
Feel my body,
Feel the blurred waves inside me,
Feel the immeasurable touches between myself and the surroundings.

I am a wasteland,
Piled high with daydreams.`;

let i = 0;
const speed = 30;
const typewriter = document.getElementById("typewriter");

function typeText() {
    if (i < text.length) {
        typewriter.textContent += text.charAt(i);
        i++;
        setTimeout(typeText, speed);
    }
}

typeText();

// 弹窗控制
function openModal() {
    console.log("🔍 openModal called");
    document.getElementById('modal').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

// 表单提交
function addFriend() {
    const name = document.getElementById('nameInput').value;
    if (!name) return;

    const formData = new FormData();
    formData.append('entry.1552334168', name);

    fetch('https://docs.google.com/forms/d/e/1FAIpQLScJv8jr3-6HaN4TqZzEqgUAs2pTqsvI3Gr-Ub8U6iaqI7Bpqg/formResponse', {
        method: 'POST',
        mode: 'no-cors',
        body: formData
    })
        .then(() => {
            closeModal();
            alert('submitted');
        })
        .catch((err) => {
            console.error("failed", err);
            alert("failed");
        });
}

// 数据加载
const SHEET_API_URL = 'https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLjVfAX-5whXCR8l3RLg5ZI1S6T4P1CHKP_6FampnIA8Rbg4kCwSkQ1BeI1oxsMXQzvZZwPdZ7-GWiYQOlbXkPFj25LOmnqHuRKl1sH8gd8tjLpoGVrbNymYShZKwtAIyGUDbL6SXBjZahR3LJ8h8ckGarKH8pifsWsaEgObT_BOqRm7ay7gLvPou0DPSBVO5tFGUFoiKhkSCWSvLPcxtggHMEKWFwNmtbzYPLeYGd7QuKWXtj9NUlZwAhfRsts9FkTStgJff0gx5mvA0f50NNOF4Ia1A_I1HaxZ9zXf&lib=ML8sUQpQVNko5ic7c60wuAOJSxjlTGBvU';

function loadFriends() {




    fetch(SHEET_API_URL)
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById('friendList');
            container.innerHTML = ''; // 清空旧列表

            data.forEach(entry => {
                const name = entry.name?.trim();
                const timestamp = entry.timestamp?.trim();
                //const dateObj = new Date(timestamp);

                // 跳过名字为空或全是空格的情况
                if (!name || name.replace(/\s/g, '') === '') return;

                const friendBox = document.createElement('div');
                friendBox.classList.add('friend');


                // link
                const link = document.createElement('a');
                link.href = `daydreamchat.html?name=${encodeURIComponent(name)}`;  // 安全处理
                link.style.textDecoration = "none";
                link.style.color = "inherit";

                const nameEl = document.createElement('div');
                nameEl.className = "friend-name"; // ✨ 加类名
                nameEl.textContent = name;

                const timeEl = document.createElement('div');
                timeEl.className = 'friend-timestamp'; // 🌟加上样式类
                timeEl.textContent = timestamp;

                link.appendChild(nameEl);
                if (timestamp) link.appendChild(timeEl);

                friendBox.appendChild(link);
                container.appendChild(friendBox);

            });
        })

        .catch(error => {
            console.error("加载失败:", error);
        });
}


// 页面载入后自动执行
window.onload = function () {
    typeText();
    loadFriends();
};


