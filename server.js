const puppeteer = require('puppeteer');
const express = require('express');

const app = express()

class Gurgle {
    static browser;
    static pages = [];
    static cache = {};

    static {
        console.log("Setting Up");

        puppeteer.launch({
            headless: true,
            args: [
                "--disable-gpu",
                "--disable-dev-shm-usage",
                "--disable-setuid-sandbox",
                "--no-sandbox",
            ]
        }).then((pup) => {
            Gurgle.browser = pup
            for (let i = 0; i < 20; i++) {
                Gurgle.browser.newPage().then(p => Gurgle.pages.push(p));        
            }
        });

        console.log("Finished Setup");
    }

    static async search (term, res) {
        res.setHeader('Content-Type', 'application/json')

        // const c_found = Gurgle.cache[term];
        // if (c_found !== undefined) {
        //     if ((Date.now() - c_found.timestamp)/1000 < 3600) {
        //         res.send(c_found.found);
        //         return;
        //     }
        // }
    
        const page = Gurgle.pages.pop();
        let f = false;
        if (page === null) {
            page = await Gurgle.browser.newPage();
            f = true;
        }
    
        await page.goto("https://www.amazon.ca/dp/" + term);
        
        try {
            const content = await page.content();

            // |<span aria-hidden="true">(\$\d+\.\d+)<\/span>
            let found = [...content.matchAll(/<span class="a-offscreen">(\$\d+\.\d+)<\/span>/g)].map(m => m[1]).filter(m => m);
    
            // Gurgle.cache[term] = {timestamp: Date.now(), found};
            res.send(JSON.stringify(found));
        } catch (e) {
            res.send(JSON.stringify(e))
        } finally {
            await page.close();

            if (!f) {
                Gurgle.pages.push(await Gurgle.browser.newPage());
            }
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
