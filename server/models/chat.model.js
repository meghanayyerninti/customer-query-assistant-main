const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['user', 'bot'], 
    required: true 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  metadata: {
    relatedProductIds: [String],
    relatedOrderIds: [String],
    intent: String,
    sentiment: String
  }
});

const chatSessionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  startedAt: { 
    type: Date, 
    default: Date.now 
  },
  endedAt: { 
    type: Date 
  },
  active: { 
    type: Boolean, 
    default: true 
  },
  summary: { 
    type: String 
  },
  feedback: {
    rating: { 
      type: Number, 
      min: 1, 
      max: 5 
    },
    comment: { 
      type: String 
    }
  },
  messages: [chatMessageSchema]
});

// Update the updatedAt field before save
chatSessionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Chat = mongoose.model('Chat', chatSessionSchema);

module.exports = Chat;
