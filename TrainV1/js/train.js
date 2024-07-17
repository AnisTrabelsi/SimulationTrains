'use strict';

// Constantes pour les dimensions du plateau et les cases
const LARGEUR_PLATEAU = 30;
const HAUTEUR_PLATEAU = 15;
const LARGEUR_CASE = 35;
const HAUTEUR_CASE = 40;

// Définition des types de cases
class Type_de_case {
    static Foret = new Type_de_case('foret');
    static Eau = new Type_de_case('eau');
    static Rail_horizontal = new Type_de_case('rail horizontal');
    static Rail_vertical = new Type_de_case('rail vertical');
    static Rail_droite_vers_haut = new Type_de_case('rail droite vers haut');
    static Rail_haut_vers_droite = new Type_de_case('rail haut vers droite');
    static Rail_droite_vers_bas = new Type_de_case('rail droite vers bas');
    static Rail_bas_vers_droite = new Type_de_case('rail bas vers droite');

    constructor(nom) {
        this.nom = nom;
    }
}


// Images des cases spécifiques
const IMAGE_FORET = new Image();
IMAGE_FORET.src = 'images/foret.png';
const IMAGE_EAU = new Image();
IMAGE_EAU.src = 'images/eau.png';
const IMAGE_RAIL_HORIZONTAL = new Image();
IMAGE_RAIL_HORIZONTAL.src = 'images/rail-horizontal.png';
const IMAGE_RAIL_VERTICAL = new Image();
IMAGE_RAIL_VERTICAL.src = 'images/rail-vertical.png';
const IMAGE_RAIL_DROITE_VERS_HAUT = new Image();
IMAGE_RAIL_DROITE_VERS_HAUT.src = 'images/rail-droite-vers-haut.png';
const IMAGE_RAIL_HAUT_VERS_DROITE = new Image();
IMAGE_RAIL_HAUT_VERS_DROITE.src = 'images/rail-haut-vers-droite.png';
const IMAGE_RAIL_DROITE_VERS_BAS = new Image();
IMAGE_RAIL_DROITE_VERS_BAS.src = 'images/rail-droite-vers-bas.png';
const IMAGE_RAIL_BAS_VERS_DROITE = new Image();
IMAGE_RAIL_BAS_VERS_DROITE.src = 'images/rail-bas-vers-droite.png';

// Variables globales
let selectedTool = null;
let trains = [];
let isPaused = false;
let intervalId;
let plateau; // Déplacer la variable plateau ici pour qu'elle soit accessible globalement

// Classe Plateau
class Plateau {

    constructor() {
        this.largeur = LARGEUR_PLATEAU;
        this.hauteur = HAUTEUR_PLATEAU;
        this.cases = [];

        for (let x = 0; x < this.largeur; x++) {
            this.cases[x] = [];
            for (let y = 0; y < this.hauteur; y++) {
                this.cases[x][y] = Type_de_case.Foret;
            }
        }
    }
    modifierCase(x, y, type) {
        this.cases[x][y] = type;
    }

    ajouterTrain(train) {
        trains.push(train);
    }

    avancerTrains() {
        console.log("Avancer trains");
        for (let train of trains) {
            train.avancer(this);
        }
        trains = trains.filter(train => !train.exploded); // Supprimer les trains explosés
    }

    estCaseValidePourTrain(x, y) {
        if (x < 0 || x >= this.largeur || y < 0 || y >= this.hauteur) return false;
        const caseType = this.cases[x][y];
        return caseType === Type_de_case.Rail_horizontal || caseType === Type_de_case.Rail_vertical ||
            caseType === Type_de_case.Rail_droite_vers_haut || caseType === Type_de_case.Rail_haut_vers_droite ||
            caseType === Type_de_case.Rail_droite_vers_bas || caseType === Type_de_case.Rail_bas_vers_droite;
    }
}

// Fonctions spécifiques pour le dessin des cases
function image_of_case(type_de_case) {
    switch(type_de_case) {
        case Type_de_case.Foret: return IMAGE_FORET;
        case Type_de_case.Eau: return IMAGE_EAU;
        case Type_de_case.Rail_horizontal: return IMAGE_RAIL_HORIZONTAL;
        case Type_de_case.Rail_vertical: return IMAGE_RAIL_VERTICAL;
        case Type_de_case.Rail_droite_vers_haut: return IMAGE_RAIL_DROITE_VERS_HAUT;
        case Type_de_case.Rail_haut_vers_droite: return IMAGE_RAIL_HAUT_VERS_DROITE;
        case Type_de_case.Rail_droite_vers_bas: return IMAGE_RAIL_DROITE_VERS_BAS;
        case Type_de_case.Rail_bas_vers_droite: return IMAGE_RAIL_BAS_VERS_DROITE;
    }
}

function dessine_case(contexte, plateau, x, y) {
    const la_case = plateau.cases[x][y];
    let image_a_afficher = image_of_case(la_case);
    contexte.drawImage(image_a_afficher, x * LARGEUR_CASE, y * HAUTEUR_CASE, LARGEUR_CASE, HAUTEUR_CASE);
}

function dessinePlateau(plateau, contexte) {
    if (!contexte) {
        console.error("Erreur : contexte 2D non défini");
        return;
    }
    if (typeof contexte.clearRect !== 'function') {
        console.error("Erreur : clearRect n'est pas une fonction sur le contexte");
        return;
    }
    // Efface le canvas avant de redessiner
    contexte.clearRect(0, 0, LARGEUR_PLATEAU * LARGEUR_CASE, HAUTEUR_PLATEAU * HAUTEUR_CASE);

    // Dessine chaque case du plateau
    for (let x = 0; x < plateau.largeur; x++) {
        for (let y = 0; y < plateau.hauteur; y++) {
            dessine_case(contexte, plateau, x, y);
        }
    }

    // Dessine tous les trains présents sur le plateau
    for (let train of trains) {
        train.dessiner(contexte);
    }
}

// Images des trains
const IMAGE_LOCO = new Image();
IMAGE_LOCO.src = 'images/locomotive.png';
const IMAGE_WAGON = new Image();
IMAGE_WAGON.src = 'images/wagon.png';

class Train {

    constructor(x, y, direction, longueur) {
        this.x = x;
        this.y = y;
        this.direction = direction; // 'droite', 'gauche', 'haut', 'bas'
        this.longueur = longueur;
        this.positions = [];
        this.exploded = false;
        for (let i = 0; i < longueur; i++) {
            this.positions.push({ x: x - i, y: y });
        }
    }

    dessiner(contexte) {
        if (this.exploded) return;
        contexte.drawImage(IMAGE_LOCO, this.positions[0].x * LARGEUR_CASE, this.positions[0].y * HAUTEUR_CASE, LARGEUR_CASE, HAUTEUR_CASE);
        for (let i = 1; i < this.longueur; i++) {
            contexte.drawImage(IMAGE_WAGON, this.positions[i].x * LARGEUR_CASE, this.positions[i].y * HAUTEUR_CASE, LARGEUR_CASE, HAUTEUR_CASE);
        }
    }

    avancer(plateau) {
        if (this.exploded) return;

        // Avancer les wagons
        for (let i = this.longueur - 1; i > 0; i--) {
            this.positions[i] = { ...this.positions[i - 1] };
        }
        // Avancer la locomotive
        let tete = this.positions[0];
        switch (this.direction) {
            case 'droite':
                tete.x++;
                break;
            case 'gauche':
                tete.x--;
                break;
            case 'haut':
                tete.y--;
                break;
            case 'bas':
                tete.y++;
                break;
        }

        // Vérifier les conditions d'explosion
        if (tete.x < 0 || tete.x >= plateau.largeur || tete.y < 0 || tete.y >= plateau.hauteur) {
            this.exploded = true; // Sortie du plateau
            return;
        }

        const laCase = plateau.cases[tete.x][tete.y];
        if (laCase.nom === 'foret' || laCase.nom === 'eau') {
            this.exploded = true; // Rencontre une case d'eau ou de forêt
            return;
        }

        switch (laCase.nom) {
            case 'rail droite vers haut':
                if (this.direction === 'droite') {
                    this.direction = 'haut';
                } else if (this.direction === 'bas') {
                    this.direction = 'gauche';
                }
                else if (this.direction === 'haut' || this.direction === 'gauche') {
                    this.exploded = true; // Explose si la direction est droite ou haut
                }
                break;
            case 'rail haut vers droite':
                if (this.direction === 'haut') {
                    this.direction = 'droite';
                } else if (this.direction === 'gauche') {
                    this.direction = 'bas';
                }
                else if (this.direction === 'bas' || this.direction === 'droite') {
                    this.exploded = true; 
                }
                break;
            case 'rail droite vers bas':
                if (this.direction === 'droite') {
                    this.direction = 'bas';
                } else if (this.direction === 'haut') {
                    this.direction = 'gauche';
                }
                else if (this.direction === 'gauche' || this.direction === 'bas') {
                    this.exploded = true; // Explose si la direction est gauche ou bas
                }
                break;
            case 'rail bas vers droite':
                if (this.direction === 'bas') {
                    this.direction = 'droite';
                } else if (this.direction === 'gauche') {
                    this.direction = 'haut';
                } else if (this.direction === 'droite' || this.direction === 'haut') {
                    this.exploded = true; // Explose si la direction est droite ou haut
                }
                break;
            case 'rail horizontal':
                if (this.direction === 'haut' || this.direction === 'bas') {
                    this.exploded = true; // Mauvaise direction pour un rail horizontal
                }
                break;
            case 'rail vertical':
                if (this.direction === 'droite' || this.direction === 'gauche') {
                    this.exploded = true; // Mauvaise direction pour un rail vertical
                }
                break;
        }
    }
}




function setupEventListeners(canvas, contexte, plateau) {
    if (!canvas || !contexte) {
        console.error("Erreur : canvas ou contexte non défini");
        return;
    }

    canvas.addEventListener('click', function (event) {
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) / LARGEUR_CASE);
        const y = Math.floor((event.clientY - rect.top) / HAUTEUR_CASE);
        if (selectedTool && typeof selectedTool !== 'number') {
            plateau.modifierCase(x, y, selectedTool);
            dessinePlateau(plateau, contexte);
        } else if (selectedTool && typeof selectedTool === 'number') {
            ajouterTrainAuPlateau(x, y, selectedTool, plateau, contexte);
        }
    });

    const buttons = document.querySelectorAll('#boutons input[type="image"]');
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            buttons.forEach(btn => btn.disabled = false);
            button.disabled = true;
            const toolType = button.id.replace('bouton_', '');
            switch (toolType) {
                case 'foret': setSelectedTool(Type_de_case.Foret); break;
                case 'eau': setSelectedTool(Type_de_case.Eau); break;
                case 'rail_horizontal': setSelectedTool(Type_de_case.Rail_horizontal); break;
                case 'rail_vertical': setSelectedTool(Type_de_case.Rail_vertical); break;
                case 'rail_droite_vers_haut': setSelectedTool(Type_de_case.Rail_droite_vers_haut); break;
                case 'rail_haut_vers_droite': setSelectedTool(Type_de_case.Rail_haut_vers_droite); break;
                case 'rail_droite_vers_bas': setSelectedTool(Type_de_case.Rail_droite_vers_bas); break;
                case 'rail_bas_vers_droite': setSelectedTool(Type_de_case.Rail_bas_vers_droite); break;
                case 'train_1': setSelectedTool(1); break;
                case 'train_2': setSelectedTool(2); break;
                case 'train_4': setSelectedTool(4); break;
                case 'train_6': setSelectedTool(6); break;
            }
        });
    });

    document.getElementById('bouton_pause').addEventListener('click', togglePause);
}

function setSelectedTool(tool) {
    selectedTool = tool;
}

function ajouterTrainAuPlateau(x, y, longueur, plateau, contexte) {
    if (!contexte) {
        console.error("Erreur : contexte 2D non défini");
        return;
    }
    if (x - longueur + 1 < 0 || x >= LARGEUR_PLATEAU || y >= HAUTEUR_PLATEAU) return;

    for (let i = 0; i < longueur; i++) {
        if (!plateau.estCaseValidePourTrain(x - i, y)) {
            return;
        }
    }

    let nouveauTrain = new Train(x, y, 'droite', longueur);
    plateau.ajouterTrain(nouveauTrain);
    dessinePlateau(plateau, contexte);
}

function togglePause() {
    isPaused = !isPaused;
    console.log("Pause status:", isPaused);
    document.getElementById('bouton_pause').innerText = isPaused ? 'Redémarrer' : 'Pause';
    if (isPaused) {
        console.log("Pausing the game");
        clearInterval(intervalId);
    } else {
    
        console.log("Resuming the game");
        const canvas = document.getElementById('simulateur');
        const contexte = canvas.getContext("2d");
        if (!contexte) {
            console.error("Erreur : contexte 2D non défini lors de la reprise");
            return;
        }
        intervalId = setInterval(() => {
            console.log("Interval tick");
            plateau.avancerTrains();
            dessinePlateau(plateau, contexte);
        }, 500);
    }
}




function cree_plateau_initial(plateau) {
    // Circuit
	plateau.cases[12][7] = Type_de_case.Rail_horizontal;
	plateau.cases[13][7] = Type_de_case.Rail_horizontal;
	plateau.cases[14][7] = Type_de_case.Rail_horizontal;
	plateau.cases[15][7] = Type_de_case.Rail_horizontal;
	plateau.cases[16][7] = Type_de_case.Rail_horizontal;
	plateau.cases[17][7] = Type_de_case.Rail_horizontal;
	plateau.cases[18][7] = Type_de_case.Rail_horizontal;
	plateau.cases[19][7] = Type_de_case.Rail_droite_vers_haut;
	plateau.cases[19][6] = Type_de_case.Rail_vertical;
	plateau.cases[19][5] = Type_de_case.Rail_droite_vers_bas;
	plateau.cases[12][5] = Type_de_case.Rail_horizontal;
	plateau.cases[13][5] = Type_de_case.Rail_horizontal;
	plateau.cases[14][5] = Type_de_case.Rail_horizontal;
	plateau.cases[15][5] = Type_de_case.Rail_horizontal;
	plateau.cases[16][5] = Type_de_case.Rail_horizontal;
	plateau.cases[17][5] = Type_de_case.Rail_horizontal;
	plateau.cases[18][5] = Type_de_case.Rail_horizontal;
	plateau.cases[11][5] = Type_de_case.Rail_haut_vers_droite;
	plateau.cases[11][6] = Type_de_case.Rail_vertical;
	plateau.cases[11][7] = Type_de_case.Rail_bas_vers_droite;

	// Segment isolé à gauche
	plateau.cases[0][7] = Type_de_case.Rail_horizontal;
	plateau.cases[1][7] = Type_de_case.Rail_horizontal;
	plateau.cases[2][7] = Type_de_case.Rail_horizontal;
	plateau.cases[3][7] = Type_de_case.Rail_horizontal;
	plateau.cases[4][7] = Type_de_case.Rail_horizontal;
	plateau.cases[5][7] = Type_de_case.Eau;
	plateau.cases[6][7] = Type_de_case.Rail_horizontal;
	plateau.cases[7][7] = Type_de_case.Rail_horizontal;

	// Plan d'eau
	for(let x = 22; x <= 27; x++){
		for(let y = 2; y <= 5; y++){
			plateau.cases[x][y] = Type_de_case.Eau;
		}
	}

	// Segment isolé à droite
	plateau.cases[22][8] = Type_de_case.Rail_horizontal;
	plateau.cases[23][8] = Type_de_case.Rail_horizontal;
	plateau.cases[24][8] = Type_de_case.Rail_horizontal;
	plateau.cases[25][8] = Type_de_case.Rail_horizontal;
	plateau.cases[26][8] = Type_de_case.Rail_bas_vers_droite;
	plateau.cases[27][8] = Type_de_case.Rail_horizontal;
	plateau.cases[28][8] = Type_de_case.Rail_horizontal;
	plateau.cases[29][8] = Type_de_case.Rail_horizontal;

	// TCHOU
	plateau.cases[3][10] = Type_de_case.Eau;
	plateau.cases[4][10] = Type_de_case.Eau;
	plateau.cases[4][11] = Type_de_case.Eau;
	plateau.cases[4][12] = Type_de_case.Eau;
	plateau.cases[4][13] = Type_de_case.Eau;
	plateau.cases[4][13] = Type_de_case.Eau;
	plateau.cases[5][10] = Type_de_case.Eau;

	plateau.cases[7][10] = Type_de_case.Eau;
	plateau.cases[7][11] = Type_de_case.Eau;
	plateau.cases[7][12] = Type_de_case.Eau;
	plateau.cases[7][13] = Type_de_case.Eau;
	plateau.cases[8][10] = Type_de_case.Eau;
	plateau.cases[9][10] = Type_de_case.Eau;
	plateau.cases[8][13] = Type_de_case.Eau;
	plateau.cases[9][13] = Type_de_case.Eau;

	plateau.cases[11][10] = Type_de_case.Eau;
	plateau.cases[11][11] = Type_de_case.Eau;
	plateau.cases[11][12] = Type_de_case.Eau;
	plateau.cases[11][13] = Type_de_case.Eau;
	plateau.cases[12][11] = Type_de_case.Eau;
	plateau.cases[13][10] = Type_de_case.Eau;
	plateau.cases[13][11] = Type_de_case.Eau;
	plateau.cases[13][12] = Type_de_case.Eau;
	plateau.cases[13][13] = Type_de_case.Eau;

	plateau.cases[15][10] = Type_de_case.Eau;
	plateau.cases[15][11] = Type_de_case.Eau;
	plateau.cases[15][12] = Type_de_case.Eau;
	plateau.cases[15][13] = Type_de_case.Eau;
	plateau.cases[16][10] = Type_de_case.Eau;
	plateau.cases[16][13] = Type_de_case.Eau;
	plateau.cases[17][10] = Type_de_case.Eau;
	plateau.cases[17][11] = Type_de_case.Eau;
	plateau.cases[17][12] = Type_de_case.Eau;
	plateau.cases[17][13] = Type_de_case.Eau;

	plateau.cases[19][10] = Type_de_case.Eau;
	plateau.cases[19][11] = Type_de_case.Eau;
	plateau.cases[19][12] = Type_de_case.Eau;
	plateau.cases[19][13] = Type_de_case.Eau;
	plateau.cases[20][13] = Type_de_case.Eau;
	plateau.cases[21][10] = Type_de_case.Eau;
	plateau.cases[21][11] = Type_de_case.Eau;
	plateau.cases[21][12] = Type_de_case.Eau;
	plateau.cases[21][13] = Type_de_case.Eau;
}
// Fonction principale
function tchou() {
    console.log("Tchou, attention au départ !");
    const canvas = document.getElementById('simulateur');
    const contexte = canvas.getContext("2d");

    if (!contexte) {
        console.error("Erreur : contexte 2D non défini lors de l'initialisation");
        return;
    }

    plateau = new Plateau(); // Initialisation du plateau
    cree_plateau_initial(plateau); // Configuration initiale du plateau

    dessinePlateau(plateau, contexte);
    setupEventListeners(canvas, contexte, plateau);

    intervalId = setInterval(() => {
        if (!isPaused) {
            console.log("Interval tick");
            plateau.avancerTrains();
            dessinePlateau(plateau, contexte);
        }
    }, 500);
}

window.addEventListener("load", tchou);

