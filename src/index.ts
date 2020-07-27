import dotenv from 'dotenv';
dotenv.config();
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import helmet from 'helmet';

import express, { Request, Response, NextFunction } from 'express';
import { BAD_REQUEST } from 'http-status-codes';
import 'express-async-errors';

// PASSPORT
import passport from 'passport';
import { ExtractJwt, Strategy as jwtStrategy } from 'passport-jwt';

import BaseRouter from './routes';
import userRouter from './routes/users';
import movieRouter from './routes/movies';
import reviewRouter from './routes/reviews';
import logger from './shared/Logger';
import User, { IUser } from './models/User';

// MONGOOSE
if (process.env.NODE_ENV !== 'test') {
    require('./mongoConfig');
}

// Init express
const app = express();

/************************************************************************************
 *                              MIDDLEWARE
 ***********************************************************************************/

passport.use(
    new jwtStrategy(
        {
            secretOrKey: 'sadadasdasdasadasddsadas',
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        },
        function (payload: IUser, done) {
            void User.findOne({ username: payload.username }, (err, user) => {
                if (err) return done(err);
                if (!user) {
                    return done(null, false);
                }
                return done(null, user);
            });
        },
    ),
);

app.use(express.json());
app.use(passport.initialize());
app.use(express.urlencoded({ extended: true }));
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
// Print API errors
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.message, err);
    return res.status(BAD_REQUEST).json({
        error: err.message,
    });
});

/************************************************************************************
 *                              Serve front-end content
 ***********************************************************************************/

const staticDir = path.join(__dirname, 'public');

// Start the server
const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
    logger.info(`Express server started on port: ${port}`);
});

app.use(express.static(staticDir));

// Export express instance
export default app;
