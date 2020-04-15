import * as mysql from "mysql"
import {
	GameDB,
	GameType,
	game
} from "../gamedb";
import * as io from "socket.io"
import {
	Request,
	Response,
	NextFunction
} from "express";


export type GameInitFunction = (db_server: GameDB) => void;
export type GameCreateFunction = (d: GameCreateData) => Promise < number > ;
export type GameDestroyFunction = (game_id: number) => void;
export type GameJoinFunction = (socket: io.Socket, args: any) => Promise < boolean > ;
export interface GameConstructor {
	new(db_server: GameDB): Game;
}
export type GameDataFunction = (socket: io.Socket, game_data: GameDataPacket) => void;
export interface GameCreateData {
	name: string,
		password ? : string,
}

export interface GameDataPacket {
	gameId: number,
		gameType: number,
		gameToken: string,
		packetType: string,
		data ? : any,
		userName ? : string,
		userToken ? : string,
}

export interface GameJoinParams {
	gameId: number,
		userName: string,
		gamePassword: string,
}

export type GameAPIHandlerFunction = (req: Request, res: Response, next: NextFunction) => void;

interface _Game {
	create: GameCreateFunction;
	data: GameDataFunction;
	destroy: GameDestroyFunction;
	join: GameJoinFunction;
	apiHandler: GameAPIHandlerFunction;
	name: string;
	id: number;
	[key: string]: any;
}

let getGameType: Function = async function(name: string, db: GameDB): Promise < GameType > {
	return db.getGameType(name)
		.catch(() => {
			return db.query("INSERT INTO games (game_name) VALUES (?);", name)
				.then(getGameType(name, db));
		})

};

export abstract class Game implements _Game {
	public name: string;
	public id: number;
	protected db: GameDB;
	protected ready: Promise < void > ;
	constructor(name: string, db: GameDB) {
		this.name = name;
		this.db = db;
		this.ready = getGameType(this.name, this.db)
			.then((g: GameType) => {
				this.id = g.id;
			});
	}
	abstract async data(socket: io.Socket, data: GameDataPacket): Promise < void > ;

	async create(d: GameCreateData): Promise < number > {
		await this.ready;
		let game: game = {
			id: -1,
			type_id: this.id,
			data: {
				name: d.name,
				players: [],
				password: d.password,
			},
		}
		game = await this.db.createGame(game);

		return game.id;
	}

	async destroy() {

	}

	abstract async join(socket: io.Socket, args: GameJoinParams): Promise < boolean > ;

	apiHandler(req: Request, res: Response, next: NextFunction) {
		next(404);
	}

}