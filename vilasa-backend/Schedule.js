const cron = require('node-cron');
const Chat = require('./model/ChatModel');
const { cleanupTempFiles } = require('./cleanup-temp-files');
// Schedule a task to run every day to delete chat messages marked for deletion
cron.schedule('0 0 * * *', async () => {
  try {
    const currentDate = new Date();
    const messagesToDelete = await Chat.find({ markedForDeletion: true, deletionDate: { $lte: currentDate } });
    await Chat.deleteMany({ _id: { $in: messagesToDelete.map(message => message._id) } });
    console.log('Deleted expired chat messages:', messagesToDelete.length);
  } catch (error) {
    console.error('Error deleting chat messages:', error);
  }
});

cron.schedule('*/3 * * * *', async () => {
  try {
    console.log('Running cleanup task...');
    await cleanupTempFiles(); // Assuming cleanupTempFiles is an async function
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
  }
});