/// <reference path="../../tsd/socket.io.d.ts"/>
/// <reference path="../../tsd/p5.global-mode.d.ts"/>

let _socket;
let gameID;
let username;
let game_password;
let cookies;

let canvas, battlecanvas;
let canvasContainer;

let ships = [{
		x: 0,
		y: 0,
		rotation: "north",
		size: 5,
	},
	{
		x: 0,
		y: 0,
		rotation: "north",
		size: 4,
	},
	{
		x: 0,
		y: 0,
		rotation: "north",
		size: 3,
	},
	{
		x: 0,
		y: 0,
		rotation: "north",
		size: 3,
	},
	{
		x: 0,
		y: 0,
		rotation: "north",
		size: 2,
	}
];
const me = (sketch) => {
	sketch.ships = ships;
	sketch.placing_ship;
	sketch.placed_ships = [];
	sketch.shots = [];

	sketch.setup = _setup.bind(sketch);
	sketch.draw = _draw.bind(sketch);
	sketch.drawGrid = _drawGrid.bind(sketch);
	sketch.drawShip = _drawShip.bind(sketch);
	sketch.checkCollisions = _checkCollisions.bind(sketch);
	sketch.keyPressed = function () {
		if (this.keyCode == 0x20) {
			this.placeShip();
		} else if (this.keyCode == 0x52) {
			rotateShip(this.placing_ship);
		}
	}.bind(sketch);
	sketch.placeShip = _placeShip.bind(sketch);
	sketch.drawShot = _drawShot.bind(sketch);
}

const opponent = (sketch) => {
	sketch.placed_ships = [];
	sketch.shots = [];

	sketch.setup = _battle_setup.bind(sketch);
	sketch.draw = _draw.bind(sketch);
	sketch.drawGrid = _drawGrid.bind(sketch);
	sketch.drawShip = _drawShip.bind(sketch);
	sketch.drawShot = _drawShot.bind(sketch);
	// sketch.checkCollisions = _checkCollisions.bind(sketch);
	sketch.fire = _fire.bind(sketch);
	sketch.keyPressed = function () {
		if (this.keyCode == 0x20) {
			this.fire();
		}
	}.bind(sketch);

}

new p5(me, "me");


function _setup() {
	cookies = document.cookie
		.split(';')
		.reduce((res, c) => {
			const [key, val] = c.trim().split('=').map(decodeURIComponent)
			try {
				return Object.assign(res, {
					[key]: JSON.parse(val)
				})
			} catch (e) {
				return Object.assign(res, {
					[key]: val
				})
			}
		}, {});

	username = cookies.username;
	game_password = cookies.game_password;

	_socket = io();
	let params = this.getURLParams();
	console.log(params);
	if (!("id" in params)) {
		history.back();
		return;
	} else {
		gameID = params.id;
	}
	let join_data = {
		gameId: gameID,
		userName: username,
		gamePassword: game_password,
	}
	_socket.on("disconnect", console.log);
	_socket.emit("join", join_data);
	_socket.on("welcome", console.log);
	_socket.on("place", (data) => {
		this.placed_ships = data;
		this.ships = [];
		this.placing_ship = null;
	});
	_socket.on("battle", () => {
		new p5(opponent, "opponent");
	});
	_socket.on("shot", shot => {
		console.log(shot);
		this.shots.push(shot);
	});

	_socket.onpacket(console.log);
	let exit = () => {
		_socket.emit("exit");
	};
	let isIOS = navigator.userAgent.match(/iPad/i) || navigator.userAgent.match(/iPhone/i);
	let evtName = isIOS ? "pagehide" : "beforeunload";
	window.addEventListener(evtName, exit);
	window.onbeforeunload = exit;
	window.onunload = exit;

	this.createCanvas(500, 500);
	this.createElement("br");
	let place = this.createButton("Place");
	let rotate = this.createButton("Rotate");
	place.mouseClicked(this.placeShip);
	place.size(100, 30);
	rotate.mouseClicked(() => rotateShip(this.placing_ship));
	rotate.size(100, 30);
	this.createElement("br");

	document.oncontextmenu = () => false;


	this.placing_ship = this.ships.splice(0, 1)[0];

}

function _battle_setup() {

	this.createCanvas(500, 500);
	this.createElement("br");
	let fire = this.createButton("Fire!");
	fire.mouseClicked(this.fire);
	fire.size(100, 30);
	this.firing = {
		x: 2,
		y: 2,
		hit: false,
	};

	_socket.on("fire", () => {
		this.firing = {
			x: 0,
			y: 0,
			hit: false
		}
	});
	_socket.on("sunk", ship => {
		this.placed_ships.push(ship);
	})

	_socket.on("fired", (shot) => {
		console.log(shot);
		this.shots.pop();
		if (shot) {
			if (shot.hit) {
				console.log("hit");
			} else {
				console.log("miss");
			}
			this.shots.push(shot);
		}
	})

	// this.shots.push()

}


function _draw() {
	let w = this.width / 10;
	let h = this.height / 10;

	this.background(100);
	this.fill(0, 255, 0);
	for (let ship of this.placed_ships) {
		this.drawShip(ship);
	}
	this.fill(255);
	if (this.placing_ship) {
		if (this.checkCollisions(this.placing_ship)) this.fill(255, 0, 0);
		if (this.mouseX < this.width && this.mouseY < this.height) {
			this.placing_ship.x = this.floor(this.mouseX / w);
			this.placing_ship.y = this.floor(this.mouseY / h);
		}
		this.placing_ship.hit = false;
		this.drawShip(this.placing_ship);
	}
	for (let shot of this.shots) {
		this.stroke(255);
		this.drawShot(shot);
	}
	this.stroke(0, 255, 0);
	if (this.firing) {
		if (this.mouseX < this.width && this.mouseY < this.height) {
			this.firing.x = this.floor(this.mouseX / w);
			this.firing.y = this.floor(this.mouseY / h);
		}
		this.firing.hit = false;
		this.drawShot(this.firing)
	}

	this.drawGrid(10, 10);

}

function _drawGrid(x = 10, y = 10) {
	this.stroke(0);
	this.strokeWeight(5);
	for (let i = 0; i <= x; i++) {
		this.line(i * this.width / x, 0, i * this.width / x, this.height);
	}

	for (let j = 0; j <= y; j++) {
		this.line(0, j * this.height / y, this.width, j * this.height / y);
	}

}

function _drawShip(ship, x = 10, y = 10) {
	let xCentreStart = (ship.x + 0.5) * this.width / x;
	let yCentreStart = (ship.y + 0.5) * this.height / y;
	let xCentreEnd, yCentreEnd;
	xCentreEnd = xCentreStart;
	yCentreEnd = yCentreStart;
	let w = this.width / x;
	let h = this.height / y;
	switch (ship.rotation) {
		case "north":
			yCentreEnd -= (ship.size - 1) * h;
			break;
		case "east":
			xCentreEnd += (ship.size - 1) * w;
			break;
		case "south":
			yCentreEnd += (ship.size - 1) * h;
			break;
		case "west":
			xCentreEnd -= (ship.size - 1) * w;
			break;
	}
	// fill(255);
	this.noStroke();
	this.ellipse(xCentreStart, yCentreStart, this.width / x - 5);
	this.ellipse(xCentreEnd, yCentreEnd, this.width / x - 5);
	this.rectMode(this.CENTER);
	this.rect((xCentreStart + xCentreEnd) / 2, (yCentreStart + yCentreEnd) / 2, this.abs(xCentreEnd - xCentreStart) + (ship.rotation == "north" || ship.rotation == "south" ? w : 0), this.abs(yCentreEnd - yCentreStart) + (ship.rotation == "east" || ship.rotation == "west" ? w : 0));


}

function _drawShot(shot, x = 10, y = 10) {
	let w = this.width / x;
	let h = this.height / y;
	let xCentre = (shot.x + 0.5) * w;
	let yCentre = (shot.y + 0.5) * h;

	this.strokeWeight(5);
	if (shot.hit == true) {
		this.stroke(255, 0, 0);
	}

	this.line(xCentre - w / 2, yCentre - h / 2, xCentre + w / 2, yCentre + h / 2);
	this.line(xCentre + w / 2, yCentre - h / 2, xCentre - w / 2, yCentre + h / 2);


}

function _checkCollisions(ship) {
	let inx = 0,
		iny = 0;
	switch (ship.rotation) {
		case "north":
			iny = -1;
			break;
		case "east":
			inx = +1;
			break;
		case "south":
			iny = +1;
			break;
		case "west":
			inx = -1;
			break;
	}
	for (let i = 0; i < ship.size; i++) {
		let shipX = ship.x + inx * i;
		let shipY = ship.y + iny * i;
		if (shipX < 0 || shipX >= 10) return true;
		if (shipY < 0 || shipY >= 10) return true;
		for (let other_ship of this.placed_ships) {
			let oinx = 0,
				oiny = 0;
			switch (other_ship.rotation) {
				case "north":
					oiny = -1;
					break;
				case "east":
					oinx = +1;
					break;
				case "south":
					oiny = +1;
					break;
				case "west":
					oinx = -1;
					break;
			}
			for (let j = 0; j < other_ship.size; j++) {
				let oX = other_ship.x + oinx * j;
				let oY = other_ship.y + oiny * j;
				if (oX == shipX && oY == shipY) return true;
			}
		}
	}

	return false;

}

function _placeShip() {
	if (this.placing_ship == null || this.checkCollisions(this.placing_ship)) return;
	this.placed_ships.push(Object.assign({}, this.placing_ship));
	this.placing_ship = this.ships.splice(0, 1)[0];
	if (this.placing_ship == null) {
		_socket.emit("place", this.placed_ships);
		console.log("All ships placed!");
	}
}

function rotateShip(ship) {
	if (!ship) return;
	switch (ship.rotation) {
		case "north":
			ship.rotation = "east";
			break;
		case "east":
			ship.rotation = "south";
			break;
		case "south":
			ship.rotation = "west";
			break;
		case "west":
			ship.rotation = "north";
			break;
	}
}

function _fire() {
	if (!this.firing) return;
	this.shots.push(this.firing);
	_socket.emit("fire", this.firing);
	this.firing = null;
}

function mousePressed(e) {
	return;
	if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
		// some code..
		return;
	}
	e.preventDefault();
	if (mouseButton == RIGHT) {
		rotateShip();
	} else {
		_placeShip();
	}
	console.log("mouse pressed");
}