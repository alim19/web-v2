import * as express from "express";
import fetch from "node-fetch";

async function mc_proxy_handler(req: express.Request, res: express.Response, next: express.NextFunction) {
	let newpath = req.path.substr(req.path.indexOf("/minecraft/") + 11);

}

export function MC_Proxy(req: express.Request, res: express.Response, next: express.NextFunction) {
	if (req.path.indexOf("/minecraft") == -1) {
		next();
		return;
	}
	console.log("MC proxying");
	console.log({
		req: req.path,
		res: req.body
	});
	let newpath = req.path.substr(req.path.indexOf("/minecraft") + 10);
	let newbody = req.body;
	console.log({
		newpath,
		newbody
	});
	fetch("https://authserver.mojang.com" + newpath, {
			body: JSON.stringify(newbody),
			headers: {
				"Content-Type": "application/json"
			},
			method: req.method,
		})
		.then((response: any) => response.json())
		.then((json: any) => {
			console.log(json);
			res.setHeader("Content-Type", "application/json");
			res.send(json);
			res.end();

		}).catch(() => next(500));
}