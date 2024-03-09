#!/bin/bash
# Purges the database and solr indexes and re-seeds the database using the seeder container

SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )

if [ ! -f "$SCRIPT_DIR/../explorer.db" ]; then
    echo "explorer.db not found in $SCRIPT_DIR/../"
    exit 1
fi

cd $SCRIPT_DIR/../

docker compose exec db sh -c "psql -U postgres -c 'DROP database charles_explorer_db WITH (FORCE)'"

docker compose exec solr sh -c "solr delete -c class"
docker compose exec solr sh -c "solr delete -c publication"
docker compose exec solr sh -c "solr delete -c person"
docker compose exec solr sh -c "solr delete -c programme"

docker compose --profile='seeder' rm -f
docker compose --profile='seeder' up

./scripts/apply-deltas.sh