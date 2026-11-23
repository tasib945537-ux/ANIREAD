export type DirectoryCategoryId =
  | 'official_anime_apps'
  | 'official_anime_websites'
  | 'free_ad_supported'
  | 'subscription_premium'
  | 'free_official_channels'
  | 'anime_news_databases'
  | 'anime_tracking_watchlists'
  | 'manga_reading_services'
  | 'official_manga_apps'
  | 'light_novel_services'
  | 'anime_merch_stores'
  | 'anime_community_discussion'
  | 'anime_discovery_search'
  | 'official_publishers'
  | 'third_party_services'
  | 'fundub_communities'
  | 'unofficial_anime_streaming';

export interface DirectoryCategory {
  id: DirectoryCategoryId;
  title: string;
  shortName: string;
  icon: string;
  description: string;
  badgeColor: string;
}

export type PlatformType = 'web' | 'android' | 'ios' | 'desktop' | 'smart_tv' | 'console';

export type BusinessModel =
  | 'free'
  | 'ad_supported'
  | 'subscription'
  | 'free_plus_premium'
  | 'pay_per_volume'
  | 'unknown';

export type BangladeshAvailability =
  | 'available'
  | 'region_restricted'
  | 'vpn_required'
  | 'unknown';

export type LicensingStatus =
  | 'official_licensed'
  | 'official_publisher'
  | 'authorized_distributor'
  | 'unverified_third_party';

export type ServiceOperationalStatus = 'working' | 'limited' | 'down' | 'unknown';

export interface ServicePricingInfo {
  hasFreeTier: boolean | 'limited' | 'unknown';
  hasFreeTrial: boolean | 'unknown';
  trialDays?: number;
  hasAds: boolean | 'some_regions' | 'unknown';
  requiresAccount: boolean | 'optional' | 'unknown';
  subscriptionPrice?: string; // e.g. "BDT 400/mo or $7.99/mo"
  billingPeriods?: string[]; // e.g. ["Monthly", "Annual"]
}

export interface ServiceMediaSpecs {
  maxVideoQuality?: '4K UHD' | '1080p FHD' | '720p HD' | 'Adaptive' | 'Audio Only' | 'Text/Images' | 'Unknown';
  audioLanguages?: string[]; // e.g. ["Japanese", "English", "Hindi", "Spanish"]
  subtitleLanguages?: string[]; // e.g. ["English", "Bengali", "Hindi", "Spanish"]
  supportsOfflineViewing: boolean | 'plan_dependent' | 'unknown';
}

export interface UserReport {
  id: string;
  serviceId: string;
  serviceName: string;
  reportType: 'broken_link' | 'wrong_pricing' | 'region_inaccurate' | 'malware_ads' | 'copyright_issue' | 'other';
  comment: string;
  timestamp: number;
  status: 'pending' | 'resolved' | 'dismissed';
}

export interface DirectoryService {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string;
  logoEmoji: string;
  tagline: string;
  description: string;
  categories: DirectoryCategoryId[];
  primaryCategory: DirectoryCategoryId;
  isOfficial: boolean;
  licensingStatus: LicensingStatus;
  operationalStatus: ServiceOperationalStatus;
  
  // URLs
  websiteUrl: string;
  androidAppUrl?: string;
  iosAppUrl?: string;
  desktopAppUrl?: string;
  
  // Supported Platforms
  platforms: PlatformType[];
  
  // Pricing & Monetization
  pricing: ServicePricingInfo;
  businessModel: BusinessModel;
  
  // Media Specs
  specs: ServiceMediaSpecs;
  
  // Regional Availability
  bangladeshStatus: BangladeshAvailability;
  regionalNotes?: string;
  supportedCountries?: string[];
  
  // Safety & Notes
  safetyNotes?: string;
  adsNotes?: string;
  
  // Verification Info
  verificationSource: string;
  sourceUrl: string;
  lastVerifiedDate: string; // e.g. "October 2026"
  isArchived?: boolean;
  
  // Community engagement
  bookmarkCount: number;
  userRating?: number; // 1 to 5 scale if real ratings exist
  ratingCount?: number;
}
