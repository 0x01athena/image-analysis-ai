import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

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
            apiKey: process.env.OPENAI_API_KEY || '',
            timeout: 120000
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
Analyze these product images and provide detailed information in JSON format, and it must be in Japanese, not foreign language.

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

    - If the detected brand name is written in a foreign language (English, French, Italian, etc.),
    **convert for brand name in foreign language into Katakana** form that matches how it is used in Japan.
    
    - Example:
        - "Chanel" → "シャネル"
        - "Nike" → "ナイキ"
        - "Prada" → "プラダ"
        - "Louis Vuitton" → "ルイ・ヴィトン"
    - Use the Katakana form consistently in all output titles.

    - Color:
        - Always append "系" after the detected color name.
        - Example: ブラック → ブラック系, ブルー → ブルー系, ベージュ → ベージュ系.
        - If the detected color name already ends with "系", do not duplicate it (e.g., "ブラック系系" → "ブラック系").

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

Case A: If the brand and model number are accurately identified and a web search is conducted to retrieve the relevant information, ensuring the accuracy of the information.
Case B: If the information cannot be accurately searched and is extracted solely from photos.
Case C: If the information cannot be confirmed at all.

4. Measurement
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
                model: "gpt-4.1",
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
                max_tokens: 2000,
                temperature: 0.3,
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
                model: "gpt-4.1",
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
