import * as mysql from "mysql";

interface DB {

};

export interface game_data {
	name: string,
		players: string[],
		password ? : string,
		[key: string]: any,
}

export interface game {
	id: number,
		type_id: number,
		data: game_data,
		json ? : {
			[key: number]: any;
		};
}

export interface QueryResults {
	err ? : mysql.MysqlError;
	results ? : any;
	fields ? : mysql.FieldInfo[];
}

export interface GameType {
	name: string,
		id: number,
}

export class GameDB {
	pool: mysql.Pool;

	constructor(config: mysql.ConnectionConfig) {
		this.pool = mysql.createPool(config).on("connection", (con) => {
			console.log("mysql DB connected!");
		});
	}

	async query(sql: string, values ? : any): Promise < QueryResults > {

		return new Promise((resolve, reject) => {
			this.pool.query(sql, values, (err: mysql.MysqlError, results: any[], fields: mysql.FieldInfo[]) => {
				if (err) reject(err);
				resolve({
					err,
					results,
					fields
				});
			})
		})
	}

	async getActiveGames(game: string | number): Promise < game[] > {

		let query: string
		if (typeof(game) == 'number' || /^[0-9]+$/.test(game)) {
			query = `SELECT games.game_id, games.game_name FROM games WHERE games.game_id = ${game};`;
		} else {
			query = `SELECT games.game_id, games.game_name FROM games WHERE games.game_name = ${mysql.escape(game)};`;
		}
		let game_id = (await this.query(query)).results[0].game_id;
		let query_results = await this.query(`SELECT active_game_id, active_game_type_id, game_id, data_value FROM active_games, game_data WHERE game_id = active_game_id AND active_game_type_id = ${game_id} AND data_key = 0;`);
		let games: game[] = [];
		for (let row of query_results.results) {
			let game: game = {
				id: row.game_id,
				type_id: row.active_game_type_id,
				data: JSON.parse(row.data_value),
			}
			games.push(game);
		}

		return games;

	}

	async createGame(game: game): Promise < game > {
		let query = await this.query(`INSERT INTO active_games (active_game_type_id, active_game_idle) VALUES (${game.type_id}, now());`);
		game.id = query.results.insertId;
		let game_data = game.data;
		this.query(`INSERT INTO game_data (game_id, data_key, data_value) VALUES (?, 0, ?);`, [game.id, JSON.stringify(game_data)]);
		return game;
	}

	async getGameData(gameId: number, key ? : number): Promise < game > {
		let query: string = "SELECT game_id,active_game_type_id,data_key,data_value FROM game_data, active_games WHERE game_id=active_game_id AND game_id=?  AND (data_key = 0 OR ";
		let args: any[] = [gameId];
		if (key) {
			query += " data_key=?);";
			args.push(key);
		} else {
			query += " 1 );";
		}
		let results = await this.query(query, args);
		let json = {};
		for (let row of results.results) {
			// @ts-ignore
			json[row.data_key] = JSON.parse(row.data_value);
		}
		let game: game = {
			id: results.results[0].game_id,
			type_id: results.results[0].active_game_type_id,
			data: JSON.parse(results.results.reduce((acc: any, cur: any) => cur.data_key == 0 ? cur : acc, null).data_value),
			json: json
		}
		return game;
	}

	async getConnection(): Promise < mysql.PoolConnection > {
		return new Promise((resolve, reject) => {
			this.pool.getConnection((err, conn) => {
				if (err) reject(err);
				else resolve(conn);
			})
		})
	}

	async setGameData(gameId: number, json: any, key: number | Array < number > ) {
		if (key instanceof Array && json instanceof Array) {
			let conn = await this.getConnection();
			for (let _k in key) {
				let k = key[_k];
				try {
					await new Promise((resolve, reject) => {
						conn.query("UPDATE game_data SET data_value=? WHERE game_id=? AND data_key=?;", [json[_k], gameId, k], (err, res, fields) => {
							console.log(res);
							if (err) reject(err);
							else resolve(res);
						})
					});
				} catch (err) {
					console.log(err);
					//insert instead of update
				};
			}
			conn.release();
		} else {
			try {
				this.query("UPDATE game_data SET data_value=? WHERE game_id=? AND data_key=?;", [json, gameId, key]);
			} catch (err) {

				//insert instead of update
			}
		}
	}

	async getGameType(game: string | number): Promise < GameType > {
		let query: string;
		if (typeof(game) == "string") {
			query = "SELECT * FROM games WHERE game_name=?";
		} else {
			query = "SELECT * FROM games WHERE game_id=?";
		}
		let {
			results
		} = await this.query(query, game);
		if (results[0]) {
			return {
				id: results[0].game_id,
				name: results[0].game_name,
			}
		} else {
			throw null as GameType;
		}
	}
}