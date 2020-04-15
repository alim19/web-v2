/// <reference path="../tsd/socket.io.d.ts" />


const cookies: any = document.cookie
	.split(';')
	.reduce((res, c) => {
		const [key, val] = c.trim().split('=').map(decodeURIComponent)
		try {
			return Object.assign(res, {
				[key]: JSON.parse(val)
			})
		} catch (e) {
			return Object.assign(res, {
				[key]: val
			})
		}
	}, {});
const params = new window.URLSearchParams(window.location.search);

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

interface GameJoinData {
	gameId: number,
		userName: string,
		gamePassword ? : string,
}

let joindata: GameJoinData = {
	gameId: parseInt(params.get("id")),
	userName: cookies["username"],
	gamePassword: cookies["game_password"],
}

let _socket = io();
_socket.on("connect", () => {
	_socket.emit("join", joindata);
	// _socket.removeAllListeners();
	_socket.on("welcome", (d) => {
		console.log(d);
	})
	// _socket.on("reconnect", reconnectData);
	_socket.on("kick", (reason) => {
		console.log("kick");
		console.log(reason);
		setTimeout(() => {
			window.location.href = "../"
		}, 1000);
	})
})