import { Request, Response } from 'express';
import Movie, { IMovie } from '../models/Movie';
import User from '../models/User';
import isValidInput from './validationResult';

const create_movie_instance = async (req: Request, res: Response): Promise<void> => {
    const { title, likes } = req.body as IMovie;
    if (!isValidInput(req)) {
        res.status(400).json({ message: 'Something is wrong...' });
        return;
    }
    const movieExists = await Movie.findOne({ title });
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

const update_movie_instance_likes = async (req: Request, res: Response): Promise<void> => {
    const { userID, movieID } = req.params;
    const user = await User.findOne({ _id: userID });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    if (user && user.liked_movies?.includes(movieID)) {
        const updatedMovie = await Movie.findByIdAndUpdate(
            movieID,
            { $inc: { likes: -1 } },
            { new: true },
        );
        await User.findOneAndUpdate({ _id: userID }, { $pull: { liked_movies: movieID } });
        res.status(200).json(updatedMovie);
        return;
    }
    const updatedMovie = await Movie.findByIdAndUpdate(
        movieID,
        { $inc: { likes: 1 } },
        { new: true },
    );
    await User.findOneAndUpdate({ _id: userID }, { $addToSet: { liked_movies: movieID } });
    res.status(200).json(updatedMovie);
};

const get_all_movie_instances = async (req: Request, res: Response): Promise<void> => {
    const movies = await Movie.find({});
    res.status(200).json(movies);
};

export default {
    create_movie_instance,
    update_movie_instance_likes,
    get_all_movie_instances,
};
