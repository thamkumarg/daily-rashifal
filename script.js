/**
 * 🕉️ TKG RASHIFALA PUBLISHER - REVERTED TO STABLE VERSION
 * Back to the logic that worked before the 404 complications.
 */

const https = require('https');

async function run() {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim();
    const wpPass = (process.env.WP_PASS || "").trim();
    const wpUser = "trikal";
    const wpHost = "tkg.com.np";

    if (!apiKey) { console.error("❌ GEMINI_API_KEY is missing!"); process.exit(1); }
    if (!wpPass) { console.error("❌ WP_PASS is missing!"); process.exit(1); }

    // --- नेपाली मिति गणना (बि.सं. २०८२ फागुन ६) ---
    const now = new Date();
    const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
    const npTime = new Date(utcTime + (5.75 * 60 * 60 * 1000));
    
    // आजको लागि नेपाली मिति फिक्स
    const nepaliDateStr = "६ फागुन २०८२, मंगलबार"; 
    const englishDateStr = npTime.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const fullDateDisplay = `${nepaliDateStr} (${englishDateStr})`;

    console.log(`🚀 मिति: ${fullDateDisplay} को लागि काम सुरु भयो...`);

    try {
        const content = await getAIResponse(apiKey, fullDateDisplay);
        
        if (!content || content.length < 500) {
            throw new Error("AI content generation failed or too short.");
        }

        const htmlBody = `
<div style="font-family: 'Mukta', sans-serif; border: 2px solid #e53e3e; border-radius: 15px; padding: 25px; background-color: #fffaf0; max-width: 800px; margin: auto; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 20px;">
        <img src="https://tkg.com.np/wp-content/uploads/2024/01/rashifal-banner.jpg" onerror="this.src='https://img.freepik.com/free-vector/zodiac-signs-wheel-astrology-background_1017-31362.jpg'" alt="Rashifal" style="width: 100%; border-radius: 10px;">
    </div>
    <h1 style="color: #c53030; text-align: center; font-size: 28px; margin-bottom: 10px;">आजको राशिफल</h1>
    <h3 style="color: #2d3748; text-align: center; font-weight: normal; margin-bottom: 25px;">मिति: ${fullDateDisplay}</h3>
    
    <div style="font-size: 19px; line-height: 1.9; color: #1a202c; text-align: justify;">
        ${content.split('\n').map(line => line.trim() ? `<p>${line}</p>` : '').join('')}
    </div>

    <div style="margin-top: 30px; text-align: center; border-top: 2px solid #feb2b2; padding-top: 20px; color: #4a5568;">
        <p>प्रस्तुति: <b>त्रिकाल ज्ञान मार्ग (TKG)</b></p>
        <p style="font-size: 14px;">तपाईँको दिन शुभ रहोस्!</p>
    </div>
</div>`;

        const postTitle = `आजको राशिफल - ${nepaliDateStr}`;
        await postToWP(wpHost, wpUser, wpPass, postTitle, htmlBody);
        console.log("🎉 WordPress मा सफलतापूर्वक पोस्ट गरियो!");

    } catch (err) {
        console.error("❌ Error occurred:", err.message);
        process.exit(1);
    }
}

function getAIResponse(key, date) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify({
            contents: [{ parts: [{ text: `तपाईँ एक अनुभवी नेपाली ज्योतिषी हुनुहुन्छ। आज मिति ${date} को लागि १२ राशिको विस्तृत दैनिक राशिफल नेपाली भाषामा लेख्नुहोस्। प्रत्येक राशिको नाम र चिन्ह बोल्डमा लेख्नुहोस्। राशिफलमा सकारात्मक र आध्यात्मिक भाषा प्रयोग गर्नुहोस्।` }] }]
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', d => data += d);
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    return reject(new Error(`API Error ${res.statusCode}: ${data}`));
                }
                try {
                    const result = JSON.parse(data);
                    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
                    resolve(text || "");
                } catch (e) { reject(e); }
            });
        });

        req.on('error', reject);
        req.write(payload);
        req.end();
    });
}

function postToWP(host, user, pass, title, content) {
    return new Promise((resolve, reject) => {
        const auth = Buffer.from(`${user}:${pass}`).toString('base64');
        const postData = JSON.stringify({
            title: title,
            content: content,
            status: 'publish'
        });

        const options = {
            hostname: host,
            path: '/wp-json/wp/v2/posts',
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let resBody = '';
            res.on('data', d => resBody += d);
            res.on('end', () => {
                if (res.statusCode === 201) resolve();
                else reject(new Error(`WP API Error ${res.statusCode}: ${resBody}`));
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

run();
