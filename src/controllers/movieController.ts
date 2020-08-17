import { Request, Response } from 'express';
import Movie, { IMovie } from '../models/Movie';
import User from '../models/User';
import isValidInput from './validationResult';

const create_movie_instance = async (req: Request, res: Response): Promise<void> => {
    const { title, likes, year } = req.body as IMovie;
    if (!isValidInput(req)) {
        res.status(400).json({ message: 'Something is wrong...' });
        return;
    }
    const movieExists = await Movie.findOne({ title, year }).populate({
        path: 'reviews',
        populate: { path: 'user', model: 'User', select: 'profile_picture username' },
    });
    if (movieExists) {
        res.status(200).json(movieExists);
        return;
    }

    const newMovie: IMovie = new Movie({
        ...req.body,
        likes: likes || 0,
    });

    const savedMovie = await newMovie.save();
    res.status(200).json(savedMovie);
};

const unlike_movie = async (req: Request, res: Response): Promise<void> => {
    const movie = await Movie.findOneAndUpdate(
        { _id: req.params.movieID },
        { $inc: { likes: -1 } },
        { new: true },
    );
    if (!movie) {
        res.status(400).json({ message: 'Something went wrong' });
        return;
    }
    await User.findOneAndUpdate({ _id: req.params.userID }, { $pull: { liked_movies: movie._id } });
    res.status(200).json({
        message: `You've removed ${movie.title} (${movie.year}) from your liked films`,
    });
    return;
};

const like_movie = async (req: Request, res: Response): Promise<void> => {
    const movie = await Movie.findOneAndUpdate(
        { _id: req.params.movieID },
        { $inc: { likes: 1 } },
        { new: true },
    );
    if (!movie) {
        res.status(400).json({ message: 'Something went wrong' });
        return;
    }
    await User.findOneAndUpdate({ _id: req.params.userID }, { $addToSet: { liked_movies: movie } });
    res.status(200).json({ message: `You've liked ${movie.title} (${movie.year})` });
};

const get_all_movie_instances = async (req: Request, res: Response): Promise<void> => {
    const movies = await Movie.find({});
    res.status(200).json(movies);
};

export default {
    create_movie_instance,
    like_movie,
    unlike_movie,
    get_all_movie_instances,
};
