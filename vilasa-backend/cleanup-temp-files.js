const fs = require('fs');
const path = require('path');

const tempDir = '/tmp/'; // Temporary file directory
const cleanupThreshold = 2 * 60 * 1000; // 2 minutes in milliseconds

const cleanupTempFiles = () => {
  fs.readdir(tempDir, (err, files) => {
    if (err) {
      console.error('Error reading temporary directory:', err);
      return;
    }

    if (files.length === 0) {
      console.log('Temporary directory is empty.');
      return;
    }

    const now = Date.now();

    files.forEach(file => {
      const filePath = path.join(tempDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) {
          console.error('Error checking file stats:', err);
          return;
        }

        if (now - stats.mtime.getTime() > cleanupThreshold) {
          fs.unlink(filePath, err => {
            if (err) {
              console.error('Error deleting file:', err);
            } else {
              console.log('Deleted:', file);
            }
          });
        }
      });
    });
  });
};

module.exports = { cleanupTempFiles };
