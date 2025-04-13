

const name = new URLSearchParams(window.location.search).get("name");
document.getElementById("chatTitle").textContent = `🌙 ${name} chat`;


const title = document.getElementById("chatTitle");
title.textContent = ` ${name} chat`;


function sendMessage() {
    const input = document.getElementById('userInput');
    const msg = input.value.trim();
    if (!msg) return;
  
    const chatBox = document.getElementById('chatBox');
  
    const userBubble = document.createElement('div');
    userBubble.className = 'bubble user';
    userBubble.textContent = msg;
    chatBox.appendChild(userBubble);
  
    input.value = '';
  
    // 模拟回应（可以换掉）
    setTimeout(() => {
      typeTerminalBubble("✨ Dreaming...", 600);
    }, 300);
  }
  


  function typeBubble(text, delay = 0) {
    setTimeout(() => {
      const chatBox = document.getElementById("chatBox");
      const bubble = document.createElement("div");
      bubble.className = "bubble bot";
      chatBox.appendChild(bubble);
  
      let i = 0;
      const interval = setInterval(() => {
        bubble.textContent += text[i];
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          chatBox.scrollTop = chatBox.scrollHeight;
        }
      }, 50); // 打字速度
    }, delay);
  }
  
  // 页面加载后依次打字
  window.addEventListener('DOMContentLoaded', () => {
    typeBubble("Build a story together", 500);
    typeBubble("Create a button", 2000);
    typeBubble("Draw a doodle", 3500);
  });
  
  
  