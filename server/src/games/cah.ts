import {
	GameConstructor,
	Game,
	GameDataPacket,
	GameJoinParams,
	GameCreateData
} from "./game";
import {
	GameDB,
	game,
	GameType
} from "../gamedb";
import * as io from "socket.io"
import {
	readFileSync,
	readFile
} from "fs";
import {
	threadId
} from "worker_threads";
import {
	Socket
} from "dgram";
import {
	NextFunction,
	Response,
	Request
} from "express";
import {
	randomBytes
} from "crypto";

interface CahCreateData extends GameCreateData {

	packs: string[],

	max_players ? : number,
	timeout ? : number,
}

interface player {
	userName: string,
		gameId: number,
		gameToken: string,
		lastSocket: io.Socket,
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

interface pack {
	name: string,
		cards: card[],
}

const cah: GameConstructor = class cah extends Game {

	packs: pack[];
	cards_ready: Promise < void > ;
	constructor(db_server: GameDB) {
		super("cah", db_server);
		let self = this;
		this.cards_ready = new Promise < void > ((resolve, reject) => {
			readFile("./data/games/cah/cards.json", (err, data) => {
				if (err) {
					reject(err);
					return;
				}
				// console.log(data.toString());
				self.packs = JSON.parse(data.toString());
				for (let pack of this.packs) {
					console.log(pack.name + ":");
					for (let card of pack.cards) {
						console.log("	" + card.text.substr(0, 40));
					}
				}
				resolve();
			})
		})
	}

	async data(socket: io.Socket, data: GameDataPacket) {
		await this.ready;
		console.log(data);
		switch (data.packetType) {
			case "rand":
				this.randCard(socket, data);
				break;
			case "hand":
				this.sendHand(socket, data);
				break;
		}
	}

	async create(d: CahCreateData): Promise < number > {
		await this.ready;
		let id: number;
		try {
			id = await super.create(d);
			await this.db.query("INSERT INTO game_data (game_id, data_key, data_value) VALUES (?, 1, ?);", [id, JSON.stringify(d.packs)]);
		} catch (e) {
			console.log(e);
		}
		return id;
	}

	async join(socket: io.Socket, args: GameJoinParams): Promise < boolean > {
		await this.ready;
		await this.cards_ready;

		let p: player = {
			gameId: args.gameId,
			gameToken: randomBytes(16).toString("base64"),
			userName: args.userName,
			lastSocket: socket
		}
		console.log(p);

		return true;
	}

	async randCard(socket: io.Socket, args: any) {
		await this.cards_ready;

		let cards = this.packs.reduce((arr: card[], cur) => {
			return arr.concat(cur.cards)
		}, []);
		let d: GameDataPacket = {
			gameId: -1,
			gameToken: "",
			// userName: "",
			// userToken: "",
			packetType: "black",
			gameType: this.id,
			data: cards[Math.floor(Math.random() * cards.length)],
		}

		if (!d.data) debugger;


		socket.emit("game_data", d);

	}

	async sendHand(socket: io.Socket, data: GameDataPacket) {
		await this.cards_ready
		let packs = await this.db.getGameData(data.gameId, 1);

		let game_cards = this.packs.reduce(
			(arr, cur) => packs.json[1].indexOf(cur.name) != -1 ? arr.concat(cur.cards.reduce(
				(_arr, _cur) => _cur.bw ? _arr : _arr.concat(_cur), [])) : arr, []);
		// [])
		console.log(game_cards);
		console.trace("WIP");
		let hand: card[] = [];
		while (hand.length < 7) {
			hand.push(game_cards[Math.floor(Math.random() * game_cards.length)]);
		}
		let d: GameDataPacket = {
			gameId: data.gameId,
			gameToken: data.gameToken,
			gameType: data.gameType,
			packetType: "hand",
			data: hand,
		}
		socket.emit("game_data", d);
	}

	async getPacks(req: Request, res: Response, next: NextFunction) {
		await this.cards_ready;
		let packs: string[] = this.packs.reduce((p, c) => {
			p.push(c.name);
			return p;
		}, []);
		res.type("json");
		res.send(packs);
		res.end();

	}

	async apiHandler(req: Request, res: Response, next: NextFunction) {
		if (req.method == "GET") {
			let action = req.path.split("/");
			action = action.slice(action.lastIndexOf("api") + 2);
			switch (action[0]) {
				case "packs":
					this.getPacks(req, res, next);
					break;
				default:
					next(404);
			}
		} else if (req.method == "POST") {
			next(404);
		}
	}



}

export {
	cah as game
};