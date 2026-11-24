# Loann l'explorateur

Application privée d'exercices ludiques pour Loann (4 ans, moyenne section, avec de l'avance sur le programme).
Tout est **dit à voix haute** : il n'a pas besoin de savoir lire.

## Les 7 mondes
| Monde | Niveaux (montée automatique) |
|---|---|
| 🔢 Les nombres | compter jusqu'à 5 → 10 → reconnaître les nombres → additions → plus/moins → compter jusqu'à 20 → soustractions |
| 🔤 Les lettres | lettres de LOANN → voyelles → toutes les lettres → premier son → majuscules/minuscules → syllabes → écrire son prénom → reconnaître les prénoms de la famille → écrire les prénoms de la famille → écrire son prénom tout seul (sans modèle) |
| 🎨 Couleurs et formes | 4 couleurs → toutes les couleurs → formes → toutes les formes → forme + couleur → mélanger les couleurs |
| 🧩 Logique | grand/petit → suites simples → l'intrus → suites difficiles → le nombre qui manque |
| 🃏 Mémoire | 3 → 4 → 6 → 8 paires |
| 🇬🇧 English | couleurs → compter jusqu'à 5 → animaux → nombres jusqu'à 10 → la famille → véhicules → le corps → toutes les couleurs |
| 🌍 Le monde | animaux et véhicules → où vivent les animaux → vie de tous les jours → mon corps → comparer → petit savant |

## L'aventure : 53 missions à débloquer dans l'ordre
L'accueil est une **carte** avec 6 chapitres : la caserne des pompiers, la patrouille de police, la ville des super-héros, la jungle, l'espace et la planète des champions.
- Une seule mission est ouverte à la fois. Il faut **3 étoiles sur 5** pour débloquer la suivante.
- Chaque chapitre se termine par un **grand défi** de 8 questions qui mélange tout le chapitre. Il faut 4 étoiles pour le gagner.
- Les missions réussies peuvent être rejouées pour gagner plus d'étoiles. On ne peut pas sauter de mission.
- 3 étoiles ou plus dans une partie font gagner **un autocollant** pour l'album 📒.
- Le programme va de la **moyenne section** (compter jusqu'à 5, les couleurs) à la **grande section** (compter jusqu'à 15, taper les syllabes, premier son des mots, écrire son prénom). Rien ne relève du CP.

## Il apprend avant d'être interrogé
- **📖 Une leçon avant chaque nouvelle mission.** La tablette montre et explique, par exemple en comptant les camions un par un et en montrant le chiffre. Ensuite seulement : « À toi de jouer ! »
- **Quand il se trompe**, la tablette lui dit ce qu'il a touché (« Ça, c'est le 3 »). Sur un comptage, elle **recompte avec lui** en allumant chaque objet. À la 2e erreur, **la bonne réponse brille** et elle explique pourquoi.
- **Mission ratée** : le bouton 📖 refait la leçon avant de réessayer. Une mission réussie a aussi un bouton 📖 pour revoir la leçon.

## L'anglais
Les consignes restent en français ; seuls les mots anglais sont dits avec une **voix anglaise** (« Où est *red* ? »). Chaque leçon montre l'image, le mot écrit, puis le dit en français et en anglais. Si la tablette n'a pas de voix anglaise : Paramètres → Synthèse vocale → installer « English (United Kingdom) ».

## Espace parents
Il s'ouvre avec la petite roue ⚙️ en bas à droite de l'accueil, après une multiplication à résoudre.
- **Mes héros** : ajoutez des images de ses personnages préférés depuis la galerie. Elles apparaissent dans les jeux.
- **Ma famille** : ajoutez papa, maman, frère, sœur, papi, mamie, tonton, tata, copains, l'animal ou le nom de famille, avec une photo si vous voulez. Ces prénoms servent à apprendre à les lire et à les écrire. Sans famille saisie, il écrit PAPA et MAMAN.
- Réglage des niveaux, vitesse de la voix, remise à zéro.

## Tester sur l'ordinateur
```
node serveur-test.js
```
Ouvrez ensuite http://localhost:8080 dans Chrome.

## Fichiers
- `index.html`, `style.css`, `app.js` : l'application
- `manifest.webmanifest`, `sw.js`, `icons/` : installation et fonctionnement hors ligne
