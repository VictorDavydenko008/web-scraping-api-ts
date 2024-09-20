import axios from 'axios';
import cheerio from 'cheerio';
import ScrapedItem from '../interfaces/scrapedItem';

// scrape data about products from category page(s)
export default async function scrapeRozetka(url: string, pages_num: number): Promise<{ pagesData: { pageItems: ScrapedItem[]}[] }> {
    try {
        // define the type of the current page: first page | one of the pages
        const match = url.match(/page=(\d+)\/$/);
        const currentPage = match ? parseInt(match[1], 10) : 1;

        let totalPagesNum = currentPage;
        if (pages_num !== 1) {
            const html = await axios.get(url);
            const $ = cheerio.load(html.data);

            const endPageElement = $('.pagination__list .pagination__item:eq(-1) a').text().trim();
            if (endPageElement) {
                totalPagesNum = parseInt(endPageElement, 10);
            } // else its the only page        
        }

        // validate resulting page
        const endPage = Math.min(currentPage + pages_num - 1, totalPagesNum);

        let data:{ pagesData: { pageItems: ScrapedItem[] }[] } = { pagesData: [] };

        for (let i = currentPage; i <= endPage; i++) {
            const pageUrl = (currentPage !== 1) ? url.replace(/\d\/$/, `${i}/`) : url + `page=${i}/`;
            const pageData = await scrapePage(pageUrl);
            data.pagesData.push(pageData);
        }
        
        return data;
    } catch (error) {
        console.error("Error scraping Rozetka: ", error);
        throw error;
    }
}

// scrape data about products from category page
async function scrapePage(url: string): Promise<{ pageItems: ScrapedItem[]}> {
    try {
        const html = await axios.get(url);
        const $ = cheerio.load(html.data);

        const itemsLinksElements = $('.product-link.goods-tile__heading');

        // page contains no items
        if (!itemsLinksElements.length) { return { pageItems: [] } };

        // get list of products links
        const itemsLinks = itemsLinksElements.get().map(item => $(item).attr('href'));
        if (!itemsLinks.length) throw new Error("It seems the website's layout has been altered.");

        // array to store scraped items
        let items: ScrapedItem[] = [];

        // scrape each item on the page by its link
        for (const itemUrl of itemsLinks) {
            if (itemUrl) {
                const itemData = await scrapeItem(itemUrl);
                items.push(itemData);
            }
        }

        return { pageItems: items };
    } catch (error) {
        console.error("Error scraping page: ", error);
        throw error;
    }
}

// scrape data about product from its page
async function scrapeItem(url: string): Promise<ScrapedItem> {
    try {
        const html = await axios.get(url);
        const $ = cheerio.load(html.data); 

        const titleElement = $("h1.h2.bold.ng-star-inserted");
        if (!titleElement.length) throw new Error("It seems the website's layout has been altered.");
        const title = titleElement.text().trim();

        // use item code instead of subtitle
        const itemCode = $('.rating .ms-auto:eq(0)').text().match(/\d+/);
        if (!itemCode) throw new Error("It seems the website's layout has been altered.");
        const subtitle = itemCode[0];

        let descriptionElement: cheerio.Cheerio | null = null;
        // define page description type
        // NOTE: item can contain both of description types
        if ($('.product-about__description-content').length > 0) {
            descriptionElement = $('.product-about__description-content');
        } else if ($('#description').length > 0) {
            descriptionElement = $('#description');
        } else {
            throw new Error("It seems the website's layout has been altered.");
        }

        // object to store description text and images
        let descriptionText = { content: "" };
        collectDescription(descriptionElement, descriptionText, $);        
        
        if (!descriptionText.content.length) throw new Error("It seems the website's layout has been altered.");
        const description = descriptionText.content;

        const priseElement = $(".product-price__big");
        // item is discontinued
        const price = priseElement.length ? parseFloat(priseElement.text().trim().replace(/\D+|\s+/g, '')) : 0.0;

        const typeElement = $('.breadcrumbs__item:eq(-2)');
        if (!typeElement.length) throw new Error("It seems the website's layout has been altered.");
        const type = typeElement.text().trim().slice(0, -1);

        const imageUrl = $('.picture-container__picture:eq(0)').attr('src');
        if (!imageUrl) throw new Error("It seems the website's layout has been altered.");
        const image = imageUrl;
        
        let specifications = {};
        specifications = await collectSpecifications(url);

        return {
            title: title, 
            subtitle: subtitle,
            description: description, 
            price: price,
            specifications: specifications,
            type: type,
            profile_image: image,
            source: 'Rozetka',
            url: url
        }
    } catch (error) {
        console.error("Error scraping item: ", error);
        throw error;
    }
}

// recursively collect description text and images url
function collectDescription(element: cheerio.Cheerio, descriptionText: { content: string; }, $: cheerio.Root): void {
    if (!element) {
        return;
    }
    
    element.contents().each((_, elem) => {
        if (elem.type === 'text') {
            const text = $(elem).text().replace(/\s+/g, ' '); 
            if (!text.match(/^ *$/g)) {
              descriptionText.content += text;
            }
        } else if (elem.type === 'tag' 
                   && elem.name !== 'style'
                   && elem.name !== 'script'
                  ) {
            if (elem.name === 'img') {
                  descriptionText.content += `[${$(elem).attr('src')}]` + '\n';
            } else if ((descriptionText.content
                            && !descriptionText.content.endsWith('\n')
                            && !descriptionText.content.endsWith(' '))
                        || (elem.name === 'br'
                            && !descriptionText.content.endsWith('\n')))
                        {
                descriptionText.content += '\n';
            }
            collectDescription($(elem), descriptionText, $);
        } 
    });
}

// collect the specifications from item characteristics page
async function collectSpecifications(url: string): Promise<Record<string, string>> {
    try {
        let specifications: Record<string, string> = {};
        
        const html = await axios.get(url + 'characteristics/');
        if (html.status !== 200) {
            throw new Error("It seems the website's layout has been altered.")
        }
        const $ = cheerio.load(html.data);

        $(".list.ng-star-inserted").children(".item.ng-star-inserted").each((_, row) => {
            const label = $(row).find('dt').text().trim();

            let value = "";
            $(row).find('dd ul').children('li').children().each((_, elem) => {
                $(elem).contents().each((_, e) => {
                    const text = $(e).text().trim();
                    if (text) {
                        value += text + '\n';
                    }
                });
            });

            specifications[label] = value.replace(/\n$/, '');
        });

        return specifications;
    } catch (error) {
        throw error;
    }
}