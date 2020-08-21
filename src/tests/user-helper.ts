import User, { IUser } from '../models/User';
import Movie, { IMovie } from '../models/Movie';

const createUsers = async (): Promise<Record<string, IUser>> => {
    const julio = await User.create({ username: 'julio', password: '123456' });
    const eric = await User.create({ username: 'eric', password: '123456' });
    return {
        julio,
        eric,
    };
};

const returnUsers = async (): Promise<Record<string, IUser>> => {
    const julio = await User.findOne({ username: 'julio' });
    const eric = await User.findOne({ username: 'eric' });
    if (!julio || !eric) throw new Error('Users not found');
    return {
        julio,
        eric,
    };
};

const createMovie = async (): Promise<void> => {
    await Movie.create({
        title: 'La La Land',
        year: '2016',
        synopsis: 'Ryan Gosling',
        poster: 'urlurlurl',
    });
};

interface Mix {
    user: IUser;
    movie: IMovie;
}

const returnOneUserAndOneMovie = async (): Promise<Mix> => {
    const user = await User.findOne({ username: 'julio' });
    const movie = await Movie.findOne({ title: 'La La Land' });
    if (!user || !movie) throw new Error('User or movie not found');

    return {
        user,
        movie,
    };
};

export default {
    createUsers,
    returnUsers,
    createMovie,
    returnOneUserAndOneMovie,
};
