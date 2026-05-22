import pool from "../../config/db.js"

export const createImageBatch = async (
   {
      userId,
      r2Key,
      totalJobs,
      originalFileName
   },
   client = pool
) => {

   const query = `
      INSERT INTO image_batches (
         user_id,
         r2_key,
         original_file_name,
         total_jobs,
         status
      )
      VALUES (
         $1,
         $2,
         $3,
         $4,
         'processing'::batch_status
      )
      RETURNING *
   `;

   const values = [
      userId,
      r2Key,
      originalFileName,
      totalJobs
   ];

   const result = await client.query(
      query,
      values
   );

   return result.rows[0];
}

export const deleteImageBatch = async (
   batchId,
   client = pool
) => {

   const query = `
      DELETE FROM image_batches
      WHERE id = $1
   `;

   const values = [batchId];

   await client.query(query, values);
}

export const createJobRow = async (
   {
      batchId,
      bullmqId,
      type,
      priority
   },
   client = pool
) => {

   const result = await client.query(
      `
      INSERT INTO image_jobs (
         batch_id,
         bullmq_id,
         type,
         priority,
         status
      )
      VALUES (
         $1,
         $2,
         $3,
         $4,
         'queued'::job_status
      )
      RETURNING id
      `,
      [
         batchId,
         bullmqId,
         type,
         priority
      ]
   );

   return result.rows[0];
};

export const increaseStorageUsed = async (
   {
      userId,
      bytes
   },
   client = pool
) => {

   const query = `
      UPDATE users
      SET storage_used_bytes =
         storage_used_bytes + $1
      WHERE id = $2
      RETURNING storage_used_bytes
   `;

   const values = [
      bytes,
      userId
   ];

   const result = await client.query(query, values);
   return result.rows[0].storage_used_bytes;
}