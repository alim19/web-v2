/// <reference path="../../tsd/p5.d.ts" />
///// <reference path="../../../socket.io.d.ts" />
/// <reference path="../game.ts" />


interface GameDataPacket {
	gameId: number,
		gameType: number,
		gameToken: string,
		packetType: string,
		userName ? : string,
		userToken ? : string,
		data ? : any
}

interface Game {
	gameId: number,
		gameType: number,
		gameName: string,
		gameToken: string,
}

_socket.on("welcome", data => {
	console.log("starting game");
	new backgammon(_socket);
})

class backgammon extends p5 {
	socket: SocketIOClient.Socket;
	board: p5.Graphics;

	constructor(socket: SocketIOClient.Socket) {
		super(() => {}, document.getElementById("game"), false);
		this.socket = socket

		this.createBoard();
	}

	createBoard() {
		this.board = this.createGraphics(this.width, this.height);
		this.board.clear();
		this.board.background(0);
		this.board.fill(40, 20, 60);
		this.board.rect(0, 0, this.width, this.height);
	}

	setup() {
		this.createCanvas(1000, 600);
	}

	draw() {
		// this.background(this.color("brown"));
		this.image(this.board, 0, 0);
	}

}