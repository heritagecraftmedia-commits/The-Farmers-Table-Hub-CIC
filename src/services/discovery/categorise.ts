import { EventCategory } from '../../types';
import { NormalisedCandidate, CategoryDecision } from './types';

/**
 * Categorisation for the What's On board.
 *
 * The categories are exactly those offered by src/pages/WhatsOn.tsx, so a
 * promoted row needs no translation on the way out.
 *
 * The rule that shapes this file: a single keyword must not decide the
 * category. A community craft fair that happens to mention woodwork among
 * six other crafts is a community craft fair, not a Wood & Furniture event.
 * Three mechanisms enforce that:
 *
 *   1. Evidence is weighted by where it appears - the title describes what
 *      the event IS, the description often lists what it merely mentions.
 *   2. A breadth check: when several distinct craft categories all have
 *      evidence, the event is general, and generality wins.
 *   3. A margin check: the leader must be clearly ahead of the runner-up.
 *      A near-tie is not a confident single-craft classification.
 *
 * Every decision carries a rationale so a reviewer can check the machine's
 * reasoning against the event itself rather than trusting the label.
 */

const TITLE_WEIGHT = 3;
const BODY_WEIGHT = 1;

type Lexicon = Partial<Record<EventCategory, string[]>>;

const LEXICON: Lexicon = {
  'Wood & Furniture': [
    'woodwork', 'woodworking', 'wood turning', 'woodturning', 'carpentry',
    'joinery', 'furniture', 'cabinet making', 'green woodworking', 'whittling',
    'chair making', 'marquetry', 'sawmill', 'timber',
  ],
  'Textiles & Clothing': [
    'textile', 'weaving', 'weaver', 'spinning', 'knitting', 'crochet',
    'quilting', 'embroidery', 'sewing', 'dressmaking', 'dyeing', 'felting',
    'tapestry', 'stitch', 'fabric', 'yarn', 'wool',
  ],
  'Pottery & Ceramics': [
    'pottery', 'ceramic', 'ceramics', 'porcelain', 'stoneware', 'kiln',
    'throwing', "potter's wheel", 'glaze', 'clay', 'raku',
  ],
  'Metal & Tools': [
    'blacksmith', 'blacksmithing', 'forge', 'forging', 'metalwork',
    'silversmith', 'jewellery making', 'welding', 'foundry', 'farrier',
    'knife making', 'toolmaking', 'anvil',
  ],
  'Heritage & Skills': [
    'heritage', 'traditional skills', 'rural crafts', 'thatching',
    'dry stone', 'drystone', 'hedgelaying', 'basketry', 'basket weaving',
    'coppicing', 'restoration', 'conservation', 'historic', 'museum',
    'living history', 'folk',
  ],
  'Workshops & Talks': [
    'workshop', 'masterclass', 'course', 'class', 'talk', 'lecture',
    'demonstration', 'seminar', 'training', 'taster session', 'tutorial',
  ],
  'Food & Produce': [
    'farmers market', "farmers' market", 'food festival', 'produce',
    'artisan food', 'bakery', 'baking', 'cheese', 'brewery', 'brewing',
    'cider', 'harvest', 'kitchen garden', 'preserving', 'foraging',
    'street food', 'local food',
  ],
  'Community': [
    'community', 'village fete', 'fete', 'fair', 'craft fair', 'open day',
    'volunteer', 'fundraiser', 'coffee morning', 'meet up', 'meetup',
    'social', 'club night', 'parish',
  ],
};

/**
 * Phrases that positively identify a general, multi-craft or whole-community
 * event. These are the events most likely to be mislabelled by a single
 * craft keyword appearing in a list of activities.
 */
const GENERAL_MARKERS = [
  'craft fair', 'crafts fair', 'makers market', "makers' market",
  'artisan market', 'artisan fair', 'craft market', 'village fete',
  'summer fete', 'winter fair', 'christmas fair', 'open studios',
  'country show', 'agricultural show', 'county show', 'community day',
  'open day', 'festival of crafts', 'craft festival',
];

/** Categories that describe a craft discipline rather than a format. */
const CRAFT_CATEGORIES: EventCategory[] = [
  'Wood & Furniture', 'Textiles & Clothing', 'Pottery & Ceramics',
  'Metal & Tools', 'Heritage & Skills', 'Food & Produce',
];

const countMatches = (haystack: string, term: string): number => {
  if (haystack === '') return 0;
  // Word-boundary match so "clay" does not fire on "Clayton".
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Allow a simple plural so "ceramics" matches "ceramic" and "potters"
  // matches "potter", without matching unrelated longer words.
  const re = new RegExp(`(^|[^a-z])${escaped}(s|es)?([^a-z]|$)`, 'gi');
  return (haystack.match(re) ?? []).length;
};

export interface CategoriseInput {
  title: string;
  description?: string;
}

export const categorise = (input: CategoriseInput): CategoryDecision => {
  const title = (input.title ?? '').toLowerCase();
  const body = (input.description ?? '').toLowerCase();
  const all = `${title} ${body}`;

  const scores: Partial<Record<EventCategory, number>> = {};
  const evidence: Partial<Record<EventCategory, string[]>> = {};

  for (const [category, terms] of Object.entries(LEXICON) as [EventCategory, string[]][]) {
    let total = 0;
    const hits: string[] = [];
    for (const term of terms) {
      const inTitle = countMatches(title, term);
      const inBody = countMatches(body, term);
      if (inTitle + inBody === 0) continue;
      total += inTitle * TITLE_WEIGHT + inBody * BODY_WEIGHT;
      hits.push(term);
    }
    if (total > 0) {
      scores[category] = total;
      evidence[category] = hits;
    }
  }

  const generalHits = GENERAL_MARKERS.filter(m => all.includes(m));
  const craftsWithEvidence = CRAFT_CATEGORIES.filter(c => (scores[c] ?? 0) > 0);

  const ranked = (Object.entries(scores) as [EventCategory, number][])
    .sort((a, b) => b[1] - a[1]);

  if (ranked.length === 0) {
    return {
      category: 'Other',
      rationale:
        'No category keywords were found in the title or description. Filed as Other for a reviewer to categorise by hand.',
      scores,
    };
  }

  const [topCategory, topScore] = ranked[0];
  const runnerUp = ranked[1]?.[1] ?? 0;

  // (2) Breadth: an event that names three or more distinct crafts is a
  // general craft event, whichever single craft happens to score highest.
  if (craftsWithEvidence.length >= 3) {
    return {
      category: 'Community',
      rationale:
        `Mentions ${craftsWithEvidence.length} different crafts (${craftsWithEvidence.join(', ')}), ` +
        `so it reads as a general multi-craft event rather than a ${topCategory} one. ` +
        'Filed as Community.',
      scores,
    };
  }

  // Which craft disciplines are named in the TITLE - the strongest signal
  // available, because a title says what an event IS.
  const craftsInTitle = CRAFT_CATEGORIES
    .filter(c => (LEXICON[c] ?? []).some(term => countMatches(title, term) > 0))
    .sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0));

  // A named general format ("craft fair", "open studios") beats a single
  // craft keyword unless that craft is named in the title itself.
  if (generalHits.length > 0 && craftsInTitle.length === 0) {
    return {
      category: 'Community',
      rationale:
        `Described as a general event ("${generalHits[0]}") and no single craft is named in the title. ` +
        'Filed as Community rather than following a keyword in the description.',
      scores,
    };
  }

  // A specific craft named in the TITLE settles it. Breadth (>= 3 crafts)
  // has already been ruled out above, so this is a single-discipline event
  // whose title says which discipline. This must be decided BEFORE the
  // margin check: format words ("fair", "workshop", "community") are common
  // enough to tie with the craft itself, and a tie would otherwise be
  // downgraded to Community even though the title was explicit.
  if (craftsInTitle.length > 0) {
    const craft = craftsInTitle[0];
    return {
      category: craft,
      rationale:
        `${craft} is named in the title, so it settles the category over the event's ` +
        `format (next closest ${topCategory}, score ${topScore}). ` +
        `Matched on ${(evidence[craft] ?? []).join(', ')}.`,
      scores,
    };
  }

  // (3) Margin: a near-tie is not a confident single-craft call.
  if (ranked.length > 1 && topScore - runnerUp < TITLE_WEIGHT) {
    const tied = ranked.filter(([, s]) => topScore - s < TITLE_WEIGHT).map(([c]) => c);
    return {
      category: 'Community',
      rationale:
        `No clear winner - ${tied.join(' and ')} scored within one title mention of each other ` +
        `(${tied.map(c => `${c}: ${scores[c]}`).join(', ')}). Filed as Community for a reviewer to settle.`,
      scores,
    };
  }

  return {
    category: topCategory,
    rationale:
      `Matched ${topCategory} on ${(evidence[topCategory] ?? []).join(', ')} ` +
      `(score ${topScore}${runnerUp > 0 ? `, next closest ${ranked[1][0]} at ${runnerUp}` : ''}).`,
    scores,
  };
};

export const categoriseCandidate = (c: NormalisedCandidate): CategoryDecision =>
  categorise({ title: c.title, description: c.description });
