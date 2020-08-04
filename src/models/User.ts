import mongoose, { Schema, Document } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import { IMovie } from './Movie';
import { IMovieList } from './MovieList';
import { IReview } from './Review';

export interface IUser extends Document {
    username: string;
    profile_picture: string;
    bio?: string;
    password: string;
    reviews?: IReview[];
    watched_movies?: Array<IMovie['_id']>;
    followers?: Array<IMovie['_id']>;
    following?: Array<IMovie['_id']>;
    watch_list?: Array<IMovie['_id']>;
    favorites?: IMovie[];
    lists?: IMovieList[];
}

const UserSchema: Schema = new Schema({
    username: { type: String, required: true, unique: true, maxlength: 25 },
    profile_picture: String,
    bio: { type: String },
    password: { type: String, required: true, select: false },
    reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
    watched_movies: [{ type: Schema.Types.ObjectId, ref: 'Movie' }],
    followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    watch_list: [{ type: Schema.Types.ObjectId, ref: 'Movie' }],
    favorites: [{ type: Schema.Types.ObjectId, ref: 'Movie' }],
    lists: [{ type: Schema.Types.ObjectId, ref: 'MovieList' }],
});

UserSchema.plugin(uniqueValidator);

export default mongoose.model<IUser>('User', UserSchema);
