import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';
import { IReview } from './Review';

export interface IComment extends Document {
    user: IUser;
    review: IReview;
    content: string;
}

const CommentSchema: Schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    review: { type: Schema.Types.ObjectId, ref: 'Review' },
    content: { type: String, required: true },
});

export default mongoose.model<IComment>('Comment', CommentSchema);
