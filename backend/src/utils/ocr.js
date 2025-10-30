import FormData from 'form-data';
import fetch from 'node-fetch';

export const extractTextFromImage = async (imageBuffer) => {
    try {
        const formData = new FormData();
        formData.append('file', imageBuffer, { filename: 'ticket.jpg', contentType: 'image/jpeg' });
        formData.append('language', 'spa');
        formData.append('apikey', process.env.OCR_API_KEY || 'K88796806988957');

        const response = await fetch('https://api.ocr.space/parse/image', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        if (!result.ParsedResults?.[0]) throw new Error('OCR failed');

        const text = result.ParsedResults[0].ParsedText;
        const amountMatch = text.match(/([0-9]+[,.]?[0-9]*)\s*€/) || text.match(/total[:\s]*([0-9]+[,.]?[0-9]*)/i);
        const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : null;

        return { amount, description: text.split('\n')[0] || '', rawText: text };
    } catch (error) {
        throw new Error('Error processing image');
    }
};
