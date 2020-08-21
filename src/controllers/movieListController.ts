import { Request, Response } from 'express';
import MovieList, { IMovieList } from '../models/MovieList';
import { validationResult } from 'express-validator';
import User from '../models/User';

const get_list = async (req: Request, res: Response): Promise<void> => {
    const list = await MovieList.findOne({ _id: req.params.movieListID }).populate('movies');
    if (!list) {
        res.status(400).json({ message: 'Something went wrong' });
        return;
    }
    res.status(200).json(list);
};

const get_lists_by_friends = async (req: Request, res: Response): Promise<void> => {
    const user = await User.findOne({ _id: req.params.userID });
    const lists = await MovieList.find({ user: { $in: user?.following } })
        .limit(Number(req.query.amount))
        .sort({ _id: '-1' })
        .populate('movies', 'title poster')
        .populate('user', 'username profile_picture');
    res.status(200).json(lists);
};

const delete_list = async (req: Request, res: Response): Promise<void> => {
    const deletedList = await MovieList.findOneAndDelete({ _id: req.params.movieListID });
    if (deletedList)
        res.status(200).json({ message: `The list '${deletedList?.title}' has been deleted` });
};

const edit_list = async (req: Request, res: Response): Promise<void> => {
    const user = await User.findOne({ _id: req.query.username });
    const list = await MovieList.findOneAndUpdate(
        { _id: req.params.movieListID },
        { movies: req.body.list },
        { new: true },
    );
    if (!list || !user) {
        res.status(400).json({ message: 'Something went wrong' });
        return;
    }

    res.status(200).json({ message: `The list '${list.title}' has been updated` });
};

const create_list = async (req: Request, res: Response): Promise<void> => {
    const { title, description, movies } = req.body as IMovieList;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const newMovieList: IMovieList = new MovieList({
        title,
        description,
        movies,
        user: req.params.userID,
    });

    const savedList = await newMovieList.save();
    await User.findOneAndUpdate({ _id: req.params.userID }, { $push: { lists: savedList } });
    res.status(200).json({ savedList, message: `You've created the list '${savedList.title}'` });
};

export default {
    create_list,
    edit_list,
    get_list,
    delete_list,
    get_lists_by_friends,
};
