import {
	Game,
	GameJoinParams,
	GameDataPacket
} from "./game";
import {
	GameDB
} from "../gamedb";
import * as io from "socket.io"


class backgammon extends Game {
	constructor(db: GameDB) {
		super("backgammon", db);
	}

	async join(socket: io.Socket, d: GameJoinParams): Promise < boolean > {

		return true;
	}

	async data(socket: io.Socket, d: GameDataPacket) {

	}


}

export {
	backgammon as game
};