# Trace des étapes d’intégration Kubernetes pour le projet

## Contexte
Ce document présente un retour d’expérience sur l’intégration de Kubernetes dans le projet de plateforme de streaming vidéo. Il inclut les étapes effectuées, les décisions prises, les succès obtenus ainsi que les problèmes rencontrés.

---

## Objectif
L’objectif principal était de migrer l’application initiale, basée sur Docker Compose, vers une architecture orchestrée par Kubernetes. Cette migration vise une meilleure scalabilité, résilience et séparation des concernes entre les services.

---

## État Initial
- **Application existante** :
  - Backend en Node.js (Express) avec une base de données MySQL.
  - Frontend en React servie via NGINX.
  - Configuration initiale en Docker Compose.
- **Problèmes identifiés** :
  - Difficulté à gérer les dépendances entre services dans un environnement de production.
  - Besoin d’une solution plus robuste pour la gestion des volumes persistants.

---

## Étapes Suivies

### 1. Démarrage de Minikube
Pour déployer l’application sur Kubernetes, j’ai commencé par configurer Minikube :
- **Pourquoi Minikube ?** :
  - Il permet de simuler un cluster Kubernetes localement pour les tests et débogages.
- Commandes exécutées :
  ```bash
  eval $(minikube docker-env)
  minikube start --memory=4096 --cpus=2
  ```
- **Problème rencontré** : Le contexte Kubernetes n’était pas correctement configuré. Correction faite avec :
  ```bash
  kubectl config use-context minikube
  ```
- **Résultat obtenu** :
  ```bash
  $ minikube profile list
  |--------------|-----------|---------|--------------|------|---------|---------|-------|----------------|--------------------|
  |   Profile    | VM Driver | Runtime |      IP      | Port | Version | Status  | Nodes | Active Profile | Active Kubecontext |
  |--------------|-----------|---------|--------------|------|---------|---------|-------|----------------|--------------------|
  | dev-cluster  | docker    | docker  | 192.168.58.2 | 8443 | v1.31.0 | Running |     1 |                |                    |
  | minikube     | docker    | docker  | 192.168.49.2 | 8443 | v1.31.0 | Running |     1 | *              |                    |
  | prod-cluster | docker    | docker  | 192.168.67.2 | 8443 | v1.31.0 | Running |     1 |                | *                  |
  |--------------|-----------|---------|--------------|------|---------|---------|-------|----------------|--------------------|
  ```

### 2. Construction et Poussée des Images Docker
- **Frontend** :
  ```bash
  cd frontend_test
  docker build -t radttal/myapp_frontend:dev .
  docker push radttal/myapp_frontend:dev
  ```
- **Backend** :
  ```bash
  cd backend_test
  docker build -t radttal/myapp_backend:dev .
  docker push radttal/myapp_backend:dev
  ```

**Problèmes rencontrés** :
- Configuration incorrecte de l’image NGINX pour le frontend, causant des erreurs de démarrage.

### 3. Application des Manifests Kubernetes
- J’ai utilisé des fichiers YAML pour définir les déploiements et services.
- Commandes exécutées :
  ```bash
  kubectl apply -f db-pvc.yaml
  kubectl apply -f videos-pvc.yaml
  kubectl apply -f db-deployment.yaml
  kubectl apply -f db-service.yaml
  kubectl apply -f backend-deployment.yaml
  kubectl apply -f backend-service.yaml
  kubectl apply -f frontend-deployment.yaml
  kubectl apply -f frontend-service.yaml
  ```

**Observations** :
- Les volumes persistants pour la base de données et les vidéos ont été créés correctement.
- Les services ont exposé les pods comme prévu.

### 4. Débogage des Pods
#### Frontend
- **Problème** : CrashLoopBackOff récurrent du pod frontend.
- **Hypothèse** : La combinaison NGINX + frontend dans un même conteneur provoquait des conflits.
- **Solution envisagée** : Séparer NGINX et le frontend en deux conteneurs distincts.

#### Backend
- **Problème** : Échecs des requêtes POST/GET vers la base de données.
- **Analyse** :
  - Les logs ont révélé une erreur de configuration du service ClusterIP.
  - Correction apportée dans le fichier `backend-service.yaml`.

### 5. Tests des Services
- Commande utilisée pour accéder au service frontend :
  ```bash
  minikube service frontend
  ```
- **Résultat obtenu** :
  ```bash
  |-----------|----------|-------------|---------------------------|
  | NAMESPACE |   NAME   | TARGET PORT |            URL            |
  |-----------|----------|-------------|---------------------------|
  | default   | frontend |          80 | http://192.168.49.2:30268 |
  |-----------|----------|-------------|---------------------------|
  ```
- **Vérification des pods** :
  ```bash
  $ kubectl get pods
  NAME                        READY   STATUS             RESTARTS      AGE
  backend-85f474c485-dw5rd    1/1     Running            2 (49s ago)   8m42s
  db-6f6d899467-nkx2b         1/1     Running            2 (48s ago)   8m18s
  frontend-859697b49d-zjkb7   1/1     Running            2 (48s ago)   7m25s
  ```
- **Vérification des services** :
  ```bash
  $ kubectl get svc
  NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
  backend      ClusterIP   10.99.233.91    <none>        5000/TCP       9m3s
  db           ClusterIP   10.105.249.9    <none>        3306/TCP       8m37s
  frontend     NodePort    10.99.182.104   <none>        80:32103/TCP   7m52s
  kubernetes   ClusterIP   10.96.0.1       <none>        443/TCP        19m
  ```
- **Vérification des PVC** :
  ```bash
  $ kubectl get pvc -n default
  NAME         STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   AGE
  db-pvc       Bound    pvc-c709ec52-ca03-4c95-bb1d-769c36d88bb2   1Gi        RWO            standard       13s
  videos-pvc   Bound    pvc-9b910edd-1228-4668-943b-752c4f945d1a   1Gi        RWO            standard       13s
  ```

---

## Résultats et Enseignements

### Résultats Positifs
1. **Modularité accrue** : Chaque composant de l’application a été isolé dans son propre pod.
2. **Gestion des volumes** : Les PersistentVolumeClaims ont fonctionné comme attendu.

### Problèmes Restants
1. **Crash du Frontend** :
   - Le frontend fonctionne brièvement après le redémarrage, mais finit par entrer dans un état d’erreur.
   - Commandes exécutées et résultats :
     ```bash
     /kubernetes$ kubectl get pods -n default
     NAME                        READY   STATUS    RESTARTS       AGE
     backend-b655bf7b4-qnr6x     1/1     Running   5 (99s ago)    32m
     db-6f6d899467-xv6sw         1/1     Running   1 (105s ago)   90m
     frontend-84dccfd79d-qcv59   0/1     Error     2 (26s ago)    90m

     /kubernetes$ kubectl get pods -n default
     NAME                        READY   STATUS             RESTARTS       AGE
     backend-b655bf7b4-qnr6x     1/1     Running            5 (119s ago)   33m
     db-6f6d899467-xv6sw         1/1     Running            1 (2m5s ago)   90m
     frontend-84dccfd79d-qcv59   0/1     CrashLoopBackOff   2 (22s ago)    90m

     /kubernetes$ kubectl get pods -n default
     NAME                        READY   STATUS    RESTARTS        AGE
     backend-b655bf7b4-qnr6x     1/1     Running   5 (2m6s ago)    33m
     db-6f6d899467-xv6sw         1/1     Running   1 (2m12s ago)   90m
     frontend-84dccfd79d-qcv59   1/1     Running   3 (29s ago)     90m
     ```
   - Nécessité de revoir la stratégie de déploiement pour NGINX.
2. **Instabilité Backend-BDD** : Communication intermittente entre le backend et la base de données.

---

## Conclusion
Ce retracement met en évidence les points forts et les limites de l’intégration Kubernetes pour ce projet. Bien que les objectifs principaux aient été partiellement atteints, des ajustements techniques restent à effectuer pour améliorer la stabilité et les performances de l’application.
