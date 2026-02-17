/**
 * ⚡ THE LAST STAND - BULLETPROOF VERSION
 * यो कोडमा ३ पटक सम्म अटो-रिट्राई (Auto-Retry) फिचर थपिएको छ।
 * वर्डप्रेस अटोमेसनका लागि सबैभन्दा सुरक्षित र स्थिर संस्करण।
 */

const https = require('https');

// अटो-रिट्राई सहितको एआई सामग्री ल्याउने फङ्सन
async function fetchAIWithRetry(apiKey, dateStr, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            return await fetchAIContent(apiKey, dateStr);
        } catch (err) {
            console.log(`⚠️ AI Attempt ${i + 1} failed, retrying...`);
            if (i === retries - 1) throw err;
            await new Promise(r => setTimeout(r, 2000));
        }
    }
}

function fetchAIContent(apiKey, englishDateStr) {
    return new Promise((resolve, reject) => {
        const aiPayload = JSON.stringify({
            contents: [{ parts: [{ text: `आजको मिति ${englishDateStr} हो। यसको नेपाली गते पत्ता लगाई १२ राशिको विस्तृत फल लेख्नुहोस्।` }] }],
            systemInstruction: { parts: [{ text: `तपाईँ विशेषज्ञ ज्योतिष हुनुहुन्छ। राशिफल <h3> र <p> ट्यागमा लेख्नुहोस्। भूमिका नलेख्नुहोस्।` }] }
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            path: `/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode !== 200) return reject(new Error(`AI Status ${res.statusCode}: ${data}`));
                try {
                    const parsed = JSON.parse(data);
                    const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (content) resolve(content);
                    else reject(new Error("AI response empty"));
                } catch (e) { reject(e); }
            });
        });
        req.on('error', reject);
        req.write(aiPayload);
        req.end();
    });
}

// वर्डप्रेस पब्लिशिङ (अझ बढी कडा Headers को साथ)
function publishToWP(host, user, pass, dateStr, content) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            title: `आजको दैनिक राशिफल - ${dateStr}`,
            content: content,
            status: 'publish',
            categories: [1]
        });

        const auth = Buffer.from(`${user.trim()}:${pass.trim()}`).toString('base64');
        const options = {
            hostname: host,
            port: 443,
            path: '/wp-json/wp/v2/posts',
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
                'User-Agent': 'NodeJS/WP-Automation-Final'
            }
        };

        const req = https.request(options, (res) => {
            let resBody = '';
            res.on('data', (d) => { resBody += d; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) resolve(resBody);
                else reject(new Error(`WP ERROR ${res.statusCode}: ${resBody}`));
            });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function run() {
    const apiKey = (process.env.GEMINI_API_KEY || "").trim(); 
    const WP_HOST = "tkg.com.np";
    const WP_USER = "trikal";
    const WP_PASS = (process.env.WP_PASS || "").replace(/\s/g, '').trim();

    if (!apiKey || !WP_PASS) {
        console.error("❌ Fatal: Missing Secrets!");
        process.exit(1);
    }

    try {
        const today = new Date();
        const npTime = new Date(today.getTime() + (5.75 * 60 * 60 * 1000));
        const dateStr = npTime.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        console.log(`⏳ Step 1: Generating content for ${dateStr}...`);
        let content = await fetchAIWithRetry(apiKey, dateStr);
        content = content.replace(/```html/gi, '').replace(/```/g, '').trim();

        const html = `
            <div style="font-family: 'Mukta', sans-serif; background: #000; color: #eee; padding: 25px; border: 1px solid #d4af37; border-radius: 12px;">
                <h1 style="color: #d4af37; text-align: center;">आजको दैनिक राशिफल</h1>
                <p style="text-align: center; color: #888;">मिति: ${dateStr}</p>
                <div style="margin-top: 20px;">${content}</div>
                <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #555;">© त्रिकाल ज्ञान मार्ग</div>
            </div>`;

        console.log(`⏳ Step 2: Publishing to ${WP_HOST}...`);
        const res = await publishToWP(WP_HOST, WP_USER, WP_PASS, dateStr, html);
        console.log(`✅ SUCCESS! Post ID: ${JSON.parse(res).id}`);

    } catch (error) {
        console.error(`❌ FAILED: ${error.message}`);
        process.exit(1);
    }
}

run();
