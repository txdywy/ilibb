import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const AMAP_KEY = process.env.AMAP_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function geocode(address: string, name: string) {
  // 1. Prioritize AMap if Key is available
  if (AMAP_KEY) {
    try {
      const url = `https://restapi.amap.com/v3/geocode/geo?address=${encodeURIComponent(address)}&city=北京&key=${AMAP_KEY}`;
      const response = await axios.get(url);
      if (response.data.status === '1' && response.data.geocodes.length > 0) {
        const location = response.data.geocodes[0].location.split(',');
        console.log(`[AMap] Geocoded ${name} to ${location[0]}, ${location[1]}`);
        return {
          lng: parseFloat(location[0]),
          lat: parseFloat(location[1]),
          district: response.data.geocodes[0].district,
        };
      }
    } catch (error: any) {
      console.error(`[AMap] Geocoding failed for ${name}:`, error.message);
    }
  }

  // 2. Fallback to Nominatim (OpenStreetMap)
  try {
    const query = `${name} 北京`;
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://github.com/BeijingFreeLibraryMap'
      }
    });

    if (response.data && response.data.length > 0) {
      const result = response.data[0];
      console.log(`[Nominatim] Geocoded ${name} to ${result.lat}, ${result.lon}`);
      return {
        lng: parseFloat(result.lon),
        lat: parseFloat(result.lat),
        district: '', 
      };
    }
  } catch (error: any) {
    console.error(`[Nominatim] Geocoding failed for ${name}:`, error.message);
  }
  
  return null;
}

export async function getAiScore(libraryInfo: any) {
  try {
    if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY.includes('YOUR_')) {
      throw new Error('Valid OPENROUTER_API_KEY is missing');
    }
    
    const prompt = `
      你是一个专业的图书馆评论员。请根据以下北京图书馆的信息，对其进行综合评分（0-100）。
      信息：${JSON.stringify(libraryInfo)}
      
      评分维度：
      A. 免费可信度 20%
      B. 开放时间友好度 15%
      C. 交通便利度 20%
      D. 阅读/自习环境 20%
      E. 周边餐饮娱乐便利度 10%
      F. 设施完整度 10%
      G. 特色加分 5%
      
      请输出 JSON 格式，包含 total (总分), details (各项分数), 和 recommendation (一句精炼的推荐理由)。
      不要输出任何多余的文字。
    `;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'google/gemini-2.0-flash-exp:free', 
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const content = response.data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return JSON.parse(jsonMatch ? jsonMatch[0] : content);
  } catch (error: any) {
    console.warn(`AI scoring failed, using heuristic fallback for ${libraryInfo.name}:`, error.message);
    
    // Heuristic fallback
    const baseScore = 70 + Math.floor(Math.random() * 20);
    return {
      total: baseScore,
      details: {
        free_credibility: 90,
        opening_hours: 80,
        accessibility: 85,
        environment: 75,
        surrounding: 70,
        facilities: 80,
        special: 10
      },
      recommendation: `[自动生成] ${libraryInfo.name} 是北京备受欢迎的免费阅读空间，环境安静，适合深度学习。`
    };
  }
}
