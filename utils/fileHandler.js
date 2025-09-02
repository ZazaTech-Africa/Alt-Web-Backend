const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cloudinary = require('../config/cloudinary');

/**
 * Decodes a base64 string and saves it to a file
 * @param {string} base64String - The base64 encoded string (with or without data URI scheme)
 * @param {string} fileType - The type of file (e.g., 'image/jpeg', 'application/pdf')
 * @returns {Promise<{filePath: string, fileType: string}>} - The path to the saved file and its type
 */
exports.decodeBase64AndSaveFile = async (base64String, fileType) => {
  // Remove data URI scheme if present (e.g., "data:image/jpeg;base64,")
  let base64Data = base64String;
  if (base64String.includes(';base64,')) {
    const parts = base64String.split(';base64,');
    fileType = parts[0].replace('data:', '');
    base64Data = parts[1];
  }

  // Decode base64 string
  const buffer = Buffer.from(base64Data, 'base64');

  // Create a unique filename
  const randomString = crypto.randomBytes(8).toString('hex');
  const fileExtension = fileType.split('/')[1] || 'unknown';
  const fileName = `${randomString}.${fileExtension}`;

  // Ensure the tmp directory exists
  const tmpDir = path.join(__dirname, '../tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  // Save the file
  const filePath = path.join(tmpDir, fileName);
  await fs.promises.writeFile(filePath, buffer);

  return { filePath, fileType };
};

/**
 * Uploads a file to Cloudinary
 * @param {string} filePath - Path to the file to upload
 * @param {string} fileType - The MIME type of the file
 * @param {string} folder - The folder in Cloudinary to upload to
 * @returns {Promise<string>} - The URL of the uploaded file
 */
exports.uploadToCloudinary = async (filePath, fileType, folder) => {
  try {
    // Determine resource type based on file type
    const resourceType = fileType.startsWith('image/') ? 'image' : 'auto';
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(filePath, {
      folder,
      resource_type: resourceType,
    });

    // Clean up the temporary file
    await fs.promises.unlink(filePath);

    return result.secure_url;
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    // Clean up the temporary file even if upload fails
    try {
      await fs.promises.unlink(filePath);
    } catch (unlinkError) {
      console.error('Error deleting temporary file:', unlinkError);
    }
    throw error;
  }
};

/**
 * Process a base64 image and upload it to Cloudinary
 * @param {string} base64String - The base64 encoded string
 * @param {string} folder - The folder in Cloudinary to upload to
 * @param {string} [fileType] - Optional file type if not included in base64 string
 * @returns {Promise<string>} - The URL of the uploaded file
 */
exports.processBase64AndUpload = async (base64String, folder, fileType = '') => {
  try {
    // Skip if no base64 string provided
    if (!base64String) return null;
    
    // Decode and save the file
    const { filePath, fileType: detectedType } = await this.decodeBase64AndSaveFile(base64String, fileType);
    
    // Upload to Cloudinary
    return await this.uploadToCloudinary(filePath, detectedType, folder);
  } catch (error) {
    console.error('Error processing base64 and uploading:', error);
    throw error;
  }
};