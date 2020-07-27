import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Movie, { IMovie } from '../models/Movie';
import { IReview } from 'src/models/Review';

const create_movie_instance = async (req: Request, res: Response): Promise<void> => {
    const { title, year, synopsis, ratings, poster, likes } = req.body as IMovie;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ message: 'Something is wrong...' });
        return;
    }

    const newMovie: IMovie = new Movie({
        title,
        year,
        synopsis,
        poster,
        ratings,
        likes,
    });

    await newMovie.save();
    res.status(200).json({ message: `You have reviewed ${title} (${year})` });
};

const update_movie_instance_ratings = async (req: Request, res: Response): Promise<void> => {
    const { rating } = req.body as IReview;
    const updatedMovie = await Movie.findByIdAndUpdate(
        req.params.id,
        { $push: { ratings: rating } },
        { new: true },
    );

    res.status(200).json(updatedMovie);
};

const update_movie_instance_likes = async (req: Request, res: Response): Promise<void> => {
    const updatedMovie = await Movie.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } });
    res.status(200).json(updatedMovie);
};

export default {
    create_movie_instance,
    update_movie_instance_ratings,
    update_movie_instance_likes,
};
