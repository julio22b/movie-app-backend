/* eslint-disable @typescript-eslint/restrict-template-expressions */
import supertest from 'supertest';
import app from '..';
import { connect, closeDatabase, clearDatabase } from '../mongoConfigTesting';
import Movie, { IMovie } from '../models/Movie';
import User from '../models/User';

const api = supertest(app);
const jsonRegex = /application\/json/;
const baseUrl = '/api/movies';

interface IMovieBase {
    title: IMovie['title'];
    year: IMovie['year'];
    synopsis: IMovie['synopsis'];
    poster: IMovie['poster'];
    reviews?: IMovie['reviews'];
    likes?: IMovie['likes'];
}

let token: string;

beforeAll(async () => {
    await connect();
});

describe('add and update movie documents', () => {
    beforeEach(async () => {
        await clearDatabase();
        const newMovie: IMovieBase = {
            title: 'Phantom Thread',
            year: '2017',
            synopsis: 'Crazy people',
            poster: 'POSTER URL STRING HERE',
            likes: 10,
        };
        await api.post(`${baseUrl}/create`).send(newMovie);
        await api.post('/api/users/sign-up').send({
            username: 'julio',
            password: '123456',
            password_confirmation: '123456',
        });
        const res = await api
            .post(`/api/users/log-in`)
            .send({ username: 'julio', password: '123456' });
        token = res.body.token;
    });

    test('should create a new movie instance', async () => {
        const moviesAtStart = await Movie.find({});

        const newMovie: IMovieBase = {
            title: 'Arrival',
            year: '2016',
            synopsis: 'Funny aliens talk to humans',
            poster: 'url',
        };
        await api
            .post(`${baseUrl}/create`)
            .send(newMovie)
            .expect(200)
            .expect('Content-Type', jsonRegex);

        const moviesAtEnd = await Movie.find({});
        expect(moviesAtEnd).toHaveLength(moviesAtStart.length + 1);
        const movieTitles = moviesAtEnd.map((movie) => movie.title);
        expect(movieTitles).toContain(newMovie.title);
    });

    test('should like a movie', async () => {
        const user = await User.findOne({ username: 'julio' });
        const beforeLikingMovie = await Movie.findOne({ title: 'Phantom Thread' });
        if (!user || !beforeLikingMovie) {
            throw new Error('User or movie not found');
        }
        await api
            .put(`${baseUrl}/${user._id}/like/${beforeLikingMovie._id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .expect('Content-Type', jsonRegex);

        const afterLikingMovie = await Movie.findOne({ title: 'Phantom Thread' });
        expect(afterLikingMovie?.likes).toBe(beforeLikingMovie.likes as number + 1);
    });

    test('should unlike a movie', async () => {
        const user = await User.findOne({ username: 'julio' });
        const beforeLikingMovie = await Movie.findOne({ title: 'Phantom Thread' });
        if (!user || !beforeLikingMovie) {
            throw new Error('User or movie not found');
        }
        await api
            .put(`${baseUrl}/${user._id}/unlike/${beforeLikingMovie._id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .expect('Content-Type', jsonRegex);

        const afterLikingMovie = await Movie.findOne({ title: 'Phantom Thread' });
        expect(afterLikingMovie?.likes).toBe(beforeLikingMovie.likes as number - 1);
    });
});

afterAll(async () => {
    await closeDatabase();
});
