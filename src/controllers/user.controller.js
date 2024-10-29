// This file contains the code for user controller.
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import { ApiError } from '../utils/ApiError.js';
import { uploadOnCloundinary } from '../utils/cloudnary.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

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

// Change the current user password
const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body; // also we can add confirm password field

  // const { oldPassword, newPassword, confirmPassword } = req.body;
  // if (newPassword !== confirmPassword) {
  //   throw new ApiError(400, 'Passwords do not match');
  // }

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, 'All fields are required');
  }

  const user = await User.findOneId(req.user?._id);

  // password match check
  const isPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordValid) {
    throw new ApiError(400, 'Invalid password');
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Password changed successfully'));
});

// Get the current user data
const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, 'User fetched successfully'));
});

// Update the current user data
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  const user = await User.findByIdAndUpdate(
    // More optimize way to update, prevent unnecessary query
    req.user._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select('-password');

  /**
   * we can also make another query after update to get the updated user data
   * then take Id and fetch anoter query using Id and remove password field
   * after then return the response
   */

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'User updated successfully'));
});

// Update file field for the current user
const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path; // we can also directly save on database without uploading to cloudinary

  if (!avatarLocalPath) {
    throw new ApiError(400, 'Avatar file is missing');
  }

  // TODO: Delete local saved file after upload to cloudinary - make uility function for this
  const avatar = await uploadOnCloundinary(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(400, 'Error while uploading on avatar');
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select('-password');

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'Avatar updated successfully'));
});

// Update cover image for the current user
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path; // we can also directly save on database without uploading to cloudinary

  if (!coverImageLocalPath) {
    throw new ApiError(400, 'Cover Image file is missing');
  }

  const coverImage = await uploadOnCloundinary(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(400, 'Error while uploading on cover Image');
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select('-password');

  return res
    .status(200)
    .json(new ApiResponse(200, user, 'Cover Image updated successfully'));
});

/**
 * file update should sperate controller and route
 * only file update
 */

// Get user channel profile
const getUserChannelProfile = asyncHandler(async (req, res) => {
  // step 1: extract username frmo query params
  const { username } = req.params;

  // step 2: validate the username - not empty
  if (!username?.trim()) {
    throw new ApiError(400, 'Username is required');
  }

  // step 3: find user by username
  // const user = await User.find({ user });

  // Aggregation pipeline
  const channel = await User([
    // Pipeline stage 1 - match/filtering stage to find user by username
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    // Pipeline stage 2 - lookup stage to get user channel subscribers - my channel which people subscribed to me
    {
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'channel',
        as: 'subscribers',
      },
    },
    // Pipeline stage 3 - lookup stage to get user subscriptions channel - channel which I subscribed - peoples channel
    {
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'subscriber',
        as: 'subscribedTo',
        // as: 'subscriptions',
      },
    },
    // Pipeline stage 4 - add fields stage to add user channel subscribers count
    {
      $addFields: {
        subscribersCount: {
          $size: '$subscribers',
        },
        channelsSubscribedToCount: {
          $size: '$subscribedTo',
        },
        // channel that I subscribed or not, if I subscribed then true else false
        isSubscribed: {
          $condition: {
            if: { $in: [req.user?._id, '$subscribers.subscriber'] },
            then: true,
            else: false,
          },
        },
      },
    },
    // Pipeline stage 5 - project stage to select required fields
    {
      $project: {
        fullName: 1,
        username: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        createdAt: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, 'Channel does not exist');
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], 'User channel fetched successfully')
    );
});

// Get User watch history
// How to write sub pipelines and routes
// watch history - nested lookup
const getWatchHistory = asyncHandler(async (req, res) => {
  // Multilayer aggregation pipeline to get user watch history
  const user = await User.aggregate([
    // pipeline stage 1 - match stage to find user by id
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
      // pipeline stage 2 - lookup stage to get user watch history - videos watched by user
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'watchHistory',
        foreignField: '_id',
        as: 'watchHistory',
        // nested pipeline to get video details - lookup
        pipeline: [
          {
            $lookup: {
              from: 'users',
              localField: 'owner',
              foreignField: '_id',
              as: 'owner',
              // nested pipeline to get user details - project
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
        ],
      },
      // pipeline stage 3 - add fields stage to add video duration and owner details
      pipeline: [
        {
          $addFields: {
            owner: {
              $first: '$owner',
            },
          },
        },
      ],
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        'Watch history fetched successfully'
      )
    );
});

// Mongodb operators learn (set, count, so on...)
// JS reduce, aggration - Learn

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
};

// Arrgration Pipeline - Learn

/**
 * Get user channel profile
 * subscribe and channel make indivudial document for each user
 */

/**
 * Join
 */
