import pool from "../config/db.js";

export const upsertUsageLog = async ({
      userId,
      storageSnapshotBytes
}) => {

      const query = `
            INSERT INTO usage_logs (
                  user_id,
                  date,
                  jobs_used,
                  storage_snapshot_bytes
            )
            VALUES (
                  $1,
                  CURRENT_DATE,
                  1,
                  $2
            )

            ON CONFLICT (user_id, date)

            DO UPDATE SET

                  jobs_used =
                        usage_logs.jobs_used + 1,

                  storage_snapshot_bytes =
                        $2
      `;

      const values = [
            userId,
            storageSnapshotBytes
      ];

      await pool.query(query, values);
};