# My Fixes

Voici la liste de mes corrections personnelles intégrées au projet.

## Fichiers modifiés

### `js/accounts/auth.js`
- **Bug initial** : L'application plantait (CORS/502) si le serveur d'authentification (`auth.monochrome.tf`) était indisponible.
- **Fix** : Ajout d'un bloc `try/catch` autour de l'appel `authClient.getSession()`. En cas d'erreur réseau, l'application ignore silencieusement l'erreur et démarre en mode déconnecté.

### `js/player.js`
- **Bug initial** : L'enchaînement des pistes manquait parfois de fiabilité, et les timeouts de chargement de l'audio pouvaient causer des blocages silencieux.
- **Fix** : 
  1. Ajout de gestionnaires d'événements `ended` sur les éléments audio et vidéo pour forcer le passage à la piste suivante.
  2. Amélioration de la logique de préchargement avec `Promise.race` et un délai strict (3000ms) dans `waitForCanPlayOrTimeout` pour éviter les attentes infinies.
  3. Gestion du timeout de lecture via `_playNextTimeout` pour garantir le passage fluide.

### `vite.config.ts`
- **Bug initial** : Le développement local peinait à accéder aux flux audio et aux fonctions API à cause de requêtes bloquées par CORS ou mal routées.
- **Fix** : Ajout de règles de proxy pour `/api/stream` et `/functions` afin de les rediriger vers `https://monochrome.tf` avec changement d'origine (`changeOrigin: true`).

---

## Comment mettre à jour avec l'Upstream

Pour intégrer les nouveautés du dépôt officiel `monochrome-music/monochrome` sans écraser ces patchs, utilisez la commande suivante :

```bash
git fetch upstream && git merge upstream/main
```

En cas de conflit, assurez-vous de toujours conserver **vos** modifications sur ces fichiers.
