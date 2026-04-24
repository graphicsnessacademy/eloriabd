import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import {
    ArrowLeft, Save, Bold, Italic, Heading1, Heading2,
    List, ListOrdered, Quote, Link2, Image as ImageIcon,
    Loader2
} from 'lucide-react';

export const ContentPageEditor: React.FC = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Link.configure({ openOnClick: false }),
            Image,
        ],
        content: '',
        editorProps: {
            attributes: {
                class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-6',
            },
        },
    });

    useEffect(() => {
        const fetchPage = async () => {
            try {
                // Public endpoint works for fetching content
                const response = await api.get(`/api/pages/${slug}`);
                setTitle(response.data.title);
                if (editor) {
                    editor.commands.setContent(response.data.body);
                }
            } catch (error) {
                console.error('Failed to fetch page', error);
                alert('Failed to load page content.');
                navigate('/admin/pages');
            } finally {
                setIsLoading(false);
            }
        };

        if (slug && editor) {
            fetchPage();
        }
    }, [slug, editor, navigate]);

    const handleSave = async () => {
        if (!editor) return;
        setIsSaving(true);
        try {
            const body = editor.getHTML();
            await api.patch(`/api/pages/admin/${slug}`, { title, body });
            navigate('/admin/pages');
        } catch (error) {
            console.error('Failed to save page', error);
            alert('Failed to save page.');
        } finally {
            setIsSaving(false);
        }
    };

    const addImage = () => {
        const url = window.prompt('URL of the image:');
        if (url && editor) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    const setLink = () => {
        const previousUrl = editor?.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);

        if (url === null) {
            return; // cancelled
        }

        if (url === '') {
            editor?.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }

        editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-[60vh]">
                <Loader2 className="w-8 h-8 text-[#534AB7] animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center space-x-4">
                    <button
                        onClick={() => navigate('/admin/pages')}
                        className="p-2 text-slate-400 hover:text-[#534AB7] hover:bg-[#534AB7]/10 rounded-full transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-xl font-bold text-slate-800 bg-transparent border-none focus:outline-none focus:ring-0 p-0 m-0"
                            placeholder="Page Title"
                        />
                        <p className="text-xs text-slate-400 mt-1 font-mono">/{slug}</p>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center space-x-2 px-6 py-2.5 bg-[#534AB7] text-white font-medium rounded-lg shadow-md hover:bg-[#433b97] transition disabled:opacity-50"
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
            </div>

            {/* Editor Area */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-1 p-3 border-b border-slate-200 bg-slate-50">
                    <ToolbarButton
                        isActive={editor?.isActive('bold') || false}
                        onClick={() => editor?.chain().focus().toggleBold().run()}
                        icon={<Bold size={16} />}
                        title="Bold"
                    />
                    <ToolbarButton
                        isActive={editor?.isActive('italic') || false}
                        onClick={() => editor?.chain().focus().toggleItalic().run()}
                        icon={<Italic size={16} />}
                        title="Italic"
                    />
                    <div className="w-px h-6 bg-slate-300 mx-2" />
                    <ToolbarButton
                        isActive={editor?.isActive('heading', { level: 1 }) || false}
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                        icon={<Heading1 size={16} />}
                        title="Heading 1"
                    />
                    <ToolbarButton
                        isActive={editor?.isActive('heading', { level: 2 }) || false}
                        onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                        icon={<Heading2 size={16} />}
                        title="Heading 2"
                    />
                    <div className="w-px h-6 bg-slate-300 mx-2" />
                    <ToolbarButton
                        isActive={editor?.isActive('bulletList') || false}
                        onClick={() => editor?.chain().focus().toggleBulletList().run()}
                        icon={<List size={16} />}
                        title="Bullet List"
                    />
                    <ToolbarButton
                        isActive={editor?.isActive('orderedList') || false}
                        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                        icon={<ListOrdered size={16} />}
                        title="Numbered List"
                    />
                    <ToolbarButton
                        isActive={editor?.isActive('blockquote') || false}
                        onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                        icon={<Quote size={16} />}
                        title="Blockquote"
                    />
                    <div className="w-px h-6 bg-slate-300 mx-2" />
                    <ToolbarButton
                        isActive={editor?.isActive('link') || false}
                        onClick={setLink}
                        icon={<Link2 size={16} />}
                        title="Link"
                    />
                    <ToolbarButton
                        isActive={false}
                        onClick={addImage}
                        icon={<ImageIcon size={16} />}
                        title="Image"
                    />
                </div>

                {/* Content */}
                <div className="min-h-[500px] cursor-text" onClick={() => editor?.commands.focus()}>
                    <EditorContent editor={editor} />
                </div>
            </div>
        </div>
    );
};

const ToolbarButton: React.FC<{ isActive: boolean; onClick: () => void; icon: React.ReactNode; title: string }> = ({ isActive, onClick, icon, title }) => (
    <button
        onClick={onClick}
        title={title}
        className={`p-2 rounded transition-colors ${
            isActive 
                ? 'bg-[#534AB7]/10 text-[#534AB7]' 
                : 'text-slate-600 hover:bg-slate-200'
        }`}
    >
        {icon}
    </button>
);
