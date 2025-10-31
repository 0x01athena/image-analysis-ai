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
    measurement_type?: { foreign: string; japanese: string };
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

            //             const prompt = `
            // You are an expert in Japanese e-commerce cataloging and product title generation for online stores like Rakuten, Yahoo! Shopping, and Mercari.
            // Analyze these product images and provide detailed information in JSON format, and it must be in Japanese, not foreign language.

            // 1. Level:
            // Evaluate the generation result and assign a 生成ランク (A/B/C) score.
            // A → The correct brand and model number are accurately identified **from the image itself**.
            // B → The image is unclear or lacks enough information to make a precise identification, **but some data is correctly extracted or partially identified from the image**.
            // C → The response is not generated from the image.

            // 2. Title
            //     Your goal is to accurately generate the official or commonly used product name (正式名称)
            //     based on the brand tag, model number, and product image.

            //     You must use:
            //     - Visual analysis to detect and read brand, model number, and category.
            //     - Web search (brand + model number) to verify or refine the product name.
            //     - Visual matching to confirm that search results align with the image (color, material, type).
            //     - Generate at least 5 possible product titles in Japanese, ranked by confidence.

            //     Each title must:
            //     - Follow standard e-commerce naming conventions used in Japan (Rakuten, ZOZOTOWN, etc.).
            //     - Be natural and factual — no extra adjectives or speculation.
            //     - Include the brand, product/series name, model number, material/color/size if visible, and category.
            //     - Be between 40–80 Japanese characters for balance.
            //     - Avoid “写真の通り” or uncertain terms like “っぽい”.

            //     If the web search shows different versions, reflect those variations across the 5 outputs.

            //     - If the detected brand name is written in a foreign language (English, French, Italian, etc.),
            //     **convert for brand name in foreign language into Katakana** form that matches how it is used in Japan.

            //     - Example:
            //         - "Chanel" → "シャネル"
            //         - "Nike" → "ナイキ"
            //         - "Prada" → "プラダ"
            //         - "Louis Vuitton" → "ルイ・ヴィトン"
            //     - Use the Katakana form consistently in all output titles.

            //     - Color:
            //         - Always append "系" after the detected color name.
            //         - Example: ブラック → ブラック系, ブルー → ブルー系, ベージュ → ベージュ系.
            //         - If the detected color name already ends with "系", do not duplicate it (e.g., "ブラック系系" → "ブラック系").

            //     Example: [
            //         "アルマーニ　ダブルライダース ジャケット　L　メンズ",
            //         "アルマーニ　アルマーニ　ネイティブダブルライダースジャケット　L　メンズ",
            //         "アルマーニ　アルマーニ　ヴィンテージ風ダブルライダースジャケット　L　メンズ",
            //         "アルマーニ　アルマーニ　ワイドダブルライダースジャケット　L　メンズ",
            //         "アルマーニ　アルマーニ　ステッチダブルライダースジャケット　L　メンズ",
            //         "アルマーニ　アルマーニ　レザージャケットジャケット　L　メンズ"
            //     ]

            // 3. Category: '123'
            // 4. Measurement: 
            // For example: "着丈:65 肩幅:45 身幅:50 袖丈:20"
            // If the measurement is not visible in the image, return empty string.
            // 5. Condition: '1'
            // 6. Shop1: '123'
            // 7. Shop2: '123'
            // 8. Shop3: '123'

            // Please only analyze the product and return a valid JSON object with the following structure:
            // {
            //     "title": [],
            //     "level",
            //     "measurement",
            //     "category",
            //     "condition",
            //     "shop1",
            //     "shop2",
            //     "shop3"
            // }
            // **DO NOT CONTAIN \`\`\`json and \`\`\` in the response, just return a valid JSON data
            // `;

            // ### 1. 生成ランク (level)
            // 画像認識結果の精度に基づいて、以下のルールでランクを判定してください。

            // A → 画像から **正確にブランド名と型番が特定できた** 場合。  
            // B → 画像の内容に基づかず、**外部情報や推測に依存している** 場合。

            // 出力は必ず "A" / "B" のいずれか1文字で。


            const prompt = `
あなたは日本のECサイト（楽天市場、Yahoo!ショッピング、メルカリなど）向けの商品カタログ作成と商品タイトル生成の専門家です。
以下の画像を分析し、製品情報を詳細に抽出してJSON形式で出力してください。出力は必ず日本語で行ってください。

---

### 1. 生成ランク (level)
画像認識結果および抽出情報の正確性に基づいて、以下のルールでランクを判定してください。

ランク判定ルール：
Aランク → 画像から ブランド名 と 型番（モデル名） が正確に特定でき、かつ サイズ情報が正常に抽出・日本サイズへ変換できた 場合。
Bランク → 以下のいずれかに該当する場合。
　・画像内容に基づかず、外部情報や推測に依存している場合。
　・ブランドタグが写っていない、またはブランド名が不明確な場合。
　・型番（モデル名）が検出できなかった場合。
　・靴カテゴリでモデル名が検出できない場合（靴は必ずモデル名が存在するため、欠落＝B判定）。
　・サイズ情報が抽出できない、または日本サイズに変換できない場合。
　・出力が「作成中」または空白の場合。

出力形式：
必ず "A" または "B" のいずれか1文字のみを出力してください。
---

### 2. サイズ形式変換 (measurement_type)
画像およびラベル（タグ）からサイズ情報を抽出し、該当する国のサイズ表記を日本サイズに変換してください。

**ルール：**
- サイズ表記が外国サイズ（イタリア、フランス、アメリカ、イギリス、EUなど）の場合は、対応する日本サイズに変換します。
- サイズ表記がすでに日本サイズ（S/M/L/LLなど）の場合は変換せずそのまま出力します。
- 結果は以下の形式のオブジェクト（measurement_type）で出力してください。

**出力フォーマット：**
    measurement_type: {
        "foreign": "IT 48",
        "japanese": "日本サイズM"
    }

**補足ルール：**
- 日本ブランドや日本サイズの場合は、「foreign」は空文字とし、「japanese」のみ出力します。
  例：
  measurement_type: {
    "foreign": "",
    "japanese": "日本サイズL"
  }

---

3. タイトル生成 (title)
画像とラベル（タグ・型番）から、**正確な正式名称（または一般的名称）**を推定し、
日本のECサイトで使われる自然なタイトルを5件生成してください。

**生成ルール：**
- ブランドタグ、型番、商品画像を視覚的に読み取る。
- ブランド＋型番でWeb検索し、結果を確認して正式名称を特定。
- 検索結果の画像と照合し、色・素材・カテゴリが一致するものを採用。
- 自信度順に5件生成。
- 各タイトルは40〜80文字程度で、日本のECサイトで一般的な表現を使用。
- 確定できない情報の推測は禁止（「っぽい」「写真の通り」などは使わない）。

**ブランド名表記と文字数制限ルール**
外国ブランド名は必ず カタカナ表記＋英字表記 の両方を生成する。
　例：ルイ・ヴィトン Louis Vuitton、グッチ Gucci、シャネル Chanel

タイトル全体の総文字数が65文字を超える場合は、
　カタカナ表記を完全に削除し、英字表記のみを残す。
　例：
　　通常 → ルイ・ヴィトン Louis Vuitton モノグラム トートバッグ
　　65文字超 → Louis Vuitton モノグラム トートバッグ

文字数判定はタイトル全体（ブランド＋型番＋商品名＋サイズ＋カラーを含む）で行う。
- 日本ブランドの場合はカタカナ表記のみで表記。
- 色は「ブラック系」「ベージュ系」など「◯◯系」で統一。

**性別カテゴリ（対象）**
- 画像またはタグの情報から、商品が「メンズ」「レディース」「キッズ」のいずれ向けかを判定する。
- 服の形状、サイズ表記（例: MENS / WOMENS / BOYS / GIRLS など）、デザイン要素を参考に判定。
- タイトル末尾に必ず対象を明記する（例：「メンズ」「レディース」「キッズ」）。
　例：
　　「ルイ・ヴィトン Louis Vuitton モノグラム トートバッグ レディース」
　　「ナイキ Nike スウェット パーカー メンズ」

---

### 4. カテゴリ (category)
常に '123' を返してください。

---

### 5. 採寸 (measurement)
画像の背景に方眼（マス目）模様がある場合、それを採寸の基準として使用する。
各マス目は1cm×1cmの正方形として扱う。
服やアイテムの端から端までのマス目数を数え、おおよその長さをcm単位で推定する。
グリッド線が不明瞭な場合は、目視で最も近い整数cmを推定する。
出力形式は次の通りとする: "着丈:65 肩幅:45 身幅:50 袖丈:20"。
画像から一部のみ測定可能な場合は、判別できる項目のみを出力し、完全に不明な場合は空文字（""）を返す。
推定値は一般的な衣類の範囲内に収め、極端な数値（例: 着丈:200など）は避ける。

例: "着丈:65 肩幅:45 身幅:50 袖丈:20"

---

### 6. コンディション (condition)
常に '1' を返してください。

---

### 7〜9. 店舗ID (shop1, shop2, shop3)
それぞれ '123' を返してください。

---

### 出力形式
以下のJSON形式で出力してください。
※ **応答に \`\`\`json と \`\`\` を含めないでください。有効な JSON データのみを返します

{
    "title": [ "title1", "title2", "title3", "title4", "title5" ],
    "level": "A",
    "measurement": "",
    "measurement_type": {
        "foreign": '',
        "japanese": ""
    },
    "category": "123",
    "condition": "1",
    "shop1": "123",
    "shop2": "123",
    "shop3": "123"
}

---

**重要:**  
- 出力は必ず上記のJSONフォーマット構造を保持すること。  
- 「level」の判定は画像からの抽出精度に基づく。  
- JSON以外の文字（コードフェンス・コメント・説明）は一切禁止。
`;

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
                level: 'B',
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
