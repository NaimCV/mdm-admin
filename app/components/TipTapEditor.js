'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  LinkOutlined,
  PictureOutlined,
  HighlightOutlined
} from '@ant-design/icons';

const TipTapEditor = ({ value, onChange, placeholder = "Escribe aquí..." }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline cursor-pointer',
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto',
        },
      }),
      Color,
      TextStyle,
      Highlight.configure({
        multicolor: true,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    immediatelyRender: false,
  });

  if (!editor) {
    return null;
  }

  const addLink = () => {
    const url = window.prompt('URL:');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt('URL de la imagen:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setColor = (color) => {
    editor.chain().focus().setColor(color).run();
  };

  const setHighlight = (color) => {
    editor.chain().focus().toggleHighlight({ color }).run();
  };

  return (
    <div className="border border-gray-300 rounded-md">
      {/* Toolbar */}
      <div className="border-b border-gray-300 p-2 bg-gray-50 flex flex-wrap gap-1">
        {/* Formato de texto */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-blue-100 text-blue-600' : ''}`}
          title="Negrita"
        >
          <BoldOutlined />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-blue-100 text-blue-600' : ''}`}
          title="Cursiva"
        >
          <ItalicOutlined />
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('underline') ? 'bg-blue-100 text-blue-600' : ''}`}
          title="Subrayado"
        >
          <UnderlineOutlined />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Alineación */}
        <button
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'left' }) ? 'bg-blue-100 text-blue-600' : ''}`}
          title="Alinear izquierda"
        >
          <AlignLeftOutlined />
        </button>
        
        <button
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'center' }) ? 'bg-blue-100 text-blue-600' : ''}`}
          title="Centrar"
        >
          <AlignCenterOutlined />
        </button>
        
        <button
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive({ textAlign: 'right' }) ? 'bg-blue-100 text-blue-600' : ''}`}
          title="Alinear derecha"
        >
          <AlignRightOutlined />
        </button>
        


        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Enlaces e imágenes */}
        <button
          onClick={addLink}
          className={`p-2 rounded hover:bg-gray-200 ${editor.isActive('link') ? 'bg-blue-100 text-blue-600' : ''}`}
          title="Agregar enlace"
        >
          <LinkOutlined />
        </button>
        
        <button
          onClick={addImage}
          className="p-2 rounded hover:bg-gray-200"
          title="Agregar imagen"
        >
          <PictureOutlined />
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Colores */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-600 mr-1">Color:</span>
          {['#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'].map((color) => (
            <button
              key={color}
              onClick={() => setColor(color)}
              className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              title={`Color ${color}`}
            />
          ))}
        </div>

        <div className="w-px h-6 bg-gray-300 mx-1"></div>

        {/* Resaltado */}
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-600 mr-1">Resaltar:</span>
          {['#fef3c7', '#fecaca', '#d1fae5', '#dbeafe', '#f3e8ff'].map((color) => (
            <button
              key={color}
              onClick={() => setHighlight(color)}
              className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              title={`Resaltar ${color}`}
            />
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className="p-3 min-h-[200px] max-h-[400px] overflow-y-auto">
        <EditorContent 
          editor={editor} 
          className="prose prose-sm max-w-none focus:outline-none"
        />
      </div>
    </div>
  );
};

export default TipTapEditor; 