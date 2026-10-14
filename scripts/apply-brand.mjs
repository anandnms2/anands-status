// Applies Anands Status branding to a Beszel source tree.
// Usage: node apply-brand.mjs <beszel-src-dir> <brand-dir>
// Every edit asserts that it matched, so the build fails loudly if upstream changes shape.
import fs from "node:fs"
import path from "node:path"

const [src, brand] = process.argv.slice(2)
if (!src || !brand) throw new Error("usage: apply-brand.mjs <beszel-src> <brand-dir>")
const site = path.join(src, "internal/site")
const rd = (p) => fs.readFileSync(p, "utf8")
const wr = (p, s) => fs.writeFileSync(p, s)

function edit(rel, fn) {
	const p = path.join(site, rel)
	const before = rd(p)
	const after = fn(before)
	if (after === before) throw new Error(`brand patch had no effect: ${rel}`)
	wr(p, after)
}

// 1. Static assets (icons, favicon, PWA manifest)
for (const f of fs.readdirSync(path.join(brand, "static"))) {
	fs.copyFileSync(path.join(brand, "static", f), path.join(site, "public/static", f))
}

// 2. Components
fs.copyFileSync(path.join(brand, "logo.tsx"), path.join(site, "src/components/logo.tsx"))
fs.copyFileSync(path.join(brand, "footer-repo-link.tsx"), path.join(site, "src/components/footer-repo-link.tsx"))

// 3. index.html: title, icons, theme colour, first-paint dark background
edit("index.html", (s) =>
	s
		.replace("<title>Beszel</title>", "<title>Anands Status</title>")
		.replace(
			'<link rel="apple-touch-icon" href="./static/icon.png" />',
			'<link rel="alternate icon" href="./static/favicon.ico" sizes="any" />\n\t\t<link rel="apple-touch-icon" href="./static/apple-touch-icon.png" />\n\t\t<meta name="theme-color" content="#0f0f0f" />\n\t\t<meta name="apple-mobile-web-app-title" content="Anands Status" />',
		)
		.replace("hsl(220 5.5% 9%)", "hsl(0 0% 6.5%)"),
)

// 4. Dynamic favicon (shows the down-count badge): orange mark instead of the blue/green gradient
const mark = rd(path.join(brand, "mark-path.txt")).trim()
edit("src/lib/utils.ts", (s) => {
	const start = s.indexOf("const svg = `")
	const end = s.indexOf("${downCount > 0 &&")
	if (start < 0 || end < 0) throw new Error("favicon template not found in utils.ts")
	const head =
		'const svg = `\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500">\n' +
		`  <path fill="#F68712" fill-rule="evenodd" d="${mark}"/>\n  `
	let out = s.slice(0, start) + head + s.slice(end)
	// badge geometry for the 500x500 viewBox
	out = out
		.replace('<circle cx="40" cy="50" r="22" fill="#f00"/>', '<circle cx="390" cy="390" r="110" fill="#f00"/>')
		.replace(
			'<text x="40" y="60" font-size="34"',
			'<text x="390" y="438" font-size="130"',
		)
	if (!out.includes('cx="390"') || !out.includes('font-size="130"')) throw new Error("favicon badge patch failed")
	return out
})

// 5. Theme variables (appended last so they override upstream values)
edit("src/index.css", (s) => s + "\n" + rd(path.join(brand, "theme.css")))

// 6. User-facing "Beszel" -> "Anands Status" (word-boundary: keeps BeszelInfo, BESZEL, beszel-agent, URLs)
let renamed = 0
const skip = new Set(["logo.tsx", "footer-repo-link.tsx", "types.d.ts"])
function walk(dir) {
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		const p = path.join(dir, e.name)
		if (e.isDirectory()) {
			if (e.name === "locales") continue
			walk(p)
		} else if (/\.tsx?$/.test(e.name) && !skip.has(e.name)) {
			const s = rd(p)
			const n = s.replace(/\bBeszel\b/g, "Anands Status")
			if (n !== s) {
				wr(p, n)
				renamed++
			}
		}
	}
}
walk(path.join(site, "src"))
if (renamed < 5) throw new Error(`expected to rename Beszel in several files, got ${renamed}`)
console.log(`Anands Status branding applied (${renamed} source files renamed)`)
