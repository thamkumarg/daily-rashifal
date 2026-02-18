/**
 * ⚡ TKG RASHIFAL ENGINE - FINAL PRODUCTION READY
 * यो संस्करणमा एआई मोडलको ४०४ समस्या समाधान गरिएको छ।
 */

const https = require('https');

async function run() {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    const wpPass = (process.env.WP_PASS || "").trim();
    const wpUser = "trikal";
    const wpHost = "tkg.com.np";

    console.log("🔍 Checking Environment...");
    if (!apiKey) { console.error("❌ Error: GEMINI_API_KEY नभेटिएकोले काम रोकियो।"); process.exit(1); }
    if (!wpPass) { console.error("❌ Error: WP_PASS नभेटिएकोले काम रोकियो।"); process.exit(1); }

    try {
        const today = new Date();
        const npTime = new Date(today.getTime() + (5.75 * 60 * 60 * 1000));
        const dateStr = npTime.toLocaleDateString('ne-NP', { year: 'numeric', month: 'long', day: 'numeric' });

        console.log(`🚀 ${dateStr} को लागि प्रक्रिया सुरु भयो...`);

        // १. एआईबाट सामग्री ल्याउने
        console.log("⏳ एआईबाट राशिफल मगाउँदै...");
        const content = await getAIContent(apiKey, dateStr);
        
        if (!content || content.length < 100) {
            throw new Error("एआईले पर्याप्त सामग्री दिएन।");
        }

        // २. एचटीएमएल ढाँचा तयार पार्ने
        const htmlPost = `
<div style="font-family: 'Mukta', sans-serif; padding: 20px; border: 2px solid #d4af37; border-radius: 15px; background: #fff; color: #333;">
    <h2 style="color: #d4af37; text-align: center;">आजको राशिफल: ${dateStr}</h2>
    <div style="line-height: 1.8; font-size: 18px;">
        ${content.replace(/\n/g, '<br>')}
    </div>
    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
    <p style="text-align: center; color: #777; font-size: 14px;">© त्रिकाल ज्ञान मार्ग | tkg.com.np</p>
</div>`;

        // ३. वर्डप्रेसमा पठाउने
        console.log("⏳ वर्डप्रेस (tkg.com.np) मा पब्लिश गर्दै...");
        await postToWP(wpHost, wpUser, wpPass, `आजको दैनिक राशिफल - ${dateStr}`, htmlPost);
        
        console.log("✅ सफल भयो! राशिफल वेबसाइटमा पब्लिश भइसक्यो।");

    } catch (err) {
        console.error(`❌ काम बिग्रियो: ${err.message}`);
        process.exit(1);
    }
}

function getAIContent(key, date) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({
            contents: [{ parts: [{ text: `आज ${date} को लागि १२ वटै राशिको नेपाली राशिफल लेख्नुहोस्। प्रत्येक राशिको नाम र चिन्ह बोल्डमा राख्नुहोस्।` }] }]
        });
        
        // मोडल नाम परिवर्तन गरिएको छ (४०४ हटाउन)
        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${key}`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };

        const req = https.request(options, (res) => {
            let d = '';
            res.on('data', chunk => d += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    return reject(new Error(`AI API Error (${res.statusCode}): ${d}`));
                }
                try {
                    const json = JSON.parse(d);
                    const result = json.candidates[0].content.parts[0].text;
                    resolve(result);
                } catch (e) {
                    reject(new Error("AI response parse error"));
                }
            });
        });
        req.on('error', (e) => reject(new Error(`AI Network Error: ${e.message}`)));
        req.write(body);
        req.end();
    });
}

function postToWP(host, user, pass, title, content) {
    return new Promise((resolve, reject) => {
        const auth = Buffer.from(`${user}:${pass}`).toString('base64');
        const body = JSON.stringify({ 
            title: title, 
            content: content, 
            status: 'publish',
            categories: [1] 
        });

        const options = {
            hostname: host,
            path: '/wp-json/wp/v2/posts',
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
                'User-Agent': 'TKG-Auto-Bot/1.0'
            }
        };

        const req = https.request(options, (res) => {
            let d = '';
            res.on('data', chunk => d += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve();
                } else {
                    reject(new Error(`WP Error (${res.statusCode}): ${d}`));
                }
            });
        });
        req.on('error', (e) => reject(new Error(`WP Network Error: ${e.message}`)));
        req.write(body);
        req.end();
    });
}

run();
