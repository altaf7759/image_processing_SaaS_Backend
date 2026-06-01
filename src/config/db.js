import Pool from 'pg';

const poolConfig = process.env.NODE_ENV === 'production' ? {
      connectionString: process.env.DATABASE_URL,
      ssl: {
            rejectUnauthorized: false
      }
} : {
      user: process.env.POSTGRES_USER,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
}

const pool = new Pool.Pool(poolConfig);

export default pool;