/**
 * Shared utility for parsing Zotero filenames.
 */
export function capitalizeTitle(title: string): string {
    return title
        .split(/[_\s.-]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(" ");
}

export function parseFilenameMetadata(filename: string): any | null {
    const cleanFilename = filename.replace(/\.(pdf|htm|html|docx)$/i, "");
    
    let authorPart = "";
    let titlePart = "";
    let year = "";

    // 1. Pattern: Author - Title (or | separator)
    if (filename.includes(" - ") || filename.includes(" | ")) {
        const separator = filename.includes(" - ") ? " - " : " | ";
        const sParts = cleanFilename.split(separator);
        if (sParts.length >= 2) {
            authorPart = sParts[0].trim();
            titlePart = sParts.slice(1).join(separator).trim();
            
            const tWords = titlePart.split(/[_\s.-]+/);
            const yIdx = tWords.findIndex(p => /^(19|20)\d{2}$/.test(p));
            if (yIdx !== -1) {
                year = tWords[yIdx];
            }
        }
    }

    // 2. Pattern: Author: 2022 - Title
    if (!authorPart && filename.includes(": ")) {
        const sParts = cleanFilename.split(": ");
        if (sParts.length >= 2) {
            authorPart = sParts[0].trim();
            const rest = sParts[1].trim();
            if (rest.includes(" - ")) {
                const restParts = rest.split(" - ");
                year = restParts[0].trim().match(/^(19|20)\d{2}$/) ? restParts[0].trim() : "";
                titlePart = restParts.slice(1).join(" - ").trim();
            } else {
                titlePart = rest;
            }
        }
    }

    // 3. Pattern: YEAR + TITLE (e.g., 2023 VULNERACIÓN DE DERECHOS)
    if (!authorPart) {
        const yearMatch = cleanFilename.match(/^(\d{4})\s+(.+)$/);
        if (yearMatch) {
            year = yearMatch[1];
            titlePart = yearMatch[2].trim();
            authorPart = "Unknown"; // Fallback for reports
        }
    }

    // 4. YEAR-BASED PATTERN (Fallback)
    if (!authorPart) {
        const parts = cleanFilename.split(/[_\s.-]+/).filter(p => p.length > 0);
        const yearIdx = parts.findIndex(p => /^(19|20)\d{2}$/.test(p));
        
        if (yearIdx !== -1) {
            year = parts[yearIdx];
            authorPart = parts.slice(0, yearIdx).join(" ").trim() || "Unknown";
            titlePart = parts.slice(yearIdx + 1).join(" ").trim();
        }
    }
    
    if (!titlePart) return null;
    if (!authorPart) authorPart = "Unknown";

    // Normalize creators
    const creators = authorPart === "Unknown" ? [] : authorPart.split(/ et | and |,/i).map(a => {
        const namePart = a.trim();
        return {
            creatorType: "author",
            lastName: namePart,
            firstName: ""
        };
    });

    return {
        title: capitalizeTitle(titlePart),
        date: year || undefined,
        creators
    };
}
