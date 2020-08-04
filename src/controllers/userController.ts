import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import User, { IUser } from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import isValidInput from './validationResult';
import Movie from 'src/models/Movie';

const get_one_user = async (req: Request, res: Response): Promise<void> => {
    const user = await User.findOne({ _id: req.params.id })
        .populate('watched_movies followers following watch_list liked_movies', '-password')
        .populate({
            path: 'reviews',
            populate: { path: 'movie', model: 'Movie', select: '-reviews' },
        });
    if (!user) {
        res.status(400).json({ message: 'User not found' });
    }
    res.status(200).json(user);
};

// ******************************* ADD/REMOVE FROM DIARY ******************** //
const add_movie_to_diary = async (req: Request, res: Response): Promise<void> => {
    await User.findOneAndUpdate(
        { _id: req.params.userID },
        { $addToSet: { watched_movies: req.params.movieID } },
    );

    res.status(200).json({ message: 'Added movie to diary' });
};

const remove_movie_from_diary = async (req: Request, res: Response): Promise<void> => {
    const movie = await Movie.findOne({ _id: req.params.movieID });
    if (!movie) {
        res.status(400).json({ message: 'Something went wrong' });
        return;
    }
    await User.findOneAndUpdate(
        { _id: req.params.userID },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        { $pull: { watched_movies: movie._id } },
    );

    res.status(200).json({ message: `Added ${movie.title} (${movie.year}) to diary` });
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

    res.status(200).json({ message: `Added ${movie.title} (${movie.year}) to watch list` });
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
    res.status(200).json({ message: `Removed ${movie.title} (${movie.year}) from watch list` });
};

// *************************** EDIT BIO ************************** ****///////

const edit_bio = async (req: Request, res: Response): Promise<void> => {
    const { bio } = req.body as IUser;

    if (!isValidInput(req)) {
        res.status(400).json({ message: 'Wrong input' });
        return;
    }

    await User.findOneAndUpdate({ _id: req.params.id }, { bio });
    res.status(200).json({ message: 'Your bio has been updated' });
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

    await User.findOneAndUpdate(
        { _id: follower._id },
        { $pull: { following: { _id: req.params.followedUserID } } },
    );
    await User.findOneAndUpdate(
        { _id: followedUser._id },
        { $pull: { followers: { _id: req.params.followerID } } },
    );

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
        const success = await bcrypt.compare(password, user?.password);
        if (success) {
            const token = jwt.sign(user.toJSON(), 'sadadasdasdasadasddsadas'); // THIS SECRET HAS TO BE CHANGED, WAS PUSHED TO GITHUB
            res.status(200).json({ username: user.username, token, id: user._id as string });
            return;
        }
    }
    res.status(400).json({ message: 'Wrong credentials' });
    return;
};

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

    await newUser.save();
    res.status(200).json({ message: 'Account created' });
};

export default {
    user_sign_up,
    get_all_users,
    user_log_in,
    edit_bio,
    remove_follower,
    add_follower,
    remove_movie_from_watch_list,
    add_movie_to_watch_list,
    remove_movie_from_diary,
    add_movie_to_diary,
    get_one_user,
};
