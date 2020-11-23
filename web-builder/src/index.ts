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
import {
	SitemapURL,
	makeSitemap
} from "./sitemap.js";
import {
	promises
} from "dns";

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

let sitemap: SitemapURL[] = [];

getConfig(root_dir + "/wbconfig.json", WBDefaultConfig)
	.then(async config => {
		// console.log(config);

		//build directories recursively
		await buildDir('/', [config], false);
		//keep all assets, copy to dest dir
		await copyFolder(`${root_dir}/${config.assetDir}/`, `${out_dir}/${config.assetDir}/`);

		//make sitemap.xml
		if (config.sitemap == true)
			makeSitemap(sitemap, `${out_dir}/sitemap.xml`);
	})

async function buildDir(dir: string, configs: WBConfig[], hasConfig: boolean = true) {
	let nodes = await fsPromise.readdir(root_dir + dir);
	let wait: Promise < any > [] = [];
	// console.log(nodes);
	fsPromise.mkdir(out_dir + dir).catch(() => {});
	if(hasConfig && nodes.includes("wbconfig.json")){
		console.log(`Found another wbconfig.json in ${root_dir + dir}`);
		wait.push(
			getConfig(root_dir + dir + "/wbconfig.json", configs[0])
				.then(async config => {
					// console.log(config);
			
					//build directories recursively
					await buildDir(dir, [config, ...configs], false);
					//keep all assets, copy to dest dir
					await copyFolder(`${root_dir + dir}/${config.assetDir}/`, `${out_dir + dir}/${config.assetDir}/`);
			
					//make sitemap.xml
					if (config.sitemap == true)
						makeSitemap(sitemap, `${out_dir}/sitemap.xml`);
				})
			)
	}
	else
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
						let genFile = await GenerateFile(doc.files[file], file, dir, configs);
						console.log(dir + file);
						wait.push(fsPromise.writeFile(out_dir + dir + file, genFile));
						let priority = doc.files[file].priority || 0;
						if (priority)
							sitemap.push({
								loc: configs[0].host + dir + file,
								priority: priority,
							});
						// console.log(genFile);
					}
				}else {
					let c = true;
					for (let e of configs[0].ignore) {
						if (e == node) c = false;
						let r = WCtoRegex(e);
						if (r.test(dir + node)) c = false;
					}
					// console.log(`${c?"Yes ":"No  "}:${dir}${node}`);

					if (c)
						wait.push(fsPromise.copyFile(root_dir + dir + node, out_dir + dir + node));
				}

			} else if (s.isDirectory()) {

				let c = true;
				for (let e of configs[0].ignore) {
					if (e == node) c = false;
					let r = WCtoRegex(e);
					if (r.test(dir + node)) c = false;
				}
				//this if statement needs updating!
				if (c && !(configs[0].templateDir.replace('/', '') == node) && !(configs[0].assetDir.replace('/', '') == node))
					wait.push(buildDir(dir + node + '/', configs));
			}
		}
	return Promise.all(wait);
}


// get a list of all index.yaml files


async function getConfig(filename: string, defaultConfig: WBConfig): Promise < WBConfig > {
	let conf: WBConfig;
	try {
		let confFile = await fsPromise.readFile(filename);
		conf = JSON.parse(confFile.toString())
	} catch {}
	return {
		...defaultConfig,
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

async function GenerateFile(f: FileObj, fileName: string, curDir: string, configs: WBConfig[]): Promise < string > {
	const templatedirs = configs.map(x => x.templateDir);
	const templateExts = configs.map(x => x.templateExt);
	const assetdir = configs[0].assetDir;
	let template: string = "";
	let file: string;
	template = await getFile(f.template, curDir, configs);
	file = template;
	let r = /#{.*}/g;
	let finds: RegExpExecArray[] = [];
	let find: RegExpExecArray;
	while (find = r.exec(file)) {
		finds.push(find);
		// console.log(find);
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
			let _file = await getFile(field, curDir, configs);
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
					let href = await getFilePath(f[field], curDir, configs);
					html += `<link rel="stylesheet" href="${href}"/>\n`
				} else if (f[field] instanceof Array) {
					for (let _f of f[field]) {
						let href = await getFilePath(_f, curDir, configs);
						html += `<link rel="stylesheet" href="${href}"/>\n`
					}
				}
				file = file.replace(_f[0], html);
				break;
			}
			case "scripts": {
				let html = "";
				if (typeof f[field] == 'string') {
					//@ts-ignore
					let src = await getFilePath(f[field], curDir, configs);
					html += `<script src="${src}"></script>\n`
				} else if (f[field] instanceof Array) {
					for (let _f of f[field]) {
						let src = await getFilePath(_f, curDir, configs);
						html += `<script src="${src}"></script>\n`
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
					let _file = await getFile(f[field].filename, curDir, configs);
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
							let _file = await getFile(f[field], curDir, configs);
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
									path += await getFilePath(templateFN, curDir, configs);
									// path += templatedir + '/' + templateFN.substr(templateFN.indexOf(':') + 1) + templateExt;
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

async function getFile(filename: string, curDir: string, configs: WBConfig[]): Promise < string > {
	try{
		let path = await getFilePath(filename, curDir, configs);
		return (await fsPromise.readFile(root_dir + path)).toString();
	}catch(e){
		return Promise.reject(`file not found: ${e}`);
	}
}

async function getFilePath(filename: string, curDir: string, configs: WBConfig[]): Promise<string> {
	let path = "";
	let b = filename.split(':')[0];
	let bn = filename.substr(filename.indexOf(':') + 1);
	for(let config of configs){
		if (b == "asset") {
			path = '/' + config.assetDir + bn;
		} else if (b == "template") {
			path = '/' + config.templateDir + bn + config.templateExt;
		} else if (b == "http" || b == "https") {
			path = filename;
			return Promise.resolve(path);
		} else if (filename[0] == '/') {
			path = filename;
			return Promise.resolve(path);
		} else {
			path = curDir + filename;
			return Promise.resolve(path);
		}
		//if path exists
		try{
			await fsPromise.access(root_dir + path)
			return Promise.resolve(path);
		}catch{}
	}
	return Promise.reject(`Could not find file: ${curDir + filename}`)
}