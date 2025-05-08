require('dotenv').config();
const express = require('express');
const path = require('path');
const Groq = require('groq-sdk');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcrypt');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

// Serve intro.html as the default page for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/loginPage.html'));
});

// Serve index.html explicitly when accessing /index.html
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './Uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir);
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only images are allowed'));
        }
        cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/dreamweaver', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB')).catch(err => console.error('MongoDB connection error:', err));

// Schemas
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: { type: String },
    provider: String,
    providerId: String,
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const chatSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    title: String,
    messages: [{
        sender: String,
        content: String,
        timestamp: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now }
});
const Chat = mongoose.model('Chat', chatSchema);

const happyMomentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: String,
    date: { type: Date, default: Date.now },
    source: String,
    image: String,
    video: String,
    metadata: Object
});
const HappyMoment = mongoose.model('HappyMoment', happyMomentSchema);

// Register Endpoint
app.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            email,
            password: hashedPassword,
            provider: 'local',
        });
        await user.save();

        const token = generateToken(user);
        res.status(201).json({ message: 'Registration successful', token });
    } catch (err) {
        console.error('Error in /register:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Login Endpoint
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (!user.password) {
            return res.status(401).json({ message: 'This account uses social login. Please use Google, Facebook, or GitHub.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = generateToken(user);
        res.json({ message: 'Login successful', token });
    } catch (err) {
        console.error('Error in /login:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Passport Strategies
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'YOUR_GOOGLE_CLIENT_SECRET',
    callbackURL: 'http://localhost:3000/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ providerId: profile.id });
        if (!user) {
            user = new User({
                name: profile.displayName,
                email: profile.emails[0].value,
                provider: 'google',
                providerId: profile.id
            });
            await user.save();
        }
        done(null, user);
    } catch (err) {
        done(err, null);
    }
}));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID || 'YOUR_FACEBOOK_APP_ID',
    clientSecret: process.env.FACEBOOK_APP_SECRET || 'YOUR_FACEBOOK_APP_SECRET',
    callbackURL: 'http://localhost:3000/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'emails']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ providerId: profile.id });
        if (!user) {
            user = new User({
                name: profile.displayName,
                email: profile.emails ? profile.emails[0].value : `${profile.id}@facebook.com`,
                provider: 'facebook',
                providerId: profile.id
            });
            await user.save();
        }
        done(null, user);
    } catch (err) {
        done(err, null);
    }
}));

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID || 'YOUR_GITHUB_CLIENT_ID',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || 'YOUR_GITHUB_CLIENT_SECRET',
    callbackURL: 'http://localhost:3000/auth/github/callback'
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ providerId: profile.id });
        if (!user) {
            user = new User({
                name: profile.displayName || profile.username,
                email: profile.emails ? profile.emails[0].value : `${profile.id}@github.com`,
                provider: 'github',
                providerId: profile.id
            });
            await user.save();
        }
        done(null, user);
    } catch (err) {
        done(err, null);
    }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// JWT Middleware
const authenticateJWT = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Authentication required' });

    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret', (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};

// OAuth Routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
app.get('/auth/google/callback', passport.authenticate('google', { session: false }), (req, res) => {
    const token = generateToken(req.user);
    res.redirect(`http://localhost:3000/ChatUI.html?token=${token}`);
});

app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));
app.get('/auth/facebook/callback', passport.authenticate('facebook', { session: false }), (req, res) => {
    const token = generateToken(req.user);
    res.redirect(`http://localhost:3000/ChatUI.html?token=${token}`);
});

app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));
app.get('/auth/github/callback', passport.authenticate('github', { session: false }), (req, res) => {
    const token = generateToken(req.user);
    res.redirect(`http://localhost:3000/ChatUI.html?token=${token}`);
});

// JWT Token Generation
const generateToken = (user) => {
    return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
};

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROK_API_KEY || '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'
});

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'Uploads')));

// Uplifting videos
const upliftingVideos = {
    general: [
        { title: 'You Matter More Than You Think ❤️', url: 'https://youtu.be/nqye02H_H6I' },
        { title: 'A Big Hug in Video Form 🤗', url: 'https://youtu.be/Pf6eZWg_Fn8' }
    ],
    sad: [
        { title: 'It’s Okay to Be Sad 💖', url: 'https://youtu.be/ZbZSe6N_BXs' }
    ],
    heartbroken: [
        { title: 'You’ll Heal From This 💔➡️❤️', url: 'https://youtu.be/gdLi9kIHGdM' }
    ]
};

function getUpliftingVideo(input) {
    const lower = input.toLowerCase();
    if (lower.includes('heartbroken') || lower.includes('breakup')) return upliftingVideos.heartbroken[0];
    if (lower.includes('sad') || lower.includes('depressed')) return upliftingVideos.sad[0];
    return upliftingVideos.general[Math.floor(Math.random() * upliftingVideos.general.length)];
}

function generateImage(description) {
    const keywords = description.toLowerCase().split(' ').slice(0, 3).join(',');
    return `https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80&query=${keywords}`;
}

async function isHappyContent(text) {
    const systemPrompt = `
        You are a happiness detection expert.
        Does this message sound genuinely happy or positive overall?
        Only respond with: yes or no
        Examples:
        - "I'm smiling today and feel amazing!" → yes
        - "I guess it's fine." → no
        - "I'm finally feeling free and light" → yes
        - "Still hurts but I'm trying." → no
    `;
    try {
        const response = await groq.chat.completions.create({
            model: 'llama3-70b-8192',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: text }
            ],
            temperature: 0,
            max_tokens: 5
        });
        return response.choices[0].message.content.trim().toLowerCase() === 'yes';
    } catch (err) {
        console.error('Error detecting happiness:', err);
        return false;
    }
}

async function getFriendlySupport(input) {
    const video = getUpliftingVideo(input);
    const systemPrompt = `
        You're a warm-hearted, loving human (not an assistant). Talk like a caring best friend, mom, or dad.
        NEVER answer tech, study, coding, or academic questions. Say something like:
        “Oh no bestie 😅 I’m not the study type — let’s talk real feelings, yeah?”
        Speak casually, emotionally, like a real person. Use emojis, 5+ lines, show love, comfort, even jokes if helpful.
        At the end, suggest this video if the user seems down: "${video.title}" - ${video.url}"
        Say it like: “Hey I think this might lift your mood 💛: [title] - [url]”
    `;
    try {
        const response = await groq.chat.completions.create({
            model: 'llama3-70b-8192',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: input }
            ],
            temperature: 0.95,
            max_tokens: 600
        });
        return { text: response.choices[0].message.content, video };
    } catch (err) {
        console.error('Error getting friendly support:', err);
        return { text: 'Sorry, I’m having trouble responding. Let’s try again?', video };
    }
}

// Chat API
app.post('/api/emotional-chat', authenticateJWT, async (req, res) => {
    const { input, chatId, media } = req.body;
    const userId = req.user.id;

    if (!input) return res.status(400).json({ message: 'Input required' });

    // Validate chatId
    if (chatId && !chatId.match(/^[0-9a-fA-F]{24}$/)) {
        console.warn(`Invalid chatId received: ${chatId}`);
        return res.status(400).json({ message: 'Invalid chatId format' });
    }

    try {
        const video = getUpliftingVideo(input);
        const systemPrompt = `
            You're DreamWeaver AI, an emotional support companion. Your role is to:
            1. Provide empathetic, understanding responses
            2. Help users explore their feelings
            3. Offer gentle guidance for emotional wellbeing
            4. Interpret dreams when asked
            5. Never give medical advice, but suggest professional help when needed
            
            Tone: Warm, compassionate, non-judgmental
            Style: Conversational but professional
            Length: 3-5 sentences typically
            
            Current time: ${new Date().toLocaleString()}
            User's last message: ${input}
        `;

        const response = await groq.chat.completions.create({
            model: 'llama3-70b-8192',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: input }
            ],
            temperature: 0.7,
            max_tokens: 500
        });

        const aiResponse = response.choices[0].message.content;

        let chat = chatId ? await Chat.findOne({ _id: chatId, userId }) : null;
        if (!chat) {
            chat = new Chat({
                userId,
                title: input.substring(0, 30) + (input.length > 30 ? '...' : ''),
                messages: []
            });
        }

        chat.messages.push({ sender: 'user', content: input });
        chat.messages.push({ sender: 'ai', content: aiResponse });
        await chat.save();

        const happyInput = await isHappyContent(input);
        const happyOutput = await isHappyContent(aiResponse);
        let happyMomentStored = false;

        if (happyInput || happyOutput) {
            const happyMoment = new HappyMoment({
                userId,
                content: happyInput ? input : aiResponse,
                source: happyInput ? 'User Input' : 'Assistant Response',
                image: media?.image || generateImage(happyInput ? input : aiResponse),
                video: media?.video || video.url,
                metadata: { video }
            });
            await happyMoment.save();
            happyMomentStored = true;
        }

        const pastHappyMoments = (input.toLowerCase().includes('sad') || 
                                input.toLowerCase().includes('down') || 
                                input.toLowerCase().includes('depressed'))
            ? await HappyMoment.find({ userId }).sort({ date: -1 }).limit(3)
            : [];

        res.json({
            response: aiResponse,
            chatId: chat._id.toString(),
            happyMomentStored,
            pastHappyMoments,
            video
        });
    } catch (err) {
        console.error('Error in /api/emotional-chat:', err);
        if (err.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid chatId format' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all chats
app.get('/api/chats', authenticateJWT, async (req, res) => {
    try {
        const chats = await Chat.find({ userId: req.user.id }).sort({ createdAt: -1 });
        res.json(chats);
    } catch (err) {
        console.error('Error in /api/chats:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single chat
app.get('/api/chats/:id', authenticateJWT, async (req, res) => {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid chatId format' });
        }
        const chat = await Chat.findOne({ _id: req.params.id, userId: req.user.id });
        if (!chat) return res.status(404).json({ message: 'Chat not found' });
        res.json(chat);
    } catch (err) {
        console.error('Error in /api/chats/:id:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete chat
app.delete('/api/chats/:id', authenticateJWT, async (req, res) => {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: 'Invalid chatId format' });
        }
        await Chat.deleteOne({ _id: req.params.id, userId: req.user.id });
        res.json({ success: true });
    } catch (err) {
        console.error('Error in /api/chats/:id:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Happy Vault API
app.get('/api/happy-vault', authenticateJWT, async (req, res) => {
    try {
        const happyMoments = await HappyMoment.find({ userId: req.user.id }).sort({ date: -1 });
        res.json(happyMoments);
    } catch (err) {
        console.error('Error in /api/happy-vault:', err);
        res.status(500).json({ message: 'Failed to fetch happy vault' });
    }
});

app.post('/api/happy-vault', authenticateJWT, upload.single('image'), async (req, res) => {
    try {
        const { content, source, video } = req.body;
        if (!content) return res.status(400).json({ message: 'Content is required' });
        if (video && !/^https:\/\/(www\.)?youtube\.com\/watch\?v=/.test(video)) {
            return res.status(400).json({ message: 'Invalid YouTube URL' });
        }
        const image = req.file ? `/uploads/${req.file.filename}` : generateImage(content);
        const happyMoment = new HappyMoment({
            userId: req.user.id,
            content,
            source,
            image,
            video,
            metadata: { manual: source === 'Manual Entry' }
        });
        await happyMoment.save();
        res.json({ success: true });
    } catch (err) {
        console.error('Error in /api/happy-vault:', err);
        res.status(500).json({ message: err.message || 'Failed to save happy moment' });
    }
});

// Dream Visualizer API
app.post('/api/visualize-dream', authenticateJWT, async (req, res) => {
    try {
        const { input, source } = req.body;
        if (!input) return res.status(400).json({ message: 'Dream description is required' });
        const story = `In a world born from your dream, ${input.toLowerCase().split(' ').slice(0, 5).join(' ')} sparked a journey of wonder. The skies glowed with possibilities, and adventure awaited around every corner. What does this dream mean to you?`;
        const image = generateImage(input);
        const happy = await isHappyContent(input);
        let happyMomentStored = false;

        if (happy) {
            const happyMoment = new HappyMoment({
                userId: req.user.id,
                content: input,
                source,
                image,
                metadata: { story }
            });
            await happyMoment.save();
            happyMomentStored = true;
        }

        res.json({ story, image, happyMomentStored });
    } catch (err) {
        console.error('Error in /api/visualize-dream:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

app.listen(port, () => {
    console.log(`💛 Emotional Support Chatbot with Happy Vault running at http://localhost:${port}`);
});