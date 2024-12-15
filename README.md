# Cloud Streaming

Ce projet est une plateforme minimaliste de streaming vidéo, conçue pour illustrer la mise en place de services conteneurisés communiquant entre eux. Elle inclut un frontend, un backend, une base de données et un système de monitoring.

## 1. Introduction

Le projet se compose de plusieurs services :

- **Frontend** : Application React servie par Nginx pour gérer l’ajout, la suppression et la visualisation de vidéos.
- **Backend** : API Node.js (Express) gérant les fichiers vidéo et les métadonnées stockées dans une base MySQL.
- **Base de données** : MySQL pour la persistance des informations.
- **Monitoring** : Prometheus pour le suivi des performances. (Grafana et cAdvisor ont été envisagés, mais Prometheus a été retenu pour sa simplicité et l'absence de besoin de compte utilisateur.)

## 2. Dépendances

Pour exécuter ce projet, les outils suivants doivent être installés :

- **Docker** (version 20.10 ou supérieure)
- **Docker Compose** (version 2.0 ou supérieure)
- **Navigateur web** (Firefox, Chrome, etc.)


## 3. Installation

1. Clonez ce dépôt :
   ```bash
   git clone https://github.com/votre-utilisateur/cloud-streaming.git
   cd cloud-streaming
   ```

2. Assurez-vous que Docker est en cours d'exécution.


## 4. Scripts Fournis pour l'utilisation

Voici une description des scripts inclus dans ce projet, leurs objectifs et instructions pour les utiliser. Des vidéos sont disponible dans backend_test/vidéos si vous n'avez pas de mp4.

### 1. **script_dev.sh**

- **Objectif :** Automatiser le démarrage du projet en mode développement.
- **Fonctionnement :**
  - Lance `docker-compose` avec le fichier `docker-compose-test.yml`.
  - Permet de modifier les conteneurs sans impacter les images de production.
  - Supporte la persistance des données : vous pouvez ajouter des vidéos, arrêter les services avec `script_stop.sh`, relancer avec `script_dev.sh`, et retrouver vos vidéos intactes.

**Utilisation :**
```bash
./script_dev.sh
```

### 2. **script_prod.sh**

- **Objectif :** Automatiser le déploiement en mode production.
- **Fonctionnement :**
  - Utilise `docker-compose-prod.yml` pour démarrer les services en mode stable.
  - Les images sont téléchargées depuis un registry Docker distant.
  - Supporte la persistance des données comme en mode dev, mais il est nécessaire d'utiliser `script_stop.sh` pour nettoyer les services avant de passer du mode dev au mode prod ou inversement.

**Utilisation :**
```bash
./script_prod.sh
```

### 3. **script_stop.sh**

- **Objectif :** Arrêter et supprimer tous les conteneurs liés au projet.
- **Fonctionnement :**
  - Arrête tous les services et nettoie les volumes si nécessaire.

**Utilisation :**
```bash
./script_stop.sh
```

### 4. **supprimer_tout_le_projet.sh**

- **Objectif :** Supprimer entièrement le projet.
- **Fonctionnement :**
  - Supprime les images Docker, les volumes et les fichiers de configuration associés au projet.

**Utilisation :**
```bash
./supprimer_tout_le_projet.sh
```

Ces scripts simplifient les étapes de gestion des environnements de développement et de production tout en automatisant les processus répétitifs.


## 5. Utilisation avec Docker Compose

### Mode développement

- Commande pour lancer le mode développement :
  ```bash
  docker-compose -f docker-compose-test.yml up --build
  ```
- Ajoutez des vidéos via l’interface web, arrêtez les services avec `script_stop.sh`, puis relancez avec `script_dev.sh`. La persistance des vidéos est garantie.
- Accédez à l'application sur [http://localhost:8080](http://localhost:8080).

### Mode production

- Commande pour lancer le mode production :
  ```bash
  docker-compose -f docker-compose-prod.yml up
  ```
- Comme en mode développement, les vidéos ajoutées sont conservées grâce à la persistance des données. Cependant, il est important de lancer `script_stop.sh` avant de passer du mode développement au mode production (ou inversement).

## 6. Monitoring avec Prometheus

- Accédez à l’interface de Prometheus sur [http://localhost:9090](http://localhost:9090) pour visualiser les métriques des conteneurs.







## 7. Intégration Kubernetes

Les tests réalisés avec Minikube pour exécuter ce projet sur Kubernetes ont été documentés dans un fichier séparé : `k8s.MD`. Ce fichier contient les détails des configurations et des résultats obtenus.

Bien que le site ait pu être rendu fonctionnel, certains problèmes ont été identifiés :

- **Crashs du frontend** : Erreurs liées à l’intégration de Nginx dans le conteneur frontend.
- **Requêtes GET et POST** : Échec des appels à la base de données depuis le backend.

Pour plus de détails, consultez le fichier `k8s.MD` dans le dépôt.







## 8. Commandes utilisés pour build et push les images

docker-compose-test.yml qui build les images, une fois fait, les images sont disponibles localement. 
On les tagg et les on pousser vers Docker Hub au fur et a mesure.

Pour le backend (radttal = dans mon cas mon nom d’utilisateur Docker Hub) :

    docker tag radttal/video_backend:dev radttal/video_backend:dev
    docker push radttal/video_backend:dev

Pour le frontend :
    
    docker tag radttal/video_frontend:dev radttal/video_frontend:dev
    docker push radttal/video_frontend:dev

Une fois satisfait de l'avancement on peut les tagger en latest  :

    docker tag radttal/video_backend:dev radttal/video_backend:latest
    docker push radttal/video_backend:latest

    docker tag radttal/video_frontend:dev radttal/video_frontend:latest
    docker push radttal/video_frontend:latest

Cela vous permet d’avoir des images accessibles depuis n’importe où pour le docker-compose-prod:yml
    
    docker-compose -f docker-compose-prod.yml up --build


