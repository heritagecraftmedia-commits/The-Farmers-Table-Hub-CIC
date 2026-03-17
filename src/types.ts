export type ListingTier = 'free' | 'supporter' | 'featured';

export interface FoodVendor {
  id: string;
  name: string;
  type: string;
  email: string;
  location: string;
  postcode: string;
  website: string;
  rating: number;
  phone: string;
  tier: ListingTier;
}

export interface MakerListing {
  id: string;
  name: string;
  craft: string;
  businessName: string;
  instagram: string;
  instagramUrl: string;
  tier: ListingTier;
}

export type UserRole = 'founder' | 'staff' | 'customer' | null;

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface RawLead {
  id: string;
  sourcePlatform: string;
  profileUrl: string;
  displayName: string;
  bioText: string;
  locationHint: string;
  categoryHint: string;
  discoveredAt: string;
}

export interface QualifiedLead {
  id: string;
  rawLeadId: string;
  artisanScore: number;
  qualificationNotes: string;
  qualified: boolean;
  reviewed: boolean;
  createdAt: string;
}

export interface EnrichedLead {
  id: string;
  vendorName: string;
  vendorType: string;
  craftCategory: string;
  location: string;
  website: string;
  publicEmail: string;
  socialLinks: Record<string, string>;
  summary: string;
  status: 'draft' | 'invited' | 'claimed';
  createdAt: string;
}

export interface OutreachLog {
  id: string;
  enrichedLeadId: string;
  contactMethod: string;
  messageSent: string;
  sentAt: string;
  response?: string;
}

export interface ClaimedVendor {
  id: string;
  userId: string;
  vendorProfile: any;
  approved: boolean;
  published: boolean;
  claimedAt: string;
}

export type EventCategory = 'Wood & Furniture' | 'Textiles & Clothing' | 'Pottery & Ceramics' | 'Metal & Tools' | 'Heritage & Skills' | 'Workshops & Talks' | 'Food & Produce' | 'Community' | 'Other';

export interface HubEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  venue: string;
  websiteUrl: string;
  craftType: EventCategory;
  source: string;
  approved: boolean;
  createdAt: string;
}

export interface DirectoryListing {
  id: string;
  enrichedLeadId?: string;
  vendorName: string;
  craftCategory: string;
  location: string;
  bio: string;
  website: string;
  socialLinks: Record<string, string>;
  listingTier: 'free' | 'supporter' | 'featured';
  featuredUntil?: string;
  approved: boolean;
  published: boolean;
  claimedAt: string;
  email?: string;
  phone?: string;
  displayCategory: 'Meat' | 'Milk & Dairy' | 'Fruit & Veg' | 'Eggs & Poultry' | 'Mixed Farms' | 'Makers & Bakers' | 'Crafters';
  affiliateLinks?: { label: string; url: string }[];
  outreachStatus?: 'not_contacted' | 'contacted' | 'responded' | 'opted_out';
  outreachDate?: string;
  response?: string;
  claimed?: boolean;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  email: string;
  status: 'active' | 'on-leave' | 'inactive';
  joinedAt: string;
}

export interface RadioShow {
  id: string;
  title: string;
  host: string;
  schedule: string;
  status: 'live' | 'pre-recorded' | 'planned';
  lastBroadcast?: string;
}

export interface FounderJob {
  id: string;
  task: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'pending' | 'completed';
  dueDate?: string;
}

export interface MakerStory {
  id: string;
  makerName: string;
  craft: string;
  image: string;
  q1: string; // How did you learn?
  q2: string; // What tools?
  q3: string; // Good making day?
  published: boolean;
}

export interface EventMakerLink {
  eventId: string;
  makerId: string;
  makerName?: string; // Fallback for makers not yet in directory
}

export interface PendingListing {
  id: string;
  businessName: string;
  category: string;
  location: string;
  website?: string;
  instagram?: string;
  description: string;
  sourceUrl?: string;
  sourcePlatform?: string;
  discoveredAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedAt?: string;
  contactEmail?: string;
  contactName?: string;
  aiConfidenceScore?: number;
}

// Update existing types with linkage hints
export interface HubEventWithMakers extends HubEvent {
  attendingMakers?: DirectoryListing[];
}

export interface MakerWithEvents extends DirectoryListing {
  upcomingEvents?: HubEvent[];
}

// ── Radio System ─────────────────────────────────────────────

export interface SponsorRotation {
  id: string;
  name: string;
  productDesc: string;
  contactName: string;
  contactEmail: string;
  package: '15s' | '30s' | '60s' | 'sponsorship';
  readsPerShow: number;
  adScript: string;
  renewalDate?: string;
  status: 'active' | 'paused' | 'expired';
  createdAt: string;
}

export interface AdSchedule {
  id: string;
  sponsorId: string;
  sponsorName?: string;   // joined from sponsor_rotations
  showDay: string;
  timeSlot: string;
  durationSeconds: number;
  status: 'scheduled' | 'played' | 'skipped';
  playedAt?: string;
  createdAt: string;
}

export interface PlaylistTrack {
  id: string;
  title: string;
  artist: string;
  durationSeconds: number;
  category: 'music' | 'jingle' | 'community' | 'ad' | 'emergency';
  fileUrl: string;
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
}

export interface SocialPost {
  id: string;
  content: string;
  platform: 'instagram' | 'facebook' | 'twitter' | 'all';
  sourceType: 'show' | 'event' | 'maker' | 'sponsor' | 'manual';
  sourceId?: string;
  status: 'draft' | 'approved' | 'posted';
  scheduledAt?: string;
  postedAt?: string;
  createdAt: string;
}
