import express from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import multer from 'multer';  
import fs from 'fs/promises'; // pour la suppression de fichier
import { register, collectDefaultMetrics } from 'prom-client'; // pour les metrics du conteneur 

// collecte des métriques sur la mémoire, le CPU ect
collectDefaultMetrics();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



/////////////////////////////////////////////////////////////////
//connection à la BDD 
let connection;
for (let i = 0; i < 10; i++) {
  try {
    connection = await mysql.createConnection({
      host: 'db',
      user: 'myuser',   //nom generique
      password: 'password',
      database: 'myapp_db'
    });
    break; // Connexion réussie
  } catch (err) {
    console.log("DB non prête, nouvelle tentative dans 5s...");
    await new Promise(r => setTimeout(r, 5000));
  }
}

if (!connection) {
  console.error("Impossible de se connecter à la DB après plusieurs tentatives.");
  process.exit(1); // On arrête le backend car impossible de se connecter
}


const app = express();
// Middleware pour parser les requêtes JSON
app.use(bodyParser.json());


//les vidéos seront sance dans /app/videos
// repertoire a voir dans l'image docker, sera monté sur un volume
const upload = multer({ dest: '/app/videos' });



////////////////////////////////////////////////////////////////
// Les differents endpoints pour faire des requetes 


// Endpoint pour récupérer la liste des vidéos
app.get('/api/videos', async (req, res) => {
    console.log('Received GET /api/videos request');  
    const [rows] = await connection.query('SELECT id, title, filename FROM videos');
    const videos = rows.map(row => ({
      id: row.id,
      title: row.title,
      url: `/api/videos/${row.filename}`
    }));
    res.json(videos);
  });


// Endpoint pour uploader une vidéo
// On devrais recevoir form-data avec "video" et "title"
app.post('/api/upload', upload.single('video'), async (req, res) => {
    console.log('Received POST /api/upload request');
    const title = req.body.title;
    const filename = req.file.filename; // multer donne un nom unique au fichier
    // Insertion en BDD du titre et du nom de fichier
    await connection.query('INSERT INTO videos (title, filename) VALUES (?, ?)', [title, filename]);
    res.status(201).send('Video uploaded');
    // avant 
    // res.sendStatus(200);
});


// Endpoint pour supprimer une vidéo
app.delete('/api/videos/:id', async (req, res) => {
  const videoId = req.params.id;

  // Selection de la vidéo dans la BDD
  const [rows] = await connection.query('SELECT filename FROM videos WHERE id = ?', [videoId]);
  if (rows.length === 0) {
      return res.status(404).json({ error: 'Vidéo non trouvée.' });
  }
  const filename = rows[0].filename;

  // Suppression de la vidéo avec une requette vers la BDD
  await connection.query('DELETE FROM videos WHERE id = ?', [videoId]);

  // Suppression du fichier physique
  try {
      await fs.unlink(`/app/videos/${filename}`);
  } catch (err) {
      console.error('Erreur lors de la suppression du fichier :', err);
      // On ne bloque pas la réponse si erreur de suppression fichier, mais on log l'erreur
  }

  res.sendStatus(200);
});



// endoint pour visioner les /metrics
app.get('/metrics', async (req, res) => {
    // Expose les métriques au format Prometheus
    res.set('Content-Type', register.contentType);
    res.send(await register.metrics());
});

// endoint pour tester les probres; reste de test pour k8s, qui a pas fonctioné :(
app.get('/health', (req, res) => {
  console.log('Received GET /health request');
  res.status(200).send('OK');
});

app.use('/api/videos', express.static(path.join(__dirname, '../videos')));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on port ${PORT}`);
});