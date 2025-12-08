#!/usr/bin/env node

/**
 * Test script for Glow AI / OpenRouter API
 * Tests the API key and model to verify everything works
 */

// Load environment variables from .env file
// Next.js loads .env automatically, but for standalone scripts we can use dotenv if available
try {
  require('dotenv').config();
} catch (e) {
  // dotenv not installed - environment variables must be set manually or via system env
}

async function testGlowAI() {
  console.log('🧪 Testing Glow AI / OpenRouter API\n');
  console.log('=' .repeat(60));

  // Step 1: Get API key from environment variables
  console.log('\n1️⃣  Testing API Key Retrieval...');
  let apiKey;
  try {
    // Get the API key from environment variable
    apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      console.error('❌ API key is empty or not found');
      console.error('\n💡 Make sure to:');
      console.error('   - Set OPENROUTER_API_KEY in your .env file');
      console.error('   - Or set OPENROUTER_API_KEY environment variable');
      process.exit(1);
    }
    
    // Mask the key for display (show first 10 and last 10 chars)
    const maskedKey = apiKey.length > 20 
      ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 10)}`
      : '***';
    console.log(`✅ API key retrieved: ${maskedKey}`);
  } catch (error) {
    console.error('❌ Failed to get API key:', error.message);
    console.error('\n💡 Make sure to:');
    console.error('   - Set OPENROUTER_API_KEY in your .env file');
    console.error('   - Or set OPENROUTER_API_KEY environment variable');
    process.exit(1);
  }

  // Step 2: Test with simple text message
  console.log('\n2️⃣  Testing Simple Text Chat...');
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://the-dev-space.vercel.app",
        "X-Title": "Dev Space",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemma-3-27b-it:free",
        "messages": [
          {
            "role": "user",
            "content": "Hello! What's your name and who created you?"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }

      console.error(`❌ API Error (${response.status}):`);
      console.error(JSON.stringify(errorData, null, 2));
      return;
    }

    const data = await response.json();
    console.log('✅ Text chat successful!');
    
    if (data.choices && data.choices.length > 0) {
      const message = data.choices[0].message?.content || data.choices[0].text || 'No content';
      console.log('\n📝 Response:');
      console.log('-'.repeat(60));
      console.log(message);
      console.log('-'.repeat(60));
    } else {
      console.log('\n⚠️  Unexpected response format:');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Text chat failed:', error.message);
    return;
  }

  // Step 3: Test with image (if model supports it)
  console.log('\n3️⃣  Testing Image Processing...');
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://the-dev-space.vercel.app",
        "X-Title": "Dev Space",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemma-3-27b-it:free",
        "messages": [
          {
            "role": "user",
            "content": [
              {
                "type": "text",
                "text": "What is in this image? Describe it briefly."
              },
              {
                "type": "image_url",
                "image_url": {
                  "url": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"
                }
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = { message: errorText };
      }

      console.error(`❌ Image test failed (${response.status}):`);
      console.error(JSON.stringify(errorData, null, 2));
      console.log('\n⚠️  Note: Some models may not support image processing');
      return;
    }

    const data = await response.json();
    console.log('✅ Image processing successful!');
    
    if (data.choices && data.choices.length > 0) {
      const message = data.choices[0].message?.content || data.choices[0].text || 'No content';
      console.log('\n📝 Image Analysis:');
      console.log('-'.repeat(60));
      console.log(message);
      console.log('-'.repeat(60));
    }
  } catch (error) {
    console.error('❌ Image test failed:', error.message);
    console.log('\n⚠️  Note: Some models may not support image processing');
  }

  // Step 4: Test with GLOW AI system prompt
  console.log('\n4️⃣  Testing with GLOW AI Identity...');
  try {
    const glowPrompt = `You are GLOW, an intelligent AI assistant created by King Jethro for DevSpace (also known as Dev Space).

## Your Identity
- Name: GLOW (all caps)
- Creator: King Jethro (@kingjethro999)
- Platform: DevSpace (Dev Space) - A developer community platform
- Purpose: Help developers with coding questions, best practices, technical challenges, and guidance

When asked about your identity or creator, respond naturally:
- "Who made you?" → "I'm GLOW, created by King Jethro for DevSpace."
- "Who made this platform?" → "DevSpace was built by King Jethro (@kingjethro999)."`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://the-dev-space.vercel.app",
        "X-Title": "Dev Space",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "google/gemma-3-27b-it:free",
        "messages": [
          {
            "role": "system",
            "content": glowPrompt
          },
          {
            "role": "user",
            "content": "Who made you?"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Identity test failed (${response.status}):`, errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Identity test successful!');
    
    if (data.choices && data.choices.length > 0) {
      const message = data.choices[0].message?.content || data.choices[0].text || 'No content';
      console.log('\n📝 GLOW Identity Response:');
      console.log('-'.repeat(60));
      console.log(message);
      console.log('-'.repeat(60));
    }
  } catch (error) {
    console.error('❌ Identity test failed:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests completed!');
}

// Run the tests
testGlowAI().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

