import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
const envPath = path.join(__dirname, '../../.env');
const envLoaded = dotenv.config({ path: envPath });

if (envLoaded.error) {
    console.warn('⚠️  OpenAIService: Could not load .env file:', envLoaded.error.message);
}

export interface OpenAIProductAnalysis {
    title: string[];
    category: string;
    level: 'A' | 'B' | 'C';
    measurement?: string;
    condition?: string;
    shop1?: string;
    shop2?: string;
    shop3?: string;
}

export class OpenAIService {
    private client: OpenAI;

    constructor() {
        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || ''
        });
    }

    /**
     * Analyze product images using OpenAI Vision API
     */
    async analyzeProductImages(productId: string, imageFilenames: string[]): Promise<OpenAIProductAnalysis> {
        try {
            // Read and encode images
            const imageContents = await Promise.all(
                imageFilenames.map(async (filename) => {
                    const imagePath = path.join(__dirname, '../../public/images', filename);
                    const imageBuffer = fs.readFileSync(imagePath);
                    return {
                        type: "image_url" as const,
                        image_url: {
                            url: `data:image/jpeg;base64,${imageBuffer.toString('base64')}`,
                            detail: "high" as const
                        }
                    };
                })
            );

            const prompt = `
You are an expert in Japanese e-commerce cataloging and product title generation for online stores like Rakuten, Yahoo! Shopping, and Mercari.
Analyze these product images and provide detailed information in JSON format, and it must be in Japanese.

1. Title
    Your goal is to accurately generate the official or commonly used product name (正式名称)
    based on the brand tag, model number, and product image.

    You must use:
    - Visual analysis to detect and read brand, model number, and category.
    - Web search (brand + model number) to verify or refine the product name.
    - Visual matching to confirm that search results align with the image (color, material, type).
    - Generate at least 5 possible product titles in Japanese, ranked by confidence.

    Each title must:
    - Follow standard e-commerce naming conventions used in Japan (Rakuten, ZOZOTOWN, etc.).
    - Be natural and factual — no extra adjectives or speculation.
    - Include the brand, product/series name, model number, material/color/size if visible, and category.
    - Be between 40–80 Japanese characters for balance.
    - Avoid “写真の通り” or uncertain terms like “っぽい”.

    If the web search shows different versions, reflect those variations across the 5 outputs.

    Example: [
        "アルマーニ　ダブルライダース ジャケット　L　メンズ",
        "アルマーニ　アルマーニ　ネイティブダブルライダースジャケット　L　メンズ",
        "アルマーニ　アルマーニ　ヴィンテージ風ダブルライダースジャケット　L　メンズ",
        "アルマーニ　アルマーニ　ワイドダブルライダースジャケット　L　メンズ",
        "アルマーニ　アルマーニ　ステッチダブルライダースジャケット　L　メンズ",
        "アルマーニ　アルマーニ　レザージャケットジャケット　L　メンズ"
    ]

2. Category: '123'
3. Level:
Evaluate the generation result and assign a 生成ランク (A/B/C) score.

---

【生成ランクの定義】

A = 完全成功
- Brand, model number, and item type are all correctly recognized.
- The generated titles are natural and consistent with real Japanese e-commerce listings.
- No major uncertainty; at least one title matches the official naming perfectly.

B = 要確認
- Brand recognition might be uncertain or possibly incorrect.
- Titles are too short, lack essential elements (brand, model number, category), or seem incomplete.
- Web search found some inconsistent or partial matches.

C = 失敗
- Could not generate meaningful titles (e.g., output is blank or only generic words like “バッグ”).
- Brand and model number are unreadable or missing.
- No matching results found from web search.

---

4. Measurement: '123'
5. Condition: '1'
6. Shop1: '123'
7. Shop2: '123'
8. Shop3: '123'

Please only analyze the product and return a valid JSON object with the following structure:
{
    "title": [],
    "level",
    "measurement",
    "category",
    "condition",
    "shop1",
    "shop2",
    "shop3"
}
**DO NOT CONTAIN \`\`\`json and \`\`\` in the response, just return a valid JSON data`;

            const response = await this.client.chat.completions.create({
                model: "gpt-4o",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: prompt
                            },
                            ...imageContents
                        ]
                    }
                ],
                max_tokens: 1000,
                temperature: 0.3
            });

            const content = response.choices[0]?.message?.content;
            if (!content) {
                throw new Error('No response from OpenAI');
            }

            // Parse JSON response
            const analysis = JSON.parse(content) as OpenAIProductAnalysis;

            // Validate required fields
            if (!analysis.title || !Array.isArray(analysis.title) || analysis.title.length === 0 || !analysis.category || !analysis.level) {
                throw new Error('Invalid response format from OpenAI');
            }

            return analysis;

        } catch (error) {
            console.error(`Error analyzing product ${productId}:`, error);

            // Return default values if OpenAI fails
            return {
                title: [''],
                category: '',
                level: 'C',
                measurement: '',
                condition: '',
                shop1: '',
                shop2: '',
                shop3: ''
            };
        }
    }

    /**
     * Test OpenAI connection
     */
    async testConnection(): Promise<boolean> {
        try {
            const response = await this.client.chat.completions.create({
                model: "gpt-4o",
                messages: [{ role: "user", content: "Hello" }],
                max_tokens: 10
            });
            return !!response.choices[0]?.message?.content;
        } catch (error) {
            console.error('OpenAI connection test failed:', error);
            return false;
        }
    }
}

export const openAIService = new OpenAIService();
