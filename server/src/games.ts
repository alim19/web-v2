import * as express from "express";
import * as mysql from "mysql";
import * as io from "socket.io";
import {
	Server
} from "http";
import {
	debug
} from "./debug";
import {
	Game,
	GameConstructor,
	GameDataPacket,
	GameJoinParams
} from "./games/game";
import {
	resolve
} from "dns";
import {
	GameDB
} from "./gamedb";
import {
	readFileSync
} from "fs";


const DB = {
	active_games: {
		table: "active_games",
		active_game_id: {
			column: "active_games.active_game_id",
		},
		active_game_type_id: {
			column: "active_games.active_game_type_id",
		},
		active_game_idle: {
			column: "active_games.active_game_idle",
		}
	},
	game_data: {
		table: "game_data",
		game_id: {
			column: "game_data.game_id",
		},
		data_key: {
			column: "game_data.data_key",
		},
		data_value: {
			column: "game_data.data_value",
		}
	},
	games: {
		table: "games",
		game_id: {
			column: "games.game_id",
		},
		game_name: {
			column: "games.game_name",
		}

	}
}
const MYSQL_CONFIG: mysql.ConnectionConfig = JSON.parse(readFileSync(".security/dbconf.json").toString());
const Games: GameDB = new GameDB(MYSQL_CONFIG);

// POOL.getConnection((err) => {
//     if(err){
//         console.log("NOT connected to sql server");
//     }else{
//         console.log("Connected to sql server");
//     }
// });


let socket;


function joinGame(socket: io.Socket, args: GameJoinParams) {
	console.log(`Join game request : `);
	console.log(args);
	if (!args) {
		socket.emit("kick", "no data");
		return;
	}

	//check game id exists

	Games.query(`SELECT active_games.active_game_id, active_games.active_game_type_id, active_games.active_game_idle, game_data.data_value FROM active_games, game_data WHERE active_game_id = ? AND game_data.data_key = 0;`, [args.gameId])
		.then(res => {
			if (res.err) {
				console.log(res.err);
				return;
			}
			// console.log(res.results);
			if (res.results.length == 0) {
				socket.emit("kick", "Game does not exist");
				console.log("disconnecting socket");
				socket.disconnect(true);
				return;
			}
			return getGame(res.results[0].active_game_type_id);
		}).then(game => {
			return game.join(socket, args);
		}).then(joined => {
			if (!joined) {
				socket.emit("kick", "Cannot join game");
				socket.disconnect(true);
			} else {
				socket.emit("welcome", "Successfully joined game!");
			}
		}).catch(console.log);
}

async function API(req: express.Request, res: express.Response, next: express.NextFunction) {
	await Games.query("delete from active_games where active_game_idle < (now()- INTERVAL 30 MINUTE) and active_game_id > 0;");
	if (!/^\/games\/api\/.+/.test(req.path)) {
		next();
		return;
	}
	// console.log(req.path);
	let paths: string[] = req.path.split('/');
	paths = paths.slice(paths.lastIndexOf("api") + 1);
	// console.log(paths);

	switch (paths[0]) {
		case "list":
			listGames(paths[1], res, next);
			return;
			break;
		case "create":
			createGame(paths[1], req, res, next);
			return;
			break;
		default:
			let g = await getGame(paths[0]);
			console.log(paths);
			if (g) g.apiHandler(req, res, next);
			else next(404);
			break;
	}

	// next();
}

function game_api(app: Server) {



	socket = io(app);
	socket.sockets.on("connection", (socket: io.Socket) => {
		console.log(`New connection : ${socket.id}`);
		socket.on("join", (data: GameJoinParams) => joinGame(socket, data));

		socket.on("disconnect", (args) => {
			console.log(`Socket disconnected : ${socket.id}`);
		});
		socket.on("game_data", async (data: GameDataPacket) => {
			// console.log(data);
			let game = await getGame(data.gameType);
			if (game)
				game.data(socket, data);
			else
				console.log("Unable to find game");
		});
	});

	return {
		API
	};
}



function listGames(game: string, response: express.Response, next: express.NextFunction) {

	//get all active games by game name/id


	Games.getActiveGames(game)
		.then(games => {
			let data = [];
			for (let game of games) {
				data.push({
					name: game.data.name,
					id: game.id,
					players: game.data.players.reduce((acc: number, cur: string) => {
						if (cur) return acc + 1;
						return acc;
					}, 0),
					password_protected: game.data.password ? true : false,
				})
			}

			response.type('application/json');
			response.send(data);
			response.end();
		})
		.catch(console.log)
		.catch(next)
	return;
}

let loadedGames: Game[] = [];

function createGame(game: string, req: express.Request, res: express.Response, next: express.NextFunction) {
	if (req.method != "POST") {
		next();
		return;
	}

	return getGame(game).then((game: Game) => {
		debug(`Creating game by Alex. CHANGE`);
		console.log(req.body);
		game.create(req.body).then(active_game_id => {
			res.send(`Created new ${game.name} game by ${"Alex"} with id ${active_game_id}`);
			res.end();
		});
	}).catch(next)
}

function getGame(game: string | number): Promise < Game > {
	let query: string
	if (typeof(game) == 'number' || /^[0-9]+$/.test(game)) {
		query = `SELECT ${DB.games.game_id.column}, ${DB.games.game_name.column} FROM ${DB.games.table} WHERE ${DB.games.game_id.column} = ${game};`;
	} else {
		query = `SELECT ${DB.games.game_id.column}, ${DB.games.game_name.column} FROM ${DB.games.table} WHERE ${DB.games.game_name.column} = ${mysql.escape(game)};`;
	}
	// console.log(query)
	return Games.query(query)

		.then(results => {
			// console.log(results);
			if (!results.results[0]) return null;
			// console.log(query);
			// console.log(results);
			let game_id: number = results.results[0].game_id;
			let game_name: string = results.results[0].game_name;
			let game_prom: Promise < Game > ;
			if (!loadedGames[game_id]) {
				game_prom = new Promise((resolve, reject) => {
					let import_prom: Promise < any > ;
					import_prom = import(`./games/${game_name}`)
						.then((_game: any) => {
							let game: GameConstructor = _game.game;
							loadedGames[game_id] = new game(Games);
							// console.log(loadedGames[game_id]);
							// game.init(Games);
							resolve(loadedGames[game_id]);
						}).catch(reject);
				})
			} else {
				game_prom = new Promise(resolve => {
					resolve(loadedGames[game_id]);
				})
			}

			return game_prom;
		}).catch((err) => {
			console.log("Server Error! Game not found!");
			console.log(err);
			return Promise.reject(500);
		})

}

export {
	game_api
};