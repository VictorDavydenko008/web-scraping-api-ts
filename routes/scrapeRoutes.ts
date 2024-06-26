import 'dotenv/config.js';
import express from 'express';
const router = express.Router();
import Item from '../models/item';
import scrapeRozetka from '../scrapers/rozetka';
import scrapeTelemart from '../scrapers/telemart';

// POST-request to fill the database with items from url of Rozetka
router.post('/scrape/rozetka', async (req: { body: { url: string; pages_num: number; }; }, res) => {
    try {
        // if url belongs to Rozetka
        if (!req.body.url.startsWith('https://rozetka.com.ua/')) {
            res.status(400).json({ error: 'Invalid URL. Expected Rozetka website URL.' }); 
            return;          
        }

        let pagesNum = Math.floor(req.body.pages_num);
        if (isNaN(pagesNum)) { // pages_num parameter is not provided or invalid
            pagesNum = 1;
        } if (!(Number.isInteger(pagesNum) && (pagesNum > 0))) {
            res.status(400).json({ error: 'Invalid number of pages. Expected integer greater than 0.'});
            return;
        }

        const data = await scrapeRozetka(req.body.url, pagesNum);
        
        // save each scrapped item to the database
        for (const page of data.pagesData) {
            for (const itemData of page.pageItems) {
                const item = new Item({
                    title: itemData.title,
                    subtitle: itemData.subtitle,
                    description: itemData.description,
                    price: itemData.price,
                    specifications: itemData.specifications,
                    type: itemData.type,
                    profile_image: itemData.profile_image,
                    source: itemData.source,
                    url: itemData.url
                });

                const newItem = await item.save();
                console.log(newItem);
            }
        }
        
        // return saved data
        res.status(201).json( data );
    } catch (error) {
        res.status(400).json({ error: 'Failed to scrape and save data.'});
    }
});


// POST-request to fill the database with items from url of Telemart
router.post('/scrape/telemart', async (req, res) => {
    try {
        if (!req.body.url.startsWith('https://telemart.ua/')) {
            res.status(400).json({ error: 'Invalid URL. Expected Telemart website URL.' }); 
            return;
        }

        let pagesNum = Math.floor(req.body.pages_num);
        if (isNaN(pagesNum)) { // pages_num parameter is not provided or invalid
            pagesNum = 1;
        } else if (!(Number.isInteger(pagesNum) && pagesNum > 0)) {
            res.status(400).json({ error: 'Invalid number of pages. Expected integer greater than 0.' });
            return;
        }

        const data = await scrapeTelemart(req.body.url, pagesNum);

        // save each scrapped item to the database
        for (const page of data.pagesData) {
            for (const itemData of page.pageItems) {
                const item = new Item({
                    title: itemData.title,
                    subtitle: itemData.subtitle,
                    description: itemData.description,
                    price: itemData.price,
                    specifications: itemData.specifications,
                    type: itemData.type,
                    profile_image: itemData.profile_image,
                    source: itemData.source,
                    url: itemData.url
                });

                const newItem = await item.save();
                console.log(newItem);
            }
        }
        
        // return saved data
        res.status(201).json( data );
    } catch (error) {
        res.status(400).json({ error: 'Failed to scrape and save data.' });
    }
})

// GET-request to the database to get items types
router.get('/', async (req, res) => {
    try {
        let distinctTypes = await Item.distinct('type');
        res.status(200).json(distinctTypes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get items types.' });
    }
})

// GET-request to the database to get all items 
router.get('/all', async (req, res) => {
    try {
        const items = await Item.find();
        res.status(200).json( items );
    } catch (error) {
        res.status(500).json({ error: 'Failed to get items.'});
    }
})

// GET-request to the database to get all items of specific type
router.get('/items/:type', async(req, res) => {
    try {
        const items = await Item.find({ type: req.params.type });
        res.status(200).json( items );
    } catch (error) {
        res.status(400).json({ error: 'Failed to get items of type ' + req.body.type + '.' });
    }
})

export default router;