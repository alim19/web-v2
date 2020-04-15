import * as express from "express";
import * as fs from "fs";

export let GlobalRoot: string;

function staticServe(root: string) {
	GlobalRoot = root;
	return function (req: express.Request, res: express.Response, next: express.NextFunction) {
		let fullpath = root + req.path;
		sendFile(fullpath, req, res, next);
	}
}

function sendFile(path: string, req: express.Request, res: express.Response, next: express.NextFunction) {
	let type = path.substr(path.lastIndexOf('.'));
	getFile(path)
		.then(async file => {

			let r = /#{.+}/gm;
			let i;
			if (type == '.html')
				while (i = r.exec(file)) {
					// console.log(i[0]);
					try {
						let include = await getFile(`public/include/${i[0].substring(2, i[0].length-1)}.html`);
						file = file.substr(0, i.index) + include + file.substr(i.index + i[0].length);
					} catch (e) {
						file = file.substr(0, i.index) + file.substr(i.index + i[0].length);
					}
				}
			res.type(type);
			res.send(file);
			res.end();
		})
		.catch(err => {
			console.log(err);
			next(404);
		})
	return;
	fs.exists(path, (exists: boolean) => {
		if (!exists) {
			next(404);
			return;
		}
		fs.stat(path, (err, stat) => {
			if (stat.isDirectory()) {
				res.redirect(req.path + "/");
				res.end();
			} else {
				let rs = fs.createReadStream(path);
				res.type(path.substr(path.lastIndexOf(".")));
				rs.on("data", (data: Buffer) => {
					res.write(data);
				});
				rs.on("end", () => {
					res.end();
					rs.close();
				});
			}

		})
	})
}

async function getFile(path: string): Promise < string > {
	// console.log(`Getting file: ${path}`);
	let handle = await fs.promises.open(path, 'r');
	// console.log("HANDLE");
	// console.log(handle);
	let file = await handle.readFile();
	handle.close();
	return file.toString();
}

export {
	sendFile,
	staticServe
};