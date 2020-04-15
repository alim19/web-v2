#!/usr/bin/env node

import {
	promises as fsPromise
} from "fs";
import {
	WBConfig,
	WBDefaultConfig
	//@ts-ignore
} from "./WBConfig.js";
//@ts-ignore
import YAML from "yaml"
import {
	FileObj,
	yamlFile
} from "./yamlFile"
import {
	WCtoRegex
} from "./wildcard.js";

const idx: number = process.argv[0].includes("node") ? 1 : 0;
if (process.argv.length <= idx + 1) {
	console.log(
		`Usage: ${process.argv[0]}
			Requires at leat one path as input`
	)
	process.exit();
}
const root_dir: string = (process.argv[idx + 1] || process.cwd()) + '/';
const out_dir: string = (process.argv[idx + 2] || "out") + '/';

let wbConfig: WBConfig = WBDefaultConfig;
// console.log(YAML);
// console.log(YAML.default)

getConfig(root_dir + "/wbconfig.json")
	.then(async config => {
		// console.log(config);

		//build directories recursively
		buildDir('/', config);
		//keep all assets, copy to dest dir
		copyFolder(`${root_dir}/${config.assetDir}/`, `${out_dir}/${config.assetDir}/`);


	})

async function buildDir(dir: string, config: WBConfig) {
	let nodes = await fsPromise.readdir(root_dir + dir);
	// console.log(nodes);
	fsPromise.mkdir(out_dir + dir).catch(() => {});
	for (let node of nodes) {
		// console.log(node);
		let s = await fsPromise.stat(root_dir + dir + node);
		if (s.isFile()) {
			if (node == "index.yaml") {
				// console.log()
				let file = await fsPromise.readFile(root_dir + dir + node);
				let doc: yamlFile = YAML.parseDocument(file.toString()).toJSON();
				// console.log(doc);
				for (let file in doc.files) {
					let genFile = await GenerateFile(doc.files[file], file, dir, config);
					console.log(dir + file);
					fsPromise.writeFile(out_dir + dir + file, genFile);
					// console.log(genFile);
				}
			} else {
				let c = true;
				for (let e of config.ignore) {
					if (e == node) c = false;
					let r = WCtoRegex(e);
					if (r.test(dir + node)) c = false;
				}
				// console.log(`${c?"Yes ":"No  "}:${dir}${node}`);

				if (c)
					fsPromise.copyFile(root_dir + dir + node, out_dir + dir + node);
			}

		} else if (s.isDirectory()) {

			let c = true;
			for (let e of config.ignore) {
				if (e == node) c = false;
				let r = WCtoRegex(e);
				if (r.test(dir + node)) c = false;
			}
			if (c && !(config.templateDir.replace('/', '') == node) && !(config.assetDir.replace('/', '') == node))
				buildDir(dir + node + '/', config);
		}
	}
}


// get a list of all index.yaml files


async function getConfig(filename: string): Promise < WBConfig > {
	let conf: WBConfig;
	try {
		let confFile = await fsPromise.readFile(filename);
		conf = JSON.parse(confFile.toString())
	} catch {}
	return {
		...wbConfig,
		...conf
	};
}

async function copyFolder(src: string, dst: string) {
	try {
		let nodes = await fsPromise.readdir(src);
		fsPromise.mkdir(dst).catch(() => {});
		for (let node of nodes) {
			let sn = `${src}/${node}`;
			let dn = `${dst}/${node}`;
			let stat = await fsPromise.stat(`${src}/${node}`);
			if (stat.isDirectory()) {
				await fsPromise.mkdir(dn);
				copyFolder(sn, dn);
			} else {
				fsPromise.copyFile(sn, dn);
			}
			// console.log(stat);
		}
		console.log(nodes);

	} catch {}
}

async function GenerateFile(f: FileObj, fileName: string, curDir: string, config: WBConfig): Promise < string > {
	const templatedir = config.templateDir;
	const templateExt = config.templateExt
	const assetdir = config.assetDir;
	let template: string = "";
	let file: string;
	template = await getFile(f.template, curDir, config);
	file = template;
	let r = /#{.*}/g;
	let finds: RegExpExecArray[] = [];
	let find: RegExpExecArray;
	while (find = r.exec(file)) {
		finds.push(find);
		// console.log(find[0]);
		// let fieldName: string = find[0].substr(2, find[0].length - 3);
		// for (let k in f) {
		// 	// console.log(k + ',' + fieldName);
		// 	if (fieldName == k) {
		// 		//@ts-ignore
		// 		console.log(f[k]);
		// 	}
		// }
		// file = file.substr(0, find.index - 1) + file.substr(find.index + find[0].length);
	}
	// = fsPromise.readFile(`${root_dir}/${templatedir}`)
	for (let _f of finds) {
		let field = _f[0].substring(2, _f[0].length - 1);
		if (field.split(':')[0] == "template") {
			// console.log("static template located");
			let _file = await getFile(field, curDir, config);
			file = file.replace(_f[0], _file);

			continue;
		}
		if (f[field] === undefined) {
			console.error(`yaml file missing entry "${field}" for file: "${fileName}" in: "${curDir}index.yaml"`);
		}
		// console.log(field);
		switch (field) {
			// case "meta":
			// 	break;
			case "title":
				let html = "";
				html += `<title>${f[field]}</title>`;
				file = file.replace(_f[0], html);
				break;
			case "styles": {
				let html = "";
				if (typeof f[field] == 'string') {
					//@ts-ignore
					html += `<link rel="stylesheet" href="${getFilePath(f[field], curDir, config)}"/>\n`
				} else if (f[field] instanceof Array) {
					for (let _f of f[field]) {
						html += `<link rel="stylesheet" href="${getFilePath(_f, curDir, config)}"/>\n`
					}
				}
				file = file.replace(_f[0], html);
				break;
			}
			case "scripts": {
				let html = "";
				if (typeof f[field] == 'string') {
					//@ts-ignore
					html += `<script src="${getFilePath(f[field], curDir, config)}"></script>\n`
				} else if (f[field] instanceof Array) {
					for (let _f of f[field]) {
						html += `<script src="${getFilePath(_f, curDir, config)}"></script>\n`
					}
				}
				file = file.replace(_f[0], html);
				break;
			}
			case "subheader":
				///@ts-ignore
				if (f[field]) {
					// console.log("subheader");


					//@ts-ignore
					let _file = await getFile(f[field].filename, curDir, config);
					//@ts-ignore
					let t = f[field].title;
					let hierarchy: {
						title: string,
						url: string
						//@ts-ignore
					} [] = f[field].hierarchy;
					let h = "";
					if (hierarchy)
						for (let a of hierarchy) {
							h += `<a href="${a.url}">${a.title}</a>`
						}
					// console.log({
					// 	t,
					// 	h,
					// 	_file
					// });
					_file = _file.replace("{{title}}", t);
					_file = _file.replace("{{hierarchy}}", h);
					file = file.replace(_f[0], _file);
				}
				break;
			case "content":
				if (typeof f[field] != 'string') {
					let html = "";
					if (f[field] instanceof Array) {
						//create a list of URLs
						html += `<ul>\n`;
						for (let {
								//@ts-ignore
								title,
								//@ts-ignore
								url
								//@ts-ignore
							} of f[field]) {
							html += `<li> <a href="${url}">${title}</a></li>\n`
						}
						html += `</ul>\n`;
					}
					file = file.replace(_f[0], html);
					break;
				}
				case "meta":
				case "footer":
				case "header":
					// default:
					//@ts-ignore
					let templateFN: any = f[field];
					//@ts-ignore
					if (typeof (f[field]) == "string") {
						try {
							//@ts-ignore
							let _file = await getFile(f[field], curDir, config);
							template = _file.toString();
							file = file.replace(_f[0], template);
						} catch (e) {
							console.log({
								field,
								templateFN,
							})
							console.log(e);
						}
						//@ts-ignore
					} else if (f[field] instanceof Array) {
						let files: string = "";
						//@ts-ignore
						for (let _f of f[field]) {
							templateFN = _f;
							try {
								let path = root_dir + '/';
								if (templateFN.split(':')[0] == "template") {
									path += templatedir + '/' + templateFN.substr(templateFN.indexOf(':') + 1) + templateExt;
									// }else if(){

								} else {
									// template = "";
									path += templateFN;
								}
								let _file = await fsPromise.readFile(path);
								template = _file.toString();
								files += template;
							} catch (e) {
								console.log({
									field,
									templateFN,
								})
								console.log(e);
							}
						}
						file = file.replace(_f[0], files);
					}
					break;

				default:
					file = file.replace(_f[0], f[field]);
					break;
		}
	}


	file = file.replace(/#{.*}/g, '');

	return file;
}

async function getFile(filename: string, curDir: string, config: WBConfig): Promise < string > {
	let path = getFilePath(filename, curDir, config);
	return (await fsPromise.readFile(root_dir + path)).toString();
}

function getFilePath(filename: string, curDir: string, config: WBConfig): string {
	let path = "";
	let b = filename.split(':')[0];
	let bn = filename.substr(filename.indexOf(':') + 1);
	if (b == "asset") {
		path += '/' + config.assetDir + bn;
	} else if (b == "template") {
		path += '/' + config.templateDir + bn + config.templateExt;
	} else if (b == "http" || b == "https") {
		path = filename;
	} else if (filename[0] == '/') {
		path += filename;
	} else {
		path += curDir + filename;
	}
	return path;
}