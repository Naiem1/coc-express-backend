import { Schema, model } from 'mongoose';

const likeSchema = new Schema(
  {
    comment: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
    },
    twitter: {
      type: Schema.Types.ObjectId,
      ref: 'Twitter',
    },
    likedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
  },
  { timestamps: true }
);

export const Like = model('Like', likeSchema);
