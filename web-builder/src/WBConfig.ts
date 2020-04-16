export interface WBConfig {
	assetDir: string,
		templateDir: string,
		templateExt: string,
		ignore: string | string[],
		host: string,
		sitemap: boolean,
}
export const WBDefaultConfig: WBConfig = {
	assetDir: "assets/",
	templateDir: "template/",
	templateExt: "",
	ignore: null,
	host: "",
	sitemap: false,
}