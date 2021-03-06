import * as express from "express";

import {
	AutoRedirect as autoredir
} from "./autoredirect"
import {
	Log
} from "./log"
import * as error from "./error"
import {
	staticServe as serve
} from "./sendFile"
import {
	game_api
} from "./games"
import * as bodyParser from "body-parser";
import multer = require("multer");
import {
	readFileSync
} from "fs";
import {
	createServer
} from "https";
import {
	MC_Proxy
} from "./web-mc";

const upload = multer();
const app: express.Application = express();
const PORT: number = parseInt(process.env.PORT) || 8080;
const DEV: boolean = process.env.DEV ? true : false;

const SSL_OPTS = {
	key: readFileSync(".security/origin.priv"),
	cert: readFileSync(".security/origin.pem"),
}

function CORS(req: express.Request, res: express.Response, next: express.NextFunction) {
	if (req.method == "OPTIONS") {
		res.setHeader("Access-Control-Allow-Origin", "*");
		res.setHeader("Access-Control-Allow-Headers", "*");
		res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE")
		res.end();
		return;
	}
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Headers", "*");
	res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE")

	next();
}

let server;
if (DEV) {
	server = app.listen(PORT, () => {
		console.log(`listening on port:${PORT}`);
	})
	app.use(CORS);
	console.log("Allowing cross origin sharing");
} else {
	server = createServer(SSL_OPTS, app)
		.listen(PORT, () => {
			console.log(`listening on port:${PORT}`);
		});
}


// let server = app.listen(PORT, () => {
// 	console.log(`Listening on port ${PORT}`)
// });
const GAMES = game_api(server);


app.use(bodyParser.json());
// app.post('*', upload.array())

app.use(Log);
app.use(GAMES.API);

app.use(MC_Proxy)


app.use(autoredir);



app.get("*", serve("../www/dst/"));

app.use(error.error);
app.use(error.handled_error);
app.use(error.unhandled_error);