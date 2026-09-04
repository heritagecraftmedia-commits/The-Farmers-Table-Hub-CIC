import { NormalisedCandidate, CategoryDecision, ScoreDecision } from './types';

/**
 * Relevance scoring, 0-100.
 *
 * "Relevant" here means: would a Farmers Table visitor - someone interested
 * in local craft, heritage skills, and local food - want to see this on the
 * What's On board?
 *
 * The score is deliberately explainable rather than clever. Each component
 * adds or subtracts a stated number of points and appends a line to the
 * rationale, so a reviewer can see exactly why something scored 41 and
 * disagree with a specific step.
 *
 * The score does NOT decide publication. It orders the review queue and
 * filters obvious noise. A human still approves every event.
 */

export const RELEVANCE_THRESHOLD = 35;

/** Subject matter that is squarely off-topic for this board. */
const OFF_TOPIC = [
  'webinar', 'crypto', 'nightclub', 'stag do', 'hen do', 'casino',
  'football match', 'premier league', 'timeshare', 'trading seminar',
  'multi-level marketing', 'weight loss', 'vape', 'e-cigarette',
];

/** Signals that this is a real, local, in-person craft or produce event. */
const ON_TOPIC = [
  'handmade', 'artisan', 'craft', 'maker', 'local', 'traditional',
  'heritage', 'farm', 'smallholding', 'producer', 'workshop',
  'demonstration', 'rural', 'village', 'community',
];

export interface ScoreInput {
  candidate: NormalisedCandidate;
  category: CategoryDecision;
  now?: Date;
}

export const scoreCandidate = ({ candidate, category, now = new Date() }: ScoreInput): ScoreDecision => {
  const reasons: string[] = [];
  let score = 40; // Neutral starting point for something that normalised cleanly.
  reasons.push('Base 40 for a candidate with a valid title, date and source.');

  const haystack = `${candidate.title} ${candidate.description}`.toLowerCase();

  // Category confidence.
  if (category.category === 'Other') {
    score -= 15;
    reasons.push('-15: could not be categorised from the event text.');
  } else if (category.category === 'Community') {
    score += 5;
    reasons.push('+5: identified as a community event.');
  } else {
    score += 15;
    reasons.push(`+15: clearly a ${category.category} event.`);
  }

  // On-topic vocabulary, capped so a keyword-stuffed listing cannot run away.
  const onTopic = ON_TOPIC.filter(t => haystack.includes(t));
  if (onTopic.length > 0) {
    const bonus = Math.min(onTopic.length * 4, 20);
    score += bonus;
    reasons.push(`+${bonus}: on-topic vocabulary (${onTopic.slice(0, 5).join(', ')}).`);
  }

  // Off-topic subject matter is decisive.
  const offTopic = OFF_TOPIC.filter(t => haystack.includes(t));
  if (offTopic.length > 0) {
    score -= 40;
    reasons.push(`-40: off-topic subject matter (${offTopic.join(', ')}).`);
  }

  // Evidence quality - what the reviewer will have to work with.
  if (candidate.websiteUrl) {
    score += 8;
    reasons.push('+8: has its own event page to link to.');
  } else {
    reasons.push('0: no dedicated event page, only the listing it came from.');
  }

  if (candidate.venue) {
    score += 5;
    reasons.push('+5: names a venue.');
  } else {
    score -= 5;
    reasons.push('-5: no venue given.');
  }

  if (candidate.location) {
    score += 5;
    reasons.push('+5: names a location.');
  } else {
    score -= 5;
    reasons.push('-5: no location given.');
  }

  const words = candidate.description.trim() === '' ? 0 : candidate.description.trim().split(/\s+/).length;
  if (words >= 25) {
    score += 8;
    reasons.push(`+8: substantive description (${words} words).`);
  } else if (words < 5) {
    score -= 8;
    reasons.push(`-8: little or no description (${words} words).`);
  }

  // Distant events are real but less useful on a weekly board.
  const days = (new Date(candidate.startDate).getTime() - now.getTime()) / 86_400_000;
  if (days > 365) {
    score -= 10;
    reasons.push(`-10: more than a year away (${Math.round(days)} days).`);
  }

  const final = Math.max(0, Math.min(100, Math.round(score)));
  return {
    score: final,
    rationale: `${reasons.join(' ')} Final score ${final}/100 (threshold ${RELEVANCE_THRESHOLD}).`,
  };
};
