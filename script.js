/**
 * यो परिमार्जित script.js फाइल हो।
 * प्रयोगकर्ताले पठाएको स्क्रिनसट अनुसार 'Dark & Gold' प्रिमियम थिम तयार गरिएको छ।
 * बाह्य इमेजको साटो शुद्ध CSS र आकर्षक फन्टको प्रयोग गरिएको छ।
 */

async function run() {
    console.log("--- प्रिमियम डार्क वैदिक ज्योतिष अटोमेसन सुरु भयो ---");
    
    const API_KEY = process.env.GEMINI_API_KEY;
    const WP_URL = "https://tkg.com.np";
    const WP_USER = "trikal";
    const WP_PASS = process.env.WP_PASS;

    if (!API_KEY || !WP_PASS) {
        console.error("Error: API Key वा WP Password सेट गरिएको छैन।");
        process.exit(1);
    }

    // १. मिति मिलान (वि.सं. २०८२ फागुन ५)
    const currentYearVS = 2082;
    const vsMonthName = "फागुन"; 
    const vsDay = 5; 
    const adDateStr = "फेब्रुअरी १७, २०२६";
    
    const nepaliVSDatStr = `${vsDay} ${vsMonthName} ${currentYearVS}`;
    const fullDateStr = `आज ${nepaliVSDatStr} तदनुसार ${adDateStr}`;

    console.log(`मिति फिक्स: ${fullDateStr}`);

    const systemPrompt = `तपाईँ एक उच्च कोटिको सनातन वैदिक ज्योतिष हुनुहुन्छ। 
    तपाईँले १२ राशिको दैनिक राशिफल शुद्ध नेपाली भाषामा लेख्नुपर्छ। 
    - सामग्री सुरु गर्दा कुनै पनि भूमिका वा शुभकामना सन्देश नलेख्नुहोस्।
    - सिधै १२ राशिको फल मात्र लेख्नुहोस्।
    - प्रत्येक राशिको सुरुमा आइकन र नाम बोल्डमा राख्नुहोस् (उदा: ♈ **मेष राशि**)।
    - सामग्रीको अन्त्यमा प्रत्येक राशिको शुभ अंक र शुभ रङ अनिवार्य राख्नुहोस्।
    - कुनै पनि अन्य धार्मिक सन्दर्भ (इद/रमदान) उल्लेख नगर्नुहोस्।`;

    const userQuery = `आज मिति ${fullDateStr} को लागि दैनिक राशिफल तयार पार्नुहोस्। १२ वटै राशिको फल आकर्षक र स्पष्ट भाषामा हुनुपर्छ।`;

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

        // २. प्रिमियम डार्क एण्ड गोल्ड डिजाइन (स्क्रिनसट अनुसार)
        const finalHTML = `
            <div style="font-family: 'Mukta', sans-serif; max-width: 850px; margin: auto; background-color: #000000; color: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #222;">
                
                <!-- Title Header -->
                <div style="padding: 60px 20px 40px; text-align: center; background: linear-gradient(to bottom, #111 0%, #000 100%);">
                    <h1 style="margin: 0; font-size: 52px; font-weight: 700; color: #d4af37; letter-spacing: 1px; line-height: 1.2;">
                        आज ${vsDay} ${vsMonthName} ${currentYearVS} <br>
                        तदनुसार ${adDateStr} को राशिफल
                    </h1>
                    <div style="width: 100px; hieght: 2px; background: #d4af37; margin: 25px auto 0;"></div>
                </div>
                
                <!-- Content Section -->
                <div style="padding: 20px 50px 60px; background-color: #000000; line-height: 1.8; font-size: 21px; text-align: justify; color: #ccc;">
                    <div style="white-space: pre-line; border-top: 1px solid #333; padding-top: 30px;">
                        ${rawContent.replace(/\*\*(.*?)\*\*/g, '<strong style="color: #d4af37; font-size: 24px;">$1</strong>')}
                    </div>
                </div>

                <!-- Footer -->
                <div style="padding: 30px; border-top: 1px solid #222; text-align: center; background-color: #050505;">
                    <p style="margin: 0; font-size: 18px; color: #777; letter-spacing: 2px; text-transform: uppercase;">
                        BY त्रिकाल ज्ञान मार्ग | TKG TODAY
                    </p>
                    <p style="margin: 10px 0 0; color: #d4af37; font-size: 14px;">tkg.com.np | धर्म रक्षति रक्षित:</p>
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
                title: `तपाईँको आज- ${vsDay} ${vsMonthName} ${currentYearVS}`,
                content: finalHTML,
                status: 'publish',
                format: 'standard'
            })
        });

        if (wpRes.ok) {
            console.log("सफलता! प्रिमियम डार्क थिममा राशिफल पब्लिश भयो।");
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
