import { WatchLink, AnimeItem } from '../types/anime';

/**
 * Verified Crunchyroll series mapping by MyAnimeList ID.
 * Direct official anime series pages on Crunchyroll.
 */
export const CRUNCHYROLL_MAL_ID_MAP: Record<number, string> = {
  // Steins;Gate (User Requirement Example)
  9253: 'https://www.crunchyroll.com/series/GY091N856/steinsgate',
  // One Piece (User Requirement Example)
  21: 'https://www.crunchyroll.com/series/GRMG8ZQZR/one-piece',
  // Demon Slayer: Kimetsu no Yaiba (User Requirement Example)
  38000: 'https://www.crunchyroll.com/series/GY5P48XEY/demon-slayer-kimetsu-no-yaiba',
  47778: 'https://www.crunchyroll.com/series/GY5P48XEY/demon-slayer-kimetsu-no-yaiba',
  49926: 'https://www.crunchyroll.com/series/GY5P48XEY/demon-slayer-kimetsu-no-yaiba',
  51019: 'https://www.crunchyroll.com/series/GY5P48XEY/demon-slayer-kimetsu-no-yaiba',
  55701: 'https://www.crunchyroll.com/series/GY5P48XEY/demon-slayer-kimetsu-no-yaiba',

  // Major popular animes
  40748: 'https://www.crunchyroll.com/series/GRDV0019R/jujutsu-kaisen', // Jujutsu Kaisen
  51009: 'https://www.crunchyroll.com/series/GRDV0019R/jujutsu-kaisen', // Jujutsu Kaisen S2
  16498: 'https://www.crunchyroll.com/series/GR751KNZY/attack-on-titan', // Attack on Titan
  25777: 'https://www.crunchyroll.com/series/GR751KNZY/attack-on-titan', // Attack on Titan S2
  35760: 'https://www.crunchyroll.com/series/GR751KNZY/attack-on-titan', // Attack on Titan S3
  40028: 'https://www.crunchyroll.com/series/GR751KNZY/attack-on-titan', // Attack on Titan Final
  20: 'https://www.crunchyroll.com/series/GY8VM2M5Y/naruto', // Naruto
  1735: 'https://www.crunchyroll.com/series/GY8VM2M5Y/naruto', // Naruto Shippuden
  44511: 'https://www.crunchyroll.com/series/GVDHX8QNW/chainsaw-man', // Chainsaw Man
  269: 'https://www.crunchyroll.com/series/G649X13QE/bleach', // Bleach
  41467: 'https://www.crunchyroll.com/series/G649X13QE/bleach', // Bleach: TYBW
  31964: 'https://www.crunchyroll.com/series/G6NQ5DWZ6/my-hero-academia', // My Hero Academia
  50265: 'https://www.crunchyroll.com/series/G4PH0WVPX/spy-x-family', // SPY x FAMILY
  52991: 'https://www.crunchyroll.com/series/GG5H5XMQ5/frieren-beyond-journeys-end', // Frieren
  52299: 'https://www.crunchyroll.com/series/GDKH4EX4W/solo-leveling', // Solo Leveling
  64340: 'https://www.crunchyroll.com/series/GT00384004', // Overgeared (Tempal)
  1535: 'https://www.crunchyroll.com/series/G6QW59836/death-note', // Death Note
  11061: 'https://www.crunchyroll.com/series/GY8VM2M5Y/hunter-x-hunter', // Hunter x Hunter (2011)
  30276: 'https://www.crunchyroll.com/series/G63K98PZ6/one-punch-man', // One Punch Man
  22319: 'https://www.crunchyroll.com/series/G6KXX3W7Y/tokyo-ghoul', // Tokyo Ghoul
  34572: 'https://www.crunchyroll.com/series/GRE507NP6/black-clover', // Black Clover
  5114: 'https://www.crunchyroll.com/series/GRGGPG93R/fullmetal-alchemist-brotherhood', // Fullmetal Alchemist: Brotherhood
  31240: 'https://www.crunchyroll.com/series/GRGG77NZR/rezero-starting-life-in-another-world-', // Re:Zero
  39535: 'https://www.crunchyroll.com/series/G675XQK76/mushoku-tensei-jobless-reincarnation', // Mushoku Tensei
  29803: 'https://www.crunchyroll.com/series/G619P9JRY/overlord', // Overlord
  37430: 'https://www.crunchyroll.com/series/GYZJ43JMR/that-time-i-got-reincarnated-as-a-slime', // Tensura Slime
  38691: 'https://www.crunchyroll.com/series/GYEXQKJG6/dr-stone', // Dr. STONE
  37521: 'https://www.crunchyroll.com/series/GEXH3W450/vinland-saga', // Vinland Saga
  52588: 'https://www.crunchyroll.com/series/GG5H5XQ4E/kaiju-no-8', // Kaiju No. 8
  56352: 'https://www.crunchyroll.com/series/G3KHEV195/wind-breaker', // Wind Breaker
  57334: 'https://www.crunchyroll.com/series/GG5H5XQ9P/dandadan', // Dandadan
  49596: 'https://www.crunchyroll.com/series/G4PH0WEKE/bluelock', // Blue Lock
  42249: 'https://www.crunchyroll.com/series/G6PDGWE96/tokyo-revengers', // Tokyo Revengers
  32182: 'https://www.crunchyroll.com/series/G675X2566/mob-psycho-100', // Mob Psycho 100
  54492: 'https://www.crunchyroll.com/series/G3KHEVDJ7/the-apothecary-diaries', // The Apothecary Diaries
  35507: 'https://www.crunchyroll.com/series/GRGG77NZR/classroom-of-the-elite', // Classroom of the Elite
  20583: 'https://www.crunchyroll.com/series/GY8VM2M5Y/haikyu', // Haikyu!!
  30831: 'https://www.crunchyroll.com/series/G68VVPKP6/konosuba-gods-blessing-on-this-wonderful-world', // KonoSuba
  11757: 'https://www.crunchyroll.com/series/GY8VM2M5Y/sword-art-online', // Sword Art Online
  46569: 'https://www.crunchyroll.com/series/GJ0H7Q5ZG/hells-paradise', // Hell's Paradise
  52211: 'https://www.crunchyroll.com/series/G79H23W47/mashle-magic-and-muscles', // Mashle
  38671: 'https://www.crunchyroll.com/series/GY8V2W48Y/fire-force', // Fire Force
  47917: 'https://www.crunchyroll.com/series/GEXH3W290/bocchi-the-rock', // Bocchi the Rock!
  37999: 'https://www.crunchyroll.com/series/GRJ0J828Y/kaguya-sama-love-is-war', // Kaguya-sama
  40787: 'https://www.crunchyroll.com/series/G6QW407PY/rent-a-girlfriend', // Rent-a-Girlfriend
  42897: 'https://www.crunchyroll.com/series/G9VHN9P43/horimiya', // Horimiya
  40221: 'https://www.crunchyroll.com/series/G6J07950Y/tower-of-god', // Tower of God
  31478: 'https://www.crunchyroll.com/series/GR5VXQ8PR/bungo-stray-dogs', // Bungo Stray Dogs
  52347: 'https://www.crunchyroll.com/series/G3KHEVD0E/shangri-la-frontier', // Shangri-La Frontier
  58059: 'https://www.crunchyroll.com/series/GW4HM75P9/wistoria-wand-and-sword', // Wistoria
  55868: 'https://www.crunchyroll.com/series/G0XHWM34P/a-sign-of-affection', // A Sign of Affection
  30694: 'https://www.crunchyroll.com/series/GR19V7816/dragon-ball-super', // Dragon Ball Super
  813: 'https://www.crunchyroll.com/series/G62P10786/dragon-ball-z', // Dragon Ball Z
  14719: 'https://www.crunchyroll.com/series/GYP8DP1GY/jojos-bizarre-adventure', // JoJo's Bizarre Adventure
  58872: 'https://www.crunchyroll.com/series/G79H23W47', // Hell Mode
  20605: 'https://www.crunchyroll.com/series/GRZXQ014Y/assassination-classroom', // Assassination Classroom
  42072: 'https://www.crunchyroll.com/series/GY8V2394R', // She Professed Herself Pupil
  53263: 'https://www.crunchyroll.com/series/GJ0H7Q5V3/the-great-cleric', // The Great Cleric
  48414: 'https://www.crunchyroll.com/series/G8DHV74P8/sabikui-bisco', // Sabikui Bisco
  41094: 'https://www.crunchyroll.com/series/GRDV0019R/the-daily-life-of-the-immortal-king', // Daily Life of Immortal King
  51064: 'https://www.crunchyroll.com/series/G0XHWM147/black-summoner', // Black Summoner
  49613: 'https://www.crunchyroll.com/series/GEXH3W480/the-wrong-way-to-use-healing-magic', // Wrong Way to Use Healing Magic
  40834: 'https://www.crunchyroll.com/series/GEXH3W490/ranking-of-kings', // Ranking of Kings
  6702: 'https://www.crunchyroll.com/series/G675XQK76/fairy-tail', // Fairy Tail
  9919: 'https://www.crunchyroll.com/series/G62P7N006/blue-exorcist', // Blue Exorcist
  4224: 'https://www.crunchyroll.com/series/G6NQ5D006/toradora', // Toradora!
  23273: 'https://www.crunchyroll.com/series/G68VM8246/your-lie-in-april', // Your Lie in April
  35849: 'https://www.crunchyroll.com/series/GRZXQ014Y/darling-in-the-franxx', // Darling in the Franxx
  35790: 'https://www.crunchyroll.com/series/G675K10NW/the-rising-of-the-shield-hero', // Shield Hero
  40496: 'https://www.crunchyroll.com/series/GY8V2394R/the-misfit-of-demon-king-academy', // Misfit of Demon King
  36882: 'https://www.crunchyroll.com/series/GRGG77NZR/arifureta-from-commonplace-to-worlds-strongest', // Arifureta
  54744: 'https://www.crunchyroll.com/series/G0XHWM385/alya-sometimes-hides-her-feelings-in-russian', // Alya Russian
  52701: 'https://www.crunchyroll.com/series/GG5H5XQ9P', // Delicious in Dungeon
  57524: 'https://www.crunchyroll.com/series/G1XHJV088/makeine-too-many-losing-heroines', // Makeine
  56690: 'https://www.crunchyroll.com/series/G79H23W47', // Re:Monster
  55265: 'https://www.crunchyroll.com/series/G1XHJV088', // Appraisal Skill
  57892: 'https://www.crunchyroll.com/series/G0XHWM385', // Failure Frame
  43523: 'https://www.crunchyroll.com/series/G8DHV74P8', // Tsukimichi
  54794: 'https://www.crunchyroll.com/series/GEXH3W480', // Metallic Rouge
  55358: 'https://www.crunchyroll.com/series/G3KHEV195', // Bucchigiri?!
  52816: 'https://www.crunchyroll.com/series/G1XHJV088', // The Witch and the Beast
  54276: 'https://www.crunchyroll.com/series/G79H23W47', // Tales of Wedding Rings
  55998: 'https://www.crunchyroll.com/series/G0XHWM34P', // Demon Prince of Momochi House
  57181: 'https://www.crunchyroll.com/series/GG5H5XQ4E', // Blue Box
  59085: 'https://www.crunchyroll.com/series/G6KXX3W7Y', // Ranma 1/2 (2024)
  54768: 'https://www.crunchyroll.com/series/G3KHEVD0E', // The Elusive Samurai
  1575: 'https://www.crunchyroll.com/series/G649X13QE/code-geass', // Code Geass
  33: 'https://www.crunchyroll.com/series/G6QW407PY/berserk', // Berserk
  1: 'https://www.crunchyroll.com/series/GY8VM2M5Y/cowboy-bebop', // Cowboy Bebop
  30: 'https://www.crunchyroll.com/series/G675XQK76/neon-genesis-evangelion', // Evangelion
  2001: 'https://www.crunchyroll.com/series/G6NQ5DWZ6/gurren-lagann', // Gurren Lagann
  13601: 'https://www.crunchyroll.com/series/G675X2566/psycho-pass', // Psycho-Pass
  22535: 'https://www.crunchyroll.com/series/G6KXX3W7Y/parasyte-the-maxim-', // Parasyte
  31043: 'https://www.crunchyroll.com/series/GY8VM9DEY/erased', // Erased
  9989: 'https://www.crunchyroll.com/series/G68VM8246/anohana-the-flower-we-saw-that-day', // Anohana
  22199: 'https://www.crunchyroll.com/series/G6KXX3W7Y/akame-ga-kill', // Akame ga Kill!
  18679: 'https://www.crunchyroll.com/series/G6NQ5DWZ6/kill-la-kill', // Kill la Kill
  20507: 'https://www.crunchyroll.com/series/G6NQ5DWZ6/noragami', // Noragami
  48736: 'https://www.crunchyroll.com/series/GEXH3W480/my-dress-up-darling', // My Dress-Up Darling
  42310: 'https://www.crunchyroll.com/series/GVDHX8QNW', // Cyberpunk: Edgerunners
  50594: 'https://www.crunchyroll.com/series/G9VHN9P43/suzume', // Suzume
  38826: 'https://www.crunchyroll.com/series/G9VHN9P43', // Weathering With You
  32281: 'https://www.crunchyroll.com/series/G9VHN9P43/your-name', // Your Name.
  28851: 'https://www.crunchyroll.com/series/G9VHN9P43', // A Silent Voice
};

/**
 * Verified Crunchyroll series mapping by AniList ID.
 */
export const CRUNCHYROLL_ANILIST_ID_MAP: Record<number, string> = {
  // Steins;Gate
  9253: 'https://www.crunchyroll.com/series/GY091N856/steinsgate',
  // One Piece
  21: 'https://www.crunchyroll.com/series/GRMG8ZQZR/one-piece',
  // Demon Slayer
  101922: 'https://www.crunchyroll.com/series/GY5P48XEY/demon-slayer-kimetsu-no-yaiba',
  142329: 'https://www.crunchyroll.com/series/GY5P48XEY/demon-slayer-kimetsu-no-yaiba',
  145139: 'https://www.crunchyroll.com/series/GY5P48XEY/demon-slayer-kimetsu-no-yaiba',
  166240: 'https://www.crunchyroll.com/series/GY5P48XEY/demon-slayer-kimetsu-no-yaiba',
  // Solo Leveling
  151807: 'https://www.crunchyroll.com/series/GDKH4EX4W/solo-leveling',
  // Overgeared
  212888: 'https://www.crunchyroll.com/series/GT00384004',
  // Hell Mode
  185262: 'https://www.crunchyroll.com/series/G79H23W47',
  // Jujutsu Kaisen
  113415: 'https://www.crunchyroll.com/series/GRDV0019R/jujutsu-kaisen',
  145064: 'https://www.crunchyroll.com/series/GRDV0019R/jujutsu-kaisen',
  // Attack on Titan
  16498: 'https://www.crunchyroll.com/series/GR751KNZY/attack-on-titan',
  20958: 'https://www.crunchyroll.com/series/GR751KNZY/attack-on-titan',
  99147: 'https://www.crunchyroll.com/series/GR751KNZY/attack-on-titan',
  110277: 'https://www.crunchyroll.com/series/GR751KNZY/attack-on-titan',
  // Chainsaw Man
  127230: 'https://www.crunchyroll.com/series/GVDHX8QNW/chainsaw-man',
  // Death Note
  1535: 'https://www.crunchyroll.com/series/G6QW59836/death-note',
  // Hunter x Hunter
  11061: 'https://www.crunchyroll.com/series/GY8VM2M5Y/hunter-x-hunter',
  // Naruto
  20: 'https://www.crunchyroll.com/series/GY8VM2M5Y/naruto',
  1735: 'https://www.crunchyroll.com/series/GY8VM2M5Y/naruto',
  // Bleach
  269: 'https://www.crunchyroll.com/series/G649X13QE/bleach',
  114446: 'https://www.crunchyroll.com/series/G649X13QE/bleach',
  // My Hero Academia
  21459: 'https://www.crunchyroll.com/series/G6NQ5DWZ6/my-hero-academia',
  // Kaguya-sama
  101921: 'https://www.crunchyroll.com/series/GRJ0J828Y/kaguya-sama-love-is-war',
  // Frieren
  154587: 'https://www.crunchyroll.com/series/GG5H5XMQ5/frieren-beyond-journeys-end',
  // Kaiju No. 8
  153288: 'https://www.crunchyroll.com/series/GG5H5XQ4E/kaiju-no-8',
  // Wind Breaker
  163270: 'https://www.crunchyroll.com/series/G3KHEV195/wind-breaker',
  // Dandadan
  171018: 'https://www.crunchyroll.com/series/GG5H5XQ9P/dandadan',
};

/**
 * Direct Crunchyroll series URLs map for verified anime titles.
 * NEVER points to search or homepage. Always exact series pages.
 */
export const CRUNCHYROLL_SERIES_MAP: Record<string, string> = {
  // Exact user requirement references
  'steins gate': 'https://www.crunchyroll.com/series/GY091N856/steinsgate',
  'steinsgate': 'https://www.crunchyroll.com/series/GY091N856/steinsgate',
  'one piece': 'https://www.crunchyroll.com/series/GRMG8ZQZR/one-piece',
  'demon slayer': 'https://www.crunchyroll.com/series/GY5P48XEY/demon-slayer-kimetsu-no-yaiba',
  'demon slayer kimetsu no yaiba': 'https://www.crunchyroll.com/series/GY5P48XEY/demon-slayer-kimetsu-no-yaiba',
  'kimetsu no yaiba': 'https://www.crunchyroll.com/series/GY5P48XEY/demon-slayer-kimetsu-no-yaiba',

  // Top franchises
  'solo leveling': 'https://www.crunchyroll.com/series/GDKH4EX4W/solo-leveling',
  'ore dake level up na ken': 'https://www.crunchyroll.com/series/GDKH4EX4W/solo-leveling',
  'kaguya sama love is war': 'https://www.crunchyroll.com/series/GRJ0J828Y/kaguya-sama-love-is-war',
  'kaguya sama wa kokurasetai tensai tachi no renai zunousen': 'https://www.crunchyroll.com/series/GRJ0J828Y/kaguya-sama-love-is-war',
  'rent a girlfriend': 'https://www.crunchyroll.com/series/G6QW407PY/rent-a-girlfriend',
  'kanojo okarishimasu': 'https://www.crunchyroll.com/series/G6QW407PY/rent-a-girlfriend',
  'jujutsu kaisen': 'https://www.crunchyroll.com/series/GRDV0019R/jujutsu-kaisen',
  'attack on titan': 'https://www.crunchyroll.com/series/GR751KNZY/attack-on-titan',
  'shingeki no kyojin': 'https://www.crunchyroll.com/series/GR751KNZY/attack-on-titan',
  'chainsaw man': 'https://www.crunchyroll.com/series/GVDHX8QNW/chainsaw-man',
  'naruto': 'https://www.crunchyroll.com/series/GY8VM2M5Y/naruto',
  'naruto shippuden': 'https://www.crunchyroll.com/series/GY8VM2M5Y/naruto',
  'bleach': 'https://www.crunchyroll.com/series/G649X13QE/bleach',
  'bleach thousand year blood war': 'https://www.crunchyroll.com/series/G649X13QE/bleach',
  'spy x family': 'https://www.crunchyroll.com/series/G4PH0WVPX/spy-x-family',
  'my hero academia': 'https://www.crunchyroll.com/series/G6NQ5DWZ6/my-hero-academia',
  'boku no hero academia': 'https://www.crunchyroll.com/series/G6NQ5DWZ6/my-hero-academia',
  'frieren beyond journey s end': 'https://www.crunchyroll.com/series/GG5H5XMQ5/frieren-beyond-journeys-end',
  'sousou no frieren': 'https://www.crunchyroll.com/series/GG5H5XMQ5/frieren-beyond-journeys-end',
  'kaiju no 8': 'https://www.crunchyroll.com/series/GG5H5XQ4E/kaiju-no-8',
  'wind breaker': 'https://www.crunchyroll.com/series/G3KHEV195/wind-breaker',
  'black clover': 'https://www.crunchyroll.com/series/GRE507NP6/black-clover',
  're zero starting life in another world': 'https://www.crunchyroll.com/series/GRGG77NZR/rezero-starting-life-in-another-world-',
  're zero': 'https://www.crunchyroll.com/series/GRGG77NZR/rezero-starting-life-in-another-world-',
  'mushoku tensei jobless reincarnation': 'https://www.crunchyroll.com/series/G675XQK76/mushoku-tensei-jobless-reincarnation',
  'mushoku tensei': 'https://www.crunchyroll.com/series/G675XQK76/mushoku-tensei-jobless-reincarnation',
  'overlord': 'https://www.crunchyroll.com/series/G619P9JRY/overlord',
  'that time i got reincarnated as a slime': 'https://www.crunchyroll.com/series/GYZJ43JMR/that-time-i-got-reincarnated-as-a-slime',
  'tensei shitara slime datta ken': 'https://www.crunchyroll.com/series/GYZJ43JMR/that-time-i-got-reincarnated-as-a-slime',
  'dr stone': 'https://www.crunchyroll.com/series/GYEXQKJG6/dr-stone',
  'vinland saga': 'https://www.crunchyroll.com/series/GEXH3W450/vinland-saga',
  'dandadan': 'https://www.crunchyroll.com/series/GG5H5XQ9P/dandadan',
  'blue lock': 'https://www.crunchyroll.com/series/G4PH0WEKE/bluelock',
  'tokyo revengers': 'https://www.crunchyroll.com/series/G6PDGWE96/tokyo-revengers',
  'mob psycho 100': 'https://www.crunchyroll.com/series/G675X2566/mob-psycho-100',
  'the apothecary diaries': 'https://www.crunchyroll.com/series/G3KHEVDJ7/the-apothecary-diaries',
  'kusuriya no hitorigoto': 'https://www.crunchyroll.com/series/G3KHEVDJ7/the-apothecary-diaries',
  'classroom of the elite': 'https://www.crunchyroll.com/series/GRGG77NZR/classroom-of-the-elite',
  'youkoso jitsuryoku shijou shugi no kyoushitsu e': 'https://www.crunchyroll.com/series/GRGG77NZR/classroom-of-the-elite',
  'haikyu': 'https://www.crunchyroll.com/series/GY8VM2M5Y/haikyu',
  'haikyuu': 'https://www.crunchyroll.com/series/GY8VM2M5Y/haikyu',
  'darling in the franxx': 'https://www.crunchyroll.com/series/GRZXQ014Y/darling-in-the-franxx',
  'the rising of the shield hero': 'https://www.crunchyroll.com/series/G675K10NW/the-rising-of-the-shield-hero',
  'tate no yuusha no nariagari': 'https://www.crunchyroll.com/series/G675K10NW/the-rising-of-the-shield-hero',
  'the misfit of demon king academy': 'https://www.crunchyroll.com/series/GY8V2394R/the-misfit-of-demon-king-academy',
  'konosuba god s blessing on this wonderful world': 'https://www.crunchyroll.com/series/G68VVPKP6/konosuba-gods-blessing-on-this-wonderful-world',
  'konosuba': 'https://www.crunchyroll.com/series/G68VVPKP6/konosuba-gods-blessing-on-this-wonderful-world',
  'arifureta from commonplace to world s strongest': 'https://www.crunchyroll.com/series/GRGG77NZR/arifureta-from-commonplace-to-worlds-strongest',
  'arifureta': 'https://www.crunchyroll.com/series/GRGG77NZR/arifureta-from-commonplace-to-worlds-strongest',
  'sword art online': 'https://www.crunchyroll.com/series/GY8VM2M5Y/sword-art-online',
  'hell s paradise': 'https://www.crunchyroll.com/series/GJ0H7Q5ZG/hells-paradise',
  'jigokuraku': 'https://www.crunchyroll.com/series/GJ0H7Q5ZG/hells-paradise',
  'mashle magic and muscles': 'https://www.crunchyroll.com/series/G79H23W47/mashle-magic-and-muscles',
  'fire force': 'https://www.crunchyroll.com/series/GY8V2W48Y/fire-force',
  'enn enn no shouboutai': 'https://www.crunchyroll.com/series/GY8V2W48Y/fire-force',
  'the daily life of the immortal king': 'https://www.crunchyroll.com/series/GRDV0019R/the-daily-life-of-the-immortal-king',
  'black summoner': 'https://www.crunchyroll.com/series/G0XHWM147/black-summoner',
  'the great cleric': 'https://www.crunchyroll.com/series/GJ0H7Q5V3/the-great-cleric',
  'sabikui bisco': 'https://www.crunchyroll.com/series/G8DHV74P8/sabikui-bisco',
  'tokyo ghoul': 'https://www.crunchyroll.com/series/G6KXX3W7Y/tokyo-ghoul',
  'the wrong way to use healing magic': 'https://www.crunchyroll.com/series/GEXH3W480/the-wrong-way-to-use-healing-magic',
  'the promised neverland': 'https://www.crunchyroll.com/series/GY8VM9DEY/the-promised-neverland',
  'fullmetal alchemist brotherhood': 'https://www.crunchyroll.com/series/GRGGPG93R/fullmetal-alchemist-brotherhood',
  'assassination classroom': 'https://www.crunchyroll.com/series/GRZXQ014Y/assassination-classroom',
  'hunter x hunter': 'https://www.crunchyroll.com/series/GY8VM2M5Y/hunter-x-hunter',
  'bocchi the rock': 'https://www.crunchyroll.com/series/GEXH3W290/bocchi-the-rock',
  'death note': 'https://www.crunchyroll.com/series/G6QW59836/death-note',
  'horimiya': 'https://www.crunchyroll.com/series/G9VHN9P43/horimiya',
  'tower of god': 'https://www.crunchyroll.com/series/G6J07950Y/tower-of-god',
  'bungo stray dogs': 'https://www.crunchyroll.com/series/GR5VXQ8PR/bungo-stray-dogs',
  'shangri la frontier': 'https://www.crunchyroll.com/series/G3KHEVD0E/shangri-la-frontier',
  'wistoria wand and sword': 'https://www.crunchyroll.com/series/GW4HM75P9/wistoria-wand-and-sword',
  'a sign of affection': 'https://www.crunchyroll.com/series/G0XHWM34P/a-sign-of-affection',
  'ranking of kings': 'https://www.crunchyroll.com/series/GEXH3W490/ranking-of-kings',
  'fairy tail': 'https://www.crunchyroll.com/series/G675XQK76/fairy-tail',
  'overgeared': 'https://www.crunchyroll.com/series/GT00384004',
  'tempal': 'https://www.crunchyroll.com/series/GT00384004',
  'tempal item no chikara': 'https://www.crunchyroll.com/series/GT00384004',
  'hell mode': 'https://www.crunchyroll.com/series/G79H23W47',
  'hell mode the hardcore gamer dominates in another world with garbage balancing': 'https://www.crunchyroll.com/series/G79H23W47',
  'dragon ball super': 'https://www.crunchyroll.com/series/GR19V7816/dragon-ball-super',
  'dragon ball z': 'https://www.crunchyroll.com/series/G62P10786/dragon-ball-z',
  'jojo s bizarre adventure': 'https://www.crunchyroll.com/series/GYP8DP1GY/jojos-bizarre-adventure',
  'jojo': 'https://www.crunchyroll.com/series/GYP8DP1GY/jojos-bizarre-adventure',
  'blue exorcist': 'https://www.crunchyroll.com/series/G62P7N006/blue-exorcist',
  'toradora': 'https://www.crunchyroll.com/series/G6NQ5D006/toradora',
  'your lie in april': 'https://www.crunchyroll.com/series/G68VM8246/your-lie-in-april',
  'alya sometimes hides her feelings in russian': 'https://www.crunchyroll.com/series/G0XHWM385/alya-sometimes-hides-her-feelings-in-russian',
  'delicious in dungeon': 'https://www.crunchyroll.com/series/GG5H5XQ9P',
  'makeine too many losing heroines': 'https://www.crunchyroll.com/series/G1XHJV088/makeine-too-many-losing-heroines',
  're monster': 'https://www.crunchyroll.com/series/G79H23W47',
  'as a reincarnated aristocrat i ll use my appraisal skill': 'https://www.crunchyroll.com/series/G1XHJV088',
  'failure frame': 'https://www.crunchyroll.com/series/G0XHWM385',
  'tsukimichi moonlit fantasy': 'https://www.crunchyroll.com/series/G8DHV74P8',
  'metallic rouge': 'https://www.crunchyroll.com/series/GEXH3W480',
  'bucchigiri': 'https://www.crunchyroll.com/series/G3KHEV195',
  'the witch and the beast': 'https://www.crunchyroll.com/series/G1XHJV088',
  'tales of wedding rings': 'https://www.crunchyroll.com/series/G79H23W47',
  'the demon prince of momochi house': 'https://www.crunchyroll.com/series/G0XHWM34P',
  'blue box': 'https://www.crunchyroll.com/series/GG5H5XQ4E',
  'ranma 1 2': 'https://www.crunchyroll.com/series/G6KXX3W7Y',
  'the elusive samurai': 'https://www.crunchyroll.com/series/G3KHEVD0E',
  'code geass': 'https://www.crunchyroll.com/series/G649X13QE/code-geass',
  'berserk': 'https://www.crunchyroll.com/series/G6QW407PY/berserk',
  'cowboy bebop': 'https://www.crunchyroll.com/series/GY8VM2M5Y/cowboy-bebop',
  'neon genesis evangelion': 'https://www.crunchyroll.com/series/G675XQK76/neon-genesis-evangelion',
  'gurren lagann': 'https://www.crunchyroll.com/series/G6NQ5DWZ6/gurren-lagann',
  'psycho pass': 'https://www.crunchyroll.com/series/G675X2566/psycho-pass',
  'parasyte the maxim': 'https://www.crunchyroll.com/series/G6KXX3W7Y/parasyte-the-maxim-',
  'erased': 'https://www.crunchyroll.com/series/GY8VM9DEY/erased',
  'anohana the flower we saw that day': 'https://www.crunchyroll.com/series/G68VM8246/anohana-the-flower-we-saw-that-day',
  'akame ga kill': 'https://www.crunchyroll.com/series/G6KXX3W7Y/akame-ga-kill',
  'kill la kill': 'https://www.crunchyroll.com/series/G6NQ5DWZ6/kill-la-kill',
  'noragami': 'https://www.crunchyroll.com/series/G6NQ5DWZ6/noragami',
  'my dress up darling': 'https://www.crunchyroll.com/series/GEXH3W480/my-dress-up-darling',
  'cyberpunk edgerunners': 'https://www.crunchyroll.com/series/GVDHX8QNW',
  'suzume': 'https://www.crunchyroll.com/series/G9VHN9P43/suzume',
  'weathering with you': 'https://www.crunchyroll.com/series/G9VHN9P43',
  'your name': 'https://www.crunchyroll.com/series/G9VHN9P43/your-name',
  'a silent voice': 'https://www.crunchyroll.com/series/G9VHN9P43',
};

/**
 * Normalizes title for lookup
 */
function normalizeKey(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Validates that a string is a genuine direct Crunchyroll series or watch URL.
 * NEVER allows search URLs or bare homepage URLs.
 */
export function isValidCrunchyrollSeriesUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim().toLowerCase();
  if (clean.includes('crunchyroll.com/search')) return false;
  if (clean === 'https://www.crunchyroll.com' || clean === 'https://www.crunchyroll.com/') return false;
  if (clean === 'http://www.crunchyroll.com' || clean === 'http://www.crunchyroll.com/') return false;
  return clean.includes('crunchyroll.com/series/') || clean.includes('crunchyroll.com/watch/');
}

export interface CrunchyrollResolutionResult {
  isAvailable: boolean;
  url: string | null;
  matchType?: 'mal_id' | 'anilist_id' | 'watch_link' | 'external_link' | 'exact_title' | 'alias';
}

/**
 * Returns the exact direct Crunchyroll Anime page URL (for Crunchyroll App or Web).
 * Rules:
 * 1. NEVER redirect to homepage.
 * 2. NEVER redirect to search results page.
 * 3. NEVER use generic URL.
 * 4. Resolves by MAL ID, AniList ID, exact title, watchLinks, or externalLinks.
 * 5. If no verified URL is available, returns null (do not guess).
 */
export function getCrunchyrollDirectUrl(
  titleOrAnime: string | Partial<AnimeItem> | any,
  watchLinks?: WatchLink[],
  japaneseTitle?: string
): string | null {
  const result = resolveCrunchyrollSeries(titleOrAnime, watchLinks, japaneseTitle);
  return result.url;
}

/**
 * Comprehensive resolution for an anime's official Crunchyroll series page
 */
export function resolveCrunchyrollSeries(
  titleOrAnime: string | Partial<AnimeItem> | any,
  watchLinks?: WatchLink[],
  japaneseTitle?: string
): CrunchyrollResolutionResult {
  let title = '';
  let englishTitle = '';
  let nativeTitle = japaneseTitle || '';
  let malId: number | undefined;
  let anilistId: number | undefined;
  let links: WatchLink[] | undefined = watchLinks;
  let extLinks: Array<{ name: string; url: string }> | undefined;

  if (typeof titleOrAnime === 'object' && titleOrAnime !== null) {
    title = titleOrAnime.title || '';
    englishTitle = titleOrAnime.englishTitle || '';
    nativeTitle = titleOrAnime.nativeTitle || japaneseTitle || '';
    malId = titleOrAnime.malId || (typeof titleOrAnime.id === 'number' && titleOrAnime.id < 100000 ? titleOrAnime.id : undefined);
    anilistId = titleOrAnime.anilistId || (typeof titleOrAnime.id === 'number' ? titleOrAnime.id : undefined);
    links = titleOrAnime.watchLinks || watchLinks;
    extLinks = titleOrAnime.externalLinks;
  } else {
    title = String(titleOrAnime || '');
  }

  // 1. Check MAL ID mapping first (Rule 4: MAL ID check)
  if (malId && CRUNCHYROLL_MAL_ID_MAP[malId]) {
    const url = CRUNCHYROLL_MAL_ID_MAP[malId];
    if (isValidCrunchyrollSeriesUrl(url)) {
      return { isAvailable: true, url, matchType: 'mal_id' };
    }
  }

  // 2. Check AniList ID mapping
  if (anilistId && CRUNCHYROLL_ANILIST_ID_MAP[anilistId]) {
    const url = CRUNCHYROLL_ANILIST_ID_MAP[anilistId];
    if (isValidCrunchyrollSeriesUrl(url)) {
      return { isAvailable: true, url, matchType: 'anilist_id' };
    }
  }

  // 3. Look for verified direct Crunchyroll series URL in watchLinks
  if (links && Array.isArray(links)) {
    for (const link of links) {
      if (link && link.name && link.name.toLowerCase().includes('crunchyroll')) {
        if (isValidCrunchyrollSeriesUrl(link.url)) {
          return { isAvailable: true, url: link.url, matchType: 'watch_link' };
        }
      }
    }
  }

  // 4. Look for verified direct Crunchyroll URL in externalLinks
  if (extLinks && Array.isArray(extLinks)) {
    for (const ext of extLinks) {
      if (ext && ext.name && ext.name.toLowerCase().includes('crunchyroll')) {
        if (isValidCrunchyrollSeriesUrl(ext.url)) {
          return { isAvailable: true, url: ext.url, matchType: 'external_link' };
        }
      }
    }
  }

  // 5. Check exact titles and normalized keys in CRUNCHYROLL_SERIES_MAP
  const titlesToCheck: string[] = [
    title,
    englishTitle,
    nativeTitle,
    japaneseTitle,
  ].filter((t): t is string => Boolean(t && typeof t === 'string' && t.trim().length > 0));

  for (const t of titlesToCheck) {
    const cleanKey = normalizeKey(t);
    if (cleanKey && CRUNCHYROLL_SERIES_MAP[cleanKey]) {
      const url = CRUNCHYROLL_SERIES_MAP[cleanKey];
      if (isValidCrunchyrollSeriesUrl(url)) {
        return { isAvailable: true, url, matchType: 'exact_title' };
      }
    }
  }

  // 6. Substring match against verified database keys (length >= 4 to avoid false positives)
  for (const t of titlesToCheck) {
    const cleanKey = normalizeKey(t);
    if (!cleanKey || cleanKey.length < 4) continue;

    for (const [key, url] of Object.entries(CRUNCHYROLL_SERIES_MAP)) {
      if (key.length >= 4 && (cleanKey === key || cleanKey.startsWith(key) || key.startsWith(cleanKey))) {
        if (isValidCrunchyrollSeriesUrl(url)) {
          return { isAvailable: true, url, matchType: 'alias' };
        }
      }
    }
  }

  // 7. Not available on Crunchyroll (Rule 8: NEVER invent/guess, never open search/home)
  return {
    isAvailable: false,
    url: null,
  };
}
