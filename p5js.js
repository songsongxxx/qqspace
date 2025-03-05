let myModel; // 变量用于存储 3D 模型
let angle = 0; // 旋转角度

function preload() {
    // 加载3D模型（STL 或 OBJ 格式）
    myModel = loadModel('print-mask.stl', true); // true 启用法线优化
}

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL); // 创建 WebGL 画布，适配窗口大小
}

function draw() {
    background(200);

    // 设置光照
    lights();

    // 旋转模型
    rotateX(angle * 0.3);
    rotateY(angle * 0.5);

    // 显示3D模型
    scale(2); // 调整模型大小
    noStroke(); // 取消轮廓
    fill(150, 150, 255); // 设定颜色
    model(myModel);

    angle += 0.02; // 逐渐旋转
}

// 窗口大小自适应
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
// JavaScript source code
