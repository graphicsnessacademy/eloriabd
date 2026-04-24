import ContentPage from '../models/ContentPage';

const DEFAULT_PAGES = [
    { slug: 'about-us', title: 'About Us' },
    { slug: 'return-policy', title: 'Return & Refund Policy' },
    { slug: 'privacy-policy', title: 'Privacy Policy' },
    { slug: 'faq', title: 'Frequently Asked Questions' },
    { slug: 'size-guide', title: 'Size Guide' }
];

export const seedPages = async () => {
    try {
        for (const page of DEFAULT_PAGES) {
            const exists = await ContentPage.findOne({ slug: page.slug });
            if (!exists) {
                await ContentPage.create({
                    slug: page.slug,
                    title: page.title,
                    body: '<p>Content coming soon...</p>'
                });
                console.log(`[Seeder] Created default page: ${page.slug}`);
            }
        }
    } catch (error) {
        console.error('[Seeder] Error seeding default pages:', error);
    }
};
