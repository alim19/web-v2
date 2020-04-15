/////<reference path="../../p5.global-mode.d.ts"/>

let GamesList;
let game;

function setup() {
	noCanvas();

	let newGame = createButton("New Game");
	newGame.mouseClicked(createGame);
	let refresh = createButton("Refresh");
	refresh.mouseClicked(refreshList);


	let path = getURLPath();
	game = path[path.lastIndexOf("games") + 1];


	GamesList = createDiv();
	createP("Current running games: ").parent(GamesList);
	// createElement("br").parent(GamesList);
	GamesList = createElement("div").parent(GamesList);

	refreshList();

	setInterval(refreshList, 10000);

}

function refreshList() {

	let path = getURLPath();
	let game = path[path.lastIndexOf("games") + 1];

	fetch(`/games/api/list/${game}`)
		.then(response => {
			// console.log(response);
			return response.json();
		})
		.then(json => {
			// console.log(json);
			let children = GamesList.child();
			while (children.length > 0) children[0].remove();

			for (let _game of json) {
				let s = createElement("span");
				s.parent(GamesList);
				s.addClass("game");
				let child = createElement("div");
				child.parent(s);
				child.html(`Join game:<br/>${_game.name}<br/>Players:${_game.players}`);
				child.mouseClicked(joinGame.bind(_game));

				// child.html(`<a href='/games/${game}/game.html?id=${_game.id}'>Join</a>`, true);
				// createElement("li", `${JSON.stringify(game)}`).parent(GamesList);
			}
		})
		.catch(err => {
			console.log(err);
		});
}

function joinGame() {

	if (document.cookie.indexOf("username") == -1) {
		let uname = prompt("You need to choose a username first!", "username");
		document.cookie = `username=${uname};path=/games`;
		return;
	}

	let password = "";
	if (this.password_protected) {
		password = prompt("Please enter the password for this game.");
	}
	document.cookie = `game_password=${password}`;
	location.assign(`/games/${game}/game.html?id=${this.id}`);

}

async function createGame() {
	let data = {};
	if (window.customCreate) {
		let custom_data = window.customCreate();
		if (custom_data instanceof Promise) {
			data = await custom_data;
		}
		if (data == null) return;
	} else {
		let name = prompt("Please enter game name", "name");
		if (name == null) return;
		let password = prompt("Enter password, \nor leave blank for open game.");
		// let data = {
		// 	name: name,
		// 	password: password,
		// };

		data.name = name;
		data.password = password;

	}


	fetch(`/games/api/create/${game}`, {
		method: "POST",
		body: JSON.stringify(data),
		headers: {
			'Content-Type': 'application/json'
		}
	}).then(() => {
		refreshList();
	})
}

function draw() {

}

new p5(null, "container");