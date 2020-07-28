import mongoose, { Document, Schema } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import { IReview } from './Review';

export interface IMovie extends Document {
    title: string;
    year: string;
    synopsis: string;
    poster: string;
    reviews?: IReview[];
    likes?: number;
    genres?: string[];
}

const MovieSchema: Schema = new Schema({
    title: { type: String, required: true, unique: true },
    year: { type: String, required: true, maxlength: 4 },
    synopsis: { type: String, required: true },
    poster: { type: String, required: true, unique: true },
    reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
    likes: Number,
    genres: [String],
});

MovieSchema.plugin(uniqueValidator);

export default mongoose.model<IMovie>('Movie', MovieSchema);
