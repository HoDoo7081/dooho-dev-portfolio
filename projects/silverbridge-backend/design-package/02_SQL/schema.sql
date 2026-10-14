-- Target DB: PostgreSQL 15
-- Schema: sb
CREATE SCHEMA IF NOT EXISTS sb;
SET search_path TO sb;

-- =========================
-- A. Users / roles
-- =========================
CREATE TABLE IF NOT EXISTS sb.users (
    user_id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(120),
    phone VARCHAR(40),
    locale VARCHAR(10),
    country_code CHAR(2),
    role VARCHAR(20) CHECK (role IN ('TRAVELER','HOST','ADMIN')),
    status VARCHAR(20) CHECK (status IN ('ACTIVE','SUSPENDED','DELETED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE sb.users IS 'SilverBridge user base record';
COMMENT ON COLUMN sb.users.role IS 'User role (TRAVELER, HOST, ADMIN)';

CREATE TABLE IF NOT EXISTS sb.travelers (
    traveler_id BIGINT PRIMARY KEY REFERENCES sb.users(user_id) ON DELETE CASCADE,
    birth_year INT,
    preferences JSONB,
    mobility_needs JSONB,
    guardian_contact JSONB
);

CREATE TABLE IF NOT EXISTS sb.hosts (
    host_id BIGINT PRIMARY KEY REFERENCES sb.users(user_id) ON DELETE CASCADE,
    bio TEXT,
    verified BOOLEAN,
    rating_avg NUMERIC(3,2)
);

CREATE TABLE IF NOT EXISTS sb.verifications (
    verification_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES sb.users(user_id) ON DELETE CASCADE,
    type VARCHAR(40) CHECK (type IN ('ID','PHONE','EMAIL','BACKGROUND_CHECK')),
    status VARCHAR(20) CHECK (status IN ('PENDING','APPROVED','REJECTED')),
    verified_at TIMESTAMPTZ
);

-- =========================
-- B. Locations / content / listings
-- =========================
CREATE TABLE IF NOT EXISTS sb.locations (
    location_id BIGSERIAL PRIMARY KEY,
    country_code CHAR(2),
    city VARCHAR(120),
    address_line VARCHAR(255),
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6)
);

CREATE TABLE IF NOT EXISTS sb.listings (
    listing_id BIGSERIAL PRIMARY KEY,
    host_id BIGINT REFERENCES sb.hosts(host_id) ON DELETE CASCADE,
    type VARCHAR(20) CHECK (type IN ('TOUR','EXPERIENCE','STAY')),
    title VARCHAR(150),
    description TEXT,
    location_id BIGINT REFERENCES sb.locations(location_id),
    base_price NUMERIC(12,2),
    currency CHAR(3),
    capacity INT,
    duration_min INT,
    status VARCHAR(20) CHECK (status IN ('DRAFT','ACTIVE','PAUSED','RETIRED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sb.amenities (
    amenity_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(80) UNIQUE
);

CREATE TABLE IF NOT EXISTS sb.listing_amenities (
    listing_id BIGINT REFERENCES sb.listings(listing_id) ON DELETE CASCADE,
    amenity_id BIGINT REFERENCES sb.amenities(amenity_id) ON DELETE CASCADE,
    PRIMARY KEY(listing_id, amenity_id)
);

CREATE TABLE IF NOT EXISTS sb.availability_slots (
    slot_id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT REFERENCES sb.listings(listing_id) ON DELETE CASCADE,
    start_ts TIMESTAMPTZ,
    end_ts TIMESTAMPTZ,
    seats_total INT,
    seats_reserved INT,
    UNIQUE(listing_id, start_ts, end_ts)
);

CREATE TABLE IF NOT EXISTS sb.media_assets (
    asset_id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT REFERENCES sb.listings(listing_id) ON DELETE CASCADE,
    url TEXT,
    kind VARCHAR(20) CHECK (kind IN ('IMAGE','VIDEO')),
    position INT
);

-- Extension: content
CREATE TABLE IF NOT EXISTS sb.contents (
    content_id BIGSERIAL PRIMARY KEY,
    listing_id BIGINT REFERENCES sb.listings(listing_id) ON DELETE CASCADE,
    content_type VARCHAR(20) CHECK (content_type IN ('GUIDE','ITINERARY','TIPS')),
    title VARCHAR(150),
    body TEXT,
    lang VARCHAR(10),
    version INT,
    is_published BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extension: courses
CREATE TABLE IF NOT EXISTS sb.courses (
    course_id BIGSERIAL PRIMARY KEY,
    title VARCHAR(150),
    description TEXT,
    difficulty VARCHAR(20) CHECK (difficulty IN ('EASY','NORMAL','CHALLENGE')),
    duration_min INT,
    locale VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sb.course_listings (
    course_id BIGINT REFERENCES sb.courses(course_id) ON DELETE CASCADE,
    listing_id BIGINT REFERENCES sb.listings(listing_id) ON DELETE CASCADE,
    seq INT,
    PRIMARY KEY(course_id, listing_id)
);

-- =========================
-- C. Recommendations / feedback
-- =========================
CREATE TABLE IF NOT EXISTS sb.match_candidates (
    candidate_id BIGSERIAL PRIMARY KEY,
    traveler_id BIGINT REFERENCES sb.travelers(traveler_id) ON DELETE CASCADE,
    listing_id BIGINT REFERENCES sb.listings(listing_id) ON DELETE CASCADE,
    algo_version VARCHAR(20),
    score NUMERIC(6,3),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(traveler_id, listing_id, algo_version)
);

CREATE TABLE IF NOT EXISTS sb.favorites (
    traveler_id BIGINT REFERENCES sb.travelers(traveler_id) ON DELETE CASCADE,
    listing_id BIGINT REFERENCES sb.listings(listing_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY(traveler_id, listing_id)
);

CREATE TABLE IF NOT EXISTS sb.match_feedback (
    feedback_id BIGSERIAL PRIMARY KEY,
    traveler_id BIGINT REFERENCES sb.travelers(traveler_id) ON DELETE CASCADE,
    listing_id BIGINT REFERENCES sb.listings(listing_id) ON DELETE CASCADE,
    action VARCHAR(30) CHECK (action IN ('VIEW','CLICK','FAVORITE','DISMISS')),
    action_ts TIMESTAMPTZ
);

-- =========================
-- D. Bookings / payments / partners
-- =========================
CREATE TABLE IF NOT EXISTS sb.bookings (
    booking_id BIGSERIAL PRIMARY KEY,
    traveler_id BIGINT REFERENCES sb.travelers(traveler_id) ON DELETE RESTRICT,
    listing_id BIGINT REFERENCES sb.listings(listing_id) ON DELETE RESTRICT,
    slot_id BIGINT REFERENCES sb.availability_slots(slot_id),
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    pax INT CHECK (pax >= 1),
    status VARCHAR(20) CHECK (status IN ('PENDING','CONFIRMED','CANCELLED','COMPLETED','DISPUTED')),
    subtotal_amount NUMERIC(12,2),
    fees_amount NUMERIC(12,2),
    total_amount NUMERIC(12,2),
    currency CHAR(3),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(listing_id, slot_id, traveler_id)
);

CREATE TABLE IF NOT EXISTS sb.payments (
    payment_id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT REFERENCES sb.bookings(booking_id) ON DELETE CASCADE,
    method VARCHAR(30) CHECK (method IN ('CARD','TOSS','PAYPAL','BANK')),
    provider VARCHAR(40),
    provider_txn_id VARCHAR(120),
    amount NUMERIC(12,2),
    currency CHAR(3),
    status VARCHAR(20) CHECK (status IN ('INITIATED','PAID','FAILED','REFUNDED','PARTIAL_REFUNDED')),
    paid_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sb.partner_integrations (
    partner_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(120),
    type VARCHAR(30) CHECK (type IN ('INSURANCE','PAYMENT','AFFILIATE')),
    config JSONB,
    status VARCHAR(20) CHECK (status IN ('ACTIVE','INACTIVE'))
);

CREATE TABLE IF NOT EXISTS sb.insurance_policies (
    policy_id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT REFERENCES sb.bookings(booking_id) ON DELETE CASCADE,
    partner_id BIGINT REFERENCES sb.partner_integrations(partner_id),
    policy_number VARCHAR(80),
    coverage_type VARCHAR(60),
    coverage_amount NUMERIC(12,2),
    currency CHAR(3),
    effective_from DATE,
    effective_to DATE,
    status VARCHAR(20) CHECK (status IN ('ACTIVE','EXPIRED','CANCELLED'))
);

CREATE TABLE IF NOT EXISTS sb.partner_offers (
    offer_id BIGSERIAL PRIMARY KEY,
    partner_id BIGINT REFERENCES sb.partner_integrations(partner_id),
    title VARCHAR(150),
    details TEXT,
    valid_from DATE,
    valid_to DATE,
    status VARCHAR(20) CHECK (status IN ('ACTIVE','INACTIVE'))
);

-- =========================
-- E. Messaging / reviews
-- =========================
CREATE TABLE IF NOT EXISTS sb.threads (
    thread_id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sb.thread_participants (
    thread_id BIGINT REFERENCES sb.threads(thread_id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES sb.users(user_id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('TRAVELER','HOST','ADMIN','ASSISTANT')),
    PRIMARY KEY(thread_id, user_id)
);

CREATE TABLE IF NOT EXISTS sb.messages (
    message_id BIGSERIAL PRIMARY KEY,
    thread_id BIGINT REFERENCES sb.threads(thread_id) ON DELETE CASCADE,
    sender_user_id BIGINT REFERENCES sb.users(user_id) ON DELETE CASCADE,
    body TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sb.reviews (
    review_id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT REFERENCES sb.bookings(booking_id) ON DELETE CASCADE,
    reviewer_user_id BIGINT REFERENCES sb.users(user_id) ON DELETE CASCADE,
    reviewee_user_id BIGINT REFERENCES sb.users(user_id) ON DELETE CASCADE,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(booking_id, reviewer_user_id)
);

-- =========================
-- F. Safety / operations
-- =========================
CREATE TABLE IF NOT EXISTS sb.user_locations (
    loc_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES sb.users(user_id) ON DELETE CASCADE,
    captured_at TIMESTAMPTZ,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    accuracy_m DECIMAL(6,2)
);

CREATE TABLE IF NOT EXISTS sb.safety_checkins (
    checkin_id BIGSERIAL PRIMARY KEY,
    traveler_id BIGINT REFERENCES sb.travelers(traveler_id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ,
    checked_at TIMESTAMPTZ,
    status VARCHAR(20) CHECK (status IN ('SCHEDULED','OK','MISSED')),
    note TEXT
);

CREATE TABLE IF NOT EXISTS sb.sos_events (
    sos_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES sb.users(user_id) ON DELETE CASCADE,
    triggered_at TIMESTAMPTZ,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    resolved_at TIMESTAMPTZ,
    status VARCHAR(20) CHECK (status IN ('OPEN','IN_PROGRESS','RESOLVED')),
    details TEXT
);

CREATE TABLE IF NOT EXISTS sb.admin_actions (
    action_id BIGSERIAL PRIMARY KEY,
    admin_user_id BIGINT REFERENCES sb.users(user_id),
    target_type VARCHAR(30),
    target_id BIGINT,
    action VARCHAR(40),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sb.disputes (
    dispute_id BIGSERIAL PRIMARY KEY,
    booking_id BIGINT REFERENCES sb.bookings(booking_id) ON DELETE CASCADE,
    opened_by_user_id BIGINT REFERENCES sb.users(user_id) ON DELETE CASCADE,
    reason TEXT,
    status VARCHAR(20) CHECK (status IN ('OPEN','IN_REVIEW','RESOLVED','REJECTED')),
    opened_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sb.audit_logs (
    audit_id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(60),
    entity VARCHAR(40),
    entity_id BIGINT,
    diff JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================
-- Indexes
-- =========================
CREATE INDEX IF NOT EXISTS idx_listings_host ON sb.listings(host_id);
CREATE INDEX IF NOT EXISTS idx_slots_listing_time ON sb.availability_slots(listing_id, start_ts, end_ts);
CREATE INDEX IF NOT EXISTS idx_bookings_traveler ON sb.bookings(traveler_id);
CREATE INDEX IF NOT EXISTS idx_bookings_listing ON sb.bookings(listing_id, status);
CREATE INDEX IF NOT EXISTS idx_messages_thread_time ON sb.messages(thread_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_uloc_user_time ON sb.user_locations(user_id, captured_at DESC);
