import {
	promises as fsPromise
} from "fs";

export interface SitemapURL {
	loc: string,
		priority ? : number,
		lastmod ? : Date,
		changeFreq ? : string,
}

export async function makeSitemap(urls: SitemapURL[], filepath: string) {
	let sitemap =
		`<?xml version="1.0" encoding="UTF-8"?>\n` +
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
	urls.forEach(url => {
		sitemap += `\t<url>\n`;
		sitemap += `\t\t<loc>${url.loc}</loc>\n`;
		if (url.priority) sitemap += `\t\t<priority>${url.priority}</priority>\n`
		sitemap += `\t</url>\n`;
	});

	sitemap += `</urlset>`;
	fsPromise.writeFile(filepath, Buffer.from(sitemap));
}