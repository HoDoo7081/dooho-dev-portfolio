-- Additive hardening on top of design-package/02_SQL/schema.sql (does not modify it).
-- These are the pieces the 31-table design implies but does not contain:
--   * seat counter bounds             -> overbooking impossible even if app code is wrong
--   * idempotency_keys                -> retried POST /bookings never creates a second booking
--   * provider_events                 -> a redelivered webhook is processed at most once
--   * UNIQUE(provider, provider_txn_id) on payments
--   * state-transition triggers for bookings and payments
SET search_path TO sb;

ALTER TABLE sb.availability_slots
  ADD CONSTRAINT slots_seats_bounds CHECK (seats_reserved >= 0 AND seats_reserved <= seats_total);

ALTER TABLE sb.payments
  ADD CONSTRAINT payments_provider_txn_uq UNIQUE (provider, provider_txn_id);

CREATE TABLE sb.idempotency_keys (
  idem_key     VARCHAR(120) PRIMARY KEY,
  request_hash CHAR(64)     NOT NULL,
  booking_id   BIGINT REFERENCES sb.bookings(booking_id),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE sb.provider_events (
  event_id     VARCHAR(120) PRIMARY KEY,
  provider     VARCHAR(40)  NOT NULL,
  event_type   VARCHAR(60)  NOT NULL,
  received_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE OR REPLACE FUNCTION sb.enforce_booking_transition() RETURNS trigger AS $$
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  IF (OLD.status, NEW.status) IN (
       ('PENDING','CONFIRMED'), ('PENDING','CANCELLED'),
       ('CONFIRMED','COMPLETED'), ('CONFIRMED','CANCELLED'), ('CONFIRMED','DISPUTED'),
       ('COMPLETED','DISPUTED'),
       ('DISPUTED','COMPLETED'), ('DISPUTED','CANCELLED')) THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'illegal booking transition % -> %', OLD.status, NEW.status
    USING ERRCODE = 'check_violation';
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_booking_transition BEFORE UPDATE OF status ON sb.bookings
  FOR EACH ROW EXECUTE FUNCTION sb.enforce_booking_transition();

CREATE OR REPLACE FUNCTION sb.enforce_payment_transition() RETURNS trigger AS $$
BEGIN
  IF NEW.status = OLD.status THEN RETURN NEW; END IF;
  IF (OLD.status, NEW.status) IN (
       ('INITIATED','PAID'), ('INITIATED','FAILED'),
       ('PAID','REFUNDED'), ('PAID','PARTIAL_REFUNDED'),
       ('PARTIAL_REFUNDED','REFUNDED')) THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'illegal payment transition % -> %', OLD.status, NEW.status
    USING ERRCODE = 'check_violation';
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_payment_transition BEFORE UPDATE OF status ON sb.payments
  FOR EACH ROW EXECUTE FUNCTION sb.enforce_payment_transition();
