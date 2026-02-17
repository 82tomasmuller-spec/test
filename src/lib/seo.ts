import type { SEOAnalysis, SEOIssue } from '@/types';
import { stripHtml } from './utils';

interface SEOInput {
  title: string;
  metaTitle?: string;
  metaDescription?: string;
  content: string;
  keyword?: string;
  slug: string;
  hasImages?: boolean;
}

export function analyzeSEO(input: SEOInput): SEOAnalysis {
  const issues: SEOIssue[] = [];
  const suggestions: string[] = [];
  let score = 100;

  const plainText = stripHtml(input.content);
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const title = input.metaTitle || input.title;
  const description = input.metaDescription || '';

  // Title checks
  if (!title) {
    issues.push({ type: 'error', message: 'Chybí titulek článku', field: 'title' });
    score -= 15;
  } else {
    if (title.length > 60) {
      issues.push({
        type: 'warning',
        message: `Meta title je příliš dlouhý (${title.length}/60 znaků)`,
        field: 'metaTitle',
      });
      score -= 5;
    }
    if (title.length < 30) {
      issues.push({
        type: 'warning',
        message: `Meta title je příliš krátký (${title.length}/60 znaků)`,
        field: 'metaTitle',
      });
      score -= 3;
    }
  }

  // Meta description checks
  if (!description) {
    issues.push({ type: 'error', message: 'Chybí meta description', field: 'metaDescription' });
    score -= 10;
  } else {
    if (description.length > 155) {
      issues.push({
        type: 'warning',
        message: `Meta description je příliš dlouhý (${description.length}/155 znaků)`,
        field: 'metaDescription',
      });
      score -= 5;
    }
    if (description.length < 70) {
      issues.push({
        type: 'warning',
        message: `Meta description je příliš krátký (${description.length}/155 znaků)`,
        field: 'metaDescription',
      });
      score -= 3;
    }
  }

  // Content length checks
  if (wordCount < 300) {
    issues.push({
      type: 'error',
      message: `Obsah je příliš krátký (${wordCount} slov, doporučeno min. 300)`,
      field: 'content',
    });
    score -= 15;
  } else if (wordCount < 800) {
    issues.push({
      type: 'warning',
      message: `Obsah by mohl být delší (${wordCount} slov, doporučeno 800+)`,
      field: 'content',
    });
    score -= 5;
  }

  // Heading structure
  const h2Count = (input.content.match(/<h2/gi) || []).length;
  const h3Count = (input.content.match(/<h3/gi) || []).length;

  if (h2Count === 0) {
    issues.push({
      type: 'warning',
      message: 'Článek neobsahuje žádné H2 nadpisy',
      field: 'content',
    });
    score -= 8;
    suggestions.push('Přidejte H2 nadpisy pro lepší strukturu článku');
  }

  if (h2Count > 0 && h3Count === 0 && wordCount > 1000) {
    suggestions.push('Zvažte přidání H3 podnadpisů pro lepší členění dlouhého textu');
    score -= 3;
  }

  // Keyword analysis
  if (input.keyword) {
    const kw = input.keyword.toLowerCase();
    const titleLower = title.toLowerCase();
    const contentLower = plainText.toLowerCase();
    const kwCount = contentLower.split(kw).length - 1;
    const density = wordCount > 0 ? (kwCount / wordCount) * 100 : 0;

    if (!titleLower.includes(kw)) {
      issues.push({
        type: 'warning',
        message: 'Klíčové slovo není v titulku',
        field: 'title',
      });
      score -= 8;
    }

    if (!description.toLowerCase().includes(kw)) {
      issues.push({
        type: 'info',
        message: 'Klíčové slovo není v meta description',
        field: 'metaDescription',
      });
      score -= 3;
    }

    if (kwCount === 0) {
      issues.push({
        type: 'error',
        message: 'Klíčové slovo se nevyskytuje v obsahu',
        field: 'content',
      });
      score -= 15;
    } else if (density > 3) {
      issues.push({
        type: 'warning',
        message: `Příliš vysoká hustota klíčového slova (${density.toFixed(1)}%), doporučeno 1-2%`,
        field: 'content',
      });
      score -= 5;
    } else if (density < 0.5) {
      issues.push({
        type: 'info',
        message: `Nízká hustota klíčového slova (${density.toFixed(1)}%), doporučeno 1-2%`,
        field: 'content',
      });
      score -= 3;
    }

    if (!input.slug.includes(kw.replace(/\s+/g, '-'))) {
      suggestions.push('Zvažte zahrnutí klíčového slova do URL slug');
    }
  }

  // Image checks
  const imgCount = (input.content.match(/<img/gi) || []).length;
  const imgWithAlt = (input.content.match(/<img[^>]+alt="[^"]+"/gi) || []).length;

  if (imgCount === 0 && wordCount > 500) {
    suggestions.push('Přidejte obrázky pro vizuální zpestření článku');
    score -= 3;
  }

  if (imgCount > 0 && imgWithAlt < imgCount) {
    issues.push({
      type: 'warning',
      message: `${imgCount - imgWithAlt} obrázek(ů) nemá ALT text`,
      field: 'content',
    });
    score -= 5;
  }

  // Internal/external link checks
  const linkCount = (input.content.match(/<a\s/gi) || []).length;
  if (linkCount === 0 && wordCount > 500) {
    suggestions.push('Přidejte interní i externí odkazy pro lepší SEO');
    score -= 3;
  }

  // Paragraph length check
  const paragraphs = input.content.split(/<\/p>/i).filter((p) => {
    const text = stripHtml(p).trim();
    return text.length > 0;
  });

  const longParagraphs = paragraphs.filter((p) => {
    const words = stripHtml(p).split(/\s+/).filter(Boolean).length;
    return words > 100;
  });

  if (longParagraphs.length > 0) {
    suggestions.push(
      `${longParagraphs.length} odstavec(ů) je příliš dlouhý. Rozdělte je na kratší úseky.`
    );
    score -= 2;
  }

  // Ensure score is between 0 and 100
  score = Math.max(0, Math.min(100, score));

  return { score, issues, suggestions };
}
