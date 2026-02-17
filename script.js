/**
 * यो परिमार्जित script.js फाइल हो।
 * कुनै पनि धार्मिक (रमदान/इद) सन्दर्भ र इमेज पूर्ण रूपमा हटाइएको छ।
 * शुद्ध हिन्दू ज्योतिषिय राशि चक्र र वैदिक थिम सेट गरिएको छ।
 * मिति: २०८२ फागुन ५ गते।
 */

async function run() {
    console.log("--- शुद्ध ज्योतिष अटोमेसन सुरु भयो ---");
    
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
    
    const nepaliVSDatStr = `वि.सं. ${currentYearVS} ${vsMonthName} ${vsDay} गते`;

    console.log(`मिति: ${nepaliVSDatStr}`);

    const systemPrompt = `तपाईँ एक कट्टर सनातन वैदिक ज्योतिष हुनुहुन्छ। 
    तपाईँले १२ राशिको दैनिक राशिफल शुद्ध नेपाली भाषामा लेख्नुपर्छ। 
    - कुनै पनि अन्य धर्म वा पर्व (इद, रमदान, आदि) को नाम कतै पनि नलेख्नुहोस्।
    - राशिफलको सुरुमा सिधै 'आजको राशिफल' शीर्षकबाट सुरु गर्नुहोस्।
    - प्रत्येक राशिको फल सकारात्मक र ज्योतिषिय दृष्टिकोणले लेख्नुहोस्।
    - प्रत्येक राशिको सुरुमा आइकन र नाम बोल्डमा राख्नुहोस् (उदा: ♈ **मेष राशि**)।
    - अन्त्यमा प्रत्येक राशिको शुभ अंक र शुभ रङ अनिवार्य राख्नुहोस्।`;

    const userQuery = `आज मिति ${nepaliVSDatStr} को लागि शुद्ध वैदिक ज्योतिषमा आधारित राशिफल तयार पार्नुहोस्। 
    कुनै पनि शुभकामना वा धार्मिक सन्दर्भ नराख्नुहोला।`;

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

        // २. शुद्ध हिन्दू ज्योतिषिय डिजाइन (नो रमदान, नो इद - ग्यारेन्टी)
        const finalHTML = `
            <div style="font-family: 'Mukta', sans-serif; max-width: 800px; margin: auto; background-color: #ffffff; border: 2px solid #b71c1c; border-radius: 10px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.15);">
                
                <!-- Header: Vedic Theme (Saffron and Gold) -->
                <div style="background: linear-gradient(135deg, #b71c1c 0%, #d32f2f 100%); padding: 35px 20px; text-align: center; color: white; border-bottom: 5px solid #ffd700;">
                    <h1 style="margin: 0; font-size: 32px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.4);">दैनिक राशिफल</h1>
                    <p style="margin: 10px 0 0; font-size: 24px; color: #ffd700; font-weight: bold;">${nepaliVSDatStr}</p>
                </div>
                
                <!-- शुद्ध हिन्दू राशि चक्र इमेज -->
                <div style="width: 100%; background-color: #fff; text-align: center; padding: 20px 0;">
                    <img src="https://tkg.com.np/wp-content/uploads/2025/02/rashi-chakra-premium.jpg" 
                         onerror="this.src='https://img.freepik.com/free-vector/astrology-zodiac-signs-wheel-poster_1017-31363.jpg'" 
                         alt="Hindu Rashi Chakra" 
                         style="width: 100%; max-width: 550px; height: auto; display: block; margin: auto;">
                </div>

                <!-- Content Area -->
                <div style="padding: 40px; line-height: 1.9; font-size: 20px; color: #1a1a1a; background-color: #fffaf0;">
                    <div style="text-align: justify; white-space: pre-line; border-left: 3px solid #ffd700; padding-left: 20px;">
                        ${rawContent}
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #b71c1c; padding: 20px; text-align: center; color: white; border-top: 1px solid #ddd;">
                    <p style="margin: 0; font-weight: bold; font-size: 20px; color: #ffd700;">त्रिकाल ज्ञान मार्ग</p>
                    <p style="margin: 5px 0 0; color: #fff; font-size: 14px; opacity: 0.8;">सर्वे भवन्तु सुखिन: | tkg.com.np</p>
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
                title: `दैनिक राशिफल: ${nepaliVSDatStr}`,
                content: finalHTML,
                status: 'publish',
                format: 'standard'
            })
        });

        if (wpRes.ok) {
            console.log("सफलता! शुद्ध ज्योतिषिय सामग्री पब्लिश भयो।");
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
