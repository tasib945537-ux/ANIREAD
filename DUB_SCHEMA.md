# AniRead Dub Database Schema Specification (DUB_SCHEMA.md)

## Overview
AniRead enforces a strict, season-specific audio dub database to eliminate false-positive badges and inaccurate metadata.

---

## 1. Schema Hierarchy

```
AnimeRecord
└── franchise_title: string
└── anime_id: string
└── format: "TV" | "Movie" | "OVA" | "ONA"
└── seasons: SeasonDubRecord[]
    └── season_number: number
    └── season_title: string
    └── episode_count: number (Season-specific, NOT franchise total)
    └── languages: SeasonDubLanguageInfo[]
        ├── language: string ("Hindi", "English", "Bengali", "Japanese", "Tamil", "Telugu", etc.)
        ├── code: string ("hi", "en", "bn", "ja", "ta", "te", "es")
        ├── audio_type: "original" | "dub"
        ├── status: DubVerificationStatus
        ├── dubbed_episodes: string | number (e.g. "12/12", "1-25", "Ongoing")
        ├── platform: string[] (e.g. ["Crunchyroll India", "Netflix India"])
        ├── region: string (e.g. "IN", "BD", "Global", "US")
        ├── source_urls: string[] (Clickable verified source links)
        ├── last_verified: string (e.g. "October 2026")
        ├── studios?: string[] (Localization / voice studios)
        ├── voice_actors?: VerifiedVoiceActor[]
        └── notes?: string
```

---

## 2. Verification Status Taxonomy

| Status | Code | Meaning |
|---|---|---|
| Confirmed | `CONFIRMED` | 100% verified by active licensed broadcaster audio stream or distributor press release. |
| Partially Confirmed | `PARTIALLY_CONFIRMED` | Some episodes dubbed or ongoing release batch; not the full season. |
| Announced | `ANNOUNCED` | Officially licensed or announced by studio/streamer, but broadcasting has not begun. |
| Subtitles Only | `Sub Only` | Only subtitles provided in this language; no localized voice audio track exists. |
| Unverified | `UNVERIFIED` | Reported by third-party without primary source citation. |
| Unknown | `UNKNOWN` | No status information available. **Never mark as Confirmed without proof.** |

---

## 3. Data Integrity Invariants

1. **Season Isolation**: A dub badge on Season 1 NEVER copies automatically to Season 2 or Season 3.
2. **Episode Totals Separation**: Franchise-wide totals (e.g., Attack on Titan = 89 eps, My Hero Academia = 159 eps) must never overwrite season totals (e.g., Attack on Titan Season 1 = 25 eps).
3. **Movie Display Format**: Feature films must be rendered as `"Movie · 1 film"`, never as `"1 episode"`.
4. **Bengali Audio vs Subtitle**: Bengali subtitles (e.g., Muse Asia subtitle feeds) must be tagged `Sub Only` and distinct from authentic Bengali audio dubs (e.g., Rent-a-Girlfriend Bengali Dub).
5. **Airing Anime Clocks**: Airing shows must show the latest verified episode and a live countdown to the next drop, calculated using verified SimulDub offset intervals.
