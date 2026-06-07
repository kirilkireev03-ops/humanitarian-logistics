-- Run once after PostgreSQL is installed (adjust password if you chose another during setup):
-- psql -U postgres -f scripts\init-postgres-logistics.sql

CREATE USER logistics WITH PASSWORD 'logistics';
CREATE DATABASE logistics OWNER logistics;
GRANT ALL PRIVILEGES ON DATABASE logistics TO logistics;
