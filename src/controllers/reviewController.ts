/* eslint-disable @typescript-eslint/no-non-null-assertion */
import Review, { IReview } from '../models/Review';
import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Movie from '../models/Movie';
import User from '../models/User';
import Comment, { IComment } from '../models/Comment';

const get_one_review = async (req: Request, res: Response): Promise<void> => {
    const review = await Review.findOne({ _id: req.params.id })
        .populate('movie', '-reviews')
        .populate('user', 'username profile_picture')
        .populate({
            path: 'comments',
            populate: { path: 'user', model: 'User', select: 'username profile_picture' },
        });
    if (review) {
        res.status(200).json(review);
        return;
    }
    res.status(404).end();
};

const get_reviews_by_friends = async (req: Request, res: Response): Promise<void> => {
    const user = await User.findOne({ _id: req.params.userID });
    const reviews = await Review.find({ user: { $in: user?.following } })
        .limit(Number(req.query.amount))
        .sort({ _id: '-1' })
        .populate('movie', 'title poster')
        .populate('user', 'username profile_picture');
    res.status(200).json(reviews);
};

const get_latest_reviews = async (req: Request, res: Response): Promise<void> => {
    const latestReviews = await Review.find({})
        .sort({ _id: -1 })
        .limit(Number(req.query.amount))
        .populate('user', 'username')
        .populate('movie');
    res.status(200).json(latestReviews);
};

const delete_review = async (req: Request, res: Response): Promise<void> => {
    await Review.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: `Your review has been deleted` });
};

const like_review = async (req: Request, res: Response): Promise<void> => {
    const likedReview = await Review.findByIdAndUpdate(
        req.params.reviewID,
        { $inc: { likes: 1 } },
        { new: true },
    );
    await User.findOneAndUpdate(
        { _id: req.params.userID },
        { $addToSet: { liked_reviews: likedReview?._id } },
    );
    res.status(200).json(likedReview);
};

const edit_review = async (req: Request, res: Response): Promise<void> => {
    const { content, rating } = req.body as IReview;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const updatedReview = await Review.findByIdAndUpdate(
        req.params.id,
        { content, rating },
        { new: true },
    );
    if (!updatedReview) {
        res.status(400).json({ message: 'Something went wrong...' });
        return;
    }
    res.status(200).json(updatedReview);
};

const post_comment = async (req: Request, res: Response): Promise<void> => {
    const { content } = req.body as IComment;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const newComment = new Comment({
        user: req.params.userID,
        review: req.params.reviewID,
        content,
    });
    const savedComment = await newComment.save();
    const comment = await savedComment
        .populate({ path: 'user', select: 'username profile_picture' })
        .execPopulate();

    const updatedReview = await Review.findOneAndUpdate(
        { _id: req.params.reviewID },
        { $push: { comments: savedComment._id } },
    ).populate('movie user');

    if (updatedReview) {
        res.status(200).json({
            message: `You've posted a comment on ${updatedReview.user.username}'s review of ${updatedReview.movie.title} (${updatedReview.movie.year})`,
            comment,
        });
    }
};

const post_review = async (req: Request, res: Response): Promise<void> => {
    const { content, rating, liked_movie, first_watch, watched_on } = req.body as IReview;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }

    const newReview: IReview = new Review({
        movie: req.params.movieID,
        user: req.params.userID,
        content,
        liked_movie,
        first_watch,
        watched_on,
        rating: Number(rating),
        likes: 0,
    });

    const reviewedMovie = await Movie.findOne({ _id: req.params.movieID });
    if (!reviewedMovie) {
        res.status(400).json({ message: 'Something went wrong' });
        return;
    }

    const savedReview = await newReview.save();
    await User.findOneAndUpdate(
        { _id: req.params.userID },
        { $push: { reviews: savedReview }, $addToSet: { watched_movies: reviewedMovie._id } },
    );
    if (liked_movie) {
        await User.findOneAndUpdate(
            { _id: req.params.userID },
            { $addToSet: { liked_movies: reviewedMovie._id } },
        );
    }
    await Movie.findOneAndUpdate(
        { _id: req.params.movieID },
        { $addToSet: { reviews: savedReview }, $inc: { likes: liked_movie ? 1 : 0 } },
    );
    res.status(200).json({
        savedReview,
        message: `You have posted a review for ${reviewedMovie.title} (${reviewedMovie.year})`,
    });
};

const get_all_reviews = async (req: Request, res: Response): Promise<void> => {
    const reviews = await Review.find({});
    res.status(200).json(reviews);
};

export default {
    get_all_reviews,
    post_review,
    edit_review,
    like_review,
    delete_review,
    get_latest_reviews,
    get_one_review,
    post_comment,
    get_reviews_by_friends,
};
