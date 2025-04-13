

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

  // 模拟机器人回复
  setTimeout(() => {
    const botBubble = document.createElement('div');
    botBubble.className = 'bubble bot';
    botBubble.textContent = "✨...";
    chatBox.appendChild(botBubble);
    chatBox.scrollTop = chatBox.scrollHeight;
  }, 600);
}
