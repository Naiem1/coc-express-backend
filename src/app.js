// import express from 'express';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

// Express app instance
const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
); // use top-level middleware to enable CORS
app.use(express.json({ limit: '16kb' })); // use body-parser middleware to parse JSON
app.use(express.urlencoded({ extended: true, limit: '16kb' })); // use body-parser middleware to parse URL-encoded data
app.use(express.static('public')); // use express.static middleware to serve static files
app.use(cookieParser()); // use cookie-parser middleware to parse cookies


// export the app object
export { app };
