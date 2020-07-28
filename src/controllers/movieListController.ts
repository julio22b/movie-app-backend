import { Request, Response } from 'express';
import MovieList, { IMovieList } from '../models/MovieList';
import { validationResult } from 'express-validator';
import Movie from '../models/Movie';
import User from '../models/User';

const get_movies_from_list = async (req: Request, res: Response): Promise<void> => {
    const list = await MovieList.findOne({ _id: req.params.movieListID }).populate('movies');
    if (!list) {
        res.status(400).json({ message: 'Something went wrong' });
        return;
    }
    res.status(200).json(list);
};

const delete_list = async (req: Request, res: Response): Promise<void> => {
    await MovieList.findOneAndDelete({ _id: req.params.movieListID });
    res.status(200).json({ message: 'List has been deleted' });
};

const remove_movie_from_list = async (req: Request, res: Response): Promise<void> => {
    const movie = await Movie.findOne({ _id: req.params.movieID });
    const list = await MovieList.findOne({ _id: req.params.movieListID });
    if (!movie || !list) {
        res.status(400).json({ message: 'Something went wrong' });
        return;
    }

    await MovieList.findOneAndUpdate(
        { _id: req.params.movieListID },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        { $pull: { movies: movie._id } },
    );
    res.status(200).json({ message: `${movie.title} was removed from ${list.title}` });
};

const add_movie_to_list = async (req: Request, res: Response): Promise<void> => {
    const movie = await Movie.findOne({ _id: req.params.movieID });
    const list = await MovieList.findOne({ _id: req.params.movieListID });
    if (!movie || !list) {
        res.status(400).json({ message: 'Something went wrong' });
        return;
    }

    await MovieList.findOneAndUpdate(
        { _id: req.params.movieListID },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        { $push: { movies: movie._id } },
    );
    res.status(200).json({ message: `Added ${movie.title} to ${list.title}` });
};

const create_list = async (req: Request, res: Response): Promise<void> => {
    const { title, description } = req.body as IMovieList;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const newMovieList: IMovieList = new MovieList({
        title,
        description,
        user: req.params.userID,
    });

    const savedList = await newMovieList.save();
    await User.findOneAndUpdate({ _id: req.params.userID }, { $push: { lists: savedList } });
    res.status(200).json({ savedList, message: `The list '${savedList.title}' has been created` });
};

export default {
    create_list,
    add_movie_to_list,
    remove_movie_from_list,
    get_movies_from_list,
    delete_list,
};
