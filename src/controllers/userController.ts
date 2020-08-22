import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import User, { IUser } from '../models/User';
import bcrypt from 'bcryptjs';
import jwt, { Secret } from 'jsonwebtoken';
import isValidInput from './validationResult';
import Movie from '../models/Movie';
import { v2 as cloudinary } from 'cloudinary';
import MovieList, { IMovieList } from '../models/MovieList';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    api_key: process.env.CLOUDINARY_API_KEY,
});

const get_one_user = async (req: Request, res: Response): Promise<void> => {
    const user = await User.findOne({ _id: req.params.id })
        .populate('watched_movies followers following watch_list liked_movies', '-password')
        .populate({ path: 'favorites', options: { retainNullValues: true } })
        .populate({
            path: 'reviews',
            populate: { path: 'movie', model: 'Movie', select: '-reviews' },
        })
        .populate({
            path: 'lists',
            populate: { path: 'movies', model: 'Movie', select: '-reviews' },
        });
    if (!user) {
        res.status(400).json({ message: 'User not found' });
    }
    res.status(200).json(user);
};

// ******************************* ADD/REMOVE FROM DIARY ******************** //
const add_movie_to_diary = async (req: Request, res: Response): Promise<void> => {
    const movie = await Movie.findOneAndUpdate(
        { _id: req.params.movieID },
        { $inc: { watches: 1 } },
        { new: true },
    );
    await User.findOneAndUpdate(
        { _id: req.params.userID },
        { $addToSet: { watched_movies: req.params.movieID } },
    );
    if (movie) {
        res.status(200).json({ message: `Added ${movie.title} (${movie.year}) to your diary` });
        return;
    }
};

const remove_movie_from_diary = async (req: Request, res: Response): Promise<void> => {
    const movie = await Movie.findOneAndUpdate(
        { _id: req.params.movieID },
        { $inc: { watches: -1 } },
        { new: true },
    );
    if (!movie) {
        res.status(400).json({ message: 'Something went wrong' });
        return;
    }
    await User.findOneAndUpdate(
        { _id: req.params.userID },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        { $pull: { watched_movies: movie._id } },
    );

    res.status(200).json({ message: `Removed ${movie.title} (${movie.year}) from your diary` });
};

// ****************************** ADD/REMOVE FROM WATCH LIST **************************///

const add_movie_to_watch_list = async (req: Request, res: Response): Promise<void> => {
    const movie = await Movie.findOne({ _id: req.params.movieID });
    if (!movie) {
        res.status(400).json({ message: 'Something went wrong' });
        return;
    }
    await User.findOneAndUpdate(
        { _id: req.params.userID },
        { $addToSet: { watch_list: req.params.movieID } },
    );

    res.status(200).json({ message: `Added ${movie.title} (${movie.year}) to your watchlist` });
};

const remove_movie_from_watch_list = async (req: Request, res: Response): Promise<void> => {
    const movie = await Movie.findOne({ _id: req.params.movieID });
    if (!movie) {
        res.status(400).json({ message: 'Something went wrong' });
        return;
    }
    await User.findOneAndUpdate(
        { _id: req.params.userID },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        { $pull: { watch_list: movie._id } },
    );
    res.status(200).json({ message: `Removed ${movie.title} (${movie.year}) from you watchlist` });
};

// *************************** EDIT BIO ************************** ****///////

const edit_profile = async (req: Request, res: Response): Promise<void> => {
    const { bio, username, favorites, profile_picture } = req.body as IUser;
    if (!isValidInput(req)) {
        res.status(400).json({ message: 'Your username must be at least 1 character long' });
        return;
    }

    const user = await User.findOne({ username });
    if (user?.username !== username) {
        if (user || username === 'settings') {
            res.status(400).json({ message: 'That username is already taken' });
            return;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    void cloudinary.uploader.upload(profile_picture as string, {}, async (error, file) => {
        const update: Pick<IUser, 'bio' | 'username' | 'favorites' | 'profile_picture'> = {
            bio: bio || '',
            username,
            favorites,
            profile_picture: (file?.url as unknown) as string,
        };

        const updatedUser = await User.findOneAndUpdate({ _id: req.params.id }, update, {
            new: true,
        }).populate('favorites');
        res.status(200).json({ updatedUser, message: 'Your profile has been updated' });
    });
};

// *************************** FOLLOWERS/FOLLOWING ***************************//

const add_follower = async (req: Request, res: Response): Promise<void> => {
    const follower = await User.findOne({ _id: req.params.followerID });
    const followedUser = await User.findOne({ _id: req.params.followedUserID });
    if (!follower || !followedUser) {
        res.status(400).json({ message: 'Something went wrong' });
        return;
    }

    await User.findOneAndUpdate(
        { _id: follower._id },
        { $addToSet: { following: req.params.followedUserID } },
    );
    await User.findOneAndUpdate(
        { _id: followedUser._id },
        { $addToSet: { followers: req.params.followerID } },
    );

    res.status(200).json({ message: `You're now following ${followedUser.username}` });
};

const remove_follower = async (req: Request, res: Response): Promise<void> => {
    const follower = await User.findOne({ _id: req.params.followerID });
    const followedUser = await User.findOne({ _id: req.params.followedUserID });
    if (!follower || !followedUser) {
        res.status(400).json({ message: 'Something went wrong' });
        return;
    }

    await User.findOneAndUpdate({ _id: follower._id }, { $pull: { following: followedUser._id } });
    await User.findOneAndUpdate({ _id: followedUser._id }, { $pull: { followers: follower._id } });

    res.status(200).json({ message: `You have unfollowed ${followedUser.username}` });
};

const get_all_users = async (req: Request, res: Response): Promise<void> => {
    const users = await User.find({});
    res.status(200).json(users);
};

// ******************************** AUTH STUFF ******************************///

const user_log_in = async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body as IUser;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const user = await User.findOne({ username }).select('+password');
    if (user) {
        const success = await bcrypt.compare(password, user.password);
        if (success) {
            const token = jwt.sign(user.toJSON(), process.env.JWT_SECRET as Secret);
            res.status(200).json({ username: user.username, token, id: user._id as string });
            return;
        }
    }
    res.status(400).json({ message: 'Wrong credentials' });
    return;
};

const Movies2019 = [
    '1917',
    'Parasite',
    'The Lighthouse',
    'Midsommar',
    'Ad Astra',
    'Portrait of a Lady on Fire',
    'Marriage Story',
    'Uncut Gems',
];

const user_sign_up = async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body as IUser;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
        username,
        password: hashedPassword,
    });

    const savedUser = await newUser.save();
    const julio = await User.findOneAndUpdate(
        { username: 'julio' },
        { $addToSet: { followers: savedUser._id, following: savedUser._id } },
        { new: true },
    );
    if (julio) {
        await User.findOneAndUpdate(
            { _id: savedUser._id },
            { $addToSet: { followers: julio._id, following: julio?._id } },
        );
    }

    const movies = await Movie.find({
        title: {
            $in: Movies2019,
        },
        year: '2019',
    });
    const newMovieList: IMovieList = new MovieList({
        title: `2019's Best Films`,
        description: 'This list was automatically created for showcasing purposes.',
        movies,
        user: savedUser._id,
    });
    const savedList = await newMovieList.save();
    await User.findOneAndUpdate({ username }, { $push: { lists: savedList } });
    res.status(200).json({ message: 'Account created' });
};

export default {
    user_sign_up,
    get_all_users,
    user_log_in,
    edit_profile,
    remove_follower,
    add_follower,
    remove_movie_from_watch_list,
    add_movie_to_watch_list,
    remove_movie_from_diary,
    add_movie_to_diary,
    get_one_user,
};
