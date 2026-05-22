-- CREATE DATABASE image_processing;

-- \c image_processing;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TYPE user_role AS ENUM (
  'admin',
  'user'
);

CREATE TYPE subscription_status AS ENUM (
  'active',
  'scheduled_cancel',
  'expired'
);

CREATE TYPE billing_interval AS ENUM (
  'monthly',
  'quarterly',
  'yearly'
);

CREATE TYPE batch_status AS ENUM (
  'processing',
  'completed',
  'partial_failed',
  'failed'
);

CREATE TYPE job_status AS ENUM (
  'queued',
  'processing',
  'retrying',
  'completed',
  'failed'
);

CREATE TYPE email_status AS ENUM (
  'sent',
  'failed'
);

CREATE TYPE transaction_status AS ENUM (
  'pending',
  'completed',
  'failed'
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email CITEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
  storage_used_bytes BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE, -- Free / Pro / Business
  is_free BOOLEAN NOT NULL DEFAULT FALSE,
  daily_jobs_limit INTEGER NOT NULL CHECK (daily_jobs_limit >= 0),
  max_file_size_bytes BIGINT NOT NULL CHECK (max_file_size_bytes > 0),
  priority_level INTEGER NOT NULL CHECK (priority_level >= 1),
  storage_limit_bytes BIGINT NOT NULL CHECK (storage_limit_bytes >= 0),
  watermark_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_plans_updated_at
BEFORE UPDATE ON plans
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TABLE plan_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL
    REFERENCES plans(id)
    ON DELETE CASCADE,
  interval billing_interval NOT NULL,
  duration_months INTEGER NOT NULL CHECK (duration_months > 0),
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(plan_id, interval)
);

CREATE INDEX idx_plan_prices_plan_id
ON plan_prices(plan_id);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,
  plan_id UUID NOT NULL
    REFERENCES plans(id)
    ON DELETE RESTRICT,
  plan_price_id UUID
    REFERENCES plan_prices(id)
    ON DELETE RESTRICT,
  status subscription_status NOT NULL DEFAULT 'active',
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
  cancelled_at TIMESTAMPTZ,
  source VARCHAR(30) NOT NULL DEFAULT 'sign_up_auto',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    expires_at IS NULL
    OR expires_at > started_at
  ),
  CHECK (
    cancelled_at IS NULL
    OR cancelled_at >= started_at
  )
);

CREATE TRIGGER trg_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- one active subscription per user
CREATE UNIQUE INDEX uq_subscriptions_one_active_per_user
ON subscriptions(user_id)
WHERE status = 'active';

CREATE INDEX idx_subscriptions_user_id
ON subscriptions(user_id);

CREATE INDEX idx_subscriptions_expiry
ON subscriptions(expires_at);

CREATE TABLE image_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,
  r2_key TEXT NOT NULL,
  original_file_name VARCHAR(255) NOT NULL,
  status batch_status NOT NULL DEFAULT 'processing',
  total_jobs INTEGER NOT NULL CHECK (total_jobs > 0),
  completed_jobs INTEGER NOT NULL DEFAULT 0,
    CHECK (completed_jobs >= 0),
  failed_jobs INTEGER NOT NULL DEFAULT 0
    CHECK (failed_jobs >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    completed_jobs + failed_jobs <= total_jobs
  )
);

CREATE INDEX idx_image_batches_user_created
ON image_batches(user_id, created_at DESC);

CREATE INDEX idx_image_batches_status
ON image_batches(status);


CREATE TABLE image_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL
    REFERENCES image_batches(id)
    ON DELETE CASCADE,
  bullmq_id VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL,
  status job_status NOT NULL DEFAULT 'queued',
  priority INTEGER NOT NULL CHECK (priority >= 1),
  output_url TEXT,
  output_size_bytes INTEGER CHECK (output_size_bytes >= 0),
  width INTEGER CHECK (width > 0),
  height INTEGER CHECK (height > 0),
  format VARCHAR(20),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  processing_time_ms INTEGER CHECK (processing_time_ms >= 0),
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  CHECK (
    completed_at IS NULL
    OR started_at IS NULL
    OR completed_at >= started_at
  )
);

CREATE INDEX idx_image_jobs_batch_status
ON image_jobs(batch_id, status);

CREATE INDEX idx_image_jobs_batch_id
ON image_jobs(batch_id);

CREATE INDEX idx_image_jobs_status
ON image_jobs(status);

CREATE INDEX idx_image_jobs_priority
ON image_jobs(priority);

CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  jobs_used INTEGER NOT NULL DEFAULT 0
    CHECK (jobs_used >= 0),
  storage_snapshot_bytes INTEGER NOT NULL DEFAULT 0
    CHECK (storage_snapshot_bytes >= 0),
  api_requests INTEGER NOT NULL DEFAULT 0
    CHECK (api_requests >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_usage_logs_user_date
ON usage_logs(user_id, date DESC);

CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID
    REFERENCES users(id)
    ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL,
  recipient_email CITEXT NOT NULL,
  status email_status NOT NULL DEFAULT 'sent',
  provider_message_id VARCHAR(255),
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_email_logs_user_id
ON email_logs(user_id);

CREATE INDEX idx_email_logs_sent_at
ON email_logs(sent_at DESC);

CREATE TABLE billing_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL
    REFERENCES users(id)
    ON DELETE CASCADE,
  plan_id UUID NOT NULL
    REFERENCES plans(id)
    ON DELETE RESTRICT,
  plan_price_id UUID
    REFERENCES plan_prices(id)
    ON DELETE RESTRICT,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  status transaction_status NOT NULL DEFAULT 'pending',
  external_reference VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_billing_transactions_updated_at
BEFORE UPDATE ON billing_transactions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_billing_transactions_user_id
ON billing_transactions(user_id);

CREATE INDEX idx_billing_transactions_status
ON billing_transactions(status);