import { useStore } from "@nanostores/react"
import { $newVersion } from "@/lib/stores"

// Anands Status footer: no upstream GitHub / release links.
export function FooterRepoLink() {
	useStore($newVersion)
	return (
		<div className="flex gap-1.5 justify-end items-center pe-3 sm:pe-6 mt-3.5 mb-4 text-xs opacity-80">
			<span className="text-muted-foreground">Anands Status {globalThis.BESZEL.HUB_VERSION}</span>
		</div>
	)
}
