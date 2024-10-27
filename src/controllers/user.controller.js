// This file contains the code for user controller.
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadOnCloundinary } from '../utils/cloudnary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// Register a new user to the database
const registerUser = asyncHandler(async (req, res) => {
  // step 1: extract the required fields from the request body
  // step 2: validate the request body - not empty fields
  // step 3: find existing user by email and username
  // step 4: check for image, check for avatar - multer
  // step 5: upload them to cloudinary, avatar
  // step 6: create a new user object
  // step 7: save the user to the database
  // step 8: remove password and refreash token field from response
  // step 9: check for use creation success and return appropriate response
  // step 10: return response with user data and token

  // step 1: extract the required fields from the request body
  const { fullName, email, username, password } = req.body;

  // step 2: validation check
  if (
    [fullName, email, username, password].some((field) => field?.trim() === '')
  ) {
    throw new ApiError(400, 'All fields are required');
  }

  // step 3: find existing user by email and username
  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new ApiError(409, 'User with this email or username already exists');
  }

  // step 4: check for image, check for avatar - multer Local Storage
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, 'Avatar file is required');
  }

  // step 5: upload them to cloudinary, avatar
  const avatar = await uploadOnCloundinary(avatarLocalPath);
  const coverImage = await uploadOnCloundinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(500, 'Failed to upload avatar to cloudinary');
  }

  // step 6: create a new user object
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || '',
    email,
    password,
    username: username.toLowerCase(),
  });

  // step 7: remove password and refreash token field from response
  const createdUser = await User.findById(user._id).select(
    '-password -refreshToken'
  );

  if (!createdUser) {
    throw new ApiError(
      500,
      'Failed to create user, someting went wrong while registering the user'
    );
  }

  // Return the response
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, 'User registered Successfully'));
});

export { registerUser };
