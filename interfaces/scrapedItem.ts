export default interface ScrapedItem {
    title: string;
    subtitle: string;
    description: string;
    price: number;
    specifications: Record<string, string>;
    type: string;
    profile_image: string;
    source: 'Rozetka' | 'Telemart';
    url: string;
}