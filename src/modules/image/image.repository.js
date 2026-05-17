import pool from "../../config/db.js"

export const createImageBatch = async ({ userId, r2Key, totalJobs, originalFileName }) => {
   const query = `
            INSERT INTO image_batches (user_id, r2_key, original_file_name, total_jobs)
            VALUES ($1, $2, $3, $4)
            RETURNING *
      `;
   const values = [userId, r2Key, originalFileName, totalJobs];
   const result = await pool.query(query, values);
   return result.rows[0];
}

export const deleteImageBatch = async (batchId) => {
   const query = `
            DELETE FROM image_batches WHERE id = $1
      `;
   const values = [batchId];
   await pool.query(query, values);
}

export const createJobRow = async ({ batchId, bullmqId, type, priority }) => {
   const result = await pool.query(
      `
            INSERT INTO image_jobs (
                  batch_id,
                  bullmq_id,
                  type,
                  status,
                  priority,
                  started_at
            )
            VALUES ($1, $2, $3, 'processing', $4, NOW())
            RETURNING id
            `,
      [batchId, bullmqId, type, priority]
   );

   return result.rows[0];
};