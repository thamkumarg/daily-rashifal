const axios = require('axios');

// १. सेटअप र कन्फिगरेसन
const API_KEY = process.env.GEMINI_API_KEY;
const WP_URL = "https://tkg.com.np/wp-json/wp/v2/posts";
const WP_USER = "admin"; // तपाईँको युजरनेम
const WP_PASS = process.env.WP_PASS;

const auth = Buffer.from(`${WP_USER}:${WP_PASS}`).toString('base64');

// २. नेपाली मिति फङ्सन (आजको ठ्याक्कै मिति निकाल्न)
function getNepaliDate() {
    const today = new Date();
    // सर्भरको समय फरक हुन सक्ने हुनाले नेपाल टाइमसेट
    const options = { timeZone: 'Asia/Kathmandu', year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    const nepaliDateStr = today.toLocaleDateString('ne-NP', options);
    
    // अङ्ग्रेजी मिति पनि (Title को लागि)
    const englishOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const englishDateStr = today.toLocaleDateString('en-US', englishOptions).toUpperCase();

    return { nepali: nepaliDateStr, english: englishDateStr };
}

async function generateRashifal() {
    const dateInfo = getNepaliDate();
    console.log(`Generating for: ${dateInfo.nepali}`);

    const prompt = `आज ${dateInfo.nepali} को लागि दैनिक राशिफल लेख्नुहोस्। 
    - प्रत्येक राशिको लागि ४-५ लाइनको सकारात्मक र उपयोगी विवरण दिनुहोस्।
    - विवरणको अन्त्यमा 'शुभ रङ्ग' र 'शुभ अङ्क' पनि लेख्नुहोस्।
    - भाषा शुद्ध नेपाली हुनुपर्छ।`;

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
            {
                contents: [{ parts: [{ text: prompt }] }]
            }
        );

        const rawText = response.data.candidates[0].content.parts[0].text;
        return formatToHTML(rawText, dateInfo);
    } catch (error) {
        console.error("Gemini API Error:", error.message);
    }
}

function formatToHTML(text, dateInfo) {
    // राशिलाई सुन्दर बक्समा सजाउने
    const formattedText = text
        .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
        .split('\n\n').map(para => {
            if (para.includes("मेष") || para.includes("वृष") || para.includes("मिथुन") || para.includes("कर्कट") || para.includes("सिंह") || para.includes("कन्या") || para.includes("तुला") || para.includes("वृश्चिक") || para.includes("धनु") || para.includes("मकर") || para.includes("कुम्भ") || para.includes("मीन")) {
                return `
                <div style="border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 25px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); background-color: #fff; border-left: 5px solid #a00000;">
                    <p style="font-size: 1.1em; line-height: 1.8; color: #333;">${para}</p>
                </div>`;
            }
            return `<p style="font-size: 1.1em; line-height: 1.8;">${para}</p>`;
        }).join('');

    return `
    <div style="font-family: 'Kalimati', 'Arial', sans-serif; max-width: 800px; margin: auto; background-color: #f9f9f9; padding: 10px;">
        <!-- हेडर -->
        <div style="background: linear-gradient(135deg, #a00000 0%, #d40000 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0; margin-bottom: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
            <div style="font-size: 40px; margin-bottom: 10px;">🕉️</div>
            <h1 style="margin: 0; font-size: 32px; letter-spacing: 1px; text-shadow: 2px 2px 4px rgba(0,0,0,0.3); color: white !important;">आजको राशिफल</h1>
            <p style="font-size: 18px; opacity: 0.9; margin-top: 10px; color: white !important;">${dateInfo.nepali}</p>
        </div>

        <!-- मुख्य सामग्री -->
        <div style="padding: 10px;">
            <p style="text-align: center; font-style: italic; color: #666; margin-bottom: 30px;">
                बिगतको कर्म र वर्तमानको ग्रहगोचरका आधारमा तयार पारिएको आजको राशिफल:
            </p>
            ${formattedText}
        </div>

        <!-- फुटर -->
        <div style="text-align: center; padding: 20px; border-top: 1px solid #ddd; margin-top: 30px; color: #888; font-size: 14px;">
            <p>© त्रिकाल ज्ञान मार्ग - आध्यात्मिक मार्गदर्शन</p>
        </div>
    </div>`;
}

async function postToWordPress() {
    const dateInfo = getNepaliDate();
    const content = await generateRashifal();

    const postData = {
        title: `आजको राशिफल: ${dateInfo.nepali}`, // शीर्षकमा नेपाली मिति राखेको
        content: content,
        status: 'publish',
        categories: [1] // तपाईँको राशिफल क्याटेगोरी ID चेक गर्नुहोला
    };

    try {
        const response = await axios.post(WP_URL, postData, {
            headers: { 'Authorization': `Basic ${auth}` }
        });
        console.log("Post Published Successfully! URL:", response.data.link);
    } catch (error) {
        console.error("WordPress Error:", error.response ? error.response.data : error.message);
    }
}

postToWordPress();
