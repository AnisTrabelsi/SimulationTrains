# Simulateur de Train Avancé

## Collaborateurs
- Anis Trabelsi (12308570)
- Zeineb Boujmil (12306651)

## Bugs et Non-Respect des Consignes sur la Première Partie
- Bug: Les animaux ne reprennent pas leur mouvement après une pause.
- Non-respect des consignes: Aucun.

## Vitesse du Train
Un prompt apparaîtra pour vous demander de saisir la vitesse du train en l'ajoutant, influençant directement sa rapidité de déplacement sur le plateau.

## Gestion des Trains et Collisions
### Collisions
Lorsque deux trains se rencontrent sur le même segment de rail, une collision se produit. Cette collision est accompagnée d'une animation d'explosion et de sons dramatiques pour marquer l'événement. Après l'explosion, une épave est laissée sur le rail, représentant les ruines des trains détruits. Cette épave reste visible pour rappeler la collision et ajouter un élément visuel de ruine sur le plateau.
### Obstacles
Si un train rencontre un obstacle tel qu'un rail inapproprié, ou des éléments naturels comme de l'eau ou une forêt, il explosera également. Cette explosion est aussi visualisée et sonorisée pour renforcer l'impact de l'événement. Dans le cas d'une collision avec la forêt, les ruines du train apparaîtront parmi les arbres, ajoutant une couche de réalisme et de complexité visuelle au jeu.

## Animations et Sons
### Événements Sonores
Des effets sonores sont joués lors de l'insertion de trains, lorsqu'ils tournent sur les rails, lors des collisions, s'ils tombent dans l'eau ou lors d'explosions pour enrichir l'expérience de jeu et fournir des indices auditifs sur les événements du jeu.

### Son Tchou Tchou
Le son "tchou tchou" se lance de façon aléatoire lorsqu'il y a un train, ajoutant une touche de réalisme et de surprise à l'environnement sonore du jeu.

## Monstres et Animaux

### Monstres
Des créatures se déplacent aléatoirement sur le plateau et interagissent avec les trains. Si un train et un monstre se rencontrent, le monstre est éliminé, illustrant une collision.

### Animaux
Les animaux comme le lapin et la tortue se déplacent à des vitesses différentes le long des rails. Ils offrent un élément visuel divertissant sans impact direct sur le gameplay des trains.

## Boutons d'Outil

### Sélection
Utilisez les boutons pour choisir différents outils tels que différents types de rails ou des options de train. Cela vous permet de modifier l'environnement du plateau selon vos préférences de jeu. D'ailleurs, lorsqu'un outil est sélectionné, le bouton correspondant devient légèrement flou et reste dans un état enfoncé visuellement.

### Changement de Direction de Train
Lorsqu'on désélectionne et on appuie sur le train, le train change de direction.

## Mode Nuit/Jour
### Basculer Manuellement
Un bouton permet de changer manuellement entre le mode nuit et le mode jour, adaptant l'interface pour une visibilité optimale selon l'heure.
### Changement Automatique
Le jeu bascule automatiquement en mode nuit après 21h et revient en mode jour après 6h. Cette fonctionnalité ajoute un élément réaliste de changement de temps, affectant la luminosité et la couleur de l'interface pour refléter l'heure réelle (à partir de 21h : mode nuit / à partir de 6h : mode jour).

Les boutons dans l'interface du jeu réagissent aux interactions de l'utilisateur pour améliorer la lisibilité et l'ergonomie. Lorsque vous passez la souris sur un bouton (mouse over), il change de taille et de couleur.

## Aides Extérieures
- Aucune aide extérieure n'a été utilisée pour la deuxième partie.