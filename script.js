/**
 * यो जाभास्क्रिप्ट (script.js) फाइल हो।
 * यसले Gemini AI बाट राशिफल लिन्छ र WordPress मा पठाउँछ।
 * यसलाई GitHub को मुख्य (Root) फोल्डरमा राख्नुहोस्।
 */

async function run() {
    console.log("आजको राशिफल तयार गर्ने प्रक्रिया सुरु भयो...");
    
    // वातावरण भेरिएबलहरू (GitHub Secrets बाट आउँछन्)
    const API_KEY = process.env.GEMINI_API_KEY;
    const WP_URL = "https://tkg.com.np";
    const WP_USER = "trikal";
    const WP_PASS = process.env.WP_PASS;

    // मिति सेटिङ (नेपाली समय अनुसार)
    const today = new Date();
    const options = { timeZone: 'Asia/Kathmandu', year: 'numeric', month: 'long', day: 'numeric' };
    const nepaliDateStr = today.toLocaleDateString('ne-NP', options);
    
    const systemPrompt = `तपाईँ एक विशेषज्ञ वैदिक ज्योतिष हुनुहुन्छ। 
    तपाईँले १२ राशिको राशिफल नेपाली भाषामा लेख्नुपर्छ। 
    प्रत्येक राशिको विवरण सुरु गर्दा राशिको आइकन र नाम बोल्डमा राख्नुहोस् (उदा: ♈ **मेष:**)। 
    सामग्रीलाई आकर्षक बनाउनुहोस् र अन्त्यमा शुभ अंक र शुभ रङ पनि थप्नुहोस्।`;
    
    const userQuery = `आज मिति ${nepaliDateStr} को लागि विस्तृत र सकारात्मक दैनिक राशिफल तयार पार्नुहोस्।`;

    try {
        if (!API_KEY || !WP_PASS) {
            throw new Error("Secrets (GEMINI_API_KEY वा WP_PASS) सेट गरिएको छैन।");
        }

        console.log("Gemini AI सँग राशिफल माग्दै...");
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] }
            })
        });

        const data = await response.json();
        const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawContent) throw new Error("AI बाट सामग्री प्राप्त हुन सकेन।");

        // वेबसाइटको लागि HTML ढाँचा
        const finalHTML = `
            <div style="font-family: 'Mukta', sans-serif; padding: 30px; background-color: #fffaf0; border: 2px solid #e65100; border-radius: 20px; max-width: 800px; margin: auto; box-shadow: 0 4px 15px rgba(0,0,0,0.1);">
                <h1 style="color: #e65100; text-align: center;">आजको राशिफल: ${nepaliDateStr}</h1>
                <hr style="border: 0; border-top: 1px solid #ffcc80; margin: 20px 0;">
                <div style="line-height: 1.9; font-size: 19px; color: #333; text-align: justify;">
                    ${rawContent.replace(/\n/g, '<br>')}
                </div>
                <hr style="border: 0; border-top: 1px solid #ffcc80; margin: 20px 0;">
                <p style="text-align: center; font-weight: bold; color: #e65100; font-size: 20px;">त्रिकाल ज्ञान मार्ग - tkg.com.np</p>
            </div>
        `;

        console.log("WordPress मा पोस्ट पठाउँदै...");
        const credentials = Buffer.from(`${WP_USER}:${WP_PASS}`).toString('base64');
        const wpRes = await fetch(`${WP_URL}/wp-json/wp/v2/posts`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: `आजको राशिफल - ${nepaliDateStr}`,
                content: finalHTML,
                status: 'publish'
            })
        });

        if (wpRes.ok) {
            console.log("सफलता! राशिफल वेबसाइटमा पब्लिश भयो।");
        } else {
            const errData = await wpRes.json();
            console.error("WordPress Error:", errData.message);
        }

    } catch (error) {
        console.error("प्रक्रियामा त्रुटि आयो:", error.message);
        process.exit(1);
    }
}

run();
