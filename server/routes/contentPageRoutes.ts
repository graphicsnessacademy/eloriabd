import express, { Request, Response } from 'express';
import adminAuth from '../middleware/adminAuth';
import ContentPage from '../models/ContentPage';

const router = express.Router();

// ─── PUBLIC ROUTES ────────────────────────────────────────────────────────────
// GET /api/pages/:slug
router.get('/:slug', async (req: Request, res: Response) => {
    try {
        const page = await ContentPage.findOne({ slug: req.params.slug });
        if (!page) {
            return res.status(404).json({ message: 'Page not found' });
        }
        res.json({ title: page.title, body: page.body, updatedAt: page.updatedAt });
    } catch (error) {
        console.error('Error fetching page:', error);
        res.status(500).json({ message: 'Error fetching page' });
    }
});

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

// GET /api/pages/admin/list
router.get('/admin/list', adminAuth(), async (req: Request, res: Response) => {
    try {
        const pages = await ContentPage.find().sort({ title: 1 }).populate('updatedBy', 'name email');
        res.json(pages);
    } catch (error) {
        console.error('Error fetching pages:', error);
        res.status(500).json({ message: 'Error fetching pages' });
    }
});

// POST /api/pages/admin/create
router.post('/admin/create', adminAuth(['super_admin']), async (req: any, res: Response) => {
    try {
        const { slug, title, body } = req.body;
        
        const existingPage = await ContentPage.findOne({ slug });
        if (existingPage) {
            return res.status(400).json({ message: 'A page with this slug already exists.' });
        }

        const newPage = new ContentPage({
            slug,
            title,
            body: body || '',
            updatedBy: req.admin?._id
        });

        await newPage.save();
        res.status(201).json(newPage);
    } catch (error) {
        console.error('Error creating page:', error);
        res.status(500).json({ message: 'Error creating page' });
    }
});

// PATCH /api/pages/admin/:slug
router.patch('/admin/:slug', adminAuth(), async (req: any, res: Response) => {
    try {
        const { title, body } = req.body;
        
        const page = await ContentPage.findOneAndUpdate(
            { slug: req.params.slug },
            { 
                title, 
                body, 
                updatedBy: req.admin?._id 
            },
            { new: true }
        );

        if (!page) {
            return res.status(404).json({ message: 'Page not found' });
        }

        res.json(page);
    } catch (error) {
        console.error('Error updating page:', error);
        res.status(500).json({ message: 'Error updating page' });
    }
});

// DELETE /api/pages/admin/:slug
router.delete('/admin/:slug', adminAuth(['super_admin']), async (req: Request, res: Response) => {
    try {
        const page = await ContentPage.findOneAndDelete({ slug: req.params.slug });
        if (!page) {
            return res.status(404).json({ message: 'Page not found' });
        }
        res.json({ message: 'Page deleted successfully' });
    } catch (error) {
        console.error('Error deleting page:', error);
        res.status(500).json({ message: 'Error deleting page' });
    }
});

export default router;
