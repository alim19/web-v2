export interface WBConfig {
	assetDir: string,
		templateDir: string,
		templateExt: string,
		ignore: string | string[]
}
export const WBDefaultConfig: WBConfig = {
	assetDir: "assets/",
	templateDir: "template/",
	templateExt: "",
	ignore: null
}