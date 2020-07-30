/* eslint-disable @typescript-eslint/restrict-template-expressions */
import supertest from 'supertest';
import app from '..';
import { connect, closeDatabase, clearDatabase } from '../mongoConfigTesting';
import User, { IUser } from '../models/User';
import userHelper from './user-helper';

const api = supertest(app);
const jsonRegex = /application\/json/;
const baseUrl = '/api/users';

interface IUserBase {
    username: IUser['username'];
    password: IUser['password'];
    password_confirmation: IUser['password'];
}

beforeAll(async () => {
    await connect();
});

describe('Validate user sign-up and log in', () => {
    beforeEach(async () => {
        await clearDatabase();
    });

    test("should return 400 with message 'Passwords must match' if passwords don't match ", async () => {
        const newUser: IUserBase = {
            username: 'julio',
            password: '123456',
            password_confirmation: 'abcdefgh',
        };

        await api
            .post(`${baseUrl}/sign-up`)
            .send(newUser)
            .expect(400)
            .expect('Content-Type', jsonRegex)
            .expect((res) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                expect(res.body.errors[0].msg).toBe('Passwords must match');
            });
    });

    test("should return 200 with message 'Account created' if sign-up is valid", async () => {
        const usersAtStart = await User.find({});
        const newUser: IUserBase = {
            username: 'julio',
            password: '123456',
            password_confirmation: '123456',
        };

        await api
            .post(`${baseUrl}/sign-up`)
            .send(newUser)
            .expect(200)
            .expect('Content-Type', jsonRegex)
            .expect((res) => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                expect(res.body.message).toBe('Account created');
            });
        const usersAtEnd = await User.find({});
        expect(usersAtEnd).toHaveLength(usersAtStart.length + 1);
    });
});

const token =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXZpZXdzIjpbXSwid2F0Y2hlZF9tb3ZpZXMiOltdLCJmb2xsb3dlcnMiOltdLCJmb2xsb3dpbmciOltdLCJ3YXRjaF9saXN0IjpbXSwiZmF2b3JpdGVzIjpbXSwibGlzdHMiOltdLCJfaWQiOiI1ZjIzMDQzMWU3ZTFhODA4OTBiZWMwMjAiLCJ1c2VybmFtZSI6Imp1bGlvIiwicGFzc3dvcmQiOiIkMmEkMTAkUlN2Qk5yLjBEcFdFR2JRMnoySk8zLmFSUHV2MXVlZm9UalAzME5NaXBGRzBqb2V5M3phVWEiLCJfX3YiOjAsImlhdCI6MTU5NjEzODY2MH0.ELDT3jOlOPrB3A6ntHZYhAJkYch6XpmAViVzbBodM30';

describe('Follow and unfollow users', () => {
    beforeEach(async () => {
        await clearDatabase();
        await userHelper.createUsers();
    });

    test('should add user to follower(userB)/following(userA) lists when userA follows userB', async () => {
        const { julio, eric } = await userHelper.returnUsers();
        await api
            .put(`${baseUrl}/${julio._id}/follow/${eric._id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .expect('Content-Type', jsonRegex)
            .expect((res) =>
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                expect(res.body.message).toBe(`You're now following ${eric.username}`),
            );

        const { julio: julioAfterFollow, eric: ericAfterFollow } = await userHelper.returnUsers();
        expect(julioAfterFollow.following).toContainEqual(eric._id);
        expect(ericAfterFollow.followers).toContainEqual(julio._id);
    });

    test('should remove user from followers(userB)/following(userA) lists when userA unfollows userB', async () => {
        const { julio, eric } = await userHelper.returnUsers();

        await api
            .put(`${baseUrl}/${julio._id}/unfollow/${eric._id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .expect('Content-Type', jsonRegex)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            .expect((res) => expect(res.body.message).toBe(`You have unfollowed ${eric.username}`));

        const { julio: julioAfterFollow, eric: ericAfterFollow } = await userHelper.returnUsers();
        expect(julioAfterFollow.following).not.toContainEqual(eric._id);
        expect(ericAfterFollow.followers).not.toContainEqual(julio._id);
    });

    test('should respond with 401 if no valid token is provided', async () => {
        const { julio, eric } = await userHelper.returnUsers();

        await api.put(`${baseUrl}/${julio._id}/follow/${eric._id}`).expect(401);
    });
});

describe('Test adding and removing movies from watch list', () => {
    beforeEach(async () => {
        await clearDatabase();
        await userHelper.createUsers();
        await userHelper.createMovie();
    });

    test("should add a movie to an user's watch list", async () => {
        const { user, movie } = await userHelper.returnOneUserAndOneMovie();
        await api
            .put(`${baseUrl}/${user._id}/add-to-watchlist/${movie._id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .expect('Content-Type', jsonRegex);

        const { user: userAfterAddition } = await userHelper.returnOneUserAndOneMovie();
        expect(userAfterAddition.watch_list).toContainEqual(movie._id);
    });

    test("should remove a movie from a user's watch list", async () => {
        const { user, movie } = await userHelper.returnOneUserAndOneMovie();

        await api
            .put(`${baseUrl}/${user._id}/remove-from-watchlist/${movie._id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .expect('Content-Type', jsonRegex);

        const { user: userAfterRemoval } = await userHelper.returnOneUserAndOneMovie();
        expect(userAfterRemoval.watch_list).not.toContainEqual(movie._id);
    });
});

describe('diary/watched movies removal and addition tests', () => {
    beforeEach(async () => {
        await clearDatabase();
        await userHelper.createUsers();
        await userHelper.createMovie();
    });

    test("should add a movie to a user' diary", async () => {
        const { user, movie } = await userHelper.returnOneUserAndOneMovie();

        await api
            .put(`${baseUrl}/${user._id}/add-to-diary/${movie._id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .expect('Content-Type', jsonRegex);

        const { user: userAfterAddition } = await userHelper.returnOneUserAndOneMovie();
        expect(userAfterAddition.watched_movies).toContainEqual(movie._id);
    });

    test("should remove a movie from a user' diary", async () => {
        const { user, movie } = await userHelper.returnOneUserAndOneMovie();

        await api
            .put(`${baseUrl}/${user._id}/remove-from-diary/${movie._id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .expect('Content-Type', jsonRegex);

        const { user: userAfterAddition } = await userHelper.returnOneUserAndOneMovie();
        expect(userAfterAddition.watched_movies).not.toContainEqual(movie._id);
    });
});

afterAll(async () => {
    await closeDatabase();
});

export {};
