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
