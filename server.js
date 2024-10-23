const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt'); // For password hashing

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ai_whiteboard', {
    useNewUrlParser: true, 
    useUnifiedTopology: true
})
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));

// Define user schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true }, // Email field added
    password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// Middleware to parse URL-encoded bodies (for form submissions)
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Parse JSON bodies for API requests
app.use(express.static('public')); // Serve static files (CSS, JS, images)

// Serve HTML pages
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Register.html'));
});

// Registration endpoint
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    // Simple validation
    if (!username || !email || !password) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Hash password before saving to the database
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();
        // Send success response as JSON
        res.status(200).json({ success: true, message: 'Registration successful!' });
    } catch (error) {
        // Check for duplicate email or username
        if (error.code === 11000) {
            res.status(400).json({ success: false, message: 'Username or email already exists' });
        } else {
            res.status(400).json({ success: false, message: 'Error registering user: ' + error.message });
        }
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Simple validation
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required' });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ success: false, message: 'User not found' });
        }

        // Check password
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ success: false, message: 'Incorrect password' });
        }

        // Send success response
        res.status(200).json({ success: true, message: 'Login successful!', redirect: 'http://localhost:3000/home.html' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error logging in: ' + error.message });
    }
});

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('draw', (data) => {
        console.log(`Drawing from ${socket.id}:`, data);
        socket.broadcast.emit('draw', data);
    });

    socket.on('clear', () => {
        console.log(`${socket.id} cleared the canvas`);
        socket.broadcast.emit('clear');
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Server Listening
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
