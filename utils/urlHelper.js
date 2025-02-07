// utils/urlHelper.js

// For regular file uploads (images, etc)
const getFileUrl = (filename) => {
  const baseUrl = process.env.BASE_URL || "http://localhost:5000";
  const cleanFilename = filename.replace(/^uploads[\/\\]/, "");
  return `${baseUrl}/uploads/${cleanFilename}`;
};

// Specifically for tenant logos
const getLogoUrl = (filename) => {
  const baseUrl = process.env.BASE_URL || "http://localhost:5000";
  const cleanFilename = filename.replace(/^Logos[\/\\]/, "");
  return `${baseUrl}/Logos/${cleanFilename}`;
};

module.exports = { getFileUrl, getLogoUrl };
