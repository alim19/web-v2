import * as io from "socket.io";
import {
	Game,
	GameInitFunction,
	GameCreateFunction,
	GameDestroyFunction,
	GameConstructor,
	GameDataPacket,
	GameJoinParams,
	GameCreateData
} from "./game";
import {
	debug
} from "../debug";
import {
	GameDB
} from "../gamedb";
import {
	escape
} from "mysql";

interface player {
	socket: io.Socket;
	game_id: number;
	username: string;
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

const battleships: GameConstructor = class battleships extends Game {
	protected players: player[] = [];

	constructor(db_server: GameDB) {
		super("battleships", db_server)
		this.db = db_server;
	}
	async data(socket: io.Socket, game_data: GameDataPacket) {

	}
	// init(){}
	async create(d: GameCreateData): Promise < number > {

		return super.create(d);
		return new Promise < number > ((resolve, reject) => {
			this.db.query(`INSERT INTO active_games(active_game_type_id, active_game_idle) VALUES (${this.id}, now());`) // 
				.then(results => {
					// console.log(results.results);
					resolve(results.results.insertId || -1);
					let json_data: any = {
						name: d.name,
						players: [],
						password: d.password
					};
					return this.db.query(`INSERT INTO game_data(game_id, data_key, data_value) VALUES (${results.results.insertId}, 0, ?);`, JSON.stringify(json_data));
				})
				.then(results => {
					// console.log(results);
				}).catch(err => {
					console.log(err);
					reject(err);
				});
		})

	}

	async destroy() {

	}

	async join(socket: io.Socket, args: GameJoinParams): Promise < boolean > {

		console.log(`Joining battleships game`);
		console.log(args);

		socket.removeAllListeners();

		//query to check if password correct etc, max number of players not reached etc

		return this.db.query(`SELECT data_key, data_value FROM game_data WHERE game_id = ${args.gameId} AND data_key = 0;`)
			.then(results => {
				let row = results.results[0];
				// console.log(row.data_value);
				let json = JSON.parse(row.data_value);
				// console.log(json);
				if (json.password !== args.gamePassword) {
					socket.emit("disconnect", "Incorrect password");
					socket.disconnect(true);
					return false;
				}
				if (json.players.length >= 2) {
					socket.emit("disconnect", "Too many players");
					socket.disconnect(true);
					return false;
				}
				// socket.emit("welcome", "Successfully joined game!");
				console.log("Successfully joined game!");
				json.players.push(args.userName);
				// console.log(json);
				console.trace("JOINING USERS");
				this.db.query(`UPDATE game_data SET data_value = ${escape(JSON.stringify(json))} WHERE game_id = ${args.gameId} AND data_key = 0;`)
					.then(() => {
						return this.db.query(`SELECT data_key, data_value FROM game_data WHERE game_id = ${args.gameId};`)
					})
					.then(results => {
						//player number
						console.log(results.results);
						let json = JSON.parse(results.results.reduce((acc: any, cur: any) => cur.data_key == 0 ? cur : acc, null).data_value);
						let player_number = json.players.indexOf(args.userName);
						debug(player_number)
						let player_data = results.results.reduce((acc: any, cur: any) => cur.data_key == player_number + 1 ? cur : acc, null);
						if (player_data) {
							debug(player_data);
							let player_json = JSON.parse(player_data.data_value);
							debug(player_json);
							socket.emit("place", player_json);
						}
						if (results.results.length >= 3) {
							socket.emit("battle");
						}
					}).catch(console.log);

				socket.on("exit", () => {
					this.leave(socket.id);
				});

				socket.on("place", (data: ship[]) => this.place(socket.id, data));

				socket.on("fire", (data: shot) => this.fire(socket.id, data));

				let player: player = {
					socket: socket,
					game_id: args.gameId,
					username: args.userName,
				}

				this.players.push(player);

				return true;
			})

		// return Promise.resolve(true);
	}

	place(sock_id: string, ships: ship[]) {
		//check that all positions are valid and not intersecting
		interface pos {
			x: number, y: number
		};
		let taken: pos[] = [];
		let valid: boolean = true;
		for (let ship of ships) {
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
				let X = ship.x + i * inx;
				let Y = ship.y + i * iny;
				if (X < 0 || X >= 10 || Y < 0 || Y >= 10) valid = false;
				let position: pos = {
					x: X,
					y: Y
				};
				if (taken.reduce((taken, cur) => cur == position ? cur : taken, null)) valid = false;
				taken.push(position);
			}
		}
		if (valid) {
			let player = this.getPlayer(sock_id);
			this.db.query(`SELECT data_value FROM game_data WHERE data_key = 0 AND game_id = ${player.game_id};`)
				.then(results => {
					let game_json = JSON.parse(results.results[0].data_value);
					let player_no = game_json.players.indexOf(player.username);

					return this.db.query(`INSERT INTO game_data (game_id, data_key, data_value) VALUES (${player.game_id}, ${player_no+1}, ${escape(JSON.stringify(ships))})`);
				})
				.then(results => {
					if (results.err) {
						console.log(results.err);
					}
					//check if altered
					// console.log(results);
					//if both entries exist, BATTLE
					return this.db.query(`SELECT data_key, data_value FROM game_data WHERE game_id = ${player.game_id};`)
				})
				.then(results => {
					if (results.results.length >= 3) {
						let game_data = results.results[0];
						let game_json = JSON.parse(game_data.data_value);
						game_json.turn = 0;
						//battle
						//get both socket for game
						let sockets: io.Socket[] = [];
						for (let p of this.players) {
							if (p.game_id == player.game_id)
								sockets.push(p.socket);
						}
						sockets.map(socket => {
							socket.emit("battle");
						});
						this.db.query(`UPDATE game_data SET data_value=${escape(JSON.stringify(game_json))} WHERE data_key = 0 AND game_id = ${player.game_id};`)
						this.db.query(`INSERT INTO game_data (game_id, data_key, data_value) VALUES (${player.game_id}, 3, "[]"), (${player.game_id}, 4, "[]")`)
					}
				})
		} else {

		}
	}

	fire(sock_id: string, shot: shot) {
		let player = this.getPlayer(sock_id);
		shot.hit = false;
		console.log(shot);
		this.db.query(`SELECT * FROM game_data WHERE game_id = ${player.game_id};`)
			.then(results => {
				//check if player's move
				let game_data = results.results.reduce((acc: any, cur: any) => {
					if (cur.data_key == 0) return cur;
					return acc;
				});
				let game_json = JSON.parse(game_data.data_value);
				let player_number = game_json.players.indexOf(player.username);
				if (game_json.turn != player_number) throw new Error("Not your turn!");
				game_json.turn++;
				game_json.turn %= 2;
				console.log(`Player ${game_json.turn}'s turn`);
				console.log(game_json);
				this.db.query(`UPDATE game_data SET data_value=${escape(JSON.stringify(game_json))} WHERE game_id = ${player.game_id} AND data_key = 0;`)
				// .then(console.log);
				//check if hit any of ships
				let opponent_ships: ship[] = JSON.parse(results.results.reduce((acc: any, cur: any) => {
					if (cur.data_key == game_json.turn + 1)
						return cur;
					return acc;
				}, null).data_value);

				let idx = (game_json.turn + 1) % 2 + 3
				let shots: shot[] = JSON.parse(results.results.reduce((acc: any, cur: any) => {
					if (cur.data_key == idx) {
						return cur;
					}
					return acc;
				}, null).data_value);

				for (let ship of opponent_ships) {
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
					let hits = ship.size - 1;
					let hit: boolean = false;
					for (let i = 0; i < ship.size; i++) {
						let X = ship.x + i * inx;
						let Y = ship.y + i * iny;
						if (shot.x == X && shot.y == Y) {
							//check if ship sunk
							shot.hit = true;
							console.log(shots);
							hit = true;
						}
						for (let shot of shots) {
							if (shot.x == X && shot.y == Y && shot.hit)
								hits--;
						}
					}
					if (hits == 0 && hit) {
						player.socket.emit("sunk", ship);
						console.log("SUNK");
					}

				}

				if (shots.reduce((dup, s) => {
						if (s.x == shot.x && s.y == shot.y) return true;
						return dup;
					}, false)) {

				} else {
					shots.push(shot);
					this.db.query(`UPDATE game_data SET data_value=${escape(JSON.stringify(shots))} WHERE game_id = ${player.game_id} AND data_key = ${idx};`);
				}

				return shot.hit;

			})
			.then(hit => {
				shot.hit = hit;
				console.log(`Hit? : ${hit}`);
				player.socket.emit("fired", shot);
				//get other player
				let opponent = this.players.reduce((acc, cur) => {
					if (cur != player && cur.game_id == player.game_id) {
						return cur;
					}
					return acc;
				}, null);
				if (opponent) {
					opponent.socket.emit("shot", shot);
					opponent.socket.emit("fire");
				} else {
					debug(`MISSING OPPONENT`);
				}

			}).catch(e => {
				console.log(e);
				player.socket.emit("fired", null);
			})
	}

	getPlayer(sock_id: string) {
		let player = this.players.reduce((correct, current) => {
			if (current.socket.id == sock_id)
				return current;
			return correct;
		}, null);
		return player;
	}

	leave(sock_id: string) {
		let player = this.getPlayer(sock_id);
		if (!player) return;
		this.players = this.players.filter(p => p == player ? 0 : 1);
		let game_id = player.game_id;
		this.db.query(`SELECT data_key, data_value FROM game_data WHERE game_id = ${game_id} AND data_key = 0;`)
			.then(results => {
				let row = results.results[0];
				let json = JSON.parse(row.data_value);
				console.log(json);
				let new_players = json.players.filter((p: any) => p == player.username ? 0 : 1);
				json.players = new_players;
				console.trace("REMOVING USERS");
				console.log(json)
				this.db.query(`UPDATE game_data SET data_value = ${escape(JSON.stringify(json))} WHERE game_id = ${game_id} AND data_key = 0;`)
			});

	}
}

export {
	battleships as game
};