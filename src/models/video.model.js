import { Schema, model } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const videoSchema = new Schema(
  {
    videoFile: {
      type: String, // cloudinary video file url
      required: [true, 'Video file is required'],
    },
    thumbnail: {
      type: String, // cloudinary thumbnail url
      required: [true, 'Thumbnail is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    duration: {
      type: Number, // from cloudinary video file
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
    },
  },
  { timestamps: true }
);

// Aggration Pipeline
videoSchema.plugin(mongooseAggregatePaginate)

export const Video = model('Video', videoSchema);
