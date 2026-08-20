import { DirectoryListing } from '../types';

/**
 * Normalise human search input so small differences in punctuation, spacing,
 * apostrophes and accents do not prevent a useful match.
 */
export const normaliseDirectorySearch = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const searchableText = (listing: DirectoryListing): string =>
  [
    listing.vendorName,
    listing.craftCategory,
    listing.displayCategory,
    listing.location,
    listing.bio,
    listing.website,
    ...Object.values(listing.socialLinks ?? {}),
  ]
    .filter(Boolean)
    .map(normaliseDirectorySearch)
    .join(' ');

/**
 * Directory search with relevance ordering. Exact business-name matches are
 * shown first, followed by category/location matches, then broader matches.
 */
export const searchDirectoryListings = (
  listings: DirectoryListing[],
  query: string,
): DirectoryListing[] => {
  const term = normaliseDirectorySearch(query);
  if (!term) return listings;

  const words = term.split(' ').filter(Boolean);

  return listings
    .map((listing) => {
      const name = normaliseDirectorySearch(listing.vendorName);
      const category = normaliseDirectorySearch(
        `${listing.craftCategory} ${listing.displayCategory}`,
      );
      const location = normaliseDirectorySearch(listing.location);
      const allText = searchableText(listing);

      let score = 0;
      if (name === term) score += 100;
      if (name.startsWith(term)) score += 60;
      if (name.includes(term)) score += 40;
      if (category.includes(term)) score += 25;
      if (location.includes(term)) score += 25;
      if (allText.includes(term)) score += 10;

      for (const word of words) {
        if (name.includes(word)) score += 12;
        if (category.includes(word)) score += 8;
        if (location.includes(word)) score += 8;
      }

      return { listing, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ listing }) => listing);
};
