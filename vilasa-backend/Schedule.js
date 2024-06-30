const cron = require('node-cron');
const { cleanupTempFiles } = require('./cleanup-temp-files');

cron.schedule('*/3 * * * *', async () => {
  try {
    console.log('Running cleanup task...');
    await cleanupTempFiles(); // Assuming cleanupTempFiles is an async function
  } catch (error) {
    console.error('Error cleaning up temp files:', error);
  }
});