import type { AIGenerationInput, AIGenerationOutput } from '@/types';

function buildPrompt(input: AIGenerationInput): string {
  const lengthGuide = {
    short: '800-1200 slov',
    medium: '1500-2500 slov',
    long: '3000-5000 slov',
  };

  const styleGuide = {
    formal: 'formální, profesionální tón',
    blog: 'přátelský blogový styl',
    review: 'detailní recenzní styl s hodnocením',
    expert: 'expertní, hloubkový analytický styl',
    casual: 'neformální, konverzační tón',
  };

  return `Vytvoř kompletní blogový článek podle následujících pokynů:

TÉMA: ${input.topic}
KLÍČOVÉ SLOVO: ${input.keyword}
STYL PSANÍ: ${styleGuide[input.writingStyle]}
DÉLKA: ${lengthGuide[input.articleLength]}
JAZYK: ${input.language === 'cs' ? 'čeština' : input.language}
CÍLOVÁ SKUPINA: ${input.targetAudience}
${input.customNotes ? `POZNÁMKY: ${input.customNotes}` : ''}
${input.affiliateLinks?.length ? `AFFILIATE ODKAZY K ZAHRNUTÍ: ${input.affiliateLinks.join(', ')}` : ''}

Odpověz ve formátu JSON s následující strukturou:
{
  "title": "Titulek článku (SEO optimalizovaný, max 60 znaků)",
  "metaTitle": "Meta title pro SEO (max 60 znaků)",
  "metaDescription": "Meta popis pro SEO (max 155 znaků)",
  "content": "Plný HTML obsah článku s H2, H3 nadpisy, odstavci, seznamy. Zahrň CTA sekce a affiliate odkazy přirozeně v textu.",
  "excerpt": "Krátký úryvek článku (max 200 znaků)",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "doporučená kategorie",
  "faqItems": [
    {"question": "Otázka 1?", "answer": "Odpověď 1"},
    {"question": "Otázka 2?", "answer": "Odpověď 2"}
  ],
  "internalLinkSuggestions": ["téma pro interní odkaz 1", "téma 2"],
  "imageAltTexts": ["popis obrázku 1", "popis obrázku 2"],
  "ctaText": "Text pro výzvu k akci"
}

Dodržuj SEO best practices:
- Klíčové slovo v titulku, prvním odstavci a průběžně v textu
- Keyword density 1-2%
- Používej H2 a H3 strukturu
- Krátké odstavce (max 3-4 věty)
- Přirozené zahrnutí affiliate odkazů
- FAQ sekce pro schema.org markup

Odpověz POUZE validním JSON objektem, bez dalšího textu.`;
}

export async function generateArticleWithOpenAI(input: AIGenerationInput): Promise<AIGenerationOutput> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Jsi profesionální copywriter a SEO specialista. Vždy odpovídáš validním JSON.',
        },
        { role: 'user', content: buildPrompt(input) },
      ],
      temperature: 0.7,
      max_tokens: 8000,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;
  if (!content) throw new Error('No content returned from AI');

  return JSON.parse(content) as AIGenerationOutput;
}

export async function generateArticleWithAnthropic(input: AIGenerationInput): Promise<AIGenerationOutput> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [
        { role: 'user', content: buildPrompt(input) },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const textBlock = data.content?.find((b: { type: string }) => b.type === 'text');
  if (!textBlock) throw new Error('No content returned from AI');

  // Extract JSON from the response (may be wrapped in markdown code blocks)
  let jsonStr = textBlock.text;
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonStr = jsonMatch[1];

  return JSON.parse(jsonStr.trim()) as AIGenerationOutput;
}

export async function generateArticle(input: AIGenerationInput): Promise<AIGenerationOutput> {
  const provider = process.env.AI_PROVIDER || 'openai';

  if (provider === 'anthropic') {
    return generateArticleWithAnthropic(input);
  }
  return generateArticleWithOpenAI(input);
}
