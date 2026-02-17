import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateArticle } from '@/lib/ai';
import type { AIGenerationInput } from '@/types';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: AIGenerationInput = await req.json();

    if (!body.topic?.trim()) {
      return NextResponse.json({ error: 'Téma je povinné' }, { status: 400 });
    }

    if (!body.keyword?.trim()) {
      return NextResponse.json({ error: 'Klíčové slovo je povinné' }, { status: 400 });
    }

    const result = await generateArticle({
      topic: body.topic,
      keyword: body.keyword,
      affiliateLinks: body.affiliateLinks || [],
      writingStyle: body.writingStyle || 'blog',
      articleLength: body.articleLength || 'medium',
      language: body.language || 'cs',
      targetAudience: body.targetAudience || 'obecná veřejnost',
      customNotes: body.customNotes,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('AI generation error:', error);
    return NextResponse.json(
      { error: error.message || 'AI generace selhala' },
      { status: 500 }
    );
  }
}
