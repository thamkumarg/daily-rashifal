/**
 * यो परिमार्जित script.js फाइल हो।
 * कुनै पनि हालतमा धार्मिक इमेज नआउने गरी शुद्ध ज्योतिषिय राशि चक्र सेट गरिएको छ।
 * मिति: २०८२ फागुन ५ गते।
 */

async function run() {
    console.log("--- सुधारीएको अटोमेसन सुरु भयो ---");
    
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

    console.log(`मिति फिक्स गरियो: ${nepaliVSDatStr}`);

    const systemPrompt = `तपाईँ एक उच्च स्तरको वैदिक ज्योतिष हुनुहुन्छ। 
    तपाईँले १२ राशिको दैनिक राशिफल नेपाली भाषामा लेख्नुपर्छ। 
    - कुनै पनि धार्मिक पर्व (इद, रमदान, आदि) को नाम समेत नलिनुहोस्।
    - राशिफलको सुरुमा कुनै शुभकामना सन्देश नराख्नुहोस्।
    - सिधै १२ राशिको फल मात्र लेख्नुहोस्।
    - प्रत्येक राशिको सुरुमा आइकन र नाम बोल्डमा राख्नुहोस् (उदा: ♈ **मेष राशि**)।
    - अन्त्यमा शुभ अंक र शुभ रङ अनिवार्य राख्नुहोस्।`;

    const userQuery = `आज मिति ${nepaliVSDatStr} को लागि शुद्ध ज्योतिषिय राशिफल तयार पार्नुहोस्। 
    कुनै पनि धार्मिक सन्दर्भ नथप्नुहोला।`;

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

        // २. शुद्ध ज्योतिषिय डिजाइन (नो रमदान, नो इद - १००% ग्यारेन्टी)
        const finalHTML = `
            <div style="font-family: 'Mukta', sans-serif; max-width: 800px; margin: auto; background-color: #ffffff; border: 1px solid #ddd; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
                
                <!-- Header: Astrology Theme -->
                <div style="background: linear-gradient(135deg, #0d1b2a 0%, #1b263b 100%); padding: 35px 20px; text-align: center; color: white; border-bottom: 4px solid #c9ada7;">
                    <h1 style="margin: 0; font-size: 32px; font-weight: bold;">आजको दैनिक राशिफल</h1>
                    <p style="margin: 10px 0 0; font-size: 22px; color: #ffd700; font-weight: bold;">${nepaliVSDatStr}</p>
                </div>
                
                <!-- शुद्ध राशि चक्र इमेज (तटस्थ इमेज मात्र) -->
                <div style="width: 100%; background-color: #f8f9fa; text-align: center; padding: 20px 0;">
                    <img src="https://tkg.com.np/wp-content/uploads/2025/02/rashi-chakra-premium.jpg" 
                         onerror="this.src='https://img.freepik.com/free-vector/astrology-zodiac-signs-wheel-poster_1017-31363.jpg'" 
                         alt="Astrology Wheel" 
                         style="width: 100%; max-width: 500px; height: auto; display: block; margin: auto; border-radius: 50%;">
                </div>

                <!-- Content -->
                <div style="padding: 35px; line-height: 1.9; font-size: 19px; color: #333; background-color: #fffaf0;">
                    <div style="text-align: justify; white-space: pre-line;">
                        ${rawContent}
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #0d1b2a; padding: 20px; text-align: center; color: white;">
                    <p style="margin: 0; font-weight: bold; font-size: 20px;">त्रिकाल ज्ञान मार्ग</p>
                    <p style="margin: 5px 0 0; color: #ccc; font-size: 14px;">tkg.com.np</p>
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
