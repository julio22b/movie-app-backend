import mongoose, { Document, Schema } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import { Rating } from './Review';

export interface IMovie extends Document {
    title: string;
    year: string;
    synopsis: string;
    poster: string;
    ratings?: Rating[];
    likes?: number;
    genres?: string[];
}

const MovieSchema: Schema = new Schema(
    {
        title: { type: String, required: true, unique: true },
        year: { type: String, required: true, maxlength: 4 },
        synopsis: { type: String, required: true },
        poster: { type: String, required: true, unique: true },
        ratings: { type: [Number], enum: [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5] },
        likes: Number,
        genres: [String],
    },
    {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    },
);

MovieSchema.plugin(uniqueValidator);

export default mongoose.model<IMovie>('Movie', MovieSchema);
