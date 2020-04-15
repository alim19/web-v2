import * as express from "express";
import * as fs from "fs";

function Log(req: express.Request, res: express.Response, next: express.NextFunction) {
	let log_data = `${req.method} : ${req.ip} : ${req.path}`
	// console.log(log_data);

	let timestr: string = new Date(Date.now()).toString();

	let path: string = `log/${timestr.substr(0, 18).replace(' ', '_')}`
	fs.appendFile(path, timestr.substr(16, 9) + log_data + '\n', () => {});

	next();
}

export {
	Log
};