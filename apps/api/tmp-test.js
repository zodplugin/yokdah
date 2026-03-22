const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://localhost:27017/gasin');
  
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const ChatMessage = mongoose.model('ChatMessage', new mongoose.Schema({
    chatRoomId: String,
    senderId: { type: String, ref: 'User' },
    content: String,
    createdAt: Date
  }, { strict: false }));

  const messages = await ChatMessage.find({ chatRoomId: '69bcd1f94c45161c8039e6ab' })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('senderId', 'displayName photo');

  console.log(JSON.stringify(messages, null, 2));
  mongoose.connection.close();
}

run().catch(console.error);
