

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



function typeBubble(text, delay = 0, callback = null) {
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

                // ✨ 加上 callback 支持
                if (callback) callback();
            }
        }, 50); // 打字速度
    }, delay);
}

// 页面加载后依次打字
window.addEventListener('DOMContentLoaded', () => {
    typeBubble("Build a story together", 500);
    typeBubble("Create a button", 2000);
    typeBubble("Draw a doodle", 3500, showEmojiOptions); // 最后一句打完触发按钮

    document.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.addEventListener('click', (e) => {
          const color = e.target.getAttribute('data-color');
          selectColor(color, e);
        });
      });
      
});


// buttons
function showEmojiOptions() {
    const container = document.getElementById("emojiOptions");

    const btnData = [
        { emoji: "◎", text: "draw", action: openDrawingBoard },
        { emoji: "◉", text: "write", action: () => alert("📜 Ready to write!") }
    ];

    btnData.forEach(({ emoji, text, action }) => {
        const btn = document.createElement("button");
        btn.className = "emoji-button";
        btn.innerHTML = `<span class="emoji">${emoji}</span> <span class="label">${text}</span>`;
        btn.onclick = action;
        container.appendChild(btn);
    });
}


const drawButton = {
    emoji: "🖍️",
    text: "",
    action: openDrawingBoard
};

// 让 canvas 支持绘图
window.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('drawCanvas');
    const ctx = canvas.getContext('2d');
    let drawing = false;

    canvas.addEventListener('mousedown', (e) => {
        drawing = true;
        ctx.beginPath();
        const rect = canvas.getBoundingClientRect();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    });

    canvas.addEventListener('mouseup', () => {
        drawing = false;
    });

    canvas.addEventListener('mouseout', () => {
        drawing = false;
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!drawing) return;
        const rect = canvas.getBoundingClientRect();
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000000'; // 你也可以让用户选择颜色
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
    });
});


// 颜色
let currentColor = "#000000";
let pixelData = [];
let isDrawing = false;

function openDrawingBoard() {
    document.getElementById('drawingModal').classList.remove('hidden');
    createPixelGrid();
}

function selectColor(color, event) {
    currentColor = color;
    document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
    event.target.classList.add('selected');
}
const palette = ['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
const paletteContainer = document.getElementById('colorPalette');
palette.forEach(color => {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch';
    swatch.style.backgroundColor = color;
    swatch.addEventListener('click', (e) => selectColor(color, e));
    paletteContainer.appendChild(swatch);
});

  


function createPixelGrid() {
    const pixelCanvas = document.getElementById('pixelCanvas');
    pixelCanvas.innerHTML = '';
    pixelData = [];

    for (let i = 0; i < 256; i++) {
        const pixel = document.createElement('div');
        pixel.className = 'pixel';
        pixel.dataset.index = i;

        // 鼠标按下
        pixel.addEventListener('mousedown', (e) => {
            isDrawing = true;
            paintPixel(pixel, i);
        });

        // 鼠标进入 + 正在绘制
        pixel.addEventListener('mouseover', (e) => {
            if (isDrawing) {
                paintPixel(pixel, i);
            }
        });

        // 取消绘制
        pixel.addEventListener('mouseup', () => {
            isDrawing = false;
        });

        pixelCanvas.appendChild(pixel);
        pixelData.push("#ffffff");
    }

    // 防止拖拽时鼠标状态不解除
    document.addEventListener('mouseup', () => {
        isDrawing = false;
    });
}

function paintPixel(pixel, index) {
    pixel.style.backgroundColor = currentColor;
    pixelData[index] = currentColor;
}


function finishDrawing() {
    const size = 16;
    const pixelSize = 16;
  
    // 计算实际画的范围
    let minX = size, maxX = 0, minY = size, maxY = 0;
    pixelData.forEach((color, i) => {
      if (color !== "#ffffff") {
        const x = i % size;
        const y = Math.floor(i / size);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    });
  
    if (minX > maxX || minY > maxY) {
      alert("你还没有画画！");
      return;
    }
  
    const drawWidth = (maxX - minX + 1) * pixelSize;
    const drawHeight = (maxY - minY + 1) * pixelSize;
  
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = drawWidth;
    canvas.height = drawHeight;
  
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const index = y * size + x;
        const color = pixelData[index];
        if (color !== "#ffffff") {
          ctx.fillStyle = color;
          ctx.fillRect((x - minX) * pixelSize, (y - minY) * pixelSize, pixelSize, pixelSize);
        }
      }
    }
  
    // 设置清晰像素边缘（避免模糊）
    ctx.imageSmoothingEnabled = false;
  
    const dataURL = canvas.toDataURL("image/png");
  
    // 创建 img 贴纸
    const img = document.createElement('img');
    img.src = dataURL;
    img.className = 'sticker';
    img.style.position = 'absolute';
    img.style.top = '100px';
    img.style.left = '100px';
    img.style.zIndex = 9999;
    img.style.cursor = 'move';
    img.style.imageRendering = 'pixelated'; // 保持像素风格
    img.draggable = false;
  
    // 拖动逻辑
    img.addEventListener('mousedown', function (e) {
      e.preventDefault();
      const shiftX = e.clientX - img.getBoundingClientRect().left;
      const shiftY = e.clientY - img.getBoundingClientRect().top;
  
      function moveAt(e) {
        img.style.left = e.pageX - shiftX + 'px';
        img.style.top = e.pageY - shiftY + 'px';
      }
  
      function onMouseMove(e) {
        moveAt(e);
      }
  
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', function onMouseUp() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      });
    });
  
    document.body.appendChild(img);
    document.getElementById('drawingModal').classList.add('hidden');
  }
  