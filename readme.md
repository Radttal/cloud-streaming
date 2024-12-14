# Ce projet est une plateforme de streaming vidéo simple permetant de sauvgarder ses vidéos, composée de plusieurs services :

- **frontend** : Une application React (buildée puis servie par Nginx) pour afficher les vidéos, uploader de nouvelles vidéos, et maintenant supprimer des vidéos.
- **backend** : Une API Node.js (Express) qui gère les vidéos, se connecte à une base de données MySQL pour stocker les métadonnées (titres, noms de fichier), et sert les fichiers vidéo. Elle permet également l’upload et la suppression.
- **db (MySQL)** : Une base de données MySQL pour stocker les informations sur les vidéos.
- **prometheus** : Services de monitoring pour visualiser la consommation des conteneurs et les métriques du système. (grafana & cadvisor on été aussi étudié mais prometheus ne demande pas de compte)
        

## Usage Classique

### en mode dev

Lancer le projet dans sa version de test, on y peut effectuer des changements sans impacts pour les images de ce projets

    docker-compose -f docker-compose-test.yml up --build
       
dans mon cas j'utilise la commande suivante :
    docker compose -f docker-compose-test.yml up --build

    une fois que le conteneur du backend indique 
        projet-backend     | Backend running on port 5000
    Vous pouvez consulter le site en allant sur localhost

         une video.mp4 devrait etre dans backend_test/videospour tester l'ajout d'une viéo(comunication entre back; front ; et bdd)

    redirigé par nginx sur la page web on peut ajouter, visionner, ou supprimer des videos .mp4.
         

    Pour voir la consomation du conteneur backend , le service de  monitoring de Prometheus est dispo ,  permet d'utiliser des requêtes PromQL

        vous pouvez accéder à Prometheus sur http://localhost:9090
            Dans l'onglet graph , executer par exemple 
            - process_cpu_seconds_total 
            - sum by (instance) (process_cpu_seconds_total)



### En mode prod

    Les images on été tagé et push vers mon registry Docker, l'utilisation de docker-compose-prod va tirrer ces images du net pour afficher la version stable

    docker-compose -f docker-compose-prod.yml up --build

    puis acceder a localhost pour voir le site



////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////
Commandes utilisés pour build et push les images
////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////

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


/////////////////////////////////////////////////////////////////////////////////
////////////////// Test d'intégration d'une partie kubernetes ///////////////////
/////////////////////////////////////////////////////////////////////////////////
                    

Et k8s dans tout ça ? J'ai tester, j'avais le site qui tournais, mais les appels a la bdd post et get ne voulais pas passer
j'ai pas réussis a pouvoir avoir une verisoin stable à montrer 

au lieu d'avoir des docker-compose, on a des Manifests Kubernetest, l'idée est de décrire l'état de l'aplication dans les .yaml puis des les appliqué a un cluster

L'un des points qui a du me limiter est mon envie de mettre nginx dans le meme conteneur que le frontend, j'avais des erreurs lunaires que j'ai pas compris
J'avais mon front qui ne voulais pas arreter de crash mais jai pas réussis a diagnostiquer pourquoi (certainement avoir mis nginx dedans n'a pas aider)
(et m'y prendre trop tard aussi, trop peu de temps pour tout debbug c'est ma faute)

/////////////////////////////////////////////////////////////////////////////////
///////////////////  Cimetiere d'expérimentation k8s  ///////////////////////////
/////////////////////////////////////////////////////////////////////////////////

Il n'y à pas toutes les commandes faites, surtout celle que j'ai utilisé le plus que je voulais garder sous la main; on y voie mes réussites et mes soucis


on commence par faire 
    minikube start

J'ai du modifier le default.conf , on utilise les images par les docker-compose donc on les push
    cd frontend_test
    docker build -t radttal/myapp_frontend:dev .
    docker push radttal/myapp_frontend:dev

Commande faites avec minikub pour k8s

    minikube start --memory=4096 --cpus=2

Pour utiliser le deamon de docker dans minikube 
     eval $(minikube docker-env)
    

verifier le context kubectl config current-context
    si c 'est pas minikune qui apparait alors :
        kubectl config use-context minikube

Démarrer Minikube avec le bon profile
    minikube start -p prod-cluster
    minikube start -p dev-cluster


Les clusters Minikube sont bien configurés :

$ minikube profile list
|--------------|-----------|---------|--------------|------|---------|---------|-------|----------------|--------------------|
|   Profile    | VM Driver | Runtime |      IP      | Port | Version | Status  | Nodes | Active Profile | Active Kubecontext |
|--------------|-----------|---------|--------------|------|---------|---------|-------|----------------|--------------------|
| dev-cluster  | docker    | docker  | 192.168.58.2 | 8443 | v1.31.0 | Running |     1 |                |                    |
| minikube     | docker    | docker  | 192.168.49.2 | 8443 | v1.31.0 | Running |     1 | *              |                    |
| prod-cluster | docker    | docker  | 192.168.67.2 | 8443 | v1.31.0 | Running |     1 |                | *                  |
|--------------|-----------|---------|--------------|------|---------|---------|-------|----------------|--------------------|


minikube service frontend -n default                    #le site fonctionnais, mais en faite non
|-----------|----------|-------------|---------------------------|
| NAMESPACE |   NAME   | TARGET PORT |            URL            |
|-----------|----------|-------------|---------------------------|
| default   | frontend |          80 | http://192.168.49.2:30268 |      
|-----------|----------|-------------|---------------------------|
🎉  Ouverture du service default/frontend dans le navigateur par défaut...

Dans le dossier k8s il y a : 
    ls kubernetes/
    backend-deployment.yaml
    backend-service.yaml
    frontend-deployment.yaml
    frontend-service.yaml
    db-deployment.yaml
    db-service.yaml
    videos-pvc.yaml
    db-pvc.yaml

Une fois écrit , il faut les appliquer  commencer par se deplacer dans /kubernetes et faire 
    kubectl apply -f backend-deployment.yaml
    kubectl apply -f backend-service.yaml
    kubectl apply -f db-deployment.yaml
    kubectl apply -f db-service.yaml
    kubectl apply -f frontend-deployment.yaml
    kubectl apply -f frontend-service.yaml
    kubectl apply -f db-pvc.yaml
    kubectl apply -f videos-pvc.yaml

    /projet/kubernetes$ kubectl apply -f backend-deployment.yaml
    deployment.apps/backend created
    /projet/kubernetes$ kubectl apply -f backend-service.yaml
    service/backend created
    /projet/kubernetes$ kubectl apply -f db-deployment.yaml 
    deployment.apps/db created
    /projet/kubernetes$ kubectl apply -f db-pvc.yaml 
    persistentvolumeclaim/db-pvc created
    /projet/kubernetes$ kubectl apply -f db-service.yaml 
    service/db created
    /projet/kubernetes$ kubectl apply -f frontend-deployment.yaml 
    deployment.apps/frontend created
    /projet/kubernetes$ kubectl apply -f frontend-service.yaml 
    service/frontend created
    /projet/kubernetes$ kubectl apply -f videos-pvc.yaml 
    persistentvolumeclaim/videos-pvc created



Vérifiez le déploiement
    Vérifiez les pods :
        $kubectl get pods
        NAME                        READY   STATUS             RESTARTS      AGE
        backend-85f474c485-dw5rd    1/1     Running            2 (49s ago)   8m42s
        db-6f6d899467-nkx2b         1/1     Running            2 (48s ago)   8m18s
        frontend-859697b49d-zjkb7   1/1     Running            2 (48s ago)   7m25s
  
        kubectl get pods -n default --show-labels
        NAME                        READY   STATUS    RESTARTS   AGE     LABELS
        backend-b655bf7b4-qnr6x     1/1     Running   0          2m22s   app=backend,pod-template-hash=b655bf7b4
        db-6f6d899467-xv6sw         1/1     Running   0          59m     app=db,pod-template-hash=6f6d899467
        frontend-84dccfd79d-qcv59   1/1     Running   0          59m     app=frontend,pod-template-hash=84dccfd79d


    Vérifiez les services :
        $kubectl get svc
        NAME         TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
        backend      ClusterIP   10.99.233.91    <none>        5000/TCP       9m3s
        db           ClusterIP   10.105.249.9    <none>        3306/TCP       8m37s
        frontend     NodePort    10.99.182.104   <none>        80:32103/TCP   7m52s
        kubernetes   ClusterIP   10.96.0.1       <none>        443/TCP        19m

    Vérifiez les PVC (PersistentVolumeClaims) :
        kubectl get pvc -n default
        NAME         STATUS   VOLUME                                     CAPACITY   ACCESS MODES   STORAGECLASS   VOLUMEATTRIBUTESCLASS   AGE
        db-pvc       Bound    pvc-c709ec52-ca03-4c95-bb1d-769c36d88bb2   1Gi        RWO            standard       <unset>                 13s
        videos-pvc   Bound    pvc-9b910edd-1228-4668-943b-752c4f945d1a   1Gi        RWO            standard       <unset>                 13s


Verification de l'endpoint du backend :
        $ kubectl get endpoints backend -n default
        NAME      ENDPOINTS         AGE
        backend   10.244.0.7:5000   79m




J'avais mon front qui ne voulais pas arreter de crash mais jai pas réussis a diagnostiquer pourquoi 

projet/kubernetes$ kubectl get pods -n default                          # tout charge, le site est up et visionnable
    NAME                        READY   STATUS    RESTARTS      AGE
    backend-b655bf7b4-qnr6x     1/1     Running   5 (93s ago)   32m
    db-6f6d899467-xv6sw         1/1     Running   1 (99s ago)   89m
    frontend-84dccfd79d-qcv59   1/1     Running   2 (20s ago)   89m

/kubernetes$ kubectl get pods -n default
    NAME                        READY   STATUS    RESTARTS       AGE
    backend-b655bf7b4-qnr6x     1/1     Running   5 (99s ago)    32m
    db-6f6d899467-xv6sw         1/1     Running   1 (105s ago)   90m
    frontend-84dccfd79d-qcv59   0/1     Error     2 (26s ago)    90m    ## ne veux pas arreter d'être chiant, trop peu de logs ; pas compris

/kubernetes$ kubectl get pods -n default
    NAME                        READY   STATUS             RESTARTS       AGE
    backend-b655bf7b4-qnr6x     1/1     Running            5 (119s ago)   33m
    db-6f6d899467-xv6sw         1/1     Running            1 (2m5s ago)   90m
    frontend-84dccfd79d-qcv59   0/1     CrashLoopBackOff   2 (22s ago)    90m

/kubernetes$ kubectl get pods -n default
    NAME                        READY   STATUS    RESTARTS        AGE
    backend-b655bf7b4-qnr6x     1/1     Running   5 (2m6s ago)    33m
    db-6f6d899467-xv6sw         1/1     Running   1 (2m12s ago)   90m
    frontend-84dccfd79d-qcv59   1/1     Running   3 (29s ago)     90m   # se remet a fonctionner mais ne veux pas fonctionner; post et get passe pas
