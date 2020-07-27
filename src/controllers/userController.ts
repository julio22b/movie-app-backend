import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import User, { IUser } from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const user_log_in = async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body as IUser;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const user = await User.findOne({ username });
    if (user) {
        const success = await bcrypt.compare(password, user?.password);
        if (success) {
            const token = jwt.sign(user.toJSON(), 'sadadasdasdasadasddsadas'); // HERE
            res.status(200).json({ username: user.username, token });
        }
    }
    res.status(400).json({ message: 'Wrong credentials' });
    return;
};

const user_sign_up = async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body as IUser;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
        username,
        password: hashedPassword,
    });

    await newUser.save();
    res.status(200).json({ message: 'Account created' });
};

const get_all_users = async (req: Request, res: Response): Promise<void> => {
    const users = await User.find({});
    res.status(200).json(users);
};

export default {
    user_sign_up,
    get_all_users,
    user_log_in,
};
