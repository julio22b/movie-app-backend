import mongoose, { Schema, Document } from 'mongoose';
import { IMovie } from './Movie';
import { IUser } from './User';
import mongooseUniqueValidator from 'mongoose-unique-validator';

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
    likes?: number;
    rating?: Rating;
}

const ReviewSchema: Schema = new Schema(
    {
        movie: { type: Schema.Types.ObjectId, required: true, ref: 'Movie' },
        content: { type: String, required: true },
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        likes: Number,
        rating: Number,
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
