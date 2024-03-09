#!/bin/sh

docker compose exec db sh -c "psql -U postgres  -c '\c charles_explorer_db' -c \"$(cat ./packages/db-delta/delta.sql | sed 's/\"/\\\"/g')\""