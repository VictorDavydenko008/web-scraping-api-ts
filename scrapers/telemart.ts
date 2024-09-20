import axios from 'axios';
import cheerio from 'cheerio';
import ScrapedItem from '../interfaces/scrapedItem';

export default async function scrapeTelemart(url: string, pages_num: number): Promise<{ pagesData: { pageItems: ScrapedItem[]}[] }> {
    try {
        // define the type of the current page: first page or one of the pages
        const match = url.match(/\?page=(\d+)$/);
        const currentPage = match ? parseInt(match[1], 10) : 1;

        let totalPagesNum = currentPage;
        if (pages_num !== 1) {
            const html = await axios.get(url);
            const $ = cheerio.load(html.data);

            const endPageElement = $('.page-item:eq(-2) a').text().trim();
            if (endPageElement) {
                totalPagesNum = parseInt(endPageElement, 10);
            } // else its the last page
        }

        // validate resulting page
        const endPage = Math.min((currentPage + pages_num - 1), totalPagesNum);
        
        let data:{ pagesData: { pageItems: ScrapedItem[] }[] } = { pagesData: [] };

        for (let i = currentPage; i <= endPage; i++) {
            const pageUrl = currentPage !== 1 ? url.replace(/\d$/, `${i}`) : url + `?page=${i}`;
            const pageData = await scrapePage(pageUrl);
            data.pagesData.push(pageData);
        }
        
        return data;
    } catch (error) {
        console.error('Error scraping Telemart: ', error);
        throw error;
    }
}

// scrape data about products from category page
async function scrapePage(url: string): Promise<{ pageItems: ScrapedItem[]}> {
    try {
        const html = await axios.get(url);
        const $ = cheerio.load(html.data); 

        const itemsLinksElements = $('.product-item__title a');

        // page contains no items
        if (!itemsLinksElements.length) { return { pageItems: [] } };

        // get list of products links
        const itemsLinks = itemsLinksElements.get().map(item => $(item).attr('href'));
        if (!itemsLinks.length) throw new Error("It seems the website's layout has been altered.");

        const items: ScrapedItem[] = [];

        // scrape each item on the page by its link
        for (const itemUrl of itemsLinks) {
            if (itemUrl) {
                const itemData = await scrapeItem(itemUrl);
                items.push(itemData);
            }
        }
        
        return { pageItems: items };
    } catch (error) {
        console.error('Error scraping page: ', error);
        throw error;
    }
}

// scrape data about product from its page
async function scrapeItem(url: string): Promise<ScrapedItem> {
    try {
        const html = await axios.get(url);
        const $ = cheerio.load(html.data); 

        const titleElement = $(".card-block__title");
        if (!titleElement.length) throw new Error("It seems the website's layout has been altered.");
        const title = titleElement.text().trim();

        // use item code instead of subtitle
        const itemCode = $(".card-block__art p:eq(1)").text().trim();
        if (!itemCode) throw new Error("It seems the website's layout has been altered.");
        const subtitle = itemCode;
        
        // object to store description content
        let descriptionText = { content: "" };

        // define if description is provided
        const descriptionElement = $('.card-block__description-text').length ? $('.card-block__description-text') : null;

        if (descriptionElement) {
            collectDescription(descriptionElement, descriptionText, $);  
        }

        const description = descriptionText.content.trim().replace(/\n$/, '');

        const priseElement = $('.card-block__price-summ:eq(0)');
        // item is out of stock
        const price = priseElement.length ? parseFloat(priseElement.text().trim().replace(/\D+|\s+/g, '')) : 0.0;

        const typeElement = $('.breadcrumb-item:eq(-2)');
        if (!typeElement.length) throw new Error("It seems the website's layout has been altered.");
        const type = typeElement.text().trim();

        const imageUrl= $('.img4zoom img:eq(0)').attr('src');
        if (!imageUrl) throw new Error("It seems the website's layout has been altered.");
        const image = imageUrl;
        
        let specifications = {};
        specifications = collectSpecifications($);

        return {
            title: title, 
            subtitle: subtitle,
            description: description, 
            price: price,
            specifications: specifications,
            type: type,
            profile_image: image,
            source: 'Telemart',
            url: url
        }
    } catch (error) {
        console.error('Error scraping item: ', error);
        throw error;
    }
}

// collect the specifications of the item
function collectSpecifications($: cheerio.Root): Record<string, string> {
    let specifications: Record<string, string> = {};

    $('.card-block__specific-table .card-block__specific-header:eq(0)')
        // skip the advertisement block
        .nextUntil('.card-block__specific-table .card-block__specific-header:eq(-2)')
  	    .not('.card-block__specific-header')
    	.add($('.card-block__specific-table .card-block__specific-header:eq(-1)').nextAll())
        .each((_, row) => {
            const cols = $(row).children('.card-block__specific-col');
            let label = '';
            cols.eq(0).contents().filter((_, elem) => {
                return elem.type === 'text';
            }).each((_, e) => {
                label += $(e).text().trim();
            });
            
            let value = ''; 
            cols.eq(1).contents().each((_, elem) => { 
                const text = $(elem).text().trim(); 
                if (text) { 
                    value += text + '\n'; 
                } 
            });
            
            specifications[label] = value.replace(/\n$/, '');
        });

    return specifications;
}

// recursively collect description text and images url
function collectDescription(element: cheerio.Cheerio, descriptionText: { content: string; }, $: cheerio.Root): void {
    if (!element) { return; }  
    
    element.contents().each((_, elem) => {
        if (elem.type === 'text') {
            const text = $(elem).text().trim();                				
            if (text) {
                descriptionText.content += text + '\n';                
            }
        } else if (elem.type === 'tag' && elem.name !== 'style') {
            if (elem.name === 'img') {
                descriptionText.content += `[${$(elem).attr('src')}]` + '\n';
            } else {
                collectDescription($(elem), descriptionText, $);
            }
        }
    });  
}