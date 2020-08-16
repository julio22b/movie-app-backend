import mongoose, { Schema, Document } from 'mongoose';
import { IMovie } from './Movie';
import { IUser } from './User';
import mongooseUniqueValidator from 'mongoose-unique-validator';
import { IComment } from './Comment';

export enum Rating {
    HALF_STAR = 0.5,
    ONE_STAR = 1,
    ONE_HALF_STAR = 1.5,
    TWO_STARS = 2,
    TWO_HALF_STARS = 2.5,
    THREE_STARS = 3,
    THREE_HALF_STARS = 3.5,
    FOUR_STARS = 4,
    FOUR_HALF_STARS = 4.5,
    FIVE_STARS = 5,
}

export interface IReview extends Document {
    movie: IMovie;
    content: string;
    user: IUser;
    liked_movie: boolean;
    watched_on: string;
    first_watch:boolean;
    likes: number;
    rating: Rating;
    comments: IComment['_id'];
}

const ReviewSchema: Schema = new Schema(
    {
        movie: { type: Schema.Types.ObjectId, required: true, ref: 'Movie' },
        content: { type: String, required: true },
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        liked_movie: { type: Boolean, required: true },
        first_watch: Boolean,
        watched_on: String,
        likes: Number,
        rating: Number,
        comments: [{ type: Schema.Types.ObjectId, ref: 'Comment' }],
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    },
);

ReviewSchema.plugin(mongooseUniqueValidator);

export default mongoose.model<IReview>('Review', ReviewSchema);
