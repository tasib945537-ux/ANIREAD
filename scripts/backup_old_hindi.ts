import fs from 'node:fs';
import path from 'node:path';
import { VERIFIED_HINDI_ANIME_CATALOG } from '../src/services/verifiedHindiAnimeCatalog';
import { EXPANDED_HINDI_ANIME_CATALOG } from '../src/services/verifiedHindiAnimeCatalogExpanded';
import { ALL_NORMALIZED_DUB_DATABASE } from '../src/services/dub-database/index';
import { VERIFIED_OFFICIAL_CATALOG, KNOWN_HINDI_DUB_FRANCHISE_KEYWORDS } from '../src/services/dubCatalog';

const root = process.cwd();
const backupDir = path.join(root, 'data', 'backups');
fs.mkdirSync(backupDir, { recursive: true });

let dubRecordsJson: any[] = [];
const dubRecordsPath = path.join(root, 'data', 'dub_records.json');
if (fs.existsSync(dubRecordsPath)) {
  dubRecordsJson = JSON.parse(fs.readFileSync(dubRecordsPath, 'utf-8'));
}

const normalizedHindiEntries = ALL_NORMALIZED_DUB_DATABASE.filter((rec) =>
  rec.seasons.some((s) => s.languages.some((l) => l.language === 'Hindi'))
).map((rec) => ({
  animeId: rec.animeId,
  title: rec.title,
  englishTitle: rec.englishTitle,
  seasons: rec.seasons.map((s) => ({
    seasonNumber: s.seasonNumber,
    seasonTitle: s.seasonTitle,
    hindi: s.languages.find((l) => l.language === 'Hindi'),
  })),
}));

const catalogHindiEntries = VERIFIED_OFFICIAL_CATALOG.filter((rec) =>
  rec.languages.some((l) => l.language === 'Hindi')
).map((rec) => ({
  title: rec.title,
  hindi: rec.languages.find((l) => l.language === 'Hindi'),
}));

const backupPayload = {
  backedUpAt: new Date().toISOString(),
  reason: 'Pre-rebuild snapshot before deleting old/unverified Hindi dub dataset and importing rebuilt verified database.',
  counts: {
    dubRecordsJson: dubRecordsJson.length,
    verifiedHindiCatalog: VERIFIED_HINDI_ANIME_CATALOG.length,
    expandedHindiCatalog: EXPANDED_HINDI_ANIME_CATALOG.length,
    normalizedHindiEntries: normalizedHindiEntries.length,
    catalogHindiEntries: catalogHindiEntries.length,
    franchiseKeywordsCount: KNOWN_HINDI_DUB_FRANCHISE_KEYWORDS.length,
  },
  sources: {
    dub_records_json: dubRecordsJson,
    verifiedHindiAnimeCatalog: VERIFIED_HINDI_ANIME_CATALOG,
    verifiedHindiAnimeCatalogExpanded: EXPANDED_HINDI_ANIME_CATALOG,
    normalizedHindiEntries,
    catalogHindiEntries,
    franchiseKeywords: KNOWN_HINDI_DUB_FRANCHISE_KEYWORDS,
  },
};

const outPath = path.join(backupDir, 'hindi_db_backup_pre_rebuild.json');
fs.writeFileSync(outPath, JSON.stringify(backupPayload, null, 2), 'utf-8');
console.log('Backup written successfully to:', outPath);
console.log('Counts:', JSON.stringify(backupPayload.counts));
