declare global {
    namespace NodeJS {
        interface ProcessEnv {
            MONGODB_URI: string;
            NODE_ENV: 'test' | 'production' | 'development';
            JWT_SECRET: string;
            CLOUDINARY_CLOUD_NAME: string;
            CLOUDINARY_API_SECRET: string;
            CLOUDINARY_API_KEY: string;
        }
    }
}

export {};
