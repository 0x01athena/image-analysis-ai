import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

export interface OpenAIProductAnalysis {
    title: string;
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

            const prompt = `Analyze these product images and provide detailed information in JSON format. 
            
            Please analyze the product and return a JSON object with the following structure:
            {
                "title": "Detailed product title in Japanese (商品タイトル)",
                "category": "Product category in Japanese (カテゴリ)",
                "level": "A" or "B" or "C" (A=high quality/long title, B=medium quality/short title, C=low quality/needs improvement),
                "measurement": "Product measurements if visible (寸法)",
                "condition": "Product condition assessment (状態)",
                "shop1": "Primary shop recommendation (店舗1)",
                "shop2": "Secondary shop recommendation (店舗2)",
                "shop3": "Tertiary shop recommendation (店舗3)"
            }

            Guidelines:
            - Title should be descriptive and appealing for e-commerce
            - Category should be specific (e.g., "電子機器", "家具", "衣類", etc.)
            - Level A: High-quality products with detailed titles
            - Level B: Medium-quality products with shorter titles
            - Level C: Products that need improvement or have issues
            - Measurements should include dimensions if visible
            - Condition should assess wear, damage, or quality
            - Shop recommendations should be relevant Japanese e-commerce platforms

            Return only valid JSON, no additional text.`;

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
            if (!analysis.title || !analysis.category || !analysis.level) {
                throw new Error('Invalid response format from OpenAI');
            }

            return analysis;

        } catch (error) {
            console.error(`Error analyzing product ${productId}:`, error);

            // Return default values if OpenAI fails
            return {
                title: `商品 ${productId}`,
                category: '未分類',
                level: 'C',
                measurement: '測定不可',
                condition: '状態不明',
                shop1: '推奨店舗1',
                shop2: '推奨店舗2',
                shop3: '推奨店舗3'
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
