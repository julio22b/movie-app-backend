declare global {
    namespace NodeJS {
        interface ProcessEnv {
            MONGODB_URI: string;
            NODE_ENV: 'test' | 'production' | 'development';
            JWT_SECRET: string;
        }
    }
}

export {};
