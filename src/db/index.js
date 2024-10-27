import mongoose from 'mongoose';
import { DB_NAME } from '../constant.js';

// TODO:  Nodejs process concept

const connectDB = async () => {
  try {
    // Mongoose connection return object
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );

    console.log(
      `MONGODB CONNECTION SUCCESS !! DB HOST>>>>: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log('MONGODB CONNECTION FAILED>>>>: ', error);
    process.exit(1);
  }
};

export default connectDB;
