import * as io from "socket.io";
import {
	GameDB,
	game,
	game_data
} from "../gamedb";
import {
	Game,
	GameConstructor,
	GameDataPacket,
	GameCreateData,
	GameJoinParams
} from "./game"

interface player {
	socket: io.Socket;
	game_id: number;
	username: string;
	player_no: number;
};

enum rotation {
	NORTH = "north",
		EAST = "east",
		SOUTH = "south",
		WEST = "west",
}

interface ship {
	x: number,
		y: number,
		rotation: rotation,
		size: number,
}

interface shot {
	x: number,
		y: number,
		hit: boolean,
}

const battleships_v2: GameConstructor = class battleships_v2 extends Game {
	players: player[] = [];
	ships: ship[] = [{
			size: 5,
			rotation: rotation.NORTH,
			x: 0,
			y: 0
		},
		{
			size: 4,
			rotation: rotation.NORTH,
			x: 0,
			y: 0
		},
		{
			size: 3,
			rotation: rotation.NORTH,
			x: 0,
			y: 0
		},
		{
			size: 3,
			rotation: rotation.NORTH,
			x: 0,
			y: 0
		},
		{
			size: 2,
			rotation: rotation.NORTH,
			x: 0,
			y: 0
		},
	]

	x: number = 10;
	y: number = 10;

	constructor(db_server: GameDB) {
		super("battleships_v2", db_server);
	}

	async data(socket: io.Socket, game_data: GameDataPacket) {

	}

	async create(d: GameCreateData): Promise < number > {
		await this.ready;

		let id: number;
		try {
			id = await super.create(d);
			this.db.query("INSERT INTO game_data (game_id, data_key, data_value) VALUES\
			(?, 1, '[]'),(?, 2, '[]');",
				[id, id]);
		} catch (e) {
			console.log("ERROR: creating game");
			console.log(e);
		}
		return id;
	}

	async destroy() {}

	async join(socket: io.Socket, args: GameJoinParams): Promise < boolean > {
		await this.ready;

		let p: player = {
			game_id: args.gameId,
			username: args.userName,
			socket: socket,
			player_no: -1,
		}

		let game = await this.db.query(`SELECT * FROM game_data WHERE game_id = ${p.game_id} AND data_key = 0 LIMIT 1;`);
		let game_data: game_data = JSON.parse(game.results[0].data_value);
		console.log(game_data);
		if (game_data.password) {
			if (args.gamePassword != game_data.password) {
				return false;
			}
		}

		if (p.player_no == -1) {
			p.player_no = game_data.players.indexOf(null);
		}
		if (p.player_no == -1) {
			p.player_no = game_data.players.length;
		}
		if (p.player_no >= 2) return false;

		game_data.players[p.player_no] = p.username;
		await this.db.query(`UPDATE game_data SET data_value=? WHERE game_id=? AND data_key=0;`, [JSON.stringify(game_data), p.game_id]);
		let player_data = await this.db.getGameData(p.game_id);
		let ships: ship[] = player_data.json[p.player_no + 1];
		//JSON.parse(player_data.results.reduce((acc: any, row: any) => row.data_key == p.player_no + 1 ? row : acc, null).data_value)
		// if (ships) {
		setTimeout(() => {
			socket.emit("placed", ships);
			socket.emit("place", this.ships[ships.length]);
			if (ships.length >= this.ships.length) {
				let opponent_ships: ship[] = player_data.json[(p.player_no + 1) % 2 + 1];
				//JSON.parse(player_data.results.reduce((acc: any, row: any) => row.data_key == (p.player_no + 1) % 2 + 1 ? row : acc, null).data_value);
				if (opponent_ships.length >= this.ships.length)
					socket.emit("battle");
				if (p.player_no == game_data.turn)
					socket.emit("fire");
			}
			let shots: shot[] = player_data.json[p.player_no + 3];
			let opp_shots: shot[] = player_data.json[(p.player_no + 1) % 2 + 3];
			if (shots)
				socket.emit("fired", shots);
			if (opp_shots)
				socket.emit("shot", opp_shots);
		}, 200);
		console.log("sent placed ships");
		console.log(ships);
		console.log(this.ships[ships.length]);
		// }


		socket.on("place", (ship: ship) => this.place(p, ship));
		socket.on("fire", (shot: shot) => this.fire(p, shot));
		socket.on("leave", () => this.leave(p));

		this.players.push(p);

		return true;
	}

	async leave(player: player) {
		console.log("Leave game : ");
		let {
			game_id,
			username,
			player_no
		} = player;
		console.log({
			game_id,
			username,
			player_no
		});
		let game = await this.db.query(`SELECT * FROM game_data WHERE game_id = ${player.game_id} AND data_key = 0 LIMIT 1;`);
		if (!game) return;

		let game_data: game_data = JSON.parse(game.results[0].data_value);
		game_data.players = game_data.players.map(p => p == player.username ? null : p);
		this.db.query(`UPDATE game_data SET data_value=? WHERE game_id=? AND data_key=0;`, [JSON.stringify(game_data), player.game_id]);
		this.players = this.players.filter(p => p == player ? false : true);
	}

	async place(player: player, ship: ship): Promise < boolean > {
		console.log(ship);

		// let ships_data = await this.db.query(`SELECT * FROM game_data WHERE game_id = ? AND data_key = ? LIMIT 1;`, [player.game_id, player.player_no + 1]);
		let game_data = await this.db.getGameData(player.game_id);
		let ships: ship[] = game_data.json[player.player_no + 1];
		//JSON.parse(ships_data.results[0].data_value);
		if (ships.length >= this.ships.length) return false;
		if (this.checkShip(ship, ships) && ship.size == this.ships[ships.length].size) {
			//check that ships of correct length.
			ships.push(ship);
			this.db.query("UPDATE game_data SET data_value=? WHERE game_id=? AND data_key=?",
				[JSON.stringify(ships), player.game_id, player.player_no + 1]);
			player.socket.emit("placed", [ship]);
			player.socket.emit("place", this.ships[ships.length]);
			//check if all ships placed
			if (ships.length >= this.ships.length && game_data.json[(player.player_no + 1) % 2 + 1].length >= this.ships.length) {
				player.socket.emit("battle");
				let opp = this.players.reduce((acc, cur) => cur.game_id == player.game_id && cur.player_no != player.player_no ? cur : acc, null);
				opp.socket.emit("battle");
				if (player.player_no == 0) player.socket.emit("fire");
				else opp.socket.emit("fire");

				//set turn
				game_data.data.turn = 0;
				this.db.query("UPDATE game_data SET data_value=? WHERE game_id=? AND data_key=0;", [JSON.stringify(game_data.data), player.game_id]);

				this.db.query("INSERT INTO game_data (game_id, data_key, data_value) VALUES (?, 3, '[]'),(?, 4, '[]');", [player.game_id, player.game_id]);

			}
			return true;
		}
		player.socket.emit("place", this.ships[ships.length]);
		return false;


	}

	async fire(player: player, shot: shot): Promise < boolean > {
		//iterate over opponents ships and check if hit
		console.log({
			player,
			shot
		});

		let game_data = await this.db.getGameData(player.game_id);
		if (game_data.data.turn != player.player_no) return false;
		let opponent_ships: ship[] = game_data.json[(player.player_no + 1) % 2 + 1];
		if (!opponent_ships) return false;
		// console.log("MARK 1")
		//check not duplicate
		let shots: shot[] = game_data.json[player.player_no + 3];
		if (shots.reduce((dup: boolean, s) => dup || (s.x == shot.x && s.y == shot.y), false)) {
			player.socket.emit("fire");
			return false;
		}
		// console.log("MARK 2");
		game_data.data.turn++;
		game_data.data.turn %= 2;
		this.db.query("UPDATE game_data SET data_value=? WHERE game_id=? AND data_key=0;", [JSON.stringify(game_data.data), game_data.id]);

		let hit: ship = null;
		for (let ship of opponent_ships) {
			let hits: number = ship.size - 1;
			let inx: number = 0,
				iny: number = 0;
			switch (ship.rotation) {
				case rotation.NORTH:
					iny = -1;
					break;

				case rotation.EAST:
					inx = +1;
					break;

				case rotation.SOUTH:
					iny = +1;
					break;

				case rotation.WEST:
					inx = -1;
					break;
			}

			for (let i = 0; i < ship.size; i++) {
				let X = ship.x + inx * i;
				let Y = ship.y + iny * i;
				if (shot.x == X && shot.y == Y) {
					shot.hit = true;
					hit = ship;
				}
				for (let shot of shots) {
					if (shot.hit && shot.x == X && shot.y == Y) hits--;
				}
			}
			// console.log({
			// 	hits,
			// 	shot,
			// 	hit,
			// 	ship
			// });
			if (hits == 0 && hit == ship) {
				console.log("SUNK");
				player.socket.emit("sunk", [ship]);
			}
		}
		shots.push(shot);
		this.db.query("UPDATE game_data SET data_value=? WHERE game_id=? AND data_key=?;", [JSON.stringify(shots), game_data.id, player.player_no + 3])
		player.socket.emit("fired", [shot]);
		let opp = this.players.reduce((opp, cur) => cur.game_id == player.game_id && cur.player_no != player.player_no ? cur : opp, null);
		if (opp) {
			opp.socket.emit("shot", [shot]);
			opp.socket.emit("fire");
		}
		// console.log("MARK 3")
		if (shot.hit) {
			let hits = shots.reduce((count: number, shot) => count + (shot.hit ? 1 : 0), 0);
			if (hits >= this.ships.reduce((count: number, ship) => count + ship.size, 0)) {
				//winner
				player.socket.emit("win");
				player.socket.emit("reset");
				if (opp) {
					opp.socket.emit("lose");
					opp.socket.emit("reset");
				}
				this.reset(game_data.id);
			}
		}

		return shot.hit;
	}

	async reset(game_id: number) {
		await this.db.query(`DELETE FROM game_data WHERE game_id = ${game_id} AND data_key > 0;`);
		await this.db.query("INSERT INTO game_data (game_id, data_key, data_value) VALUES\
		(?, 1, '[]'),(?, 2, '[]');", [game_id, game_id]);
		let players: player[] = this.players.filter(p => p.game_id == game_id);
		players.map(p => p.socket.emit("place", this.ships[0]));
	}


	checkShip(ship: ship, placed_ships: ship[]): boolean {

		let inx: number = 0,
			iny: number = 0;
		switch (ship.rotation) {
			case rotation.NORTH:
				iny = -1;
				break;

			case rotation.EAST:
				inx = +1;
				break;

			case rotation.SOUTH:
				iny = +1;
				break;

			case rotation.WEST:
				inx = -1;
				break;
		}

		for (let i = 0; i < ship.size; i++) {
			let X = ship.x + inx * i;
			let Y = ship.y + iny * i;
			if (X < 0 || X >= this.x ||
				Y < 0 || Y >= this.y) {
				return false;
			}
			for (let other of placed_ships) {
				let oinx: number = 0,
					oiny: number = 0;
				switch (other.rotation) {
					case rotation.NORTH:
						oiny = -1;
						break;

					case rotation.EAST:
						oinx = +1;
						break;

					case rotation.SOUTH:
						oiny = +1;
						break;

					case rotation.WEST:
						oinx = -1;
						break;
				}
				for (let j = 0; j < other.size; j++) {
					let oX = other.x + oinx * j;
					let oY = other.y + oiny * j;

					if (X == oX && Y == oY) {
						return false;
					}
				}
			}
		}
		return true;
	}
}

export {
	battleships_v2 as game
};