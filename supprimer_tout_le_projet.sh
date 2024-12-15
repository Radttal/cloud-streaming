#!/bin/bash

echo "Arrêt et suppression des conteneurs Docker..."
docker compose -f docker-compose-test.yml down
docker compose -f docker-compose-prod.yml down

echo "Nettoyage terminé."
