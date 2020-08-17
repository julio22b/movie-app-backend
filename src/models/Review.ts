import mongoose, { Schema, Document } from 'mongoose';
import { IMovie } from './Movie';
import { IUser } from './User';
import { IComment } from './Comment';

export interface IReview extends Document {
    movie: IMovie;
    content: string;
    user: IUser;
    liked_movie: boolean;
    watched_on: string;
    first_watch: boolean;
    likes: number;
    rating: number;
    comments: IComment['_id'];
}

const ReviewSchema: Schema = new Schema(
    {
        movie: { type: Schema.Types.ObjectId, required: true, ref: 'Movie' },
        content: { type: String },
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        liked_movie: Boolean,
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

export default mongoose.model<IReview>('Review', ReviewSchema);
