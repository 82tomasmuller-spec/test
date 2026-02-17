export type UserRole = 'admin' | 'editor' | 'author' | 'viewer';

export type ArticleStatus =
  | 'idea'
  | 'draft'
  | 'in_progress'
  | 'ready'
  | 'scheduled'
  | 'published'
  | 'archived';

export type ContentPlanStatus =
  | 'idea'
  | 'planned'
  | 'in_progress'
  | 'ready'
  | 'published';

export type WritingStyle =
  | 'formal'
  | 'blog'
  | 'review'
  | 'expert'
  | 'casual';

export interface AIGenerationInput {
  topic: string;
  keyword: string;
  affiliateLinks?: string[];
  writingStyle: WritingStyle;
  articleLength: 'short' | 'medium' | 'long';
  language: string;
  targetAudience: string;
  customNotes?: string;
}

export interface AIGenerationOutput {
  title: string;
  metaTitle: string;
  metaDescription: string;
  content: string;
  excerpt: string;
  tags: string[];
  category: string;
  faqItems: { question: string; answer: string }[];
  internalLinkSuggestions: string[];
  imageAltTexts: string[];
  ctaText: string;
}

export interface SEOAnalysis {
  score: number;
  issues: SEOIssue[];
  suggestions: string[];
}

export interface SEOIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  field?: string;
}

export interface ArticleFilters {
  status?: ArticleStatus;
  categoryId?: string;
  authorId?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: ['*'],
  editor: [
    'articles:read', 'articles:write', 'articles:publish',
    'categories:read', 'categories:write',
    'tags:read', 'tags:write',
    'media:read', 'media:write',
    'affiliates:read', 'affiliates:write',
    'seo:read', 'seo:write',
    'planner:read', 'planner:write',
    'stats:read',
  ],
  author: [
    'articles:read', 'articles:write',
    'categories:read',
    'tags:read',
    'media:read', 'media:write',
    'planner:read',
    'stats:read',
  ],
  viewer: [
    'articles:read',
    'categories:read',
    'tags:read',
    'stats:read',
  ],
};

export const STATUS_LABELS: Record<ArticleStatus, string> = {
  idea: 'Nápad',
  draft: 'Rozpracováno',
  in_progress: 'V přípravě',
  ready: 'Připraveno',
  scheduled: 'Naplánováno',
  published: 'Publikováno',
  archived: 'Archivováno',
};

export const STATUS_COLORS: Record<ArticleStatus, string> = {
  idea: 'bg-gray-100 text-gray-700',
  draft: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  ready: 'bg-green-100 text-green-700',
  scheduled: 'bg-purple-100 text-purple-700',
  published: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-red-100 text-red-700',
};
