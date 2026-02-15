/**
 * AWS Comprehend Service
 * Server-side only - do NOT import this from client-side code
 * 
 * This service provides email analysis capabilities using AWS Comprehend:
 * - Entity detection (people, places, organizations)
 * - Key phrase extraction
 * - Sentiment analysis
 * - Fingerprint hash generation for deduplication
 */

import {
  ComprehendClient,
  DetectEntitiesCommand,
  DetectKeyPhrasesCommand,
  DetectSentimentCommand,
  type Entity,
  type KeyPhrase,
} from '@aws-sdk/client-comprehend';
import { createHash } from 'crypto';

// Initialize Comprehend client
// Credentials are automatically loaded from EC2 instance role
const comprehendClient = new ComprehendClient({
  region: process.env.AWS_REGION || 'us-east-1',
});

export interface EmailAnalysisInput {
  subject: string;
  body: string;
  from: string;
  to?: string[];
  date?: Date;
}

export interface AnalyzedEntity {
  text: string;
  type: string;
  score: number;
}

export interface AnalyzedKeyPhrase {
  text: string;
  score: number;
}

export interface SentimentResult {
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED';
  scores: {
    positive: number;
    negative: number;
    neutral: number;
    mixed: number;
  };
}

export interface EmailAnalysisResult {
  entities: AnalyzedEntity[];
  keyPhrases: AnalyzedKeyPhrase[];
  sentiment: SentimentResult;
  topicScore: number;
  fingerprintHash: string;
  categories: string[];
  suggestedPriority: 'low' | 'medium' | 'high' | 'urgent';
}

/**
 * Truncate text to Comprehend's maximum length (5000 bytes in UTF-8)
 */
function truncateText(text: string, maxBytes: number = 4900): string {
  const encoder = new TextEncoder();
  const encoded = encoder.encode(text);
  
  if (encoded.length <= maxBytes) {
    return text;
  }
  
  // Binary search for the right length
  let low = 0;
  let high = text.length;
  
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (encoder.encode(text.slice(0, mid)).length <= maxBytes) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  
  return text.slice(0, low);
}

/**
 * Detect entities in text using AWS Comprehend
 */
async function detectEntities(text: string): Promise<AnalyzedEntity[]> {
  const truncated = truncateText(text);
  
  if (!truncated.trim()) {
    return [];
  }
  
  const command = new DetectEntitiesCommand({
    Text: truncated,
    LanguageCode: 'en',
  });
  
  const response = await comprehendClient.send(command);
  
  return (response.Entities || [])
    .filter((entity): entity is Entity & { Text: string; Type: string; Score: number } => 
      !!entity.Text && !!entity.Type && entity.Score !== undefined
    )
    .map((entity) => ({
      text: entity.Text,
      type: entity.Type,
      score: entity.Score,
    }));
}

/**
 * Detect key phrases in text using AWS Comprehend
 */
async function detectKeyPhrases(text: string): Promise<AnalyzedKeyPhrase[]> {
  const truncated = truncateText(text);
  
  if (!truncated.trim()) {
    return [];
  }
  
  const command = new DetectKeyPhrasesCommand({
    Text: truncated,
    LanguageCode: 'en',
  });
  
  const response = await comprehendClient.send(command);
  
  return (response.KeyPhrases || [])
    .filter((phrase): phrase is KeyPhrase & { Text: string; Score: number } => 
      !!phrase.Text && phrase.Score !== undefined
    )
    .map((phrase) => ({
      text: phrase.Text,
      score: phrase.Score,
    }));
}

/**
 * Detect sentiment in text using AWS Comprehend
 */
async function detectSentiment(text: string): Promise<SentimentResult> {
  const truncated = truncateText(text);
  
  if (!truncated.trim()) {
    return {
      sentiment: 'NEUTRAL',
      scores: { positive: 0, negative: 0, neutral: 1, mixed: 0 },
    };
  }
  
  const command = new DetectSentimentCommand({
    Text: truncated,
    LanguageCode: 'en',
  });
  
  const response = await comprehendClient.send(command);
  
  return {
    sentiment: (response.Sentiment as SentimentResult['sentiment']) || 'NEUTRAL',
    scores: {
      positive: response.SentimentScore?.Positive || 0,
      negative: response.SentimentScore?.Negative || 0,
      neutral: response.SentimentScore?.Neutral || 0,
      mixed: response.SentimentScore?.Mixed || 0,
    },
  };
}

/**
 * Generate a deterministic fingerprint hash for deduplication
 * Uses key phrases and entities to create a content-based hash
 */
function generateFingerprintHash(
  keyPhrases: AnalyzedKeyPhrase[],
  entities: AnalyzedEntity[],
  subject: string
): string {
  // Sort and normalize key phrases (top 10 by score)
  const topPhrases = keyPhrases
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((p) => p.text.toLowerCase().trim())
    .sort();
  
  // Sort and normalize entities (filter to important types)
  const importantEntityTypes = ['PERSON', 'ORGANIZATION', 'EVENT', 'TITLE', 'COMMERCIAL_ITEM'];
  const topEntities = entities
    .filter((e) => importantEntityTypes.includes(e.type))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((e) => `${e.type}:${e.text.toLowerCase().trim()}`)
    .sort();
  
  // Normalize subject
  const normalizedSubject = subject
    .toLowerCase()
    .replace(/^(re:|fwd:|fw:)\s*/gi, '')
    .trim();
  
  // Create fingerprint content
  const fingerprintContent = JSON.stringify({
    subject: normalizedSubject,
    phrases: topPhrases,
    entities: topEntities,
  });
  
  // Generate SHA-256 hash
  return createHash('sha256').update(fingerprintContent).digest('hex');
}

/**
 * Categorize email based on entities and key phrases
 */
function categorizeEmail(
  entities: AnalyzedEntity[],
  keyPhrases: AnalyzedKeyPhrase[]
): string[] {
  const categories: Set<string> = new Set();
  
  // Category keywords mapping
  const categoryKeywords: Record<string, string[]> = {
    'bug': ['bug', 'error', 'issue', 'crash', 'broken', 'fix', 'defect', 'problem'],
    'feature': ['feature', 'enhancement', 'request', 'add', 'new', 'implement'],
    'support': ['help', 'support', 'question', 'how to', 'assistance', 'guide'],
    'urgent': ['urgent', 'asap', 'critical', 'emergency', 'immediately', 'priority'],
    'billing': ['invoice', 'payment', 'billing', 'charge', 'refund', 'subscription'],
    'feedback': ['feedback', 'suggestion', 'review', 'opinion', 'thoughts'],
    'meeting': ['meeting', 'call', 'schedule', 'appointment', 'discuss'],
  };
  
  const allText = [
    ...keyPhrases.map((p) => p.text.toLowerCase()),
    ...entities.map((e) => e.text.toLowerCase()),
  ].join(' ');
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((keyword) => allText.includes(keyword))) {
      categories.add(category);
    }
  }
  
  return Array.from(categories);
}

/**
 * Determine suggested priority based on analysis
 */
function determinePriority(
  sentiment: SentimentResult,
  categories: string[],
  keyPhrases: AnalyzedKeyPhrase[]
): 'low' | 'medium' | 'high' | 'urgent' {
  // Urgent keywords check
  if (categories.includes('urgent')) {
    return 'urgent';
  }
  
  // Negative sentiment + bug = high priority
  if (sentiment.sentiment === 'NEGATIVE' && categories.includes('bug')) {
    return 'high';
  }
  
  // Bug reports are generally medium-high
  if (categories.includes('bug')) {
    return 'medium';
  }
  
  // Negative sentiment alone
  if (sentiment.sentiment === 'NEGATIVE' && sentiment.scores.negative > 0.7) {
    return 'high';
  }
  
  // Feature requests are usually medium
  if (categories.includes('feature')) {
    return 'medium';
  }
  
  // Default based on key phrase count (more = more complex = higher priority)
  if (keyPhrases.length > 10) {
    return 'medium';
  }
  
  return 'low';
}

/**
 * Calculate topic relevance score
 */
function calculateTopicScore(
  keyPhrases: AnalyzedKeyPhrase[],
  entities: AnalyzedEntity[]
): number {
  if (keyPhrases.length === 0 && entities.length === 0) {
    return 0;
  }
  
  const phraseScoreSum = keyPhrases.reduce((sum, p) => sum + p.score, 0);
  const entityScoreSum = entities.reduce((sum, e) => sum + e.score, 0);
  
  const totalItems = keyPhrases.length + entities.length;
  const avgScore = (phraseScoreSum + entityScoreSum) / totalItems;
  
  // Factor in the quantity of meaningful content
  const quantityBonus = Math.min(totalItems / 20, 0.2);
  
  return Math.min(avgScore + quantityBonus, 1);
}

/**
 * Main function to analyze an email using AWS Comprehend
 */
export async function analyzeEmail(input: EmailAnalysisInput): Promise<EmailAnalysisResult> {
  const fullText = `${input.subject}\n\n${input.body}`;
  
  // Run Comprehend operations in parallel for efficiency
  const [entities, keyPhrases, sentiment] = await Promise.all([
    detectEntities(fullText),
    detectKeyPhrases(fullText),
    detectSentiment(fullText),
  ]);
  
  // Derive additional insights
  const categories = categorizeEmail(entities, keyPhrases);
  const suggestedPriority = determinePriority(sentiment, categories, keyPhrases);
  const topicScore = calculateTopicScore(keyPhrases, entities);
  const fingerprintHash = generateFingerprintHash(keyPhrases, entities, input.subject);
  
  return {
    entities,
    keyPhrases,
    sentiment,
    topicScore,
    fingerprintHash,
    categories,
    suggestedPriority,
  };
}

/**
 * Check if two emails are likely duplicates based on their fingerprint hashes
 * Returns a similarity score from 0 to 1
 */
export function checkDuplicateSimilarity(hash1: string, hash2: string): number {
  if (hash1 === hash2) {
    return 1;
  }
  
  // For now, hash comparison is binary
  // Future: implement fuzzy matching using the underlying content
  return 0;
}

/**
 * Batch analyze multiple emails
 */
export async function analyzeEmailBatch(inputs: EmailAnalysisInput[]): Promise<EmailAnalysisResult[]> {
  // Process in batches of 5 to avoid rate limiting
  const batchSize = 5;
  const results: EmailAnalysisResult[] = [];
  
  for (let i = 0; i < inputs.length; i += batchSize) {
    const batch = inputs.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(analyzeEmail));
    results.push(...batchResults);
    
    // Small delay between batches to avoid rate limiting
    if (i + batchSize < inputs.length) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  
  return results;
}
