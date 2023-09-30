require('dotenv').config(); //

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin()); //

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

(async () => {

    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', // When your puppeteer is not able to find your chrome path then use this but make sure to put your chrome path.
        headless: false
    });
    const pages = await browser.pages(); // Get pages
    const page = pages[0]; // Select first page

    await page.goto("https://www.linkedin.com/login");

    await page.waitForSelector('#username', {
        visible: true
    });

    await page.type('#username', process.env.linkedin_email);
    await page.type('#password', process.env.linkedin_pass);
    await page.click('button[aria-label="Sign in"]');
    let dashboardHttpRequestBlock;

    try {
        dashboardHttpRequestBlock = await page.waitForResponse(httpRequest => httpRequest.url() == 'https://www.linkedin.com/feed/', {
            timeout: 5000
        });
    }
    catch (error) {
        console.error(`Invalid login details.`);
        await browser.close();
        process.exit();
    };
    
    const dashboardBlockResponse = await dashboardHttpRequestBlock.text();

    if (!dashboardBlockResponse.includes('recent_activity_nav_all&quot;,&quot;actionTarget&quot;:&quot;https://www.linkedin.com/')) {
        console.error(`Unknown error occured: ${dashboardBlockResponse}`);
        await browser.close();
        process.exit();
    };

    const username = capture(dashboardBlockResponse, 'recent_activity_nav_all&quot;,&quot;actionTarget&quot;:&quot;https://www.linkedin.com/', '/recent-activity/&quot;,');

    await page.goto(`https://www.linkedin.com/${username}/details/skills/`);

    const skillHttpRequestBlock = await page.waitForResponse(httpRequest => httpRequest.url().includes('/api/graphql?includeWebMetadata=true&variables=(profileUrn') && httpRequest.url().includes('sectionType:skills'));
    const skillBlockResponse = await skillHttpRequestBlock.text();

    if (!skillBlockResponse.includes('"accessibilityText":"Edit ')) {
        console.error(`Unknown error occured: ${skillBlockResponse}`);
        await browser.close();
        process.exit();
    };

    const skillLists = recursiveCapture(skillBlockResponse, '"accessibilityText":"Edit ', '",');
    const filtteredSkillSets = [...new Set(skillLists)];

    await browser.close();

})();