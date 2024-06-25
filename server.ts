import 'dotenv/config.js'
import express from 'express';
const app = express();
import mongoose from 'mongoose';
import cors from 'cors';

import itemsRouter from './routes/scrapeRoutes';

// connect to database
mongoose.connect(process.env.DATABASE_URL as string)
.then(() => 
  console.log('Connected to Database')
).catch((err) =>
  console.error('Error connecting to Database', err)
);

app.use(cors());

app.use(express.json());

app.use('/api', itemsRouter);

app.listen(
  process.env.PORT, 
  () => { console.log(`Server is running on port ${process.env.PORT}`);
});