-- Script de base de datos de PlotSkip / Plotea
-- Generado a partir del modelo actual del backend.
-- Motor objetivo: PostgreSQL

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX ix_refresh_tokens_user_id ON refresh_tokens (user_id);

CREATE TABLE password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX ix_password_reset_tokens_user_id ON password_reset_tokens (user_id);

CREATE TABLE user_media_status (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tmdb_id INTEGER NOT NULL,
    media_type VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_user_media_status_media_type CHECK (media_type IN ('movie', 'tv')),
    CONSTRAINT ck_user_media_status_status CHECK (status IN ('watched', 'watchlist')),
    CONSTRAINT uq_user_media_status_user_media UNIQUE (user_id, tmdb_id, media_type, status)
);

CREATE INDEX ix_user_media_status_user_id ON user_media_status (user_id);

CREATE TABLE watch_log (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tmdb_id INTEGER NOT NULL,
    media_type VARCHAR(10) NOT NULL,
    watched_at DATE NOT NULL,
    rating INTEGER,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_watch_log_media_type CHECK (media_type IN ('movie', 'tv')),
    CONSTRAINT ck_watch_log_rating CHECK (rating IS NULL OR (rating >= 1 AND rating <= 10))
);

CREATE INDEX ix_watch_log_user_id ON watch_log (user_id);

CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tmdb_id INTEGER NOT NULL,
    media_type VARCHAR(10) NOT NULL,
    rating INTEGER NOT NULL,
    body TEXT NOT NULL,
    contains_spoilers BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_reviews_media_type CHECK (media_type IN ('movie', 'tv')),
    CONSTRAINT ck_reviews_rating CHECK (rating >= 1 AND rating <= 10),
    CONSTRAINT uq_reviews_user_media UNIQUE (user_id, tmdb_id, media_type)
);

CREATE INDEX ix_reviews_user_id ON reviews (user_id);

CREATE TABLE comments (
    id BIGSERIAL PRIMARY KEY,
    review_id BIGINT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_comment_id BIGINT REFERENCES comments(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX ix_comments_review_id ON comments (review_id);
CREATE INDEX ix_comments_user_id ON comments (user_id);

CREATE TABLE review_votes (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    review_id BIGINT NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT pk_review_votes PRIMARY KEY (user_id, review_id)
);

CREATE TABLE follows (
    follower_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followed_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT pk_follows PRIMARY KEY (follower_id, followed_id),
    CONSTRAINT ck_follows_no_self_follow CHECK (follower_id <> followed_id),
    CONSTRAINT uq_follows_pair UNIQUE (follower_id, followed_id)
);

CREATE TABLE lists (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(80) NOT NULL,
    description TEXT,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX ix_lists_user_id ON lists (user_id);

CREATE TABLE list_items (
    id BIGSERIAL PRIMARY KEY,
    list_id BIGINT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    added_by_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tmdb_id INTEGER NOT NULL,
    media_type VARCHAR(16) NOT NULL,
    position INTEGER NOT NULL,
    added_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_list_items_media_type CHECK (media_type IN ('movie', 'tv')),
    CONSTRAINT uq_list_items_media UNIQUE (list_id, tmdb_id, media_type)
);

CREATE INDEX ix_list_items_list_id ON list_items (list_id);
CREATE INDEX ix_list_items_added_by_user_id ON list_items (added_by_user_id);

CREATE TABLE list_collaborators (
    id BIGSERIAL PRIMARY KEY,
    list_id BIGINT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invited_by_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uq_list_collaborators_pair UNIQUE (list_id, user_id)
);

CREATE INDEX ix_list_collaborators_list_id ON list_collaborators (list_id);
CREATE INDEX ix_list_collaborators_user_id ON list_collaborators (user_id);

CREATE TABLE list_invitations (
    id BIGSERIAL PRIMARY KEY,
    list_id BIGINT NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    inviter_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    invitee_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(16) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL,
    responded_at TIMESTAMPTZ,
    CONSTRAINT ck_list_invitations_status CHECK (status IN ('pending', 'accepted', 'denied'))
);

CREATE INDEX ix_list_invitations_list_id ON list_invitations (list_id);
CREATE INDEX ix_list_invitations_invitee_user_id ON list_invitations (invitee_user_id);

CREATE TABLE activities (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(32) NOT NULL,
    review_id BIGINT REFERENCES reviews(id) ON DELETE CASCADE,
    watch_log_id BIGINT REFERENCES watch_log(id) ON DELETE CASCADE,
    followed_user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    list_id BIGINT,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_activities_type CHECK (activity_type IN ('review', 'watch_log', 'follow', 'list_created'))
);

CREATE INDEX ix_activities_user_id ON activities (user_id);
CREATE INDEX ix_activities_user_created ON activities (user_id, created_at, id);

CREATE TABLE user_favorite_media (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    tmdb_id INTEGER NOT NULL,
    media_type VARCHAR(16) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_user_favorite_media_position CHECK (position >= 0 AND position <= 3),
    CONSTRAINT uq_user_favorite_media_user_position UNIQUE (user_id, position)
);

CREATE INDEX ix_user_favorite_media_user_id ON user_favorite_media (user_id);

CREATE TABLE push_devices (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expo_push_token VARCHAR(255) NOT NULL UNIQUE,
    platform VARCHAR(16) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_push_devices_platform CHECK (platform IN ('android', 'ios'))
);

CREATE INDEX ix_push_devices_user_id ON push_devices (user_id);
CREATE INDEX ix_push_devices_expo_push_token ON push_devices (expo_push_token);
