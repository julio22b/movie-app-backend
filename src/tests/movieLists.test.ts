/* eslint-disable @typescript-eslint/restrict-template-expressions */
import supertest from 'supertest';
import app from '..';
import { connect, closeDatabase, clearDatabase } from '../mongoConfigTesting';
import MovieList, { IMovieList } from '../models/MovieList';
import User from '../models/User';
import Movie from '../models/Movie';

const api = supertest(app);
const jsonRegex = /application\/json/;
const baseUrl = '/api/movie-lists';

interface IMovieListBase {
    title: IMovieList['title'];
    description?: IMovieList['description'];
}

let token: string;

beforeAll(async () => {
    await connect();
    await api.post('/api/users/sign-up').send({
        username: 'julio',
        password: '123456',
        password_confirmation: '123456',
    });

    await api.post('/api/movies/create').send({
        title: 'Carol',
        year: '2015',
        synopsis: 'Cate Blanchet is glamorous for 2 hours',
        poster: 'some url',
    });

    const res = await api.post('/api/users/log-in').send({ username: 'julio', password: '123456' });
    token = res.body.token;

    const user = await User.findOne({ username: 'julio' });
    if (!user) {
        throw new Error('User not found');
    }
    await api.post(`${baseUrl}/${user._id}`).set('Authorization', `Bearer ${token}`).send({
        title: 'Amy Adam Movies',
        description: 'Movies where Amy Adams is a goddess',
    });
});

describe('movie list operations', () => {
    test('should create a new movie list and add it to the lists[] of user', async () => {
        const user = await User.findOne({ username: 'julio' });
        const movieListsAtStart = await MovieList.find({});
        if (!user) {
            throw new Error('User not found');
        }

        const newMovieList: IMovieListBase = {
            title: 'Best Movies of 2020',
            description: 'A list of my favorite movies from 2020',
        };
        await api
            .post(`${baseUrl}/${user._id}`)
            .set('Authorization', `Bearer ${token}`)
            .send(newMovieList)
            .expect(200)
            .expect('Content-Type', jsonRegex)
            .expect((res) => {
                expect(res.body.message).toBe(`You've created the list '${newMovieList.title}'`);
            });
        const movieListsAtEnd = await MovieList.find({});
        expect(movieListsAtEnd).toHaveLength(movieListsAtStart.length + 1);
        const movieListDescs = movieListsAtEnd.map((m) => m.description);
        expect(movieListDescs).toContain(newMovieList.description);

        const userAfterCreatingList = await User.findOne({ username: 'julio' });
        const createdList = await MovieList.findOne({ title: newMovieList.title });
        if (!userAfterCreatingList || !createdList) throw new Error('not found');
        expect(userAfterCreatingList.lists).toContainEqual(createdList._id);
    });

    test('should add a movie to an existing list', async () => {
        const user = await User.findOne({ username: 'julio' });
        const movieList = await MovieList.findOne({ title: 'Amy Adam Movies' });
        const movie = await Movie.findOne({ title: 'Carol' });
        if (!user || !movieList || !movie) {
            throw new Error('User or list or movie not found');
        }

        await api
            .put(`${baseUrl}/${movieList._id}?username=julio`)
            .set('Authorization', `Bearer ${token}`)
            .send(movieList.movies.concat(movie))
            .expect(200)
            .expect('Content-Type', jsonRegex)
            .expect((res) =>
                expect(res.body.message).toBe(`Added ${movie.title} to ${movieList.title}`),
            );

        const movieListAfterAddition = await MovieList.findOne({ title: 'Amy Adam Movies' });
        expect(movieListAfterAddition?.movies).toHaveLength(movieList.movies.length + 1);
        expect(movieListAfterAddition?.movies[0]._id).toEqual(movie._id);
    });

    test('should remove a movie from an existing list', async () => {
        const user = await User.findOne({ username: 'julio' });
        const movieList = await MovieList.findOne({ title: 'Amy Adam Movies' });
        const movie = await Movie.findOne({ title: 'Carol' });
        if (!user || !movieList || !movie) {
            throw new Error('User or list or movie not found');
        }

        await api
            .put(`${baseUrl}/${movieList._id}/remove-movie/${movie._id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .expect('Content-Type', jsonRegex)
            .expect((res) =>
                expect(res.body.message).toBe(`${movie.title} was removed from ${movieList.title}`),
            );
        const movieListAfterRemoval = await MovieList.findOne({ title: 'Amy Adam Movies' });
        expect(movieListAfterRemoval?.movies).toHaveLength(movieList.movies.length - 1);
        const movieListMovies = movieListAfterRemoval?.movies.map((m) => m.title);
        expect(movieListMovies).not.toContain(movie._id);
    });

    test('should delete a movie list', async () => {
        const movieListsAtStart = await MovieList.find({});
        const movieListToDelete = await MovieList.findOne({ title: 'Amy Adam Movies' });

        if (!movieListsAtStart || !movieListToDelete) throw new Error('not found');

        await api
            .delete(`${baseUrl}/${movieListToDelete._id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .expect('Content-Type', jsonRegex)
            .expect((res) =>
                expect(res.body.message).toBe(
                    `The list '${movieListToDelete.title}' has been deleted`,
                ),
            );

        const movieListsAtEnd = await MovieList.find({});
        expect(movieListsAtEnd).toHaveLength(movieListsAtStart.length - 1);

        const userAfterListRemoval = await User.findOne({ username: 'julio' }).populate('lists');
        const movieListTitles = userAfterListRemoval?.lists?.map((l) => l.title);
        expect(movieListTitles).not.toContain(movieListToDelete.title);
    });
});

afterAll(async () => {
    await clearDatabase();
    await closeDatabase();
});
