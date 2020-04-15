/// <reference path="../../tsd/p5.global-mode.d.ts" />
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

interface card {
	bw: boolean,
		text: string,
		pack_name: string,
		extra ? : {
			draw ? : number,
			pick ? : number
		}
}

const icon = "data:image/svg+xml;base64,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"

class cah extends p5 {
	socket;

	black: card;
	hand: card[];
	game: Game;

	constructor(socket) {
		super(() => {}, document.getElementById("game"), false);
		this.socket = socket;
		this.socket.on("game_data", this.onData.bind(this));
	}

	onData(data: GameDataPacket) {
		// console.log(data);
		switch (data.packetType) {
			case "black":
				this.black = data.data;
				break;
			case "hand":
				this.hand = data.data;
				break;
			default:
				console.log(`Unknown data packet of type : ${data.packetType}`);
				console.log(data.data);
				break;
		}
		this.updateCards();
	}

	setup() {
		// console.log(this.socket);
		this.noCanvas();

		this.game = {
			gameId: parseInt(params.get("id")),
			gameName: "",
			gameType: 2,
			gameToken: "",
		}
		//@ts-ignore
		let b: p5.Element = this.createButton("rand");
		b.mousePressed(() => {
			this.socket.emit("game_data", {
				gameId: this.game.gameId,
				gameToken: this.game.gameToken,
				packetType: "rand",
				gameType: this.game.gameType,
			});
		});
		this.createElement("br");
		//@ts-ignore
		this.createDiv().id("black");
		//@ts-ignore
		this.createDiv().id("hand");
	}

	updateCards() {
		let cards = document.getElementsByClassName("card");
		while (cards.length) cards[0].remove();
		// for (let card of cards) {
		// 	card.remove();
		// }
		if (this.black)
			this.drawCard(this.black, "black");
		if (this.hand)
			for (let card of this.hand) {
				this.drawCard(card, "hand");
			}
	}

	drawCard(c: card, node ? : string | HTMLElement | p5.Element) {
		// @ts-ignore
		// let d: p5.Element = this.createSpan();
		// if (node) d.parent(node);
		// d.style("display", "inline-block")
		let d: p5.Element;
		//@ts-ignore
		// d = this.createDiv().parent(d);
		//@ts-ignore
		d = this.createDiv().parent(node);
		d.addClass("card");
		if (c.bw) d.addClass("black");
		//@ts-ignore
		let t: p5.Element = this.createP();
		t.parent(d);
		t.html(c.text);
		t.style("margin", "0");
		d.style("background-color", c.bw ? "black" : "white");
		d.style("color", c.bw ? "white" : "black");
		d.size(240, 300);


		//@ts-ignore
		let foot: p5.Element = this.createDiv();
		foot.style("position", "absolute");
		foot.style("bottom", "0");
		foot.parent(d);


		//@ts-ignore
		let simg: p5.Element = this.createSpan();
		simg.parent(foot);
		simg.style("display", "inline-block");

		//@ts-ignore
		let img: p5.Element = this.createImg(icon, "cah icon");
		img.parent(simg);
		img.size(50, 50);
		// img.style("position", "absolute");
		// img.style("bottom", "0");

		//@ts-ignore
		let sp: p5.Element = this.createSpan();
		sp.parent(foot);
		sp.style("display", "inline-block");

		// @ts-ignore
		let p: p5.Element = this.createP();
		p.parent(sp);
		p.html(c.pack_name);
		// p.style("position", "absolute");
		// p.style("bottom", "0");
		p.style("left", "60px");
		p.style("font-size", "14px");



		// if (node) d.parent(node);
	}


}

// new cah(_socket)