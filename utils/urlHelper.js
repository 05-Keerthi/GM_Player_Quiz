// utils/urlHelper.js
const getFileUrl = (filename) => {
  // Get BASE_URL from environment
  const baseUrl = process.env.BASE_URL || "http://localhost:5000";

  // Ensure filename is clean (no 'uploads/' prefix)
  const cleanFilename = filename.replace(/^uploads[\/\\]/, "");

  return `${baseUrl}/uploads/${cleanFilename}`;
};

module.exports = { getFileUrl };
