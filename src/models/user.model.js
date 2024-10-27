import { Schema, model } from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true, // for faster search
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full Name is required'],
      trim: true,
      index: true, // for faster search
    },
    avatar: {
      type: String, // clouodinary image url
      required: [true, 'Avatar is required'],
    },
    coverImage: {
      type: String, // clouodinary image url,
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Video',
      },
    ],
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    refreashToken: {
      type: String,
    },
  },
  { timestamps: true }
);

// mongoose hook to hash password before saving to database
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// custom method to verify password
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// custom method to generate JWT token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

// custom method to generate refresh token
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

// custom method to verify JWT token
userSchema.methods.verifyAccessToken = function (token) {};

// custom method to verify refresh token
userSchema.methods.verifyRefreshToken = function (token) {};

export const User = model('User', userSchema);
