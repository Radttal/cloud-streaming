#!/bin/bash

# Ce script automatise le déploiement du projet Cloud Streaming pour la version de test

#  S'il ne veux pas se lancer 
    #chmod +x script.sh

# Arrêter le script en cas d'erreur
set -e

# Lancer les conteneurs Docker
printf "Lancement des conteneurs Docker...\n"

#  Alternativement si vous avez une version recent dubuntu il est probable qu'il faille changer "docker-compose" en "docker compose"  
docker compose -f docker-compose-test.yml up --build -d

printf "Attente de la disponibilité des services...\n"

# Boucle pour vérifier si le frontend est accessible
ATTEMPTS=0
MAX_ATTEMPTS=10

while ! curl -s http://localhost > /dev/null; do
  ATTEMPTS=$((ATTEMPTS+1))
  if [ $ATTEMPTS -ge $MAX_ATTEMPTS ]; then
    echo "Le service frontend n'est pas encore disponible."
    exit 1
  fi
  printf "Tentative %d/%d : Le frontend n'est pas encore disponible...\n" "$ATTEMPTS" "$MAX_ATTEMPTS"
  sleep 5
done

# Ouvrir l'application dans le navigateur par défaut
printf "Ouverture de l'application dans le navigateur...\n"
# fonctionne ne soit xdg-open "http://localhost" || open "http://localhost"
gio open "http://localhost" || xdg-open "http://localhost:8080" || open "http://localhost:8080" || echo "Impossible d'ouvrir le navigateur automatiquement."

printf "\nDéploiement terminé.\n"
