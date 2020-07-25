import supertest from 'supertest';
import app from '../Server';
import { connect, closeDatabase, clearDatabase } from '../mongoConfigTesting';
const api = supertest(app);

const jsonRegex = /application\/json/;
const baseUrl = '/api';

beforeAll(async () => {
    await connect();
});

beforeEach(async () => {
    await clearDatabase();
});

test('should receive hello', async () => {
    await api.get(`${baseUrl}/create`).expect(200).expect('Content-Type', jsonRegex);
});

afterAll(async () => {
    await closeDatabase();
});

export {};
