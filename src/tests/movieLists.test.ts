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

    const user = await User.findOne({ username: 'julio' });
    if (!user) {
        throw new Error('User not found');
    }
    await api.post(`${baseUrl}/create/${user._id}`).send({
        title: 'Amy Adam Movies',
        description: 'Movies where Amy Adams is a goddess',
    });
});

describe('movie list operations', () => {
    test('should create a new movie list', async () => {
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
            .post(`${baseUrl}/create/${user._id}`)
            .send(newMovieList)
            .expect(200)
            .expect('Content-Type', jsonRegex)
            .expect((res) => {
                expect(res.body.message).toBe(`The list '${newMovieList.title}' has been created`);
            });
        const movieListsAtEnd = await MovieList.find({});
        expect(movieListsAtEnd).toHaveLength(movieListsAtStart.length + 1);
        const movieListDescs = movieListsAtEnd.map((m) => m.description);
        expect(movieListDescs).toContain(newMovieList.description);
    });

    test('should add a movie to an existing list', async () => {
        const user = await User.findOne({ username: 'julio' });
        const movieList = await MovieList.findOne({ title: 'Amy Adam Movies' });
        const movie = await Movie.findOne({ title: 'Carol' });
        if (!user || !movieList || !movie) {
            throw new Error('User or list or movie not found');
        }

        await api
            .put(`${baseUrl}/${movieList._id}/add-movie/${movie._id}`)
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
});

afterAll(async () => {
    await clearDatabase();
    await closeDatabase();
});
