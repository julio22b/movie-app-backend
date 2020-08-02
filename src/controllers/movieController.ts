import { Request, Response } from 'express';
import Movie, { IMovie } from '../models/Movie';
import isValidInput from './validationResult';

const create_movie_instance = async (req: Request, res: Response): Promise<void> => {
    const {
        title,
        year,
        synopsis,
        poster,
        director,
        likes,
        actors,
        country,
        genres,
        language,
        run_time,
    } = req.body as IMovie;
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
        title,
        year,
        synopsis,
        poster,
        likes: likes || 0,
        director,
        actors,
        country,
        genres,
        run_time,
        language,
    });

    const savedMovie = await newMovie.save();
    res.status(200).json(savedMovie);
};

const update_movie_instance_likes = async (req: Request, res: Response): Promise<void> => {
    const updatedMovie = await Movie.findByIdAndUpdate(
        req.params.id,
        { $inc: { likes: 1 } },
        { new: true },
    );
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
