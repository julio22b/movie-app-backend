import mongoose, { Document, Schema } from 'mongoose';
import { IReview } from './Review';

export interface IMovie extends Document {
    title: string;
    year: string;
    synopsis: string;
    poster: string;
    director?: string;
    reviews?: IReview[];
    likes?: number;
    watches: number;
    genres?: string[];
    actors?: string[];
    country: string;
    language: string;
    run_time: string;
}

const MovieSchema: Schema = new Schema({
    title: { type: String, required: true },
    year: { type: String, required: true, maxlength: 4 },
    synopsis: { type: String, required: true },
    poster: { type: String, required: true },
    director: String,
    reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
    likes: Number,
    watches: Number,
    genres: [String],
    actors: [String],
    country: String,
    language: String,
    run_time: String,
});

export default mongoose.model<IMovie>('Movie', MovieSchema);
