import dotenv from 'dotenv';
import connectDB from './db/index.js';
import { app } from './app.js';


dotenv.config({
  path: './.env',
});


// Connect to MongoDB
connectDB()
  .then(() => {
    // Listen Error event
    app.on('error', (error) => {
      console.log('⚠ ERROR: Could not start server', error);
      throw error;
    });
    app.listen(process.env.PORT || 8000, () => {
      console.log(`⚙ Server running on port ${process.env.PORT || 8000}`);
    });
  })
  .catch((error) => {
    console.log('❌ Error connecting to MongoDB database !!! :', error);
  });

/*   async function startServer() {
    try {
      await connectDB();
      console.log('✅ Connected to MongoDB');
  
      app.on('error', (error) => {
        console.error('⚠ ERROR: Could not start server', error);
        process.exit(1); // Exit the process if there’s a critical error
      });
  
      const PORT = process.env.PORT || 8000;
      app.listen(PORT, () => {
        console.log(`⚙ Server running on port ${PORT}`);
      });
    } catch (error) {
      console.error('❌ Error connecting to MongoDB database:', error);
      process.exit(1); // Exit if the DB connection fails
    }
  }
  
  startServer(); */

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
