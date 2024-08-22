import mongoose from 'mongoose';

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
void mongoose.connect(process.env.MONGODB_URI as string);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'mongo connection error'));
