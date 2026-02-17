/**
 * यो परिमार्जित script.js फाइल हो।
 * कुनै पनि बाह्य इमेज लिङ्क प्रयोग नगरी HTML/CSS बाट शुद्ध वैदिक डिजाइन तयार गरिएको छ।
 * धार्मिक सन्दर्भ (इद/रमदान) आउने सम्भावना शून्य पारिएको छ।
 * मिति: २०८२ फागुन ५ गते।
 */

async function run() {
    console.log("--- शुद्ध वैदिक ज्योतिष अटोमेसन सुरु भयो ---");
    
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

    console.log(`मिति फिक्स: ${nepaliVSDatStr}`);

    const systemPrompt = `तपाईँ एक उच्च कोटिको सनातन वैदिक ज्योतिष हुनुहुन्छ। 
    तपाईँले १२ राशिको दैनिक राशिफल शुद्ध नेपाली भाषामा लेख्नुपर्छ। 
    - कुनै पनि अन्य धर्म वा पर्व (इद, रमदान, आदि) को नाम झुक्किएर पनि नलेख्नुहोस्।
    - राशिफलको सुरुमा कुनै शुभकामना सन्देश नराख्नुहोस्।
    - सिधै १२ राशिको फल मात्र लेख्नुहोस्।
    - प्रत्येक राशिको सुरुमा आइकन र नाम बोल्डमा राख्नुहोस् (उदा: ♈ **मेष राशि**)।
    - अन्त्यमा प्रत्येक राशिको शुभ अंक र शुभ रङ अनिवार्य राख्नुहोस्।`;

    const userQuery = `आज मिति ${nepaliVSDatStr} को लागि शुद्ध वैदिक ज्योतिषमा आधारित दैनिक राशिफल तयार पार्नुहोस्।`;

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

        // २. शुद्ध सनातन डिजाइन (कुनै पनि बाह्य इमेज प्रयोग नगरिएको)
        const finalHTML = `
            <div style="font-family: 'Mukta', sans-serif; max-width: 800px; margin: auto; background-color: #ffffff; border: 3px solid #b71c1c; border-radius: 20px; overflow: hidden; box-shadow: 0 15px 40px rgba(0,0,0,0.2);">
                
                <!-- Header: Saffron & Red Vedic Theme -->
                <div style="background: linear-gradient(135deg, #b71c1c 0%, #ff6f00 100%); padding: 40px 20px; text-align: center; color: white; border-bottom: 6px solid #ffd700;">
                    <div style="font-size: 50px; margin-bottom: 10px;">ॐ</div>
                    <h1 style="margin: 0; font-size: 36px; font-weight: bold; text-shadow: 2px 2px 5px rgba(0,0,0,0.5);">दैनिक राशिफल</h1>
                    <p style="margin: 10px 0 0; font-size: 26px; color: #ffd700; font-weight: bold;">${nepaliVSDatStr}</p>
                </div>
                
                <!-- Symbolic Design (इमेजको सट्टामा CSS आइकन र डिजाइन) -->
                <div style="background-color: #fffaf0; padding: 30px; text-align: center;">
                    <div style="display: inline-block; padding: 20px; border: 4px double #b71c1c; border-radius: 50%;">
                        <span style="font-size: 80px; color: #b71c1c;">🚩</span>
                    </div>
                    <h2 style="color: #b71c1c; margin-top: 15px;">शुभ दिनको कामना</h2>
                </div>

                <!-- Content Area -->
                <div style="padding: 40px; line-height: 2; font-size: 20px; color: #111; background-color: #ffffff;">
                    <div style="text-align: justify; white-space: pre-line; border-left: 4px solid #b71c1c; padding-left: 25px;">
                        ${rawContent}
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #b71c1c; padding: 25px; text-align: center; color: white;">
                    <p style="margin: 0; font-weight: bold; font-size: 22px; color: #ffd700;">त्रिकाल ज्ञान मार्ग</p>
                    <p style="margin: 5px 0 0; font-size: 16px; opacity: 0.9;">tkg.com.np | धर्म रक्षति रक्षित: </p>
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
            console.log("सफलता! शुद्ध सनातन सामग्री पब्लिश भयो।");
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
