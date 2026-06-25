import TextRecognition from '@react-native-ml-kit/text-recognition';

export async function extractReceiptData(imageUri: string): Promise<{ title: string; amount: string }> {
  try {
    const result = await TextRecognition.recognize(imageUri);
    const text = result.text;
    
    // Heuristic to extract amount: find the largest number that looks like a currency amount
    const amountRegex = /\$?\s*(\d+\.\d{2})/g;
    let match;
    let maxAmount = 0;
    
    while ((match = amountRegex.exec(text)) !== null) {
      const val = parseFloat(match[1]);
      if (val > maxAmount) {
        maxAmount = val;
      }
    }

    // Heuristic for title: first non-empty line
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.match(/\d+\.\d{2}/));
    const title = lines.length > 0 ? lines[0] : 'Scanned Receipt';

    return {
      title,
      amount: maxAmount > 0 ? maxAmount.toFixed(2) : '',
    };
  } catch (error) {
    console.error('OCR Error:', error);
    return { title: '', amount: '' };
  }
}
