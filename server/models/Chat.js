const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    chatId: { type: String, required: true }, // Unique identifier for the chat
    title: { type: String, required: true }, // Chat title (e.g., first 30 chars of message)
    messages: [{
        sender: { type: String, enum: ["user", "ai"], required: true },
        message: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// Update updatedAt on save
chatSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model("Chat", chatSchema);