import { Schema, model } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const twitterSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Twitter must have an owner'],
    },
  },
  { timestamps: true }
);

twitterSchema.plugin(mongooseAggregatePaginate);

export const Twitter = model('Twitter', twitterSchema);
