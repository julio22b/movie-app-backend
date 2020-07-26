import mongoose, { Schema, Document } from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';
import { IMovie } from './Movie';
import { IMovieList } from './MovieList';
import { IReview } from './Review';

export interface IUser extends Document {
    username: string;
    bio?: string;
    password: string;
    reviews?: IReview[];
    watched?: IMovie[]; // how to do this one
    followers?: IUser[];
    following?: IUser[];
    watch_list?: IMovie[];
    favorites?: IMovie[];
    lists?: IMovieList[];
}

const UserSchema: Schema = new Schema({
    username: { type: String, required: true, unique: true },
    bio: { type: String },
    password: { type: String, required: true },
    reviews: [{ type: Schema.Types.ObjectId, ref: 'Review' }],
    watched: [{ type: Schema.Types.ObjectId, ref: 'Movie' }],
    followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    watch_list: [{ type: Schema.Types.ObjectId, ref: 'Movie' }],
    favorites: [{ type: Schema.Types.ObjectId, ref: 'Movie' }],
    lists: [{ type: Schema.Types.ObjectId, ref: 'MovieList' }],
});

UserSchema.plugin(uniqueValidator);

export default mongoose.model<IUser>('User', UserSchema);
