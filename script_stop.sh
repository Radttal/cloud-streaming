#!/bin/bash

echo "Arrêt et suppression des conteneurs Docker..."
docker compose -f docker-compose-test.yml stop
docker compose -f docker-compose-prod.yml stop

echo "Nettoyage terminé."
