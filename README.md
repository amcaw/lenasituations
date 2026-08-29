# Léna Situations — dix ans de vlogs d'août

Visualisation interactive des dix saisons de « vlogs d'août » de Léna Situations
(2017-2026) : 276 épisodes, un anneau par saison, un secteur par jour du mois.

**En ligne : https://amcaw.github.io/lenasituations**

## Lancer en local

```bash
npm install
npm run dev
```

## Construire

```bash
npm run build          # sortie dans build/
BASE_PATH=/lenasituations npm run build   # pour GitHub Pages
```

Le déploiement se fait automatiquement à chaque push sur `main`
(`.github/workflows/deploy.yml`).

## Données

`static/data/` contient quatre fichiers produits par le pipeline d'extraction
(yt-dlp pour les métadonnées YouTube, Internet Archive pour l'historique
d'abonnés) :

| Fichier | Contenu |
| --- | --- |
| `videos.json` | une fiche par épisode : date, durée, vues, likes, commentaires, courbe de rétention |
| `seasons.json` | les agrégats par saison |
| `markers.json` | les repères éditoriaux placés sur le cercle |
| `subs.json` | l'historique du nombre d'abonnés |

Extraction du 29 août 2026. La saison 10 est en cours : elle se termine le
31 août 2026.

## Raccourcis

- **Clic** sur une case : ouvre la vidéo au centre du cercle
- **Flèches** : épisode précédent / suivant, saison précédente / suivante
- **Échap** ou clic ailleurs : referme
