/**
 * we can also create it as service
 * Now we create as a utility function
 * we also can name it "uploadFile"
 */

/** Upload fild using multer to cloudinary - for reupdate we need complete this 2 process
 * step 1: upload throw using multer ans temporarily store  the file in the local server
 * step 2: using cloudnary we take fild from local server and upload it to cloudinary
 */

import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloundinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // update the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: 'auto',
    });
    // File has been uploaded to cloudinary successfully
    console.log('file isuploaded on cloudinary: ', response.url);
    return response;
  } catch (error) {
    console.log('error while uploading file on cloudinary: ', error);
    fs.unlinkSync(localFilePath); // remote the locally saved temporay file as the upload operation got failed
    return null;
  }
};

export { uploadOnCloundinary };
