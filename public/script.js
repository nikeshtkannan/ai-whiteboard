// Initialize the canvas and context
const canvas = document.getElementById('whiteboard');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth * 0.8;
canvas.height = window.innerHeight * 0.8;

let painting = false;
let currentColor = '#000000';
let erasing = false;

let model; // For Handpose

// Setting up the webcam
const video = document.getElementById('webcam');

async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;

        return new Promise((resolve) => {
            video.onloadedmetadata = () => resolve(video);
        });
    } catch (err) {
        console.error("Error accessing webcam: ", err);
    }
}

// Load TensorFlow.js backend
async function setBackend() {
    try {
        await tf.setBackend('webgl');
        console.log("Backend set to WebGL");
    } catch (err) {
        console.warn("WebGL backend unavailable, falling back to CPU.");
        await tf.setBackend('cpu');
    }
    await tf.ready();
}

// Load Handpose Model
async function loadHandpose() {
    try {
        model = await handpose.load();
        console.log("Handpose model loaded.");
        detectHands(); // Start hand detection
    } catch (err) {
        console.error("Error loading Handpose model: ", err);
    }
}

let lastPosition = null; // To store the last position for smooth drawing

// Detect hands in the video feed
async function detectHands() {
    try {
        const predictions = await model.estimateHands(video);

        if (predictions.length > 0) {
            const landmarks = predictions[0].annotations;

            // Get finger positions
            const indexFingerTip = landmarks.indexFinger[3];
            const thumbTip = landmarks.thumb[3];

            const currentFingerPosition = {
                x: indexFingerTip[0],
                y: indexFingerTip[1],
            };

            // Check if the user is drawing (index finger tip is below thumb tip)
            if (indexFingerTip[2] < thumbTip[2]) {
                painting = true;
                draw(currentFingerPosition); // Draw on the whiteboard
            } else {
                painting = false;
                lastPosition = null; // Reset last position when not drawing
            }
        }

        requestAnimationFrame(detectHands); // Continue detecting hands
    } catch (err) {
        console.error("Error during hand detection: ", err);
    }
}

// Draw on the canvas
function draw(position) {
    if (!painting) return;

    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = erasing ? '#ffffff' : currentColor;

    if (lastPosition) {
        // Draw a line from the last position to the current position
        ctx.beginPath();
        ctx.moveTo(lastPosition.x, lastPosition.y);
        ctx.lineTo(position.x, position.y);
        ctx.stroke();
    }

    // Update the last position
    lastPosition = position;
}

// Color Picker Event
const colorPicker = document.getElementById('colorPicker');
colorPicker.addEventListener('input', (e) => {
    currentColor = e.target.value;
});

// Erase Button Event
const eraseBtn = document.getElementById('erase');
eraseBtn.addEventListener('click', () => {
    erasing = true;
});

// Draw Button Event
const drawBtn = document.getElementById('draw');
drawBtn.addEventListener('click', () => {
    erasing = false;
});

// Clear Button Event
document.getElementById('clear').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

// Initialize TensorFlow.js and Handpose
setupCamera()
    .then(video => video.play())
    .then(() => setBackend())
    .then(() => loadHandpose())
    .catch(err => console.error("Initialization error: ", err));
