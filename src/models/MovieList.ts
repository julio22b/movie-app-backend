import mongoose, { Schema, Document } from 'mongoose';
import { IMovie } from './Movie';
import mongooseUniqueValidator from 'mongoose-unique-validator';
import { IUser } from './User';

export interface IMovieList extends Document {
    title: string;
    description: string;
    movies: Array<IMovie>;
    user: IUser;
    tags: string[];
}

const MovieListSchema: Schema = new Schema({
    title: { type: String, required: true },
    description: { type: String },
    movies: [{ type: Schema.Types.ObjectId, ref: 'Movie' }],
    tags: [String],
});

MovieListSchema.plugin(mongooseUniqueValidator);

export default mongoose.model<IMovieList>('MovieList', MovieListSchema);
