import JSZip from 'jszip';
import initSqlJs from 'sql.js/dist/sql-wasm.js';

export class AnkiProcessor {
    constructor() {
        this.sqlPromise = initSqlJs({
            locateFile: file => `/${file}`
        });
        this.cards = [];
        this.media = {};
    }

    async processFile(file) {
        const zip = await JSZip.loadAsync(file);
        
        // Load media map if exists
        const mediaFile = zip.file('media');
        if (mediaFile) {
            this.media = JSON.parse(await mediaFile.async('string'));
            // We need to extract the actual media files and create URLs for them
            // This is done on-demand or pre-emptively. For simplicity, let's do it on-demand
            // But we need the zip instance to do that.
            this.zip = zip; 
        }

        // Extract database
        const dbFile = zip.file('collection.anki21') || zip.file('collection.anki2');
        if (!dbFile) {
            throw new Error('Invalid .apkg: Could not find database file.');
        }

        const dbData = await dbFile.async('uint8array');
        const SQL = await this.sqlPromise;
        const db = new SQL.Database(dbData);

        // Query notes and cards
        // 'flds' contains the content separated by \x1f
        // 'cards' table links cards to notes
        const query = `
            SELECT n.flds, n.sfld, c.id
            FROM notes n
            JOIN cards c ON n.id = c.nid
            ORDER BY c.ord
        `;
        
        const results = db.exec(query);
        if (results.length === 0) {
            return [];
        }

        const rows = results[0].values;
        this.cards = rows.map(row => {
            const fields = row[0].split('\x1f');
            return {
                front: fields[0],
                back: fields[1] || '',
                id: row[2]
            };
        });

        return this.cards;
    }

    async getMediaUrl(filename) {
        // Find the index key in this.media
        const mediaId = Object.keys(this.media).find(key => this.media[key] === filename);
        if (mediaId && this.zip) {
            const file = this.zip.file(mediaId);
            if (file) {
                const blob = await file.async('blob');
                return URL.createObjectURL(blob);
            }
        }
        return null;
    }

    // Replace [anki:...] tags or <img> tags with local URLs
    async processHtml(html) {
        if (!html) return '';
        
        // Simple regex to find image tags and replace their src
        const imgRegex = /<img[^>]+src="([^">]+)"/g;
        let match;
        let processedHtml = html;

        // Reset regex state
        imgRegex.lastIndex = 0;
        
        const replacements = [];
        while ((match = imgRegex.exec(html)) !== null) {
            const filename = match[1];
            const url = await this.getMediaUrl(filename);
            if (url) {
                replacements.push({ original: match[0], filename, url });
            }
        }

        for (const replacement of replacements) {
            processedHtml = processedHtml.replace(
                `src="${replacement.filename}"`, 
                `src="${replacement.url}"`
            );
        }

        return processedHtml;
    }
}
