
import { GoogleGenAI, Type } from "@google/genai";
import { Category } from "../types";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const scanReceipt = async (base64Image: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
          },
        },
        {
          text: `Hãy phân tích hóa đơn này và trả về dữ liệu JSON chính xác. 
          Bao gồm: tổng tiền (amount), danh mục (category - chọn một trong: Thực phẩm, Đồ gia dụng, Mỹ phẩm, Thời trang, Sức khỏe, Khác), 
          và một ghi chú ngắn gọn (note).`
        }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          amount: { type: Type.NUMBER },
          category: { type: Type.STRING },
          note: { type: Type.STRING },
        },
        required: ["amount", "category", "note"]
      }
    }
  });

  try {
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Failed to parse AI response", e);
    return null;
  }
};

export const processVoiceInput = async (voiceText: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Chuyển câu nói sau thành dữ liệu chi tiêu JSON: "${voiceText}". 
    Ví dụ: "Mua rau 20k, thịt 50k" -> [{amount: 20000, category: "Thực phẩm", note: "Rau"}, {amount: 50000, category: "Thực phẩm", note: "Thịt"}]
    Chọn category từ: Thực phẩm, Đồ gia dụng, Mỹ phẩm, Thời trang, Sức khỏe, Khác.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            category: { type: Type.STRING },
            note: { type: Type.STRING },
          },
          required: ["amount", "category", "note"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    return [];
  }
};

export const getShoppingAdvice = async (items: string[]) => {
  const ai = getAI();
  const prompt = `Dựa trên danh sách mua sắm này: ${items.join(', ')}. Hãy đưa ra 2 mẹo đi chợ hoặc bảo quản thực phẩm ngắn gọn, dễ thương cho phụ nữ nội trợ.`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });
  return response.text;
};

export const getMarketHandbook = async (topic: 'prices' | 'freshness' | 'recipes') => {
  const ai = getAI();
  const prompts = {
    prices: "Hãy cung cấp thông tin tham khảo về giá cả một số mặt hàng thực phẩm phổ biến tại chợ Việt Nam hôm nay (thịt, cá, rau). Trình bày ngắn gọn, dễ thương.",
    freshness: "Hãy chia sẻ 3 mẹo chọn thực phẩm tươi ngon (ví dụ: cách chọn cá, chọn rau, chọn trái cây). Trình bày sinh động bằng emoji.",
    recipes: "Hãy gợi ý 2 công thức nấu ăn tiết kiệm, nhanh gọn cho bữa cơm gia đình từ những nguyên liệu cơ bản. Trình bày rõ ràng."
  };
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompts[topic],
  });
  return response.text;
};
