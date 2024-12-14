import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';

const MainApp = () => {
    const [videos, setVideos] = useState([]);
    const [title, setTitle] = useState('');
    const [videoFile, setVideoFile] = useState(null);

    useEffect(() => {
        fetch('/api/videos')
            .then((response) => response.json())
            .then((data) => setVideos(data))
            .catch((error) => console.error('Error fetching videos:', error));  //c'est cette ligne qui faisait tout peter avec k8s
    }, []);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!videoFile) {
            alert("Veuillez sélectionner une vidéo.");
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('video', videoFile);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            if (response.ok) {
                // Recharger la liste des vidéos après upload
                const data = await fetch('/api/videos').then(res => res.json());
                setVideos(data);
                setTitle('');
                setVideoFile(null);
                alert("Vidéo uploadée avec succès !");
            } else {
                alert("Erreur lors de l'upload de la vidéo.");
            }
        } catch (error) {
            console.error('Error uploading video:', error);
        }
    }

    return (
        <div>
            <h1>Bienvenue sur la plateforme de streaming</h1>
            <h2>Uploadez vos vidéos ici (format mp4) </h2>
            <form onSubmit={handleUpload} style={{ marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="Titre de la vidéo"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
                <input
                    type="file"
                    accept="video/mp4,video/x-m4v,video/*"
                    onChange={(e) => setVideoFile(e.target.files[0])}
                    required
                />
                <button type="submit">Uploader</button>
            <h3>Vos vidéos ci dessous</h3>
            </form>
            {videos.length > 0 ? (
                videos.map((video) => (
                    <div key={video.id}>
                        <h3>{video.title}</h3>
                        <video width="400" controls>
                            <source src={video.url} type="video/mp4" />
                        </video>
                        <button onClick={async () => {
                            const response = await fetch(`/api/videos/${video.id}`, {
                                method: 'DELETE'
                            });
                            if (response.ok) {
                                const updatedVideos = await fetch('/api/videos').then(res => res.json());
                                setVideos(updatedVideos);
                            } else {
                                alert("Erreur lors de la suppression de la vidéo.");
                            }
                        }}>Supprimer</button>
                    </div>
                ))
            ) : (
                <p>Aucune vidéo uploadée pour le moment, ajoutez en !</p>
            )}
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<MainApp />);