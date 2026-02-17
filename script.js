/**
 * यो परिमार्जित script.js फाइल हो।
 * यसले सही नेपाली वि.सं. मिति (फागुन ५) र सही ज्योतिषिय इमेज थपेको छ।
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

    // १. मिति मिलान (Date Fix for Today)
    const today = new Date();
    const adDateStr = today.toLocaleDateString('ne-NP', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // फेब्रुअरी १७, २०२६ = फागुन ५, २०८१
    const currentYearVS = 2081;
    const vsMonthName = "फागुन"; 
    const vsDay = 5; // आजको लागि फागुन ५ गते फिक्स गरिएको
    
    const nepaliVSDatStr = `वि.सं. ${currentYearVS} ${vsMonthName} ${vsDay} गते`;

    console.log(`मिति मिलान: ${adDateStr} = ${nepaliVSDatStr}`);

    const systemPrompt = `तपाईँ एक विशेषज्ञ वैदिक ज्योतिष हुनुहुन्छ। 
    तपाईँले १२ राशिको राशिफल नेपाली भाषामा एकदमै आकर्षक र प्रस्ट ढाँचामा लेख्नुपर्छ। 
    - प्रत्येक राशिको सुरुमा ठूलो ईमोजी र बोल्ड नाम राख्नुहोस् (उदा: ♈ **मेष राशि**)।
    - राशिफलको भाषा सकारात्मक र उत्साहजनक हुनुपर्छ।
    - अक्षरहरू पढ्न सजिलो हुने गरी अनुच्छेदहरू मिलाउनुहोस्।
    - अन्त्यमा प्रत्येक राशिको शुभ अंक र शुभ रङ अनिवार्य राख्नुहोस्।`;

    const userQuery = `आज मिति ${adDateStr} (${nepaliVSDatStr}) को लागि विस्तृत दैनिक राशिफल तयार पार्नुहोस्। 
    शीर्षकमा "आजको राशिफल: ${nepaliVSDatStr}" राख्नुहोला।`;

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

        // २. सुधारिएको प्रिमियम डिजाइन (Clean UI)
        const finalHTML = `
            <div style="font-family: 'Mukta', sans-serif; max-width: 800px; margin: auto; background-color: #ffffff; border: 1px solid #eee; border-radius: 20px; overflow: hidden; box-shadow: 0 15px 35px rgba(0,0,0,0.1);">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #6a1b9a 0%, #4a148c 100%); padding: 40px 20px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 36px; letter-spacing: 1px; border-bottom: 2px solid #ffab40; display: inline-block; padding-bottom: 5px;">आजको राशिफल</h1>
                    <p style="margin: 15px 0 0; font-size: 22px; color: #ffab40; font-weight: bold;">${nepaliVSDatStr}</p>
                    <p style="margin: 5px 0 0; font-size: 16px; opacity: 0.8;">अङ्ग्रेजी मिति: ${adDateStr}</p>
                </div>
                
                <!-- Astrology Image (Corrected Rashi Chakra) -->
                <div style="width: 100%; background-color: #f3e5f5; text-align: center; padding: 20px 0;">
                    <img src="https://img.freepik.com/free-vector/astrology-zodiac-signs-wheel-poster_1017-31363.jpg" alt="Nepali Rashi Chakra" style="width: 90%; max-width: 500px; height: auto; border-radius: 50%; box-shadow: 0 5px 15px rgba(0,0,0,0.2); margin: auto; display: block;">
                </div>

                <!-- Content Area -->
                <div style="padding: 40px; line-height: 2; font-size: 20px; color: #333; background-color: #fffaf0;">
                    <div style="text-align: justify; white-space: pre-line;">
                        ${rawContent}
                    </div>
                </div>

                <!-- Footer -->
                <div style="background-color: #f8f9fa; padding: 25px; text-align: center; border-top: 1px solid #eee;">
                    <p style="margin: 0; font-weight: bold; color: #4a148c; font-size: 20px;">त्रिकाल ज्ञान मार्ग - tkg.com.np</p>
                    <p style="margin: 5px 0 0; color: #666; font-size: 16px;">तपाईँको आजको दिन शुभ रहोस्!</p>
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
            console.log("सफलता! सबै कुरा सुधारिएर राशिफल पब्लिश भयो।");
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
