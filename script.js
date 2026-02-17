/**
 * सुधारिएको script.js
 * १. चिह्न, नाम र विवरणबीचको अनावश्यक ग्याप हटाइएको।
 * २. क्लिन र कम्प्याक्ट डिजाइन।
 */

async function run() {
    const API_KEY = process.env.GEMINI_API_KEY;
    const WP_URL = "https://tkg.com.np";
    const WP_USER = "trikal";
    const WP_PASS = process.env.WP_PASS;

    // मिति सेटिङ
    const vsDate = "५ फागुन २०८२";
    const adDate = "फेब्रुअरी १७, २०२६";
    const fullDateStr = `आज मिति ${vsDate} तदनुसार ${adDate}`;

    const systemPrompt = `तपाईँ एक अनुभवी वैदिक ज्योतिष हुनुहुन्छ। १२ राशिको फल लेख्नुहोस्।
    - शीर्षक वा मिति फेरि नलेख्नुहोस्। 
    - प्रत्येक राशिको सुरुमा यसरी लेख्नुहोस्: **♈ मेष राशि:** (चिह्न र नाम एउटै लाइनमा)।
    - राशिको नामपछि लगत्तै विवरण सुरु गर्नुहोस्, धेरै खाली ठाउँ नछोड्नुहोस्।
    - विवरणको अन्त्यमा सानो अक्षरमा शुभ अंक र शुभ रङ लेख्नुहोस्।`;

    const userQuery = `${fullDateStr} को दैनिक राशिफल तयार पार्नुहोस्।`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: userQuery }] }],
                systemInstruction: { parts: [{ text: systemPrompt }] }
            })
        });

        const data = await response.json();
        let rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        
        // अनावश्यक लाइन ब्रेकहरू हटाउने
        rawContent = rawContent.trim().replace(/\n{2,}/g, '\n');

        // HTML संरचना - ग्याप घटाउने गरी बनाइएको
        const finalHTML = `
            <div style="font-family: 'Mukta', sans-serif; max-width: 750px; margin: auto; background-color: #000; color: #eee; padding: 30px 15px; line-height: 1.5;">
                
                <!-- हेडर -->
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="color: #d4af37; font-size: 34px; margin-bottom: 5px; border-bottom: 2px solid #d4af37; display: inline-block; padding-bottom: 5px;">
                        आजको राशिफल
                    </h1>
                    <p style="font-size: 17px; color: #aaa; margin-top: 10px;">${fullDateStr}</p>
                </div>
                
                <!-- राशिफल विवरण -->
                <div style="font-size: 18px;">
                    ${rawContent
                        .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #d4af37; font-size: 20px; display: block; margin-top: 20px; margin-bottom: 5px; border-bottom: 1px solid #222; padding-bottom: 3px;">$1</strong>')
                        .replace(/\n/g, '<div style="margin-bottom: 8px; text-align: justify;">')
                        .split('</div>').map(line => line.includes('<strong') ? line : line + '</div>').join('')}
                </div>

                <!-- फुटर -->
                <div style="margin-top: 40px; padding-top: 15px; border-top: 1px solid #333; text-align: center; color: #666; font-size: 14px;">
                    © त्रिकाल ज्ञान मार्ग | वैदिक ज्योतिष सेवा
                </div>
            </div>
        `;

        const credentials = Buffer.from(`${WP_USER}:${WP_PASS}`).toString('base64');
        const wpRes = await fetch(`${WP_URL}/wp-json/wp/v2/posts`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: `तपाईँको आज- ${vsDate}`,
                content: finalHTML,
                status: 'publish'
            })
        });

        if (wpRes.ok) console.log("Published successfully!");
        else console.log("Failed:", await wpRes.text());

    } catch (error) {
        console.error("Error:", error);
    }
}

run();
