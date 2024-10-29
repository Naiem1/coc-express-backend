import { Schema, model } from 'mongoose';

const playlistSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    videos: [
      {
        type: Schema.Types.ObjectId,
        ref: 'video',
        required: true,
      },
    ],
  },
  { timestamps: true }
);

export const Playlist = model('Playlist', playlistSchema);
