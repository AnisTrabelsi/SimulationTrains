// Constantes pour les dimensions du plateau et les cases
const LARGEUR_PLATEAU = 30;
const HAUTEUR_PLATEAU = 15;
const LARGEUR_CASE = 35;
const HAUTEUR_CASE = 40;

const explosionSound = new Audio('./sons/explosion.mp3');
const eauSound = new Audio('./sons/eauExplosion.wav');
const insertionSound = new Audio('./sons/trainInsertion.wav');
const tchouSound = new Audio('./sons/tchou.mp3');
const screechSound = new Audio('./sons/virage.wav');

// Définition des types de cases
class Type_de_case {
    static Foret = new Type_de_case('foret', 'images/foret.png');
    static Eau = new Type_de_case('eau', 'images/eau.png');
    static Rail_horizontal = new Type_de_case('rail horizontal', 'images/rail-horizontal.png');
    static Rail_vertical = new Type_de_case('rail vertical', 'images/rail-vertical.png');
    static Rail_droite_vers_haut = new Type_de_case('rail droite vers haut', 'images/rail-droite-vers-haut.png');
    static Rail_haut_vers_droite = new Type_de_case('rail haut vers droite', 'images/rail-haut-vers-droite.png');
    static Rail_droite_vers_bas = new Type_de_case('rail droite vers bas', 'images/rail-droite-vers-bas.png');
    static Rail_bas_vers_droite = new Type_de_case('rail bas vers droite', 'images/rail-bas-vers-droite.png');
    static Explosif = new Type_de_case('explosif', 'images/explosif.png'); // Nouvelle case explosive

    constructor(nom, imageSrc) {
        this.nom = nom;
        this.image = new Image();
        this.image.src = imageSrc;
    }
}

// Images des trains
const IMAGE_LOCO = new Image();
IMAGE_LOCO.src = 'images/locomotive.png';
const IMAGE_WAGON = new Image();
IMAGE_WAGON.src = 'images/wagon.png';
// Images d'explosion et d'eau
const IMAGE_EXPLOSION = new Image();
IMAGE_EXPLOSION.src = './images/explosion.gif';
const IMAGE_EAU = new Image();
IMAGE_EAU.src = './images/eau.gif';

// Variables globales
let contexte;
let selectedTool = null;
let trains = [];
let isPaused = false;
let intervalId;
let plateau;

function dessinerMonstres(contexte) {
    for (let monstre of monstres) {
        monstre.dessiner(contexte);
    }
}

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

    dessiner(contexte) {
        for (let x = 0; x < this.largeur; x++) {
            for (let y = 0; y < this.hauteur; y++) {
                const laCase = this.cases[x][y];
                contexte.drawImage(laCase.image, x * LARGEUR_CASE, y * HAUTEUR_CASE, LARGEUR_CASE, HAUTEUR_CASE);
            }
        }
    }

    modifierCase(x, y, type) {
        this.cases[x][y] = type;
    }

    ajouterTrain(train) {
        trains.push(train);
        insertionSound.play(); // Jouer le son lors de l'insertion d'un train
    }

    avancerTrains() {
        console.log("Avancer trains");
        let positionsOccupees = {};

        for (let train of trains) {
            if (train.exploded) continue;
            train.avancer(this);

            for (let position of train.positions) {
                let cle = `${position.x},${position.y}`;
                if (positionsOccupees[cle]) {
                    train.exploser(this);
                    positionsOccupees[cle].exploser(this);
                    positionsOccupees[cle] = train;
                } else {
                    positionsOccupees[cle] = train;
                }
            }
        }

        trains = trains.filter(train => !train.exploded || train.explosionTime === null || performance.now() - train.explosionTime <= 1000);
    }

    estCaseValidePourTrain(x, y) {
        if (x < 0 || x >= this.largeur || y < 0 || y >= this.hauteur) return false;
        const caseType = this.cases[x][y];
        return caseType === Type_de_case.Rail_horizontal || caseType === Type_de_case.Rail_vertical ||
            caseType === Type_de_case.Rail_droite_vers_haut || caseType === Type_de_case.Rail_haut_vers_droite ||
            caseType === Type_de_case.Rail_droite_vers_bas || caseType === Type_de_case.Rail_bas_vers_droite;
    }

    estCaseValide(x, y) {
        if (x < 0 || x >= this.largeur || y < 0 || y >= this.hauteur) return false;
        return this.cases[x][y] !== Type_de_case.Eau;
    }

    deplacerMonstres() {
        for (let monstre of monstres) {
            console.log("Déplacement du monstre avant :", monstre);
            monstre.deplacer(this);
            monstre.checkCollisionAvecTrain(trains);
            console.log("Déplacement du monstre après :", monstre);
        }
    }
}

// Classe Train
class Train {
    constructor(x, y, direction, longueur, vitesse = 1) {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.longueur = longueur;
        this.vitesse = vitesse;
        this.positions = [];
        this.exploded = false;
        this.explosionTime = null;
        this.lastMoveTime = performance.now();
        for (let i = 0; i < longueur; i++) {
            switch (direction) {
                case 'droite':
                    this.positions.push({ x: x - i, y: y });
                    break;
                case 'gauche':
                    this.positions.push({ x: x + i, y: y });
                    break;
                case 'haut':
                    this.positions.push({ x: x, y: y + i });
                    break;
                case 'bas':
                    this.positions.push({ x: x, y: y - i });
                    break;
            }
        }
    }

    dessiner(contexte) {
        if (this.exploded) {
            if (this.explosionTime === null) {
                this.explosionTime = performance.now();
            }
            if (this.explodedInWater) {
                contexte.drawImage(IMAGE_EAU, this.positions[0].x * LARGEUR_CASE, this.positions[0].y * HAUTEUR_CASE, LARGEUR_CASE, HAUTEUR_CASE);
            } else {
                contexte.drawImage(IMAGE_EXPLOSION, this.positions[0].x * LARGEUR_CASE, this.positions[0].y * HAUTEUR_CASE, LARGEUR_CASE, HAUTEUR_CASE);
            }
            return;
        }
        contexte.drawImage(IMAGE_LOCO, this.positions[0].x * LARGEUR_CASE, this.positions[0].y * HAUTEUR_CASE, LARGEUR_CASE, HAUTEUR_CASE);
        for (let i = 1; i < this.longueur; i++) {
            contexte.drawImage(IMAGE_WAGON, this.positions[i].x * LARGEUR_CASE, this.positions[i].y * HAUTEUR_CASE, LARGEUR_CASE, HAUTEUR_CASE);
        }
    }

    avancer(plateau) {
        if (this.exploded) return;

        const now = performance.now();
        if (now - this.lastMoveTime < (1000 / this.vitesse)) {
            return;
        }
        this.lastMoveTime = now;

        for (let i = this.longueur - 1; i > 0; i--) {
            this.positions[i] = { ...this.positions[i - 1] };
        }

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

        if (Math.random() < 0.1) {
            tchouSound.play();
        }

        if (tete.x < 0 || tete.x >= plateau.largeur || tete.y < 0 || tete.y >= plateau.hauteur) {
            this.exploser(plateau);
            return;
        }

        const laCase = plateau.cases[tete.x][tete.y];
        if (laCase.nom === 'foret' || laCase.nom === 'explosif') {
            this.exploser(plateau);
            return;
        }

        if (laCase.nom === 'eau') {
            this.exploserEau(plateau);
            return;
        }

        let changementDeDirection = false;

        switch (laCase.nom) {
            case 'rail droite vers haut':
                if (this.direction === 'droite') {
                    this.direction = 'haut';
                    changementDeDirection = true;
                } else if (this.direction === 'bas') {
                    this.direction = 'gauche';
                    changementDeDirection = true;
                } else if (this.direction === 'haut' || this.direction === 'gauche') {
                    this.exploser(plateau);
                }
                break;
            case 'rail haut vers droite':
                if (this.direction === 'haut') {
                    this.direction = 'droite';
                    changementDeDirection = true;
                } else if (this.direction === 'gauche') {
                    this.direction = 'bas';
                    changementDeDirection = true;
                } else if (this.direction === 'bas' || this.direction === 'droite') {
                    this.exploser(plateau);
                }
                break;
            case 'rail droite vers bas':
                if (this.direction === 'droite') {
                    this.direction = 'bas';
                    changementDeDirection = true;
                } else if (this.direction === 'haut') {
                    this.direction = 'gauche';
                    changementDeDirection = true;
                } else if (this.direction === 'gauche' || this.direction === 'bas') {
                    this.exploser(plateau);
                }
                break;
            case 'rail bas vers droite':
                if (this.direction === 'bas') {
                    this.direction = 'droite';
                    changementDeDirection = true;
                } else if (this.direction === 'gauche') {
                    this.direction = 'haut';
                    changementDeDirection = true;
                } else if (this.direction === 'droite' || this.direction === 'haut') {
                    this.exploser(plateau);
                }
                break;
            case 'rail horizontal':
                if (this.direction === 'haut' || this.direction === 'bas') {
                    this.exploser(plateau);
                }
                break;
            case 'rail vertical':
                if (this.direction === 'droite' || this.direction === 'gauche') {
                    this.exploser(plateau);
                }
                break;
        }

        if (changementDeDirection) {
            screechSound.play();
        }
    }

    exploser(plateau) {
        this.exploded = true;
        this.explodedInWater = false;
        explosionSound.play();
        tchouSound.pause();
        screechSound.pause();
        plateau.modifierCase(this.positions[0].x, this.positions[0].y, Type_de_case.Explosif);
    }

    exploserEau(plateau) {
        this.exploded = true;
        this.explodedInWater = true;
        eauSound.play();
        tchouSound.pause();
        screechSound.pause();
        plateau.modifierCase(this.positions[0].x, this.positions[0].y, Type_de_case.Eau);
    }
}

class Monstre {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.mort = false;
        this.image = new Image();
        this.image.src = 'images/monstre.png';
    }

    dessiner(contexte) {
        if (!this.mort) {
            console.log(`Dessiner le monstre à (${this.x}, ${this.y})`);
            contexte.drawImage(this.image, this.x * LARGEUR_CASE, this.y * HAUTEUR_CASE, LARGEUR_CASE, HAUTEUR_CASE);
        }
    }

    deplacer(plateau) {
        if (this.mort) return;

        const directions = [
            { x: 0, y: -1 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
            { x: 1, y: 0 }
        ];

        const direction = directions[Math.floor(Math.random() * directions.length)];
        const newX = this.x + direction.x;
        const newY = this.y + direction.y;

        console.log(`Essai de déplacement du monstre de (${this.x}, ${this.y}) à (${newX}, ${newY})`);

        if (plateau.estCaseValide(newX, newY)) {
            this.x = newX;
            this.y = newY;
            console.log(`Monstre déplacé à (${this.x}, ${this.y})`);
        } else {
            console.log(`Déplacement invalide pour le monstre à (${newX}, ${newY})`);
        }
    }

    checkCollisionAvecTrain(trains) {
        for (let train of trains) {
            for (let position of train.positions) {
                if (this.x === position.x && this.y === position.y) {
                    this.mort = true;
                    return;
                }
            }
        }
    }
}

class Animal {
    constructor(x, y, vitesse, imageSrc, nom) {
        this.x = x;
        this.y = y;
        this.vitesse = vitesse;
        this.image = new Image();
        this.image.src = imageSrc;
        this.nom = nom;
    }

    dessiner(contexte) {
        contexte.drawImage(this.image, this.x * LARGEUR_CASE, this.y * HAUTEUR_CASE, LARGEUR_CASE, HAUTEUR_CASE);
    }

    
    avancer() {
        this.x += this.vitesse;
        if (this.x >= LARGEUR_PLATEAU) {
            this.x = 0;
            document.getElementById('arrival-time').textContent = `${this.nom} arrive`;
        }
    }
}

// Fonctions de gestion de l'interface
function dessinePlateau(plateau) {
    if (!contexte) {
        console.error("Erreur : contexte 2D non défini");
        return;
    }
    if (typeof contexte.clearRect !== 'function') {
        console.error("Erreur : clearRect n'est pas une fonction sur le contexte");
        return;
    }
    contexte.clearRect(0, 0, LARGEUR_PLATEAU * LARGEUR_CASE, HAUTEUR_PLATEAU * HAUTEUR_CASE);
    plateau.dessiner(contexte);
    for (let train of trains) {
        train.dessiner(contexte);
    }
    dessinerMonstres(contexte);
    for (let animal of animaux) {
        animal.dessiner(contexte);
    }
}

function setupEventListeners(canvas, contexte, plateau) {
    if (!canvas || !contexte) {
        console.error("Erreur : canvas ou contexte non défini");
        return;
    }

    canvas.addEventListener('click', function (event) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        for (let train of trains) {
            for (let position of train.positions) {
                const trainX = position.x * LARGEUR_CASE;
                const trainY = position.y * HAUTEUR_CASE;
                if (mouseX >= trainX && mouseX < trainX + LARGEUR_CASE && mouseY >= trainY && mouseY < trainY + HAUTEUR_CASE) {
                    inverserDirection(train);
                    dessinePlateau(plateau, contexte);
                    return;
                }
            }
        }
    });

    canvas.addEventListener('click', function (event) {
        const rect = canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) / LARGEUR_CASE);
        const y = Math.floor((event.clientY - rect.top) / HAUTEUR_CASE);
        if (selectedTool && typeof selectedTool !== 'number') {
            plateau.modifierCase(x, y, selectedTool);
            dessinePlateau(plateau, contexte);
        } else if (selectedTool && typeof selectedTool === 'number') {
            promptVitesseEtAjouterTrain(x, y, selectedTool, plateau, contexte);
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
    document.getElementById('bouton_deselection').addEventListener('click', function () {
        selectedTool = null;
        const buttons = document.querySelectorAll('#boutons input[type="image"]');
        buttons.forEach(button => button.disabled = false);
    });

    document.getElementById('bouton_nuit').addEventListener('click', toggleNightMode);

    function toggleNightMode() {
        var body = document.body;
        var canvas = document.getElementById('simulateur');
        var modeStatusElement = document.getElementById('mode-status');

        if (body.classList.contains('nuit')) {
            body.classList.remove('nuit');
            canvas.classList.remove('nuit');
            modeStatusElement.textContent = "Mode: Jour";
            modeStatusElement.style.color = "black";
        } else {
            body.classList.add('nuit');
            canvas.classList.add('nuit');
            modeStatusElement.textContent = "Mode: Nuit";
            modeStatusElement.style.color = "white";
        }
    }
}

function inverserDirection(train) {
    switch (train.direction) {
        case 'droite':
            train.direction = 'gauche';
            break;
        case 'gauche':
            train.direction = 'droite';
            break;
        case 'haut':
            train.direction = 'bas';
            break;
        case 'bas':
            train.direction = 'haut';
            break;
    }
}

function setSelectedTool(tool) {
    selectedTool = tool;
}

function ajouterTrainAuPlateau(x, y, longueur, vitesse, plateau, contexte) {
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

    let nouveauTrain = new Train(x, y, 'droite', longueur, vitesse);
    plateau.ajouterTrain(nouveauTrain);
    dessinePlateau(plateau, contexte);
}

function promptVitesseEtAjouterTrain(x, y, longueur, plateau, contexte) {
    const vitesseParDefaut = 2;
    const userVitesse = prompt("Entrez la vitesse du train (plus haut est le nombre plus rapide est le train) :", vitesseParDefaut);
    if (userVitesse !== null) {
        const vitesse = parseInt(userVitesse, 10);
        if (isNaN(vitesse) || vitesse <= 0) {
            alert("Vitesse invalide. Utilisation de la vitesse par défaut.");
            ajouterTrainAuPlateau(x, y, longueur, vitesseParDefaut, plateau, contexte);
        } else {
            ajouterTrainAuPlateau(x, y, longueur, vitesse, plateau, contexte);
        }
    } else {
        ajouterTrainAuPlateau(x, y, longueur, vitesseParDefaut, plateau, contexte);
    }
}

function stopAllSounds() {
    explosionSound.pause();
    explosionSound.currentTime = 0;
    eauSound.pause();
    eauSound.currentTime = 0;
    tchouSound.pause();
    tchouSound.currentTime = 0;
    screechSound.pause();
    screechSound.currentTime = 0;
}

function togglePause() {
    isPaused = !isPaused;
    console.log("Pause status:", isPaused);
    document.getElementById('bouton_pause').innerText = isPaused ? 'Redémarrer' : 'Pause';
    if (isPaused) {
        console.log("Pausing the game");
        clearInterval(intervalId);
        clearInterval(remainingTimeIntervalId);
        stopAllSounds();
    } else {
        console.log("Resuming the game");
        const canvas = document.getElementById('simulateur');
        const contexte = canvas.getContext("2d");
        if (!contexte) {
            console.error("Erreur : contexte 2D non défini lors de la reprise");
            return;
        }
        intervalId = setInterval(() => {
            if (!isPaused) {
                plateau.avancerTrains();
                plateau.deplacerMonstres();
                dessinePlateau(plateau, contexte);
            }
        }, 500);

        remainingTimeIntervalId = setInterval(() => {
            if (!isPaused) {
                if (remainingTime <= 0) {
                    clearInterval(remainingTimeIntervalId);
                    console.log("Train est arrivé à destination.");
                    return;
                }
                remainingTime--;

                const minutes = Math.floor(remainingTime / 60);
                const seconds = remainingTime % 60;
                document.getElementById('arrival-time').textContent = `Arrive dans ${minutes}:${seconds < 10 ? '0' + seconds : seconds} minutes`;
            }
        }, 1000);
    }
}

function checkTimeForNightMode() {
    var currentHour = new Date().getHours();
    var modeStatusElement = document.getElementById('mode-status');
    if ((currentHour >= 21 || currentHour < 6) && !document.body.classList.contains('manual-toggle')) {
        document.body.classList.add('nuit');
        document.getElementById('simulateur').classList.add('nuit');
        modeStatusElement.textContent = "Mode: Nuit";
        modeStatusElement.style.color = "white";
    } else if (!document.body.classList.contains('manual-toggle')) {
        document.body.classList.remove('nuit');
        document.getElementById('simulateur').classList.remove('nuit');
        modeStatusElement.textContent = "Mode: Jour";
        modeStatusElement.style.color = "black";
    }
}

function drawClock() {
    var canvas = document.getElementById('clockCanvas');
    var context = canvas.getContext('2d');
    var radius = canvas.height / 2;
    context.translate(radius, radius);
    radius = radius * 0.90;
    setInterval(function() {
        drawClockFace(context, radius);
        drawClockNumbers(context, radius);
        drawClockTime(context, radius);
    }, 1000);
}

function drawClockFace(context, radius) {
    var grad;
    context.beginPath();
    context.arc(0, 0, radius, 0, 2 * Math.PI);
    context.fillStyle = document.body.classList.contains('nuit') ? '#333' : 'white';
    context.fill();
    grad = context.createRadialGradient(0, 0, radius * 0.95, 0, 0, radius * 1.05);
    grad.addColorStop(0, '#333');
    grad.addColorStop(0.5, 'white');
    grad.addColorStop(1, '#333');
    context.strokeStyle = grad;
    context.lineWidth = radius * 0.1;
    context.stroke();
    context.beginPath();
    context.arc(0, 0, radius * 0.1, 0, 2 * Math.PI);
    context.fillStyle = '#333';
    context.fill();
}

function drawClockNumbers(context, radius) {
    var ang;
    var num;
    context.font = radius * 0.15 + "px arial";
    context.textBaseline = "middle";
    context.textAlign = "center";
    context.fillStyle = document.body.classList.contains('nuit') ? 'white' : 'black';
    for (num = 1; num < 13; num++) {
        ang = num * Math.PI / 6;
        context.rotate(ang);
        context.translate(0, -radius * 0.85);
        context.rotate(-ang);
        context.fillText(num.toString(), 0, 0);
        context.rotate(ang);
        context.translate(0, radius * 0.85);
        context.rotate(-ang);
    }
}

function drawClockTime(context, radius) {
    var now = new Date();
    var hour = now.getHours();
    var minute = now.getMinutes();
    var second = now.getSeconds();
    hour = hour % 12;
    hour = (hour * Math.PI / 6) +
        (minute * Math.PI / (6 * 60)) +
        (second * Math.PI / (360 * 60));
    drawClockHand(context, hour, radius * 0.5, radius * 0.07, document.body.classList.contains('nuit') ? 'white' : 'black');
    minute = (minute * Math.PI / 30) + (second * Math.PI / (30 * 60));
    drawClockHand(context, minute, radius * 0.8, radius * 0.07, document.body.classList.contains('nuit') ? 'white' : 'black');
    second = (second * Math.PI / 30);
    drawClockHand(context, second, radius * 0.9, radius * 0.02, document.body.classList.contains('nuit') ? 'red' : 'black');
}

function drawClockHand(context, pos, length, width, color) {
    context.beginPath();
    context.lineWidth = width;
    context.lineCap = "round";
    context.strokeStyle = color;
    context.moveTo(0, 0);
    context.rotate(pos);
    context.lineTo(0, -length);
    context.stroke();
    context.rotate(-pos);
}

let remainingTimeIntervalId;
let remainingTime;

function startTopRailTrain() {
    const vitesse = 30 / (10 * 60);
    const train = new Train(0, 0, 'droite', 1, vitesse);
    plateau.ajouterTrain(train);

    remainingTime = 10 * 60;

    remainingTimeIntervalId = setInterval(() => {
        if (!isPaused) {
            if (remainingTime <= 0) {
                clearInterval(remainingTimeIntervalId);
                console.log("Train est arrivé à destination.");
                return;
            }
            remainingTime--;

            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            document.getElementById('arrival-time').textContent = `Arrive dans ${minutes}:${seconds < 10 ? '0' + seconds : seconds} minutes`;
        }
    }, 1000);
}

let animaux = [
    new Animal(0, 1, 0.5, 'images/lapin.png', 'Lapin'),
    new Animal(0, 1, 0.1, 'images/tortue.png', 'Tortue')
];

// Initialisation du plateau de jeu avec choix de la carte
function choisirCarte() {
    plateau = new Plateau();
    // Rail horizontal en haut
    for (let x = 0; x < plateau.largeur; x++) {
        plateau.cases[x][0] = Type_de_case.Rail_horizontal;
    }

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

    plateau.cases[0][7] = Type_de_case.Rail_horizontal;
    plateau.cases[1][7] = Type_de_case.Rail_horizontal;
    plateau.cases[2][7] = Type_de_case.Rail_horizontal;
    plateau.cases[3][7] = Type_de_case.Rail_horizontal;
    plateau.cases[4][7] = Type_de_case.Rail_horizontal;
    plateau.cases[5][7] = Type_de_case.Eau;
    plateau.cases[6][7] = Type_de_case.Rail_horizontal;
    plateau.cases[7][7] = Type_de_case.Rail_horizontal;

    for (let x = 22; x <= 27; x++) {
        for (let y = 2; y <= 5; y++) {
            plateau.cases[x][y] = Type_de_case.Eau;
        }
    }

    plateau.cases[22][8] = Type_de_case.Rail_horizontal;
    plateau.cases[23][8] = Type_de_case.Rail_horizontal;
    plateau.cases[24][8] = Type_de_case.Rail_horizontal;
    plateau.cases[25][8] = Type_de_case.Rail_horizontal;
    plateau.cases[26][8] = Type_de_case.Rail_bas_vers_droite;
    plateau.cases[27][8] = Type_de_case.Rail_horizontal;
    plateau.cases[28][8] = Type_de_case.Rail_horizontal;
    plateau.cases[29][8] = Type_de_case.Rail_horizontal;

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

    return plateau;
}

let monstres = [];

function tchou() {
    console.log("Tchou, attention au départ !");
    const canvas = document.getElementById('simulateur');
    contexte = canvas.getContext("2d");

    if (!contexte) {
        console.error("Erreur : contexte 2D non défini lors de l'initialisation");
        return;
    }
    checkTimeForNightMode();

    plateau = choisirCarte();
    canvas.style.display = "block";
    dessinePlateau(plateau, contexte);
    setupEventListeners(canvas, contexte, plateau);

    monstres.push(new Monstre(5, 5));
    monstres.push(new Monstre(10, 10));
    monstres.push(new Monstre(15, 15));

    console.log("Monstres après ajout :", monstres);

    intervalId = setInterval(() => {
        if (!isPaused) {
            console.log("Interval tick");
            plateau.avancerTrains();
            plateau.deplacerMonstres();
            dessinePlateau(plateau);
            for (let animal of animaux) {
                animal.avancer();
            }
        }
    }, 500);

    startTopRailTrain();
}

window.addEventListener("load", function () {
    checkTimeForNightMode();
    drawClock();
    tchou();
});
