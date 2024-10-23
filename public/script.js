// Initialize the canvas and context
const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth * 0.8;
canvas.height = window.innerHeight * 0.8;

let painting = false;
let erasing = false;
let currentColor = '#000000';

const socket = io();  // Connect to the server

// Setting up the webcam
const video = document.getElementById('webcam');

async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;

        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                resolve(video);
            };
        });
    } catch (err) {
        console.error('Error accessing the webcam: ', err);
    }
}

setupCamera().then(video => {
    video.play();
});

// Load TensorFlow.js with backend fallback
async function setBackend() {
    try {
        await tf.setBackend('webgl');  // Try WebGL first
        console.log("Backend set to WebGL");
    } catch (err) {
        console.warn("WebGL backend unavailable, switching to WASM");
        try {
            await tf.setBackend('wasm');  // Fallback to WASM if WebGL is unavailable
            console.log("Backend set to WASM");
        } catch (wasmErr) {
            console.warn("WASM backend also unavailable, switching to CPU");
            await tf.setBackend('cpu');  // Fallback to CPU as a last resort
            console.log("Backend set to CPU");
        }
    }
    await tf.ready();
}

let model;

async function loadHandpose() {
    try {
        model = await handpose.load();
        console.log("Handpose model loaded");
        detectHands();  // Start detecting hands
    } catch (err) {
        console.error("Error loading Handpose model: ", err);
    }
}

async function detectHands() {
    try {
        const predictions = await model.estimateHands(video);
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas before drawing

        if (predictions.length > 0) {
            const landmarks = predictions[0].annotations;
            // Draw skeleton
            drawSkeleton(landmarks);
            
            const thumbTip = landmarks.thumb[3];
            const indexFingerTip = landmarks.indexFinger[3];
            console.log(`Thumb: ${thumbTip}, Index Finger: ${indexFingerTip}`);

            if (indexFingerTip[2] < thumbTip[2]) {
                startPosition({ clientX: indexFingerTip[0], clientY: indexFingerTip[1] });
            } else {
                erasing = true;
            }
        }
        requestAnimationFrame(detectHands);  // Continue detecting
    } catch (err) {
        console.error("Error in hand detection: ", err);
    }
}

// Draw the hand skeleton
function drawSkeleton(landmarks) {
    // Draw the hand landmarks
    ctx.fillStyle = 'red'; // Color of the landmarks
    for (const finger in landmarks) {
        landmarks[finger].forEach(([x, y]) => {
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, 2 * Math.PI); // Draw circles around landmarks
            ctx.fill();
        });
    }

    // Draw lines between landmarks to form a skeleton
    const connections = [
        // Connections for the thumb
        [landmarks.thumb[0], landmarks.thumb[1]],
        [landmarks.thumb[1], landmarks.thumb[2]],
        [landmarks.thumb[2], landmarks.thumb[3]],
        // Connections for the index finger
        [landmarks.indexFinger[0], landmarks.indexFinger[1]],
        [landmarks.indexFinger[1], landmarks.indexFinger[2]],
        [landmarks.indexFinger[2], landmarks.indexFinger[3]],
        // Add more connections for other fingers...
        [landmarks.middleFinger[0], landmarks.middleFinger[1]],
        [landmarks.middleFinger[1], landmarks.middleFinger[2]],
        [landmarks.middleFinger[2], landmarks.middleFinger[3]],
        [landmarks.ringFinger[0], landmarks.ringFinger[1]],
        [landmarks.ringFinger[1], landmarks.ringFinger[2]],
        [landmarks.ringFinger[2], landmarks.ringFinger[3]],
        [landmarks.pinky[0], landmarks.pinky[1]],
        [landmarks.pinky[1], landmarks.pinky[2]],
        [landmarks.pinky[2], landmarks.pinky[3]],
    ];

    ctx.strokeStyle = 'blue'; // Color of the skeleton
    ctx.lineWidth = 2;
    connections.forEach(([start, end]) => {
        ctx.beginPath();
        ctx.moveTo(start[0], start[1]);
        ctx.lineTo(end[0], end[1]);
        ctx.stroke();
    });
}

// Initialize TensorFlow.js backend and Handpose
setBackend().then(loadHandpose);

// Start a new path (draw or erase)
function startPosition(e) {
    painting = true;
    const startData = {
        x: e.clientX - canvas.offsetLeft,
        y: e.clientY - canvas.offsetTop,
        color: erasing ? '#fff' : currentColor,
        erasing: erasing,
        newPath: true  // New path marker
    };
    socket.emit('draw', startData);

    // Start locally
    ctx.beginPath();
    draw(e);
}

// Color picker change event
const colorPicker = document.getElementById('colorPicker');
colorPicker.addEventListener('input', (e) => {
    currentColor = e.target.value;
});

// Erase and draw button events
const eraseBtn = document.getElementById('erase');
const drawBtn = document.getElementById('draw');

eraseBtn.addEventListener('click', () => {
    erasing = true;
    drawBtn.classList.remove('active');
    eraseBtn.classList.add('active');
});

drawBtn.addEventListener('click', () => {
    erasing = false;
    eraseBtn.classList.remove('active');
    drawBtn.classList.add('active');
});

// End drawing path
function endPosition() {
    painting = false;
    ctx.beginPath();  // Reset the path
}

// Draw the path
function draw(e) {
    if (!painting) return;

    const data = {
        x: e.clientX - canvas.offsetLeft,
        y: e.clientY - canvas.offsetTop,
        color: erasing ? '#fff' : currentColor,
        erasing: erasing
    };

    socket.emit('draw', data);

    // Draw locally
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = data.color;
    ctx.lineTo(data.x, data.y);
    ctx.stroke();
    ctx.moveTo(data.x, data.y);
}

// Canvas event listeners
canvas.addEventListener('mousedown', startPosition);
canvas.addEventListener('mouseup', endPosition);
canvas.addEventListener('mousemove', draw);

// Listen for drawing from other clients
socket.on('draw', (data) => {
    if (data.newPath) {
        ctx.beginPath();
    }

    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = data.color;
    ctx.lineTo(data.x, data.y);
    ctx.stroke();
    ctx.moveTo(data.x, data.y);
});

// Clear the canvas
document.getElementById('clear').addEventListener('click', () => {
    socket.emit('clear');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Listen for clear events
socket.on('clear', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});




