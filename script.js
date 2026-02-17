/**
 * यो परिमार्जित script.js फाइल हो।
 * सबै गलत इमेजहरू हटाएर शुद्ध वैदिक ज्योतिष थिम र २०८२ फागुन ५ को मिति सेट गरिएको छ।
 */

async function run() {
    console.log("--- सुधारीएको अटोメसन सुरु भयो ---");
    
    const API_KEY = process.env.GEMINI_API_KEY;
    const WP_URL = "https://tkg.com.np";
    const WP_USER = "trikal";
    const WP_PASS = process.env.WP_PASS;

    if (!API_KEY || !WP_PASS) {
        console.error("Error: API Key वा WP Password सेट गरिएको छैन।");
        process.exit(1);
    }

    // १. मिति मिलान (तपाईँले भन्नुभएको जस्तै २०८२ फागुन ५)
    const currentYearVS = 2082;
    const vsMonthName = "फागुन"; 
    const vsDay = 5; 
    const adDateStr = "फेब्रुअरी १७, २०२६";
    
    const nepaliVSDatStr = `वि.सं. ${currentYearVS} ${vsMonthName} ${vsDay} गते`;

    console.log(`मिति फिक्स गरियो: ${nepaliVSDatStr}`);

    const systemPrompt = `तपाईँ एक उच्च स्तरको वैदिक ज्योतिष हुनुहुन्छ। 
    तपाईँले १२ राशिको दैनिक राशिफल नेपाली भाषामा लेख्नुपर्छ। 
    - कुनै पनि धार्मिक पर्व (जस्तै इद, आदि) को चर्चा नगर्नुहोस्, केवल शुद्ध राशिफल लेख्नुहोस्।
    - प्रत्येक राशिको सुरुमा आइकन र नाम बोल्डमा राख्नुहोस् (उदा: ♈ **मेष राशि**)।
    - भाषा सटिक, सकारात्मक र मर्मस्पर्शी हुनुपर्छ।
    - अन्त्यमा शुभ अंक र शुभ रङ अनिवार्य राख्नुहोस्।`;

    const userQuery = `आज मिति ${nepaliVSDatStr} को लागि विस्तृत दैनिक राशिफल तयार पार्नुहोस्। 
    शीर्षकमा "आजको राशिफल: ${nepaliVSDatStr}" मात्र राख्नुहोला।`;

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
        const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawContent) throw new Error("AI बाट सामग्री प्राप्त भएन।");

        // २. शुद्ध ज्योतिषिय डिजाइन (नो इद मुबारक - ग्यारेन्टी)
        const finalHTML = `
            <div style="font-family: 'Mukta', sans-serif; max-width: 800px; margin: auto; background-color: #ffffff; border: 1px solid #ddd; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                
                <!-- Header: Pure Vedic Astrology Theme -->
                <div style="background: linear-gradient(135deg, #1a237e 0%, #311b92 100%); padding: 35px 20px; text-align: center; color: white; border-bottom: 4px solid #ffd700;">
                    <h1 style="margin: 0; font-size: 32px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">आजको दैनिक राशिफल</h1>
                    <p style="margin: 10px 0 0; font-size: 22px; color: #ffd700; font-weight: bold;">${nepaliVSDatStr}</p>
                </div>
                
                <!-- शुद्ध राशि चक्र इमेज (No Eid, No Religious Mix) -->
                <div style="width: 100%; background-color: #000; text-align: center; padding: 0;">
                    <img src="https://img.freepik.com/free-vector/zodiac-signs-wheel-astrology-background_1017-31362.jpg" 
                         alt="Vedic Rashi Chakra" 
                         style="width: 100%; max-width: 800px; height: auto; display: block; margin: auto;">
                </div>

                <!-- Content -->
                <div style="padding: 30px; line-height: 1.9; font-size: 19px; color: #222; background-color: #fffaf0;">
                    <div style="text-align: justify; white-space: pre-line;">
                        ${rawContent}
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #f1f1f1; padding: 20px; text-align: center; border-top: 1px solid #ddd;">
                    <p style="margin: 0; font-weight: bold; color: #1a237e; font-size: 20px;">त्रिकाल ज्ञान मार्ग - tkg.com.np</p>
                    <p style="margin: 5px 0 0; color: #555; font-size: 15px;">तपाईँको भविष्य, हाम्रो मार्गदर्शन।</p>
                </div>
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
                title: `आजको राशिफल: ${nepaliVSDatStr}`,
                content: finalHTML,
                status: 'publish',
                format: 'standard'
            })
        });

        if (wpRes.ok) {
            console.log("सफलता! २०८२ फागुन ५ को राशिफल सही इमेजका साथ पब्लिश भयो।");
        } else {
            const errData = await wpRes.json();
            throw new Error(`WordPress Error: ${errData.message}`);
        }

    } catch (error) {
        console.error("Error Detail:", error.message);
        process.exit(1);
    }
}

run();
