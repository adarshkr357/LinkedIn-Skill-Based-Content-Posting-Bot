require('dotenv').config();
const config = require('./config.js');
const fs = require('fs');

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

function capture(userString, first, last, isHtml = false) {
    const regex = new RegExp(`${first}(.*?)${last}`, 's');
    const match = userString.match(regex);
    if (match) {
        let result = match[1];
        if (!isHtml) {
            result = result.replace(/\s\s+/g, '').trim();
        }
        return result;
    }
    return null;
};

function recursiveCapture(userString, start, final, isHtml = false) {
    const regex = new RegExp(`${start}(.*?)${final}`, 'g');
    let matches = [...userString.matchAll(regex)].map(match => match[1]);

    if (!isHtml) {
        matches = matches.map(match => match.replace(/<[^>]*>?/gm, '').trim());
    }

    return matches;
};

function updateConfig() {
    const updatedConfig = JSON.stringify(config, null, 2);  // Serialize the configuration object to JSON
    fs.writeFileSync('./config.js', `module.exports = ${updatedConfig};`, 'utf-8');
}

async function getSkillsFromLinkedin() {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // Specify your chrome path.
        headless: "new"  // Make it false (headless: false) if there are too many errors.
    });
    const pages = await browser.pages();
    const page = pages[0];

    await page.goto("https://www.linkedin.com/login", {
        waitUntil: 'networkidle0'
    });

    await page.type('#username', process.env.linkedin_email);
    await page.type('#password', process.env.linkedin_pass);
    await page.click('button[aria-label="Sign in"]');

    const loginHttpRequestBlock = await page.waitForResponse(httpRequest => httpRequest.url() == 'https://www.linkedin.com/checkpoint/lg/login-submit');
    
    if (parseInt(loginHttpRequestBlock.status().toString().substr(0, 1)) != 3) {
        const loginBlockResponse = await loginHttpRequestBlock.text();
        if (loginBlockResponse.includes("Wrong email")) {
            console.error("Incorrect email entered.");
        }
        else if (loginBlockResponse.includes("right password")) {
            console.error("Incorrect password entered.");
        }
        else {
            console.error(`Unknown error occured, here's the response: ${loginBlockResponse}`);
        };
        await browser.close();
        process.exit();
    };

    let dashboardHttpRequestBlock;

    try {
        dashboardHttpRequestBlock = await page.waitForResponse(httpRequest => httpRequest.url() == 'https://www.linkedin.com/feed/', {
            timeout: 5000  // Increase it if your connection is slow.
        });
    }
    catch (error) {
        console.error(`Ip banned / Slow connection speed.`);
        await browser.close();
        process.exit();
    };

    const dashboardBlockResponse = await dashboardHttpRequestBlock.text();

    if (!dashboardBlockResponse.includes('recent_activity_nav_all&quot;,&quot;actionTarget&quot;:&quot;https://www.linkedin.com/')) {
        console.error(`Unknown error occured, here's the response: ${dashboardBlockResponse}`);
        await browser.close();
        process.exit();
    };

    const username = capture(dashboardBlockResponse, 'recent_activity_nav_all&quot;,&quot;actionTarget&quot;:&quot;https://www.linkedin.com/', '/recent-activity/&quot;,');

    await page.goto(`https://www.linkedin.com/${username}/details/skills/`);

    const skillHttpRequestBlock = await page.waitForResponse(httpRequest => httpRequest.url().includes('/api/graphql?includeWebMetadata=true&variables=(profileUrn') && httpRequest.url().includes('sectionType:skills'));
    const skillBlockResponse = await skillHttpRequestBlock.text();
    await browser.close();

    if (!skillBlockResponse.includes('"accessibilityText":"Edit ')) {
        console.error(`Unknown error occured, here's the response: ${skillBlockResponse}`);
        await browser.close();
        process.exit();
    };

    const skillLists = recursiveCapture(skillBlockResponse, '"accessibilityText":"Edit ', '",');
    return [...new Set(skillLists)];
};

(async () => {

    if (config.skills.length < 1) {
        config.skills = await getSkillsFromLinkedin();
        updateConfig();
        return;
    };

    let nextPostTimestamp;

    while (true) {

        const currentTimestamp = Date.now();

        if (currentTimestamp >= nextPostTimestamp) {
            //
            nextPostTimestamp = currentTimestamp + 24*60*60*1000;  // 24 hours * 60 minutes * 60 seconds * 1000 milliseconds
        }

    };

})();
