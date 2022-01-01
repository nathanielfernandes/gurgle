const puppeteer = require('puppeteer');
const express = require('express');

const app = express()

class Gurgle {
    static browser;
    static pages = [];
    static cache = {};

    static {
        console.log("Setting Up");

        puppeteer.launch().then((pup) => {
            browser = pup
            for (let i = 0; i < 20; i++) {
                browser.newPage().then(p => pages.push(p));        
            }
        });

        console.log("Finished Setup");
    }

    static async search (term, res) {
        term = term.replace(" ", "+");

        const c_found = cache[term];
        if (c_found !== undefined) {
            if ((Date.now() - c_found.timestamp)/1000 < 3600) {
                res.send(c_found.found);
                console.log(c_found.timestamp);
                return;
            }
        }
    
        const page = pages.pop();
        let f = false;
        if (page === null) {
            page = await browser.newPage();
            f = true;
        }
    
        await page.goto("https://www.google.com/search?tbm=isch&q=" + term);
    
        const content = await page.content();
    
        let found = [...content.matchAll(/http[s]*:\/\/[a-z\-_0-9\/.]+\.[a-z.]{2,3}\/[a-z0-9\-_\/._~:?#\[\]@!$&'()*+,;=%]*[a-z0-9]+\.(:?jpg|jpeg|png|gif)/gi)].map(match => match[0]);
        found = JSON.stringify(found.slice(4));
        cache[term] = {timestamp: Date.now(), found};
        res.send(found);
        
        await page.close();

        if (!f) {
            pages.push(await browser.newPage());
        }
    }
}

app.get('/', (_req, res) => {
    res.send("gurgle")
})
  
app.get('/:search', async (req, res) => {
    let search = req.params.search || "";
    await Gurgle.search(search, res);
})

app.listen(80, () => {
  console.log(`Gurgle listening at http://0.0.0.0:80`)
})
