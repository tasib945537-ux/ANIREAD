import {
  DirectoryService,
  DirectoryCategory,
  UserReport,
} from '../types/directory';

export const DIRECTORY_CATEGORIES: DirectoryCategory[] = [
  {
    id: 'official_anime_apps',
    title: 'Official Anime Streaming Apps',
    shortName: 'Streaming Apps',
    icon: '📱',
    description: 'Authorized native mobile and smart TV applications for streaming licensed anime series and movies.',
    badgeColor: 'text-amber-300 bg-amber-950/60 border-amber-800/40',
  },
  {
    id: 'official_anime_websites',
    title: 'Official Anime Streaming Websites',
    shortName: 'Streaming Sites',
    icon: '🌐',
    description: 'Official browser portals for legal anime simulcasts, dubbed broadcasts, and theatrical releases.',
    badgeColor: 'text-blue-300 bg-blue-950/60 border-blue-800/40',
  },
  {
    id: 'free_ad_supported',
    title: 'Free and Ad-Supported Services',
    shortName: 'Free / AVOD',
    icon: '🎁',
    description: 'Officially free platforms offering anime with commercial sponsorship or free trial access.',
    badgeColor: 'text-emerald-300 bg-emerald-950/60 border-emerald-800/40',
  },
  {
    id: 'subscription_premium',
    title: 'Subscription / Premium Services',
    shortName: 'Premium / SVOD',
    icon: '👑',
    description: 'Subscription streaming tiers offering ad-free 1080p/4K viewing, simulcasts, and offline downloads.',
    badgeColor: 'text-purple-300 bg-purple-950/60 border-purple-800/40',
  },
  {
    id: 'free_official_channels',
    title: 'Free Official Anime Channels',
    shortName: 'YouTube Channels',
    icon: '📺',
    description: 'Legitimately licensed YouTube channels broadcasting full anime episodes for regional audiences.',
    badgeColor: 'text-rose-300 bg-rose-950/60 border-rose-800/40',
  },
  {
    id: 'anime_news_databases',
    title: 'Anime News and Databases',
    shortName: 'News & Info',
    icon: '📰',
    description: 'Comprehensive industry encyclopedia, news agencies, and reference catalogs for anime releases.',
    badgeColor: 'text-cyan-300 bg-cyan-950/60 border-cyan-800/40',
  },
  {
    id: 'anime_tracking_watchlists',
    title: 'Anime Tracking and Watchlists',
    shortName: 'Watchlists & Trackers',
    icon: '📊',
    description: 'Tools for cataloging completed episodes, managing custom watchlists, and logging seasonal stats.',
    badgeColor: 'text-indigo-300 bg-indigo-950/60 border-indigo-800/40',
  },
  {
    id: 'manga_reading_services',
    title: 'Manga Reading Services',
    shortName: 'Manga Readers',
    icon: '📖',
    description: 'Online digital readers hosting expansive manga libraries, scanlations, and licensed localizations.',
    badgeColor: 'text-teal-300 bg-teal-950/60 border-teal-800/40',
  },
  {
    id: 'official_manga_apps',
    title: 'Official Manga Apps and Websites',
    shortName: 'Official Manga',
    icon: '📚',
    description: 'Official publisher storefronts and reading apps supporting creators directly (Shueisha, Kodansha, VIZ).',
    badgeColor: 'text-orange-300 bg-orange-950/60 border-orange-800/40',
  },
  {
    id: 'light_novel_services',
    title: 'Light Novel Services',
    shortName: 'Light Novels',
    icon: '✨',
    description: 'Digital bookstores and publishers providing official English translations of Japanese light novels.',
    badgeColor: 'text-fuchsia-300 bg-fuchsia-950/60 border-fuchsia-800/40',
  },
  {
    id: 'anime_merch_stores',
    title: 'Anime Merchandise and Official Stores',
    shortName: 'Merch & Figures',
    icon: '🛍️',
    description: 'Authentic retailers for licensed Japanese figures, Nendoroids, anime apparel, and physical media.',
    badgeColor: 'text-pink-300 bg-pink-950/60 border-pink-800/40',
  },
  {
    id: 'anime_community_discussion',
    title: 'Anime Community and Discussion',
    shortName: 'Community & Forums',
    icon: '💬',
    description: 'Active discussion forums, episode reaction threads, and fan gathering hubs across the web.',
    badgeColor: 'text-sky-300 bg-sky-950/60 border-sky-800/40',
  },
  {
    id: 'anime_discovery_search',
    title: 'Anime Discovery and Legal Availability Search',
    shortName: 'Availability Search',
    icon: '🔍',
    description: 'Engines that search across licensed services to find exactly where an anime is streaming by country.',
    badgeColor: 'text-lime-300 bg-lime-950/60 border-lime-800/40',
  },
  {
    id: 'official_publishers',
    title: 'Official Anime Publishers and Distributors',
    shortName: 'Publishers & Studios',
    icon: '🏢',
    description: 'Primary Japanese production committees, animation studios, and worldwide distribution licensors.',
    badgeColor: 'text-violet-300 bg-violet-950/60 border-violet-800/40',
  },
  {
    id: 'third_party_services',
    title: 'Third-Party Services',
    shortName: 'Third-Party Services',
    icon: '🛡️',
    description: 'Community tools, aggregators, and unverified resources with explicit safety and ad disclosure notes.',
    badgeColor: 'text-slate-300 bg-slate-900 border-slate-700',
  },
  {
    id: 'fundub_communities',
    title: 'Fan Dub Communities & Hindi Telegram Channels',
    shortName: 'Fan Dubs & Telegram',
    icon: '🎙️',
    description: 'Community anime fan dub collectives, regional Hindi voice acting groups, and official Telegram release channels.',
    badgeColor: 'text-amber-300 bg-amber-950/60 border-amber-800/40',
  },
  {
    id: 'unofficial_anime_streaming',
    title: 'Unofficial Watch Sites (EverythingMoe Index)',
    shortName: 'Unofficial Watch Sites',
    icon: '⚡',
    description: 'Community-indexed anime watch portals and fan aggregators curated from EverythingMoe. Clearly designated as unofficial third-party resources.',
    badgeColor: 'text-rose-300 bg-rose-950/60 border-rose-800/40',
  },
];

export const INITIAL_SERVICES_SEED: DirectoryService[] = [
  // 1. Crunchyroll
  {
    id: 'crunchyroll',
    slug: 'crunchyroll',
    name: 'Crunchyroll',
    logoEmoji: '🟠',
    tagline: 'The premier worldwide anime streaming home with simultaneous Japanese broadcasts.',
    description: 'Crunchyroll hosts the world’s largest library of licensed anime series and movies, broadcasting simulcasts minutes after Japanese television. Offers multi-audio tracks including Hindi, Tamil, Telugu, English, and Japanese with localized subtitles.',
    categories: ['official_anime_apps', 'official_anime_websites', 'free_ad_supported', 'subscription_premium'],
    primaryCategory: 'official_anime_apps',
    isOfficial: true,
    licensingStatus: 'official_licensed',
    operationalStatus: 'working',
    websiteUrl: 'https://www.crunchyroll.com/',
    androidAppUrl: 'https://play.google.com/store/apps/details?id=com.crunchyroll.crunchyroid',
    iosAppUrl: 'https://apps.apple.com/app/crunchyroll/id329913454',
    platforms: ['web', 'android', 'ios', 'desktop', 'smart_tv', 'console'],
    pricing: {
      hasFreeTier: 'limited',
      hasFreeTrial: true,
      trialDays: 14,
      hasAds: 'some_regions',
      requiresAccount: true,
      subscriptionPrice: 'BDT 500/mo (approx $4.99/mo depending on currency)',
      billingPeriods: ['Monthly', 'Annual'],
    },
    businessModel: 'free_plus_premium',
    specs: {
      maxVideoQuality: '1080p FHD',
      audioLanguages: ['Japanese', 'Hindi', 'English', 'Tamil', 'Telugu', 'Spanish', 'French', 'German', 'Portuguese'],
      subtitleLanguages: ['English', 'Hindi', 'Bengali', 'Spanish', 'French', 'German', 'Arabic'],
      supportsOfflineViewing: 'plan_dependent',
    },
    bangladeshStatus: 'available',
    regionalNotes: 'Fully accessible in Bangladesh with direct web streaming and Android/iOS app support. Subscription billed in international USD/local bank cards.',
    supportedCountries: ['Bangladesh', 'India', 'United States', 'United Kingdom', 'Canada', 'Worldwide'],
    safetyNotes: '100% official Sony Group platform. Secure, verified legal stream with direct animator royalties.',
    adsNotes: 'Free tier includes video commercial breaks; Premium (Fan & Mega Fan) is completely ad-free.',
    verificationSource: 'Crunchyroll Official Terms & Catalog',
    sourceUrl: 'https://help.crunchyroll.com/',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 1420,
    userRating: 4.8,
    ratingCount: 380,
  },

  // 2. Netflix Anime
  {
    id: 'netflix_anime',
    slug: 'netflix-anime',
    name: 'Netflix Anime',
    logoEmoji: '🔴',
    tagline: 'High-budget exclusive anime originals, classics, and regional audio dubs.',
    description: 'Netflix produces major exclusive anime franchises (Delicious in Dungeon, Cyberpunk: Edgerunners, DAN DA DAN) and licenses international hits. Features spatial Dolby 5.1/Atmos audio, multiple language dubs (including Hindi and English), and pristine 4K video.',
    categories: ['official_anime_apps', 'official_anime_websites', 'subscription_premium'],
    primaryCategory: 'subscription_premium',
    isOfficial: true,
    licensingStatus: 'official_licensed',
    operationalStatus: 'working',
    websiteUrl: 'https://www.netflix.com/browse/genre/6721',
    androidAppUrl: 'https://play.google.com/store/apps/details?id=com.netflix.mediaclient',
    iosAppUrl: 'https://apps.apple.com/app/netflix/id363590051',
    platforms: ['web', 'android', 'ios', 'desktop', 'smart_tv', 'console'],
    pricing: {
      hasFreeTier: false,
      hasFreeTrial: false,
      hasAds: 'some_regions',
      requiresAccount: true,
      subscriptionPrice: 'Mobile BDT 250/mo, Basic BDT 450/mo, Standard BDT 800/mo',
      billingPeriods: ['Monthly'],
    },
    businessModel: 'subscription',
    specs: {
      maxVideoQuality: '4K UHD',
      audioLanguages: ['Japanese', 'Hindi', 'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese'],
      subtitleLanguages: ['English', 'Bengali', 'Hindi', 'Spanish', 'French', 'Arabic'],
      supportsOfflineViewing: true,
    },
    bangladeshStatus: 'available',
    regionalNotes: 'Officially launched in Bangladesh with mobile payments, bKash/Nagad debit cards, and local currency pricing.',
    supportedCountries: ['Bangladesh', 'Global (190+ countries)'],
    safetyNotes: 'Global media corporation. High safety, strict DRM, certified child safety controls.',
    verificationSource: 'Netflix Official Help Center',
    sourceUrl: 'https://help.netflix.com/',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 1150,
    userRating: 4.7,
    ratingCount: 290,
  },

  // 3. Muse Asia
  {
    id: 'muse_asia',
    slug: 'muse-asia',
    name: 'Muse Asia & Muse India',
    logoEmoji: '▶️',
    tagline: '100% legal, free-to-watch anime simulcasts with verified Hindi dubs and multi-language subs.',
    description: 'Muse Communication is a premier anime licensor for South and Southeast Asia. On YouTube, Muse Asia and Muse India broadcast full anime episodes legally for free with advertising sponsorship. Holds official Hindi dubs and Japanese master simulcasts.',
    categories: ['free_official_channels', 'free_ad_supported'],
    primaryCategory: 'free_official_channels',
    isOfficial: true,
    licensingStatus: 'authorized_distributor',
    operationalStatus: 'working',
    websiteUrl: 'https://www.youtube.com/@MuseAsia',
    platforms: ['web', 'android', 'ios', 'smart_tv'],
    pricing: {
      hasFreeTier: true,
      hasFreeTrial: false,
      hasAds: true,
      requiresAccount: false,
      subscriptionPrice: 'Free (Ad-Supported on YouTube)',
    },
    businessModel: 'ad_supported',
    specs: {
      maxVideoQuality: '1080p FHD',
      audioLanguages: ['Japanese', 'Hindi', 'English'],
      subtitleLanguages: ['English', 'Hindi', 'Bengali', 'Malay', 'Indonesian', 'Thai', 'Vietnamese'],
      supportsOfflineViewing: true,
    },
    bangladeshStatus: 'available',
    regionalNotes: 'No VPN needed. Readily accessible across Bangladesh via YouTube without an account.',
    supportedCountries: ['Bangladesh', 'India', 'Pakistan', 'Nepal', 'Southeast Asia'],
    safetyNotes: 'Official YouTube broadcast channel. No downloads, zero phishing, virus-free.',
    adsNotes: 'Monetized through YouTube non-intrusive pre-roll advertisements.',
    verificationSource: 'Muse Communication Co., Ltd. Official Channel',
    sourceUrl: 'https://www.youtube.com/@MuseAsia/about',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 980,
    userRating: 4.9,
    ratingCount: 410,
  },

  // 4. Ani-One Asia
  {
    id: 'ani_one_asia',
    slug: 'ani-one-asia',
    name: 'Ani-One Asia',
    logoEmoji: '📺',
    tagline: 'Medialink official licensed anime channel on YouTube with ULTRA membership.',
    description: 'Operated by Hong Kong distributor Medialink, Ani-One Asia streams simulcast anime legally across Asian territories. Free episodes are available with advertising, while select simulcasts require YouTube Channel Membership (Ani-One ULTRA).',
    categories: ['free_official_channels', 'free_ad_supported', 'subscription_premium'],
    primaryCategory: 'free_official_channels',
    isOfficial: true,
    licensingStatus: 'authorized_distributor',
    operationalStatus: 'working',
    websiteUrl: 'https://www.youtube.com/@AniOneAsia',
    platforms: ['web', 'android', 'ios', 'smart_tv'],
    pricing: {
      hasFreeTier: true,
      hasFreeTrial: false,
      hasAds: true,
      requiresAccount: false,
      subscriptionPrice: 'Ani-One ULTRA approx $1.50/mo on YouTube',
    },
    businessModel: 'free_plus_premium',
    specs: {
      maxVideoQuality: '1080p FHD',
      audioLanguages: ['Japanese', 'Chinese', 'English'],
      subtitleLanguages: ['English', 'Chinese', 'Hindi', 'Thai', 'Vietnamese'],
      supportsOfflineViewing: true,
    },
    bangladeshStatus: 'available',
    regionalNotes: 'Accessible in Bangladesh without regional blocks on YouTube.',
    supportedCountries: ['Bangladesh', 'India', 'Southeast Asia', 'Hong Kong', 'Taiwan'],
    verificationSource: 'Medialink Group Limited',
    sourceUrl: 'https://www.youtube.com/@AniOneAsia/about',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 650,
    userRating: 4.6,
    ratingCount: 180,
  },

  // 5. AniList
  {
    id: 'anilist',
    slug: 'anilist',
    name: 'AniList',
    logoEmoji: '🔷',
    tagline: 'Modern, ad-free anime & manga tracking social network with powerful GraphQL API.',
    description: 'AniList is a premier anime and manga discovery, review, and tracking platform. Features customized lists, seasonal air charts, staff/voice actor cast directories, and an open developer API used across hundreds of apps.',
    categories: ['anime_tracking_watchlists', 'anime_news_databases', 'anime_community_discussion'],
    primaryCategory: 'anime_tracking_watchlists',
    isOfficial: true,
    licensingStatus: 'official_licensed',
    operationalStatus: 'working',
    websiteUrl: 'https://anilist.co/',
    platforms: ['web', 'android', 'ios'],
    pricing: {
      hasFreeTier: true,
      hasFreeTrial: false,
      hasAds: false,
      requiresAccount: 'optional',
      subscriptionPrice: '100% Free (Community Supported & Donor Tiers)',
    },
    businessModel: 'free',
    specs: {
      maxVideoQuality: 'Text/Images',
      supportsOfflineViewing: false,
    },
    bangladeshStatus: 'available',
    regionalNotes: 'Completely accessible in Bangladesh with instant loading and zero regional restrictions.',
    supportedCountries: ['Worldwide'],
    safetyNotes: 'Open community database with OAuth 2.0 authentication and clean privacy practices.',
    verificationSource: 'AniList.co Official Documentation',
    sourceUrl: 'https://docs.anilist.co/',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 1680,
    userRating: 4.9,
    ratingCount: 520,
  },

  // 6. MyAnimeList (MAL)
  {
    id: 'myanimelist',
    slug: 'myanimelist',
    name: 'MyAnimeList',
    logoEmoji: '🇲',
    tagline: 'The world’s largest and most historic anime and manga database & community.',
    description: 'MyAnimeList organizes millions of member reviews, detailed production credits, studio histories, and global rankings. Powerhouse behind the Jikan API ecosystem.',
    categories: ['anime_tracking_watchlists', 'anime_news_databases', 'anime_community_discussion'],
    primaryCategory: 'anime_news_databases',
    isOfficial: true,
    licensingStatus: 'official_licensed',
    operationalStatus: 'working',
    websiteUrl: 'https://myanimelist.net/',
    androidAppUrl: 'https://play.google.com/store/apps/details?id=net.myanimelist.app',
    iosAppUrl: 'https://apps.apple.com/app/myanimelist-official/id1435212586',
    platforms: ['web', 'android', 'ios'],
    pricing: {
      hasFreeTier: true,
      hasFreeTrial: false,
      hasAds: true,
      requiresAccount: 'optional',
      subscriptionPrice: 'MAL Supporter $2.99/mo (optional ad-free tier)',
    },
    businessModel: 'free_plus_premium',
    specs: {
      maxVideoQuality: 'Text/Images',
      supportsOfflineViewing: false,
    },
    bangladeshStatus: 'available',
    regionalNotes: 'Accessible in Bangladesh with official mobile app on Google Play Store.',
    supportedCountries: ['Worldwide'],
    verificationSource: 'MyAnimeList, LLC',
    sourceUrl: 'https://myanimelist.net/about.php',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 1540,
    userRating: 4.7,
    ratingCount: 490,
  },

  // 7. MangaDex
  {
    id: 'mangadex',
    slug: 'mangadex',
    name: 'MangaDex',
    logoEmoji: '🐱',
    tagline: 'Open-source community manga reader supporting 50+ languages with zero ads.',
    description: 'MangaDex is an ad-free online manga reader providing user uploads and scanlation group releases across dozens of languages. Equipped with a robust public REST API for high-resolution chapter retrieval.',
    categories: ['manga_reading_services'],
    primaryCategory: 'manga_reading_services',
    isOfficial: false,
    licensingStatus: 'unverified_third_party',
    operationalStatus: 'working',
    websiteUrl: 'https://mangadex.org/',
    platforms: ['web', 'android'],
    pricing: {
      hasFreeTier: true,
      hasFreeTrial: false,
      hasAds: false,
      requiresAccount: false,
      subscriptionPrice: '100% Free (Donation Driven)',
    },
    businessModel: 'free',
    specs: {
      maxVideoQuality: 'Text/Images',
      subtitleLanguages: ['English', 'Bengali', 'Spanish', 'French', 'Portuguese', 'Japanese', '50+ languages'],
      supportsOfflineViewing: true,
    },
    bangladeshStatus: 'available',
    regionalNotes: 'Readily available in Bangladesh. No geo-blocking or ISP censorship.',
    supportedCountries: ['Worldwide'],
    safetyNotes: 'Open-source software, zero invasive third-party ad networks, community verified.',
    verificationSource: 'MangaDex Public API Docs',
    sourceUrl: 'https://api.mangadex.org/docs/',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 1890,
    userRating: 4.9,
    ratingCount: 630,
  },

  // 8. MANGA Plus by SHUEISHA
  {
    id: 'manga_plus',
    slug: 'manga-plus',
    name: 'MANGA Plus by SHUEISHA',
    logoEmoji: '📖',
    tagline: 'Official Shonen Jump publisher app with simultaneous chapter releases.',
    description: 'Direct from Japan’s Shueisha, MANGA Plus publishes the latest chapters of One Piece, Jujutsu Kaisen, Chainsaw Man, and Spy x Family simultaneously with Weekly Shonen Jump magazine in Japan for free.',
    categories: ['official_manga_apps', 'manga_reading_services', 'free_ad_supported'],
    primaryCategory: 'official_manga_apps',
    isOfficial: true,
    licensingStatus: 'official_publisher',
    operationalStatus: 'working',
    websiteUrl: 'https://mangaplus.shueisha.co.jp/',
    androidAppUrl: 'https://play.google.com/store/apps/details?id=jp.co.shueisha.mangaplus',
    iosAppUrl: 'https://apps.apple.com/app/manga-plus-by-shueisha/id1442476536',
    platforms: ['web', 'android', 'ios'],
    pricing: {
      hasFreeTier: true,
      hasFreeTrial: false,
      hasAds: true,
      requiresAccount: false,
      subscriptionPrice: 'Free for latest 3 chapters; MANGA Plus MAX $1.99 - $4.99/mo',
    },
    businessModel: 'free_plus_premium',
    specs: {
      maxVideoQuality: 'Text/Images',
      subtitleLanguages: ['English', 'Spanish', 'French', 'Portuguese', 'Indonesian', 'Thai', 'Russian'],
      supportsOfflineViewing: 'plan_dependent',
    },
    bangladeshStatus: 'available',
    regionalNotes: 'Officially supported in Bangladesh via web browser and mobile app stores.',
    supportedCountries: ['Worldwide except Japan, China, South Korea'],
    safetyNotes: 'Official Shueisha Japanese corporate service. Directly supports original mangaka.',
    verificationSource: 'Shueisha Inc. Official Guidelines',
    sourceUrl: 'https://mangaplus.shueisha.co.jp/about',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 1320,
    userRating: 4.8,
    ratingCount: 370,
  },

  // 9. VIZ Media
  {
    id: 'viz_media',
    slug: 'viz-media',
    name: 'VIZ Media / Shonen Jump',
    logoEmoji: '⚡',
    tagline: 'English publisher of Dragon Ball, Naruto, Bleach, and Shonen Jump classics.',
    description: 'VIZ Media is the premier official English manga publisher in North America. Provides a digital Shonen Jump vault with over 15,000 manga chapters for a minimal monthly subscription fee.',
    categories: ['official_manga_apps', 'manga_reading_services', 'subscription_premium'],
    primaryCategory: 'official_manga_apps',
    isOfficial: true,
    licensingStatus: 'official_publisher',
    operationalStatus: 'working',
    websiteUrl: 'https://www.viz.com/',
    androidAppUrl: 'https://play.google.com/store/apps/details?id=com.viz.wsj.android',
    iosAppUrl: 'https://apps.apple.com/app/shonen-jump-manga-comics/id594237344',
    platforms: ['web', 'android', 'ios'],
    pricing: {
      hasFreeTier: 'limited',
      hasFreeTrial: true,
      trialDays: 7,
      hasAds: false,
      requiresAccount: true,
      subscriptionPrice: '$2.99/mo for complete Shonen Jump vault',
    },
    businessModel: 'subscription',
    specs: {
      maxVideoQuality: 'Text/Images',
      subtitleLanguages: ['English'],
      supportsOfflineViewing: true,
    },
    bangladeshStatus: 'region_restricted',
    regionalNotes: 'Subscription vault is officially licensed for US, UK, Canada, Australia. May require international payment method or regional VPN.',
    supportedCountries: ['United States', 'Canada', 'United Kingdom', 'Australia', 'New Zealand'],
    safetyNotes: 'Official North American publisher jointly owned by Shueisha, Shogakukan, and ShoPro.',
    verificationSource: 'VIZ Media LLC Official Licensing',
    sourceUrl: 'https://www.viz.com/company-overview',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 840,
    userRating: 4.8,
    ratingCount: 220,
  },

  // 10. BOOK☆WALKER Global
  {
    id: 'bookwalker',
    slug: 'bookwalker',
    name: 'BOOK☆WALKER Global',
    logoEmoji: '📚',
    tagline: 'Kadokawa’s official global eBook store for digital manga and light novels.',
    description: 'Operated by Japanese media conglomerate Kadokawa, BOOK☆WALKER is the authorized direct digital bookstore for official English translations of manga, light novels, and artbooks with exclusive digital bonuses.',
    categories: ['light_novel_services', 'official_manga_apps'],
    primaryCategory: 'light_novel_services',
    isOfficial: true,
    licensingStatus: 'official_publisher',
    operationalStatus: 'working',
    websiteUrl: 'https://global.bookwalker.jp/',
    androidAppUrl: 'https://play.google.com/store/apps/details?id=jp.bookwalker.kreader.android.en',
    iosAppUrl: 'https://apps.apple.com/app/book-walker-global/id1044941914',
    platforms: ['web', 'android', 'ios', 'desktop'],
    pricing: {
      hasFreeTier: 'limited',
      hasFreeTrial: false,
      hasAds: false,
      requiresAccount: true,
      subscriptionPrice: 'Pay-per-volume ($5 - $14) + Select Monthly Manga Sub ($8.49/mo)',
    },
    businessModel: 'pay_per_volume',
    specs: {
      maxVideoQuality: 'Text/Images',
      subtitleLanguages: ['English', 'Japanese'],
      supportsOfflineViewing: true,
    },
    bangladeshStatus: 'available',
    regionalNotes: 'Global store allows purchasing and reading in Bangladesh using international credit/debit cards or PayPal.',
    supportedCountries: ['Global / Worldwide'],
    safetyNotes: 'Official Kadokawa Corporation subsidiary.',
    verificationSource: 'BOOK WALKER Co., Ltd.',
    sourceUrl: 'https://global.bookwalker.jp/info-about/',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 710,
    userRating: 4.7,
    ratingCount: 160,
  },

  // 11. Anime-Planet
  {
    id: 'anime_planet',
    slug: 'anime-planet',
    name: 'Anime-Planet',
    logoEmoji: '🪐',
    tagline: 'Anime and manga database created by fans with legal streaming partnerships.',
    description: 'Founded in 2001, Anime-Planet holds detailed character directories, voice actors by language, anime recommendation trees, and partnerships with Crunchyroll to stream legal episodes directly.',
    categories: ['anime_news_databases', 'anime_tracking_watchlists', 'anime_discovery_search'],
    primaryCategory: 'anime_news_databases',
    isOfficial: true,
    licensingStatus: 'official_licensed',
    operationalStatus: 'working',
    websiteUrl: 'https://www.anime-planet.com/',
    platforms: ['web'],
    pricing: {
      hasFreeTier: true,
      hasFreeTrial: false,
      hasAds: true,
      requiresAccount: 'optional',
      subscriptionPrice: 'Free (Ad-supported or Patreon Supporter)',
    },
    businessModel: 'free',
    specs: {
      maxVideoQuality: 'Text/Images',
      supportsOfflineViewing: false,
    },
    bangladeshStatus: 'available',
    regionalNotes: 'Freely accessible in Bangladesh for browsing and database lookups.',
    supportedCountries: ['Worldwide'],
    verificationSource: 'Anime-Planet LLC',
    sourceUrl: 'https://www.anime-planet.com/faq',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 890,
    userRating: 4.8,
    ratingCount: 240,
  },

  // 12. JustWatch
  {
    id: 'justwatch',
    slug: 'justwatch',
    name: 'JustWatch',
    logoEmoji: '🟡',
    tagline: 'The streaming search engine that finds legal availability by country.',
    description: 'JustWatch searches across Netflix, Crunchyroll, Amazon Prime, Apple TV, and regional catalogs to show exactly where an anime is available to buy, rent, or stream legally in over 100 countries.',
    categories: ['anime_discovery_search'],
    primaryCategory: 'anime_discovery_search',
    isOfficial: true,
    licensingStatus: 'official_licensed',
    operationalStatus: 'working',
    websiteUrl: 'https://www.justwatch.com/',
    androidAppUrl: 'https://play.google.com/store/apps/details?id=com.justwatch.justwatch',
    iosAppUrl: 'https://apps.apple.com/app/justwatch-movies-tv-shows/id979227482',
    platforms: ['web', 'android', 'ios', 'smart_tv'],
    pricing: {
      hasFreeTier: true,
      hasFreeTrial: false,
      hasAds: 'some_regions',
      requiresAccount: 'optional',
      subscriptionPrice: 'Free (JustWatch Pro optional $2.99/mo)',
    },
    businessModel: 'free',
    specs: {
      maxVideoQuality: 'Text/Images',
      supportsOfflineViewing: false,
    },
    bangladeshStatus: 'available',
    regionalNotes: 'JustWatch supports regional filtering, enabling viewers to select their region or browse global catalogs.',
    supportedCountries: ['140+ countries'],
    verificationSource: 'JustWatch GmbH',
    sourceUrl: 'https://www.justwatch.com/us/about',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 1120,
    userRating: 4.8,
    ratingCount: 310,
  },

  // 13. AmiAmi
  {
    id: 'amiami',
    slug: 'amiami',
    name: 'AmiAmi',
    logoEmoji: '🎎',
    tagline: 'Japan’s leading character figure, scale statue, and anime merchandise exporter.',
    description: 'Based in Tokyo, AmiAmi offers pre-orders and direct exports of official anime figures (Good Smile, Alter, Kotobukiya, MegaHouse), character plushies, keychains, and doujinshi with worldwide DHL/EMS shipping.',
    categories: ['anime_merch_stores'],
    primaryCategory: 'anime_merch_stores',
    isOfficial: true,
    licensingStatus: 'official_licensed',
    operationalStatus: 'working',
    websiteUrl: 'https://www.amiami.com/eng/',
    platforms: ['web'],
    pricing: {
      hasFreeTier: true,
      hasFreeTrial: false,
      hasAds: false,
      requiresAccount: true,
      subscriptionPrice: 'Retail Purchase / Pre-order',
    },
    businessModel: 'pay_per_volume',
    specs: {
      maxVideoQuality: 'Text/Images',
      supportsOfflineViewing: false,
    },
    bangladeshStatus: 'available',
    regionalNotes: 'Delivers to Bangladesh via Japan Post EMS and DHL Express. Customs clearance apply.',
    supportedCountries: ['Worldwide (150+ countries)'],
    safetyNotes: 'Premier authentic retailer. Guaranteed genuine Japanese licensed merchandise; zero bootlegs.',
    verificationSource: 'Oami Inc. Tokyo',
    sourceUrl: 'https://support.amiami.com/',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 760,
    userRating: 4.9,
    ratingCount: 200,
  },

  // 14. J-Novel Club
  {
    id: 'j_novel_club',
    slug: 'j-novel-club',
    name: 'J-Novel Club',
    logoEmoji: '📖',
    tagline: 'Digital-first light novel and manga subscription publisher.',
    description: 'A subsidiary of Kadokawa, J-Novel Club translates and publishes light novels chapter by chapter in weekly pre-publication parts for members before releasing complete digital and physical volumes.',
    categories: ['light_novel_services', 'subscription_premium'],
    primaryCategory: 'light_novel_services',
    isOfficial: true,
    licensingStatus: 'official_publisher',
    operationalStatus: 'working',
    websiteUrl: 'https://j-novel.club/',
    platforms: ['web', 'android', 'ios'],
    pricing: {
      hasFreeTier: 'limited',
      hasFreeTrial: false,
      hasAds: false,
      requiresAccount: true,
      subscriptionPrice: '$4.95/mo (Standard) or $10.95/mo (Premium with coin credits)',
    },
    businessModel: 'subscription',
    specs: {
      maxVideoQuality: 'Text/Images',
      subtitleLanguages: ['English'],
      supportsOfflineViewing: true,
    },
    bangladeshStatus: 'available',
    regionalNotes: 'Global digital service accessible in Bangladesh.',
    supportedCountries: ['Worldwide'],
    safetyNotes: 'Official Kadokawa Corporation company.',
    verificationSource: 'J-Novel Club LLC',
    sourceUrl: 'https://j-novel.club/howitworks',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 520,
    userRating: 4.7,
    ratingCount: 130,
  },

  // 15. Prime Video Anime
  {
    id: 'prime_video',
    slug: 'prime-video',
    name: 'Amazon Prime Video Anime',
    logoEmoji: '📦',
    tagline: 'Home of Evangelion: 3.0+1.0, Vinland Saga Season 1, and Dororo.',
    description: 'Amazon Prime Video licenses prominent anime films, including global rights to Evangelion 3.0+1.0 Thrice Upon a Time. Multi-language dubs and subtitles available.',
    categories: ['official_anime_apps', 'official_anime_websites', 'subscription_premium'],
    primaryCategory: 'subscription_premium',
    isOfficial: true,
    licensingStatus: 'official_licensed',
    operationalStatus: 'working',
    websiteUrl: 'https://www.primevideo.com/',
    androidAppUrl: 'https://play.google.com/store/apps/details?id=com.amazon.avod.thirdpartyclient',
    iosAppUrl: 'https://apps.apple.com/app/amazon-prime-video/id545519333',
    platforms: ['web', 'android', 'ios', 'smart_tv'],
    pricing: {
      hasFreeTier: false,
      hasFreeTrial: true,
      trialDays: 30,
      hasAds: 'some_regions',
      requiresAccount: true,
      subscriptionPrice: 'approx $5.99/mo',
    },
    businessModel: 'subscription',
    specs: {
      maxVideoQuality: '4K UHD',
      audioLanguages: ['Japanese', 'Hindi', 'English', 'Spanish', 'French', 'German'],
      subtitleLanguages: ['English', 'Hindi', 'Bengali', 'Spanish'],
      supportsOfflineViewing: true,
    },
    bangladeshStatus: 'available',
    regionalNotes: 'Officially available in Bangladesh.',
    supportedCountries: ['Global (200+ countries)'],
    verificationSource: 'Amazon.com, Inc.',
    sourceUrl: 'https://www.primevideo.com/help',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 640,
    userRating: 4.5,
    ratingCount: 170,
  },

  // 16. Bilibili (Southeast / South Asia)
  {
    id: 'bilibili_tv',
    slug: 'bilibili-tv',
    name: 'Bilibili (BiliBili TV)',
    logoEmoji: '📺',
    tagline: 'Licensed anime simulcasts with active Danmaku community in South/Southeast Asia.',
    description: 'Bilibili’s international platform offers officially licensed seasonal anime in South Asia and Southeast Asia. Features free 720p/1080p streaming with ads, VIP subscription for full HD/4K, and interactive bullet comments.',
    categories: ['official_anime_apps', 'official_anime_websites', 'free_ad_supported', 'subscription_premium'],
    primaryCategory: 'official_anime_apps',
    isOfficial: true,
    licensingStatus: 'official_licensed',
    operationalStatus: 'working',
    websiteUrl: 'https://www.bilibili.tv/',
    androidAppUrl: 'https://play.google.com/store/apps/details?id=com.bstar.bilibili',
    iosAppUrl: 'https://apps.apple.com/app/bilibili/id1527632938',
    platforms: ['web', 'android', 'ios', 'smart_tv'],
    pricing: {
      hasFreeTier: true,
      hasFreeTrial: false,
      hasAds: true,
      requiresAccount: 'optional',
      subscriptionPrice: 'Free (720p with ads); Premium approx $2.99/mo',
    },
    businessModel: 'free_plus_premium',
    specs: {
      maxVideoQuality: '1080p FHD',
      audioLanguages: ['Japanese', 'Chinese', 'English'],
      subtitleLanguages: ['English', 'Bengali', 'Thai', 'Vietnamese', 'Indonesian', 'Malay'],
      supportsOfflineViewing: 'plan_dependent',
    },
    bangladeshStatus: 'available',
    regionalNotes: 'Accessible in Bangladesh with regional licensing catalog.',
    supportedCountries: ['Bangladesh', 'India', 'Southeast Asia'],
    verificationSource: 'Bilibili Global Operations',
    sourceUrl: 'https://www.bilibili.tv/en/about',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 820,
    userRating: 4.6,
    ratingCount: 210,
  },

  // 17. Anime News Network (ANN)
  {
    id: 'ann',
    slug: 'anime-news-network',
    name: 'Anime News Network',
    logoEmoji: '📰',
    tagline: 'The internet’s most authoritative journalism and encyclopedia for anime and manga.',
    description: 'Founded in 1998, Anime News Network provides verified breaking news, staff interviews, editorial reviews, industry box office analytics, and a comprehensive historical encyclopedia.',
    categories: ['anime_news_databases'],
    primaryCategory: 'anime_news_databases',
    isOfficial: true,
    licensingStatus: 'official_licensed',
    operationalStatus: 'working',
    websiteUrl: 'https://www.animenewsnetwork.com/',
    platforms: ['web'],
    pricing: {
      hasFreeTier: true,
      hasFreeTrial: false,
      hasAds: true,
      requiresAccount: 'optional',
      subscriptionPrice: 'Free (Ad-Supported; optional ad-free subscription $2.50/mo)',
    },
    businessModel: 'free',
    specs: {
      maxVideoQuality: 'Text/Images',
      supportsOfflineViewing: false,
    },
    bangladeshStatus: 'available',
    regionalNotes: 'Fully accessible in Bangladesh.',
    supportedCountries: ['Worldwide'],
    verificationSource: 'Anime News Network Inc. / Kadokawa',
    sourceUrl: 'https://www.animenewsnetwork.com/about',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 710,
    userRating: 4.8,
    ratingCount: 190,
  },

  // 18. EverythingMoe Reference Directory
  {
    id: 'everythingmoe',
    slug: 'everythingmoe',
    name: 'EverythingMoe Directory Reference',
    logoEmoji: '🌸',
    tagline: 'Curated index and status tracker for community anime and manga resources.',
    description: 'An influential community-maintained directory tracking the status, features, and safety of anime and manga websites, streaming services, and reading tools worldwide.',
    categories: ['anime_discovery_search', 'third_party_services'],
    primaryCategory: 'anime_discovery_search',
    isOfficial: false,
    licensingStatus: 'unverified_third_party',
    operationalStatus: 'working',
    websiteUrl: 'https://everythingmoe.com/',
    platforms: ['web'],
    pricing: {
      hasFreeTier: true,
      hasFreeTrial: false,
      hasAds: false,
      requiresAccount: false,
      subscriptionPrice: '100% Free',
    },
    businessModel: 'free',
    specs: {
      maxVideoQuality: 'Text/Images',
      supportsOfflineViewing: false,
    },
    bangladeshStatus: 'available',
    regionalNotes: 'Accessible in Bangladesh.',
    supportedCountries: ['Worldwide'],
    safetyNotes: 'Community directory reference. Does not host video files.',
    verificationSource: 'EverythingMoe Community Registry',
    sourceUrl: 'https://everythingmoe.com/',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 940,
    userRating: 4.9,
    ratingCount: 310,
  },

  // 36. English Dub Anime Calendar
  {
    id: 'english_dub_anime_calendar',
    slug: 'english-dub-anime-calendar',
    name: 'English Dub Anime Calendar',
    logoEmoji: '🎙️',
    tagline: 'The authoritative industry calendar tracking weekly English dub releases and SimulDub air dates.',
    description: 'English-Dubbed.com provides the official anime industry English Dub schedule, tracking weekly SimulDub episodes, premier drop dates across Crunchyroll and Hulu, and voice cast announcements.',
    categories: ['anime_news_databases', 'anime_tracking_watchlists'],
    primaryCategory: 'anime_news_databases',
    isOfficial: false,
    licensingStatus: 'unverified_third_party',
    operationalStatus: 'working',
    websiteUrl: 'https://english-dubbed.com/anime-industry/english-dub-anime-calendar/',
    platforms: ['web', 'desktop', 'android', 'ios'],
    pricing: {
      hasFreeTier: true,
      hasFreeTrial: false,
      hasAds: true,
      requiresAccount: false,
      subscriptionPrice: '100% Free Schedule Resource',
    },
    businessModel: 'free',
    specs: {
      maxVideoQuality: 'Text/Images',
      audioLanguages: ['English'],
      supportsOfflineViewing: false,
    },
    bangladeshStatus: 'available',
    regionalNotes: 'Globally accessible calendar for tracking North American and international English dub releases.',
    supportedCountries: ['Worldwide'],
    safetyNotes: 'Industry editorial and timetable database. Does not host video files.',
    verificationSource: 'English-Dubbed Industry Schedule',
    sourceUrl: 'https://english-dubbed.com/anime-industry/english-dub-anime-calendar/',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 870,
    userRating: 4.8,
    ratingCount: 240,
  },

  // 37. AniDub.moe
  {
    id: 'anidub_moe',
    slug: 'anidub-moe',
    name: 'AniDub.moe',
    logoEmoji: '🎧',
    tagline: 'Global multi-language anime dubbing tracker, voice actor roster, and episode release timetable.',
    description: 'AniDub is an extensive community dubbing schedule portal indexing voice actors, recording studios, and episode availability across Japanese, English, Hindi, and European languages.',
    categories: ['anime_news_databases', 'anime_tracking_watchlists', 'third_party_services'],
    primaryCategory: 'anime_news_databases',
    isOfficial: false,
    licensingStatus: 'unverified_third_party',
    operationalStatus: 'working',
    websiteUrl: 'https://www.anidub.moe/',
    platforms: ['web', 'desktop', 'android', 'ios'],
    pricing: {
      hasFreeTier: true,
      hasFreeTrial: false,
      hasAds: false,
      requiresAccount: false,
      subscriptionPrice: 'Free Community Catalog',
    },
    businessModel: 'free',
    specs: {
      maxVideoQuality: 'Text/Images',
      audioLanguages: ['Japanese', 'English', 'Hindi', 'Spanish', 'French', 'German'],
      supportsOfflineViewing: false,
    },
    bangladeshStatus: 'available',
    regionalNotes: 'Accessible worldwide including Bangladesh and South Asia.',
    supportedCountries: ['Worldwide'],
    safetyNotes: 'Dub reference portal and scheduling directory.',
    verificationSource: 'AniDub Moe Registry',
    sourceUrl: 'https://www.anidub.moe/',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 780,
    userRating: 4.7,
    ratingCount: 190,
  },

  // 38. AnimeDubHindi Schedule
  {
    id: 'animedubhindi_schedule',
    slug: 'animedubhindi-schedule',
    name: 'AnimeDubHindi Schedule',
    logoEmoji: '📅',
    tagline: 'Dedicated schedule and airing timetable for Hindi dubbed anime series and movie broadcasts.',
    description: 'AnimeDubHindi tracks real-time broadcasting schedules and release dates for Hindi dubbed anime streaming on Crunchyroll India, Netflix India, JioCinema, and Indian television.',
    categories: ['anime_news_databases', 'anime_tracking_watchlists', 'anime_discovery_search'],
    primaryCategory: 'anime_news_databases',
    isOfficial: false,
    licensingStatus: 'unverified_third_party',
    operationalStatus: 'working',
    websiteUrl: 'https://www.animedubhindi.link/schedule.php',
    platforms: ['web', 'desktop', 'android', 'ios'],
    pricing: {
      hasFreeTier: true,
      hasFreeTrial: false,
      hasAds: true,
      requiresAccount: false,
      subscriptionPrice: 'Free Hindi Dub Schedule',
    },
    businessModel: 'free',
    specs: {
      maxVideoQuality: 'Text/Images',
      audioLanguages: ['Hindi', 'Japanese'],
      supportsOfflineViewing: false,
    },
    bangladeshStatus: 'available',
    regionalNotes: 'Directly accessible across Bangladesh, India, and South Asian subcontinent.',
    supportedCountries: ['Bangladesh', 'India', 'Pakistan', 'Nepal', 'Worldwide'],
    safetyNotes: 'Schedule reference guide. Ad disclosure applies on external browsing.',
    verificationSource: 'AnimeDubHindi Schedule Portal',
    sourceUrl: 'https://www.animedubhindi.link/schedule.php',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 1150,
    userRating: 4.9,
    ratingCount: 310,
  },

  // 39. Anime Hub India
  {
    id: 'animehub_india',
    slug: 'anime-hub-india',
    name: 'Anime Hub India',
    logoEmoji: '🌟',
    tagline: 'The leading Indian anime community hub for Hindi, Tamil, and Telugu dub news.',
    description: 'Anime Hub India covers regional Indian anime localizations, theatrical anime movie distributions, television premieres on Cartoon Network/Sony YAY, and licensed streaming releases.',
    categories: ['anime_news_databases', 'anime_community_discussion', 'anime_discovery_search'],
    primaryCategory: 'anime_news_databases',
    isOfficial: false,
    licensingStatus: 'unverified_third_party',
    operationalStatus: 'working',
    websiteUrl: 'https://www.animehubindia.com/',
    platforms: ['web', 'desktop', 'android', 'ios'],
    pricing: {
      hasFreeTier: true,
      hasFreeTrial: false,
      hasAds: true,
      requiresAccount: false,
      subscriptionPrice: 'Free Community News & Hub',
    },
    businessModel: 'free',
    specs: {
      maxVideoQuality: 'Text/Images',
      audioLanguages: ['Hindi', 'Tamil', 'Telugu', 'English'],
      supportsOfflineViewing: false,
    },
    bangladeshStatus: 'available',
    regionalNotes: 'Popular across Bangladesh, India, and diaspora communities.',
    supportedCountries: ['Bangladesh', 'India', 'Nepal', 'Sri Lanka', 'Worldwide'],
    safetyNotes: 'News and editorial portal for Indian anime fans.',
    verificationSource: 'Anime Hub India Portal',
    sourceUrl: 'https://www.animehubindia.com/',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 1280,
    userRating: 4.9,
    ratingCount: 340,
  },

  // -------------------------------------------------------------
  // FAN DUB & REGIONAL HINDI DUBBING COMMUNITIES (TELEGRAM)
  // -------------------------------------------------------------
  {
    id: 'unknown_dubbers',
    slug: 'unknown-dubbers',
    name: 'Unknown Dubbers (Telegram)',
    logoEmoji: '🎙️',
    tagline: 'Prominent Hindi anime fan dubbing collective and voice cast community.',
    description: 'Active fan dubbing team releasing high-quality Hindi dubs for seasonal anime series, films, and unreleased regional dubs.',
    categories: ['fundub_communities', 'third_party_services'],
    primaryCategory: 'fundub_communities',
    isOfficial: false,
    licensingStatus: 'unverified_third_party',
    operationalStatus: 'working',
    websiteUrl: 'https://t.me/UNKNOWN_DUBBERS_1',
    platforms: ['web', 'android', 'ios', 'desktop'],
    businessModel: 'free',
    pricing: {
      hasFreeTier: true,
      hasFreeTrial: false,
      hasAds: false,
      requiresAccount: true,
    },
    specs: {
      maxVideoQuality: '1080p FHD',
      audioLanguages: ['Hindi', 'Japanese'],
      subtitleLanguages: ['Hindi', 'English'],
      supportsOfflineViewing: true,
    },
    bangladeshStatus: 'available',
    regionalNotes: 'Direct Telegram channel link accessible worldwide.',
    supportedCountries: ['India', 'Bangladesh', 'Nepal', 'Worldwide'],
    safetyNotes: 'Fan dub community release channel on Telegram. Use official Telegram app.',
    verificationSource: 'Telegram Channel Verification',
    sourceUrl: 'https://t.me/UNKNOWN_DUBBERS_1',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 840,
    userRating: 4.8,
    ratingCount: 210,
  },
  {
    id: 'fan_dub_anime_hindi',
    slug: 'fan-dub-anime-hindi',
    name: 'Fan Dub Anime Hindi 17 (Telegram)',
    logoEmoji: '🎧',
    tagline: 'Dedicated Hindi anime fan dub channel and episode releases.',
    description: 'Community channel providing Hindi dubbed episodes, voice cast credits, and episode discussions for Indian anime viewers.',
    categories: ['fundub_communities', 'third_party_services'],
    primaryCategory: 'fundub_communities',
    isOfficial: false,
    licensingStatus: 'unverified_third_party',
    operationalStatus: 'working',
    websiteUrl: 'https://t.me/Fan_dub_anime_hindi_17',
    platforms: ['web', 'android', 'ios', 'desktop'],
    businessModel: 'free',
    pricing: {
      hasFreeTier: true,
      hasFreeTrial: false,
      hasAds: false,
      requiresAccount: true,
    },
    specs: {
      maxVideoQuality: '1080p FHD',
      audioLanguages: ['Hindi'],
      subtitleLanguages: ['Hindi', 'English'],
      supportsOfflineViewing: true,
    },
    bangladeshStatus: 'available',
    regionalNotes: 'Accessible on Telegram across South Asia.',
    supportedCountries: ['India', 'Bangladesh', 'Nepal', 'Worldwide'],
    safetyNotes: 'Unofficial fan dub channel on Telegram.',
    verificationSource: 'Telegram Community Verification',
    sourceUrl: 'https://t.me/Fan_dub_anime_hindi_17',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 650,
    userRating: 4.7,
    ratingCount: 160,
  },
  {
    id: 'anime_agg_dubbers',
    slug: 'anime-agg-dubbers',
    name: 'Anime Agg Dubbers (Telegram)',
    logoEmoji: '⚡',
    tagline: 'Regional Hindi and Indian fan dub episodes and release updates.',
    description: 'Community aggregator channel for voice actors, fan dubbers, and multi-language anime dub releases.',
    categories: ['fundub_communities', 'third_party_services'],
    primaryCategory: 'fundub_communities',
    isOfficial: false,
    licensingStatus: 'unverified_third_party',
    operationalStatus: 'working',
    websiteUrl: 'https://t.me/s/animeaggdubbers',
    platforms: ['web', 'android', 'ios', 'desktop'],
    businessModel: 'free',
    pricing: {
      hasFreeTier: true,
      hasFreeTrial: false,
      hasAds: false,
      requiresAccount: false,
    },
    specs: {
      maxVideoQuality: '1080p FHD',
      audioLanguages: ['Hindi', 'Tamil'],
      subtitleLanguages: ['English', 'Hindi'],
      supportsOfflineViewing: true,
    },
    bangladeshStatus: 'available',
    regionalNotes: 'Public channel preview link accessible directly via web browser or Telegram app.',
    supportedCountries: ['India', 'Bangladesh', 'Worldwide'],
    safetyNotes: 'Telegram public preview channel.',
    verificationSource: 'Telegram Public Preview',
    sourceUrl: 'https://t.me/s/animeaggdubbers',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 720,
    userRating: 4.8,
    ratingCount: 190,
  },
  {
    id: 'hindi_ani_chat',
    slug: 'hindi-ani-chat',
    name: 'Hindi AniChat (Telegram Community)',
    logoEmoji: '💬',
    tagline: 'Interactive Hindi anime community, voice casting, and discussion hub.',
    description: 'Hub for Hindi anime lovers, voice artists, discussion threads, episode polls, and fan dub feedback.',
    categories: ['fundub_communities', 'anime_community_discussion', 'third_party_services'],
    primaryCategory: 'fundub_communities',
    isOfficial: false,
    licensingStatus: 'unverified_third_party',
    operationalStatus: 'working',
    websiteUrl: 'https://telegram.me/HindiAniChat',
    platforms: ['web', 'android', 'ios', 'desktop'],
    businessModel: 'free',
    pricing: {
      hasFreeTier: true,
      hasFreeTrial: false,
      hasAds: false,
      requiresAccount: true,
    },
    specs: {
      maxVideoQuality: 'Audio Only',
      audioLanguages: ['Hindi', 'English'],
      subtitleLanguages: ['Hindi', 'English'],
      supportsOfflineViewing: false,
    },
    bangladeshStatus: 'available',
    regionalNotes: 'Active community chat for Hindi-speaking anime fans.',
    supportedCountries: ['India', 'Bangladesh', 'Worldwide'],
    safetyNotes: 'Community group chat on Telegram.',
    verificationSource: 'Telegram Group Verification',
    sourceUrl: 'https://telegram.me/HindiAniChat',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 540,
    userRating: 4.6,
    ratingCount: 130,
  },
  {
    id: 'jd_dubbing_studio',
    slug: 'jd-dubbing-studio',
    name: 'JD Dubbing Studio Official (Telegram)',
    logoEmoji: '🎛️',
    tagline: 'Independent Hindi dubbing production studio for anime series.',
    description: 'Independent fan dubbing collective producing full Hindi voice tracks, SFX syncing, and opening/ending adaptations.',
    categories: ['fundub_communities', 'third_party_services'],
    primaryCategory: 'fundub_communities',
    isOfficial: false,
    licensingStatus: 'unverified_third_party',
    operationalStatus: 'working',
    websiteUrl: 'https://t.me/JDDubbingstudioofficial01',
    platforms: ['web', 'android', 'ios', 'desktop'],
    businessModel: 'free',
    pricing: {
      hasFreeTier: true,
      hasFreeTrial: false,
      hasAds: false,
      requiresAccount: true,
    },
    specs: {
      maxVideoQuality: '1080p FHD',
      audioLanguages: ['Hindi'],
      subtitleLanguages: ['Hindi', 'English'],
      supportsOfflineViewing: true,
    },
    bangladeshStatus: 'available',
    regionalNotes: 'Accessible on Telegram.',
    supportedCountries: ['India', 'Bangladesh', 'Worldwide'],
    safetyNotes: 'Fan dub studio channel on Telegram.',
    verificationSource: 'Telegram Studio Channel',
    sourceUrl: 'https://t.me/JDDubbingstudioofficial01',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 610,
    userRating: 4.7,
    ratingCount: 145,
  },
  {
    id: 'dynamite_anime',
    slug: 'dynamite-anime',
    name: 'Dynamite Anime (Telegram)',
    logoEmoji: '💥',
    tagline: 'High-energy Hindi anime fan dubs, AMVs, and fast episode releases.',
    description: 'Community channel featuring Hindi anime episodes, popular shonen clips, and fan voiceover projects.',
    categories: ['fundub_communities', 'third_party_services'],
    primaryCategory: 'fundub_communities',
    isOfficial: false,
    licensingStatus: 'unverified_third_party',
    operationalStatus: 'working',
    websiteUrl: 'https://t.me/Dynamite_Anime',
    platforms: ['web', 'android', 'ios', 'desktop'],
    businessModel: 'free',
    pricing: {
      hasFreeTier: true,
      hasFreeTrial: false,
      hasAds: false,
      requiresAccount: true,
    },
    specs: {
      maxVideoQuality: '1080p FHD',
      audioLanguages: ['Hindi', 'Japanese'],
      subtitleLanguages: ['English', 'Hindi'],
      supportsOfflineViewing: true,
    },
    bangladeshStatus: 'available',
    regionalNotes: 'Direct Telegram channel link.',
    supportedCountries: ['India', 'Bangladesh', 'Worldwide'],
    safetyNotes: 'Telegram anime channel.',
    verificationSource: 'Telegram Channel Verification',
    sourceUrl: 'https://t.me/Dynamite_Anime',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 490,
    userRating: 4.6,
    ratingCount: 115,
  },
  {
    id: 'anime_tm_dub',
    slug: 'anime-tm-dub',
    name: 'Anime TM Dub (Telegram Channel)',
    logoEmoji: '🌟',
    tagline: 'Regional Hindi and Tamil anime dub episodes with high audio fidelity.',
    description: 'Multi-lingual regional anime fan dub group specializing in Hindi and Tamil voice adaptations.',
    categories: ['fundub_communities', 'third_party_services'],
    primaryCategory: 'fundub_communities',
    isOfficial: false,
    licensingStatus: 'unverified_third_party',
    operationalStatus: 'working',
    websiteUrl: 'https://t.me/s/animetmdub',
    platforms: ['web', 'android', 'ios', 'desktop'],
    businessModel: 'free',
    pricing: {
      hasFreeTier: true,
      hasFreeTrial: false,
      hasAds: false,
      requiresAccount: false,
    },
    specs: {
      maxVideoQuality: '1080p FHD',
      audioLanguages: ['Hindi', 'Tamil', 'Telugu'],
      subtitleLanguages: ['English'],
      supportsOfflineViewing: true,
    },
    bangladeshStatus: 'available',
    regionalNotes: 'Public channel preview link accessible without app.',
    supportedCountries: ['India', 'Bangladesh', 'Worldwide'],
    safetyNotes: 'Telegram public preview channel.',
    verificationSource: 'Telegram Public Preview',
    sourceUrl: 'https://t.me/s/animetmdub',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 580,
    userRating: 4.7,
    ratingCount: 140,
  },

  // -------------------------------------------------------------
  // UNOFFICIAL WATCH SITES & AGGREGATORS (EVERYTHINGMOE CURATED)
  // -------------------------------------------------------------
  {
    id: 'everything_moe',
    slug: 'everything-moe',
    name: 'EverythingMoe (Index)',
    logoEmoji: '🌸',
    tagline: 'The ultimate community index for anime streaming, manga, and tools.',
    description: 'Trusted master index at everythingmoe.com cataloging active anime streaming websites, ratings, ad disclosures, and streaming servers with transparent community reviews.',
    categories: ['unofficial_anime_streaming', 'anime_news_databases', 'third_party_services'],
    primaryCategory: 'unofficial_anime_streaming',
    isOfficial: false,
    licensingStatus: 'unverified_third_party',
    operationalStatus: 'working',
    websiteUrl: 'https://everythingmoe.com/',
    platforms: ['web', 'desktop', 'android', 'ios'],
    businessModel: 'free',
    pricing: {
      hasFreeTier: true,
      hasFreeTrial: false,
      hasAds: false,
      requiresAccount: false,
    },
    specs: {
      maxVideoQuality: 'Text/Images',
      audioLanguages: ['Japanese', 'English', 'Hindi'],
      subtitleLanguages: ['English', 'Multi-Language'],
      supportsOfflineViewing: false,
    },
    bangladeshStatus: 'available',
    regionalNotes: 'Master index directory accessible globally without geoblocks.',
    supportedCountries: ['Worldwide'],
    safetyNotes: 'EverythingMoe is an informational directory and review site. It does not host video files directly.',
    verificationSource: 'EverythingMoe Official Index',
    sourceUrl: 'https://everythingmoe.com/',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 3400,
    userRating: 4.9,
    ratingCount: 890,
  },
  {
    id: 'hianime_to',
    slug: 'hianime',
    name: 'HiAnime (AniWatch / Zoro)',
    logoEmoji: '⚡',
    tagline: 'Top-rated community anime streaming portal indexed on EverythingMoe.',
    description: 'Popular anime streaming website featuring 1080p high bitrate playback, synchronous dubs and subs, auto-next, watch2gether rooms, and MAL synchronization.',
    categories: ['unofficial_anime_streaming', 'third_party_services'],
    primaryCategory: 'unofficial_anime_streaming',
    isOfficial: false,
    licensingStatus: 'unverified_third_party',
    operationalStatus: 'working',
    websiteUrl: 'https://hianime.to/',
    platforms: ['web', 'desktop', 'android', 'ios'],
    businessModel: 'ad_supported',
    pricing: {
      hasFreeTier: true,
      hasFreeTrial: false,
      hasAds: true,
      requiresAccount: false,
    },
    specs: {
      maxVideoQuality: '1080p FHD',
      audioLanguages: ['Japanese', 'English Dub', 'Hindi Dub (Select)'],
      subtitleLanguages: ['English', 'Spanish', 'French', 'German'],
      supportsOfflineViewing: false,
    },
    bangladeshStatus: 'available',
    regionalNotes: 'High speed CDN available across South Asia.',
    supportedCountries: ['Worldwide'],
    safetyNotes: 'Unofficial third-party streaming service indexed by EverythingMoe. Using an adblocker (e.g. uBlock Origin) is advised.',
    verificationSource: 'EverythingMoe Streaming Index',
    sourceUrl: 'https://everythingmoe.com/',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 2950,
    userRating: 4.8,
    ratingCount: 760,
  },
  {
    id: 'animepahe_ru',
    slug: 'animepahe',
    name: 'AnimePahe',
    logoEmoji: '🍃',
    tagline: 'Lightweight, data-efficient anime streaming with high video compression.',
    description: 'Renowned for exceptionally small file sizes with remarkable visual quality. Features multiple resolutions (360p to 1080p) and instant episode downloads.',
    categories: ['unofficial_anime_streaming', 'third_party_services'],
    primaryCategory: 'unofficial_anime_streaming',
    isOfficial: false,
    licensingStatus: 'unverified_third_party',
    operationalStatus: 'working',
    websiteUrl: 'https://animepahe.ru/',
    platforms: ['web', 'desktop', 'android', 'ios'],
    businessModel: 'ad_supported',
    pricing: {
      hasFreeTier: true,
      hasFreeTrial: false,
      hasAds: true,
      requiresAccount: false,
    },
    specs: {
      maxVideoQuality: '1080p FHD',
      audioLanguages: ['Japanese', 'English Dub'],
      subtitleLanguages: ['English'],
      supportsOfflineViewing: true,
    },
    bangladeshStatus: 'available',
    regionalNotes: 'Extremely popular for mobile data users in South Asia due to efficient encodings.',
    supportedCountries: ['Worldwide'],
    safetyNotes: 'Unofficial streaming site indexed by EverythingMoe. Standard pop-up ad protection recommended.',
    verificationSource: 'EverythingMoe Streaming Index',
    sourceUrl: 'https://everythingmoe.com/',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 2400,
    userRating: 4.7,
    ratingCount: 620,
  },
  {
    id: 'aniwave_to',
    slug: 'aniwave',
    name: 'AniWave (9Anime)',
    logoEmoji: '🌊',
    tagline: 'Massive archive of anime series, movies, and OVAs with multi-server backup.',
    description: 'Expansive anime library with filterable genres, season schedules, schedule countdowns, and multiple video host servers.',
    categories: ['unofficial_anime_streaming', 'third_party_services'],
    primaryCategory: 'unofficial_anime_streaming',
    isOfficial: false,
    licensingStatus: 'unverified_third_party',
    operationalStatus: 'working',
    websiteUrl: 'https://aniwave.to/',
    platforms: ['web', 'desktop', 'android', 'ios'],
    businessModel: 'ad_supported',
    pricing: {
      hasFreeTier: true,
      hasFreeTrial: false,
      hasAds: true,
      requiresAccount: false,
    },
    specs: {
      maxVideoQuality: '1080p FHD',
      audioLanguages: ['Japanese', 'English Dub'],
      subtitleLanguages: ['English', 'Spanish'],
      supportsOfflineViewing: false,
    },
    bangladeshStatus: 'available',
    regionalNotes: 'Accessible worldwide with mirror domains.',
    supportedCountries: ['Worldwide'],
    safetyNotes: 'Unofficial streaming portal indexed by EverythingMoe.',
    verificationSource: 'EverythingMoe Streaming Index',
    sourceUrl: 'https://everythingmoe.com/',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 2200,
    userRating: 4.7,
    ratingCount: 540,
  },
  {
    id: 'yugenanime_tv',
    slug: 'yugenanime',
    name: 'YugenAnime',
    logoEmoji: '✨',
    tagline: 'Minimalist, distraction-free anime streaming with built-in episode bookmarks.',
    description: 'Clean user interface with dark theme, responsive player controls, watch history, and fast streaming servers rated top-tier on EverythingMoe.',
    categories: ['unofficial_anime_streaming', 'third_party_services'],
    primaryCategory: 'unofficial_anime_streaming',
    isOfficial: false,
    licensingStatus: 'unverified_third_party',
    operationalStatus: 'working',
    websiteUrl: 'https://yugenanime.tv/',
    platforms: ['web', 'desktop', 'android', 'ios'],
    businessModel: 'free_plus_premium',
    pricing: {
      hasFreeTier: true,
      hasFreeTrial: false,
      hasAds: false,
      requiresAccount: false,
    },
    specs: {
      maxVideoQuality: '1080p FHD',
      audioLanguages: ['Japanese', 'English Dub'],
      subtitleLanguages: ['English'],
      supportsOfflineViewing: false,
    },
    bangladeshStatus: 'available',
    regionalNotes: 'Clean interface with minimal redirects.',
    supportedCountries: ['Worldwide'],
    safetyNotes: 'Unofficial anime portal listed on EverythingMoe.',
    verificationSource: 'EverythingMoe Streaming Index',
    sourceUrl: 'https://everythingmoe.com/',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 1980,
    userRating: 4.8,
    ratingCount: 490,
  },
  {
    id: 'kaido_to',
    slug: 'kaido',
    name: 'Kaido.to',
    logoEmoji: '🐉',
    tagline: 'Modern, fast mobile-optimized anime streaming portal.',
    description: 'Fast anime streaming website designed for smooth performance on both mobile browsers and desktop, featuring full English sub & dub catalogs.',
    categories: ['unofficial_anime_streaming', 'third_party_services'],
    primaryCategory: 'unofficial_anime_streaming',
    isOfficial: false,
    licensingStatus: 'unverified_third_party',
    operationalStatus: 'working',
    websiteUrl: 'https://kaido.to/',
    platforms: ['web', 'android', 'ios', 'desktop'],
    businessModel: 'ad_supported',
    pricing: {
      hasFreeTier: true,
      hasFreeTrial: false,
      hasAds: true,
      requiresAccount: false,
    },
    specs: {
      maxVideoQuality: '1080p FHD',
      audioLanguages: ['Japanese', 'English Dub'],
      subtitleLanguages: ['English'],
      supportsOfflineViewing: false,
    },
    bangladeshStatus: 'available',
    regionalNotes: 'Mobile-friendly streaming interface.',
    supportedCountries: ['Worldwide'],
    safetyNotes: 'Unofficial streaming site indexed by EverythingMoe.',
    verificationSource: 'EverythingMoe Streaming Index',
    sourceUrl: 'https://everythingmoe.com/',
    lastVerifiedDate: 'October 2026',
    bookmarkCount: 1650,
    userRating: 4.7,
    ratingCount: 380,
  },
];

const DIRECTORY_STORAGE_KEY = 'aniread_directory_services_v3';
const DIRECTORY_BOOKMARKS_KEY = 'aniread_directory_bookmarks_v1';
const DIRECTORY_RECENT_KEY = 'aniread_directory_recently_visited_v1';
const DIRECTORY_REPORTS_KEY = 'aniread_directory_user_reports_v1';

/**
 * Loads all services from localStorage or falls back to INITIAL_SERVICES_SEED
 */
export function getStoredDirectoryServices(): DirectoryService[] {
  try {
    const raw = localStorage.getItem(DIRECTORY_STORAGE_KEY);
    if (!raw) {
      saveDirectoryServices(INITIAL_SERVICES_SEED);
      return INITIAL_SERVICES_SEED;
    }
    const parsed: DirectoryService[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      saveDirectoryServices(INITIAL_SERVICES_SEED);
      return INITIAL_SERVICES_SEED;
    }

    // Merge in any new seed entries that aren't in stored data yet
    const existingIds = new Set(parsed.map((s) => s.id));
    let hasUpdates = false;
    INITIAL_SERVICES_SEED.forEach((seed) => {
      if (!existingIds.has(seed.id)) {
        parsed.push(seed);
        hasUpdates = true;
      }
    });

    if (hasUpdates) {
      saveDirectoryServices(parsed);
    }

    return parsed;
  } catch (err) {
    console.error('Failed to load directory services from storage:', err);
    return INITIAL_SERVICES_SEED;
  }
}

/**
 * Saves all directory services persistently
 */
export function saveDirectoryServices(services: DirectoryService[]): void {
  try {
    localStorage.setItem(DIRECTORY_STORAGE_KEY, JSON.stringify(services));
  } catch (err) {
    console.error('Failed to save directory services:', err);
  }
}

/**
 * Gets user bookmarked service IDs
 */
export function getDirectoryBookmarks(): string[] {
  try {
    const raw = localStorage.getItem(DIRECTORY_BOOKMARKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Toggles a bookmark for a service ID
 */
export function toggleDirectoryBookmark(serviceId: string): boolean {
  try {
    const current = getDirectoryBookmarks();
    const index = current.indexOf(serviceId);
    let updated: string[];
    let isBookmarked = false;

    if (index > -1) {
      updated = current.filter((id) => id !== serviceId);
      isBookmarked = false;
    } else {
      updated = [serviceId, ...current];
      isBookmarked = true;
    }

    localStorage.setItem(DIRECTORY_BOOKMARKS_KEY, JSON.stringify(updated));

    // Update bookmarkCount on service
    const services = getStoredDirectoryServices();
    const target = services.find((s) => s.id === serviceId);
    if (target) {
      target.bookmarkCount = Math.max(0, (target.bookmarkCount || 0) + (isBookmarked ? 1 : -1));
      saveDirectoryServices(services);
    }

    return isBookmarked;
  } catch {
    return false;
  }
}

/**
 * Gets recently visited service IDs
 */
export function getRecentlyVisitedServices(): string[] {
  try {
    const raw = localStorage.getItem(DIRECTORY_RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Records a visit to a service
 */
export function recordServiceVisit(serviceId: string): void {
  try {
    const current = getRecentlyVisitedServices().filter((id) => id !== serviceId);
    const updated = [serviceId, ...current].slice(0, 10); // keep last 10
    localStorage.setItem(DIRECTORY_RECENT_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

/**
 * Gets all user reports
 */
export function getUserReports(): UserReport[] {
  try {
    const raw = localStorage.getItem(DIRECTORY_REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Submits a new user report
 */
export function submitUserReport(report: Omit<UserReport, 'id' | 'timestamp' | 'status'>): UserReport {
  const newReport: UserReport = {
    ...report,
    id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: Date.now(),
    status: 'pending',
  };

  const current = getUserReports();
  const updated = [newReport, ...current];
  try {
    localStorage.setItem(DIRECTORY_REPORTS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save user report:', err);
  }

  return newReport;
}

/**
 * Updates a user report status (Admin action)
 */
export function updateReportStatus(reportId: string, status: 'pending' | 'resolved' | 'dismissed'): void {
  const current = getUserReports();
  const updated = current.map((r) => (r.id === reportId ? { ...r, status } : r));
  try {
    localStorage.setItem(DIRECTORY_REPORTS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to update report status:', err);
  }
}
