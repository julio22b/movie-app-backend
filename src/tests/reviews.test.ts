/* eslint-disable @typescript-eslint/restrict-template-expressions */
import supertest from 'supertest';
import app from '..';
import { connect, closeDatabase, clearDatabase } from '../mongoConfigTesting';
import Review, { IReview } from '../models/Review';
import User from '../models/User';
import Movie from '../models/Movie';

const api = supertest(app);
const jsonRegex = /application\/json/;
const baseUrl = '/api/reviews';

interface IReviewBase {
    content: IReview['content'];
    rating: IReview['rating'];
    likes?: IReview['likes'];
}

let token: string;

beforeAll(async () => {
    await connect();
    await api.post('/api/movies/create').send({
        title: 'Arrival',
        year: '2016',
        synopsis: 'Funny aliens talk to humans',
        ratings: [5, 5, 5, 4.5],
        poster: 'url',
    });

    await api.post('/api/users/sign-up').send({
        username: 'julio',
        password: '123456',
        password_confirmation: '123456',
    });

    const res = await api.post(`/api/users/log-in`).send({ username: 'julio', password: '123456' });
    token = res.body.token;
});

describe('reviews crud actions', () => {
    beforeEach(async () => {
        await Review.deleteMany({});
        const movie = await Movie.findOne({ title: 'Arrival' });
        const user = await User.findOne({ username: 'julio' });
        if (!movie || !user) {
            throw new Error('user or movie were not found');
        }
        await api
            .post(`${baseUrl}/${movie._id}/${user._id}/create`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                content: `DENIS VILLENUEVE`,
                rating: 5,
            });
    });

    test('should create a review of a movie and add it to the reviews[] of the user', async () => {
        const user = await User.findOne({ username: 'julio' });
        const movie = await Movie.findOne({ title: 'Arrival' });
        const reviewsAtStart = await Review.find({});
        if (!user || !movie) {
            throw new Error('User or movie were not found');
        }

        const newReview: IReviewBase = {
            content: `amy saves cinema`,
            rating: 5,
        };

        await api
            .post(`${baseUrl}/${movie._id}/${user._id}/create`)
            .set('Authorization', `Bearer ${token}`)
            .send(newReview)
            .expect(200)
            .expect('Content-Type', jsonRegex)
            .expect((res) => {
                expect(res.body.message).toBe(
                    `You have posted a review for ${movie.title} (${movie.year})`,
                );
            });
        const reviewsAtEnd = await Review.find({});
        expect(reviewsAtEnd).toHaveLength(reviewsAtStart.length + 1);
        const contents = reviewsAtEnd.map((review) => review.content);
        expect(contents).toContain(newReview.content);

        const userAfterReview = await User.findOne({ username: 'julio' });
        const review = await Review.findOne({ content: `amy saves cinema` });
        expect(userAfterReview?.reviews).toContainEqual(review?._id);
    });

    test('should edit the content of a review', async () => {
        const review = await Review.findOne({ content: 'DENIS VILLENUEVE' });
        if (!review) throw new Error('Review not found');

        const update: IReviewBase = {
            content: 'IS A DIRECTOR',
            rating: review?.rating,
        };

        await api
            .put(`${baseUrl}/${review._id}/edit`)
            .set('Authorization', `Bearer ${token}`)
            .send(update)
            .expect(200)
            .expect('Content-Type', jsonRegex);

        const reviews = await Review.find({});
        const contents = reviews.map((r) => r.content);
        expect(contents).toContain(update.content);
    });

    test('should edit the rating of a movie review', async () => {
        const review = await Review.findOne({ content: 'DENIS VILLENUEVE' });
        if (!review) throw new Error('Review not found');

        const update: IReviewBase = {
            content: review.content,
            rating: 1,
        };

        await api
            .put(`${baseUrl}/${review._id}/edit`)
            .set('Authorization', `Bearer ${token}`)
            .send(update)
            .expect(200)
            .expect('Content-Type', jsonRegex);

        const reviewAfterRatingEdit = await Review.findOne({ content: 'DENIS VILLENUEVE' });
        expect(reviewAfterRatingEdit?.rating).toBe(update.rating);
        const movie = await Movie.findOne({ title: 'Arrival' }).populate('reviews');
        const ratings = movie?.reviews?.map((r) => r.rating);
        expect(ratings).toContain(update.rating);
    });

    test('should update the likes of a review', async () => {
        const review = await Review.findOne({ content: 'DENIS VILLENUEVE' });
        const user = await User.findOne({ username: 'julio' });
        if (!review || typeof review.likes !== 'number' || !user) {
            throw new Error('Review or user not found or doesnt have likes');
        }
        await api
            .put(`${baseUrl}/${user._id}/like/${review._id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .expect('Content-Type', jsonRegex);

        const reviewAfterLike = await Review.findOne({ content: 'DENIS VILLENUEVE' });
        expect(reviewAfterLike?.likes).toBe(review.likes + 1);
    });

    test('should delete a review of a movie', async () => {
        const reviewsAtStart = await Review.find({});
        const review = await Review.findOne({ content: 'DENIS VILLENUEVE' });
        if (!review) {
            throw new Error('Review not found');
        }
        await api
            .delete(`${baseUrl}/${review._id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .expect('Content-Type', jsonRegex)
            .expect((res) => {
                expect(res.body.message).toBe('Your review has been deleted');
            });
        const reviewsAtEnd = await Review.find({});
        expect(reviewsAtEnd).toHaveLength(reviewsAtStart.length - 1);
    });
});

afterAll(async (done) => {
    await clearDatabase();
    await closeDatabase();
    done();
});
