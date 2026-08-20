const { v2: cloudinary } = require("cloudinary");

const UPLOAD_FOLDER = "chronos/scenarios";

// Pictures are optional. A project checkout with no Cloudinary account should
// still run, seed and play — only uploading is unavailable. Everything here
// asks this first rather than crashing on a missing key at startup.
const isConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
};

let configured = false;

const configure = () => {
  if (configured) {
    return;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  configured = true;
};

// Cloudinary's upload_stream takes a callback, not a promise, so it is wrapped
// once here and every caller gets to use await.
const uploadImage = (buffer, { folder = UPLOAD_FOLDER, publicId } = {}) => {
  configure();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        overwrite: true,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result.secure_url);
      },
    );

    stream.end(buffer);
  });
};

module.exports = {
  UPLOAD_FOLDER,
  isConfigured,
  uploadImage,
};
