// This file contains the code for user controller.
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadOnCloundinary } from '../utils/cloudnary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';

// Generate access and refresh token for the user
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // save refresh token to the database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      'Someting went wrong while generating access and refresh token'
    );
  }
};

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

  console.log('req-files', req.files);

  // step 4: check for image, check for avatar - multer Local Storage
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  /*   
  let coverImageLocalpath;
  if (
    req.fiels &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  } 
*/

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

// Login a user to the system
const loginUser = asyncHandler(async (req, res) => {
  // step 1: extract the required fields from the request body
  // step 2: validate the request body - not empty fields - email or username
  // step 3: find existing user by email and username
  // step 4: check for password match
  // step 5: generate refresh token & access token
  // step 6: save the refresh token to the database
  // step 7: send coockie with refresh token
  // step 8: return response with user data and token

  // step 1: extract the required fields from the request body
  const { email, username, password } = req.body;

  // step 2: validation check
  if (!username && !email) {
    throw new ApiError(400, 'username or email is required');
  }

  // Here is an alternative of above code based on logic discussed in video:
  // if (!(username || email)) {
  //     throw new ApiError(400, "username or email is required")

  // }

  // step 3: find existing user by email or username
  //   const user = await User.findOne({
  //     $or: [{username}, {email}]
  // })
  const user = await User.findOne({
    $or: [{ email }, { username: username?.toLowerCase() }],
  });

  // if not user found
  if (!user) {
    throw new ApiError(404, 'User does not exist');
  }

  // step 4: check for password match
  const isPasswordValid = await user.isPasswordCorrect(password);

  // if password is not valid
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid user credentials');
  }

  // step 5: generate refresh token & access token
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  // remove password and refreash token field from response
  const loggedInUser = await User.findById(user._id).select(
    '-password -refreshToken'
  );

  // Send coockie with refresh token
  /**
   * Set the coockie options for secure and httpOnly
   * when set it 'true' then the coockie only modify by the server
   */
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        'User logged in successfully'
      )
    );
});

// Logout a user from the system
const logoutUser = asyncHandler(async (req, res) => {
  // step 1: extract the refresh token from the request coockie
  // step 2: find the user by refresh token
  // step 3: remove the refresh token from the user
  // step 4: return response with success message

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(new ApiResponse(200, {}, 'User logged out successfully'));
});

// Referesh the access token for the user
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incommingRefreshToken = req.cookies?.refreshToken;
  if (!incommingRefreshToken) {
    throw new ApiError(401, 'Unauthorized request');
  }

  try {
    const decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken._id);
    if (!user) {
      throw new ApiError(401, 'Invalid Refresh token');
    }

    if (incommingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, 'Refresh token is expired or used');
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie('accessToken', accessToken, options)
      .cookie('refreshToken', newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          'Access token refreshed successfully'
        )
      );
  } catch (error) {
    throw new ApiError(401, error.message || 'Invalid Refresh token');
  }
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
