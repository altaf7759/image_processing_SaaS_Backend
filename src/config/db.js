import Pool from 'pg';

const pool = new Pool.Pool({
      user: process.env.POSTGRES_USER,
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
})

export default pool;