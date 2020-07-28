import supertest from 'supertest';
import app from '..';
import { connect, closeDatabase, clearDatabase } from '../mongoConfigTesting';
import User, { IUser } from 'src/models/User';
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
                expect(res.body.message).toBe('Account created');
            });
        const usersAtEnd = await User.find({});
        expect(usersAtEnd).toHaveLength(usersAtStart.length + 1);
    });
});

afterAll(async () => {
    await closeDatabase();
});

export {};
