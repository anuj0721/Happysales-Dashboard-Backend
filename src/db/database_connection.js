import { MongoClient } from "mongodb";
import pg from "pg";

export async function mongoConnection() {
    try {
        const client = MongoClient.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("connect to MongoDB database!")
        return client; // Return the database object
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error; // Re-throw the error for handling in other files
    }
}

export async function postgresConnection() {
    try {
        const client = new pg.Client({
            user: process.env.DB_USER_NAME,
            host: process.env.DB_HOST,
            database: process.env.DATABASE,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT, // Optional, default is 5432
            ssl: { rejectUnauthorized: false }, // Optional, disable SSL certificate validation (not recommended for production)
        });

        await client.connect();
        console.log("Connected to PostgreSQL database!");

        return client;
    } catch (error) {
        console.error("Error connecting to PostgreSQL:", error);
        throw error; // Re-throw the error for handling in other files
    }
}

