import dotenv from 'dotenv';
import connectDB from './db/index.js';

dotenv.config({
  path: './env',
});


connectDB();





/* import mongoose from 'mongoose';
import { DB_NAME } from './constant';

// Express app
import express from 'express';
const app = express();
*/

/**
 * Two way we can connect db to our app
 * 1. using mongoose.connect() method directly in our index.js file
 * 2. using mongoose.connect() method in our db.js file and importing it in our index.js file **(recommended)**
 */

/**
// ** 1 - USING MONGOOSE.CONNECT() METHOD DIRECTLY IN OUR INDEX.JS FILE
// Option 1
function connectDB() {}

connectDB();

// Option 2 - USING IIFFE FUNCTION
(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on('error', (error) => {
      console.log('ERROR: Could not connect to database', error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error('ERROR: Could not connect to database', error);
    throw error;
  }
})();
 */
