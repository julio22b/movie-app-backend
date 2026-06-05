import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import helmet from 'helmet';
import cors from 'cors';
import 'dotenv/config';

import express, { Request, Response, NextFunction } from 'express';
import { BAD_REQUEST } from 'http-status-codes';

// PASSPORT
import passport from 'passport';
import { ExtractJwt, Strategy as jwtStrategy } from 'passport-jwt';

// ROUTER IMPORTS
import BaseRouter from './routes';
import userRouter from './routes/users';
import movieRouter from './routes/movies';
import reviewRouter from './routes/reviews';
import movieListRouter from './routes/movieLists';

import logger from './shared/Logger';
import User from './models/User';
import './mongoConfig';

// MONGOOSE
// mongoConfig.ts handles the connection logic

// Init express
const app = express();

/************************************************************************************
 *                              MIDDLEWARE
 ***********************************************************************************/

passport.use(
    new jwtStrategy(
        {
            secretOrKey: process.env.JWT_SECRET as string,
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        },
        async function (payload: { _id: string }, done) {
            try {
                const user = await User.findOne({ _id: payload._id });
                if (!user) {
                    return done(null, false);
                }
                return done(null, user);
            } catch (err) {
                return done(err, false);
            }
        },
    ),
);

app.use(
    cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
    }),
);
app.use(express.json({ limit: '5mb' }));
app.use(passport.initialize());
app.use(express.urlencoded({ extended: false, limit: '5mb' }));
app.use(cookieParser());

// Show routes called in console during development
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Security
if (process.env.NODE_ENV === 'production') {
    app.use(helmet());
}

// Add APIs
app.use('/api', BaseRouter);
app.use('/api/users', userRouter);
app.use('/api/movies', movieRouter);
app.use('/api/reviews', reviewRouter);
app.use('/api/movie-lists', movieListRouter);
// Print API errors
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message, err);
    return res.status(BAD_REQUEST).json({
        error: err.message,
    });
});

// Start the server
const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
    logger.info(`Express server started on port: ${port}`);
});

// Export express instance
export default app;
