let myModel; // �������ڴ洢 3D ģ��
let angle = 0; // ��ת�Ƕ�

function preload() {
    // ����3Dģ�ͣ�STL �� OBJ ��ʽ��
    myModel = loadModel('print-mask.stl', true); // true ���÷����Ż�
}

function setup() {
    createCanvas(windowWidth, windowHeight, WEBGL); // ���� WebGL ���������䴰�ڴ�С
}

function draw() {
    background(200);

    // ���ù���
    lights();

    // ��תģ��
    rotateX(angle * 0.3);
    rotateY(angle * 0.5);

    // ��ʾ3Dģ��
    scale(2); // ����ģ�ʹ�С
    noStroke(); // ȡ������
    fill(150, 150, 255); // �趨��ɫ
    model(myModel);

    angle += 0.02; // ����ת
}

// ���ڴ�С����Ӧ
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
// JavaScript source code
