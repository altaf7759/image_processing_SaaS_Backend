import pool from "../config/db.js";

export const createEmailLog = async ({ userId, type, email, client }) => {
      const query = `
            INSERT INTO email_logs
                  (user_id, type, recipient_email)
            VALUES
                  ($1, $2, $3)
            RETURNING
                  id,
                  recipient_email,
                  type
      `

      const result = await client.query(query, [userId, type, email])
      return result.rows[0]
}

export const deleteEmailLog = async (emailLogId) => {
      const query = `
            DELETE
            FROM email_logs
            WHERE id = $1
      `

      await pool.query(query, [emailLogId])
}

export const markEmailSent = async (emailLogId) => {
      const query = `
            UPDATE email_logs
            SET
                  status = 'sent'::email_status
            WHERE id = $1
      `
      await pool.query(query, [emailLogId])
}

export const markEmailFailed = async (emailLogId) => {
      const query = `
            UPDATE email_logs
            SET
                  status = 'failed'::email_status
            WHERE id = $1
      `
      await pool.query(query, [emailLogId])
}