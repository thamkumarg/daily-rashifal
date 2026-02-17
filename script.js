/**
 * सुधारिएको script.js
 * १. शीर्षक र बडी बीचको ग्याप हटाइएको।
 * २. राशीको नाम र विवरणलाई एकदमै नजिक ल्याइएको।
 * ३. अलाइनमेन्टलाई सफा बनाइएको।
 */

async function run() {
    const API_KEY = ""; // Environment key handled by system
    const WP_URL = "https://tkg.com.np";
    const WP_USER = "trikal";
    const WP_PASS = process.env.WP_PASS;

    const vsDate = "५ फागुन २०८२";
    const adDate = "फेब्रुअरी १७, २०२६";
    const fullDateStr = `आज मिति ${vsDate} तदनुसार ${adDate}`;

    const systemPrompt = `तपाईँ एक अनुभवी वैदिक ज्योतिष हुनुहुन्छ। 
    - प्रत्येक राशिको फल एउटा अनुच्छेद (Paragraph) मा लेख्नुहोस्।
    - शीर्षक वा मिति बडीमा नलेख्नुहोस्।
    - ढाँचा: **♈ मेष राशि:** तपाईँको आजको दिन... (चिह्न र नाम एउटै लाइनमा)।
    - शुभ अंक र रङलाई अन्त्यमा सानो फन्टमा राख्नुहोस्।`;

    const userQuery = `${fullDateStr} को संक्षिप्त र सटिक दैनिक राशिफल तयार पार्नुहोस्।`;

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
        
        // Clean up text
        rawContent = rawContent.trim().replace(/\n{2,}/g, '\n');

        const finalHTML = `
            <div style="font-family: 'Mukta', sans-serif; max-width: 700px; margin: -20px auto 0 auto; background-color: #000; color: #eee; line-height: 1.6;">
                
                <!-- Compact Header -->
                <div style="text-align: center; padding: 20px 0; border-bottom: 1px solid #333; margin-bottom: 15px;">
                    <h2 style="color: #d4af37; font-size: 28px; margin: 0; padding: 0; text-transform: uppercase;">
                        आजको राशिफल
                    </h2>
                    <p style="font-size: 15px; color: #888; margin: 5px 0 0 0;">${fullDateStr}</p>
                </div>
                
                <!-- Content Area -->
                <div style="padding: 0 10px;">
                    ${rawContent
                        .split('\n')
                        .map(line => {
                            if (line.includes('**')) {
                                // For Zodiac Names
                                return line.replace(/\*\*(.*?)\*\*/g, 
                                    '<div style="color: #d4af37; font-size: 19px; font-weight: bold; margin-top: 15px; margin-bottom: 2px; border-left: 3px solid #d4af37; padding-left: 10px;">$1</div>');
                            } else if (line.trim() !== "") {
                                // For Body Text
                                return `<p style="margin: 0 0 10px 0; text-align: justify; font-size: 17px; color: #ccc; padding-left: 13px;">${line}</p>`;
                            }
                            return '';
                        }).join('')}
                </div>

                <!-- Footer -->
                <div style="margin-top: 30px; padding: 15px; border-top: 1px dotted #444; text-align: center; color: #555; font-size: 13px;">
                    © त्रिकाल ज्ञान मार्ग | डिजिटल ज्योतिष डायरी
                </div>
            </div>
        `;

        const credentials = btoa(`${WP_USER}:${WP_PASS}`);
        const wpRes = await fetch(`${WP_URL}/wp-json/wp/v2/posts`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: `तपाईँको आज- ${vsDate}`,
                content: finalHTML,
                status: 'publish',
                format: 'standard'
            })
        });

        if (wpRes.ok) {
            console.log("Successfully Published with improved alignment!");
        } else {
            console.error("WP Error:", await wpRes.text());
        }

    } catch (error) {
        console.error("System Error:", error);
    }
}

// Global invocation
run();
