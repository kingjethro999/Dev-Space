import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

async function searchWeb(query: string): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.log("No Tavily API Key found");
    return "";
  }
  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: "basic",
        include_answer: true,
      }),
    });
    if (!response.ok) {
      console.error("Tavily response not ok", response.status);
      return "";
    }
    const data = await response.json();
    let context = "";
    if (data.answer) {
      context += `Tavily Quick Answer: ${data.answer}\n\n`;
    }
    if (data.results && data.results.length > 0) {
      context += `Web Search Results:\n`;
      data.results.forEach((res: any, idx: number) => {
        context += `${idx + 1}. [${res.title}](${res.url})\n   ${res.content}\n\n`;
      });
    }
    return context;
  } catch (error) {
    console.error("Tavily search failed:", error);
    return "";
  }
}

export async function POST(request: NextRequest) {
  try {
    const { messages, webSearch, model = "llama-3.3-70b-versatile" } = await request.json();

    // Support both env var names for backward compat
    const apiKey = process.env.GROQ_API_KEY || process.env.NEXT_GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Groq API Key (GROQ_API_KEY) is not set." },
        { status: 500 }
      );
    }

    // Instantiate the Groq SDK – handles keep-alive, retries, and timeouts
    const groq = new Groq({
      apiKey,
      timeout: 30000, // 30s timeout
      maxRetries: 2,
    });

    let searchContext = "";
    if (webSearch && messages && messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find((m: any) => m.role === 'user');
      if (lastUserMessage) {
        const queryText = typeof lastUserMessage.content === 'string'
          ? lastUserMessage.content
          : lastUserMessage.content?.map((c: any) => c.text || '').join(' ') || '';
        console.log(`Searching the web for: "${queryText}"`);
        searchContext = await searchWeb(queryText);
      }
    }

    const finalMessages: Groq.Chat.ChatCompletionMessageParam[] = [...messages];
    if (searchContext) {
      finalMessages.push({
        role: "system",
        content: `Here is the real-time web search context retrieved for the user's query:\n\n${searchContext}\n\nIntegrate this information naturally, cite sources, and answer the user's question.`,
      });
    }

    // Detect vision model requirement
    const hasImage = messages && messages.some((m: any) =>
      Array.isArray(m.content) && m.content.some((c: any) => c.type === 'image_url')
    );
    const modelToUse = hasImage ? "llama-3.2-11b-vision-preview" : model;

    const groqStream = await groq.chat.completions.create({
      model: modelToUse,
      messages: finalMessages,
      stream: true,
    });

    // Convert the Groq async iterable stream to a ReadableStream for Next.js Response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of groqStream) {
            const data = `data: ${JSON.stringify(chunk)}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (e) {
          console.error("Stream error:", e);
          controller.error(e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in Groq API route:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
