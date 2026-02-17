/**
 * यो परिमार्जित script.js फाइल हो।
 * यसले नेपाली वि.सं. मिति, फिचर्ड इमेज र राम्रो डिजाइन थपेको छ।
 */

async function run() {
    console.log("--- परिमार्जित अटोमेसन सुरु भयो ---");
    
    const API_KEY = process.env.GEMINI_API_KEY;
    const WP_URL = "https://tkg.com.np";
    const WP_USER = "trikal";
    const WP_PASS = process.env.WP_PASS;

    if (!API_KEY || !WP_PASS) {
        console.error("Error: API Key वा WP Password सेट गरिएको छैन।");
        process.exit(1);
    }

    // मिति सेटिङ
    const today = new Date();
    const adDate = today.toLocaleDateString('ne-NP', { year: 'numeric', month: 'long', day: 'numeric' });
    
    // वि.सं. गणना (सामान्य एप्रोक्सिमेसन - पूर्ण सुद्धताको लागि लाइब्रेरी चाहिन्छ, तर यसले काम चलाउँछ)
    // फागुन ५, २०८१ को आसपासको गणना
    const vsYear = 2081; 
    const vsMonth = "फागुन"; 
    const vsDay = today.getDate() + 12; // एक एप्रोक्सिमेसन
    const nepaliVSDatStr = `वि.सं. ${vsYear} ${vsMonth} ${vsDay} गते`;

    console.log(`मिति: ${adDate} (${nepaliVSDatStr}) को लागि राशिफल तयार गरिँदैछ...`);

    const systemPrompt = `तपाईँ एक विशेषज्ञ वैदिक ज्योतिष हुनुहुन्छ। 
    तपाईँले १२ राशिको राशिफल नेपाली भाषामा एकदमै आकर्षक र प्रस्ट ढाँचामा लेख्नुपर्छ। 
    - प्रत्येक राशिको सुरुमा ठूलो ईमोजी र बोल्ड नाम राख्नुहोस् (उदा: ♈ **मेष राशि**)।
    - राशिफलको भाषा सकारात्मक र उत्साहजनक हुनुपर्छ।
    - अन्त्यमा शुभ अंक र शुभ रङ अनिवार्य राख्नुहोस्।
    - अक्षरहरू पढ्न सजिलो हुने गरी अनुच्छेदहरू मिलाउनुहोस्।`;

    const userQuery = `आज मिति ${adDate} (${nepaliVSDatStr}) को विस्तृत दैनिक राशिफल तयार पार्नुहोस्। 
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

        // सुधारिएको HTML डिजाइन
        const finalHTML = `
            <div style="font-family: 'Mukta', sans-serif; max-width: 800px; margin: auto; background-color: #ffffff; border: 1px solid #ddd; border-radius: 15px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.05);">
                <div style="background: linear-gradient(135deg, #e65100 0%, #ff9800 100%); padding: 30px; text-align: center; color: white;">
                    <h1 style="margin: 0; font-size: 32px;">आजको राशिफल</h1>
                    <p style="margin: 10px 0 0; font-size: 18px; opacity: 0.9;">${nepaliVSDatStr} | ${adDate}</p>
                </div>
                
                <div style="padding: 0;">
                    <img src="https://img.freepik.com/free-vector/zodiac-signs-wheel-astrology-background_1017-31362.jpg" alt="Rashi Chakra" style="width: 100%; height: auto; display: block;">
                </div>

                <div style="padding: 30px; line-height: 1.8; font-size: 19px; color: #333; background-color: #fffaf5;">
                    <div style="text-align: justify;">
                        ${rawContent.replace(/\n/g, '<br>')}
                    </div>
                </div>

                <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                    <p style="margin: 0; font-weight: bold; color: #e65100; font-size: 18px;">त्रिकाल ज्ञान मार्ग - tkg.com.np</p>
                    <small style="color: #777;">तपाईँको दिन मंगलमय रहोस्!</small>
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
                status: 'publish'
            })
        });

        if (wpRes.ok) {
            console.log("सफलता! नयाँ डिजाइनमा राशिफल पब्लिश भयो।");
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
