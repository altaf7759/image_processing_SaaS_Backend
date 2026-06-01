import { Pool } from 'pg';

console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");

const poolConfig =
      process.env.NODE_ENV === 'production'
            ? {
                  connectionString: process.env.DATABASE_URL,
                  ssl: {
                        rejectUnauthorized: false,
                  },
            }
            : {
                  user: process.env.POSTGRES_USER,
                  host: process.env.DB_HOST,
                  port: process.env.DB_PORT,
                  password: process.env.POSTGRES_PASSWORD,
                  database: process.env.POSTGRES_DB,
            };

const pool = new Pool(poolConfig);

pool.connect()
      .then(client => {
            console.log("✅ Database connected");
            client.release();
      })
      .catch(err => {
            console.error("❌ Database connection failed:", err);
      });

export default pool;