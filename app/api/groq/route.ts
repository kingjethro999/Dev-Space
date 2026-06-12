import { NextRequest, NextResponse } from 'next/server';

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
    const apiKey = process.env.NEXT_GROQ_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Groq API Key (NEXT_GROQ_API_KEY) is not set." },
        { status: 500 }
      );
    }

    let searchContext = "";
    if (webSearch && messages && messages.length > 0) {
      const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
      if (lastUserMessage) {
        console.log(`Searching the web for: "${lastUserMessage.content}"`);
        searchContext = await searchWeb(lastUserMessage.content);
      }
    }

    const finalMessages = [...messages];
    if (searchContext) {
      // Append web search context as system prompt or system message at the end
      finalMessages.push({
        role: "system",
        content: `Here is the real-time web search context retrieved for the user's query:\n\n${searchContext}\n\nIntegrate this information naturally, cite sources, and answer the user's question.`
      });
    }

    let modelToUse = model;
    const hasImage = messages && messages.some((m: any) => 
      Array.isArray(m.content) && m.content.some((c: any) => c.type === 'image_url')
    );
    if (hasImage) {
      modelToUse = "llama-3.2-11b-vision-preview";
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: finalMessages,
        stream: true
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq API error:", errText);
      return NextResponse.json(
        { error: `Groq API error: ${errText}` },
        { status: response.status }
      );
    }

    // Stream the response using a ReadableStream
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            controller.enqueue(chunk);
          }
        } catch (e) {
          controller.error(e);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });
  } catch (error) {
    console.error("Error in Groq API route:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
