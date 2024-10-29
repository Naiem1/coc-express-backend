import { Schema, model } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const commentSchema = new Schema(
  {
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      minlength: [2, 'Content must be at least 2 characters long'],
      maxlength: [500, 'Content must be at most 500 characters long'],
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: 'Video',
      required: [true, 'Video is required'],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
    },
  },
  { timestamps: true }
);

commentSchema.plugin(mongooseAggregatePaginate);

export const Comment = model('Comment', commentSchema);
