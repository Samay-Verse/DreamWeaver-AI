const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const jwt = require('jsonwebtoken');

// JWT Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    jwt.verify(token, 'your_jwt_secret', (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Get all chats for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const chats = await Chat.find({ userId: req.user.id });
        res.json(chats);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create or update a chat
router.post('/', authenticateToken, async (req, res) => {
    const { chatId, title, messages } = req.body;
    try {
        let chat = await Chat.findOne({ chatId, userId: req.user.id });
        if (chat) {
            chat.title = title;
            chat.messages = messages;
            await chat.save();
        } else {
            chat = new Chat({ userId: req.user.id, chatId, title, messages });
            await chat.save();
        }
        res.json({ message: 'Chat saved successfully', chat });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a specific chat
router.delete('/:chatId', authenticateToken, async (req, res) => {
    try {
        const chat = await Chat.findOneAndDelete({ chatId: req.params.chatId, userId: req.user.id });
        if (!chat) return res.status(404).json({ message: 'Chat not found' });
        res.json({ message: 'Chat deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;