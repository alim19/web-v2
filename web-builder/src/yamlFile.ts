export interface yamlFile {
	files: {
		[filename: string]: FileObj,
	}
}

export interface FileObj {
	template: string,
		meta ? : string,
		title ? : string,
		styles ? : string | string[],
		scripts ? : string | string[],
		header ? : string,
		subheader ? : SubHeaderObj,
		content ? : string | ContentObj | {
			title: string,
			url: string
		} [],
		footer: string | FooterObj,
		[key: string]: any,
}

export interface SubHeaderObj {
	filename: string,
		title: string,
		hierarch: {
			title: string,
			url: string,
		} []
}

export interface ContentObj {

}

export interface FooterObj {

}