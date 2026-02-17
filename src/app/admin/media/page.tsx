'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface MediaFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  path: string;
  createdAt: string;
}

export default function MediaPage() {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [editAlt, setEditAlt] = useState('');

  const fetchMedia = useCallback(async () => {
    try {
      const res = await fetch('/api/media');
      const data = await res.json();
      setFiles(data);
    } catch {
      toast.error('Nepodařilo se načíst média');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;

    setUploading(true);

    for (const file of Array.from(fileList)) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Upload selhal');
        }

        toast.success(`${file.name} nahráno`);
      } catch (err: any) {
        toast.error(`${file.name}: ${err.message}`);
      }
    }

    setUploading(false);
    fetchMedia();
    e.target.value = '';
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Smazat tento soubor?')) return;

    try {
      await fetch(`/api/media/${id}`, { method: 'DELETE' });
      toast.success('Soubor smazán');
      setSelectedFile(null);
      fetchMedia();
    } catch {
      toast.error('Nepodařilo se smazat');
    }
  };

  const handleUpdateAlt = async (id: string) => {
    try {
      await fetch(`/api/media/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ altText: editAlt }),
      });
      toast.success('ALT text aktualizován');
      fetchMedia();
    } catch {
      toast.error('Nepodařilo se aktualizovat');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Správa médií</h1>
        <label className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors cursor-pointer">
          {uploading ? 'Nahrávání...' : '+ Nahrát soubory'}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center mb-6 hover:border-primary-400 transition-colors"
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-primary-500', 'bg-primary-50'); }}
        onDragLeave={(e) => { e.currentTarget.classList.remove('border-primary-500', 'bg-primary-50'); }}
        onDrop={async (e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('border-primary-500', 'bg-primary-50');
          const droppedFiles = e.dataTransfer.files;
          if (!droppedFiles.length) return;
          setUploading(true);
          for (const file of Array.from(droppedFiles)) {
            const formData = new FormData();
            formData.append('file', file);
            try {
              const res = await fetch('/api/media/upload', { method: 'POST', body: formData });
              if (!res.ok) throw new Error('Upload selhal');
              toast.success(`${file.name} nahráno`);
            } catch (err: any) {
              toast.error(err.message);
            }
          }
          setUploading(false);
          fetchMedia();
        }}
      >
        <p className="text-gray-500">Přetáhněte soubory sem nebo klikněte na tlačítko výše</p>
        <p className="text-xs text-gray-400 mt-1">JPEG, PNG, GIF, WebP, AVIF, SVG (max 10 MB)</p>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Načítání...</div>
      ) : files.length === 0 ? (
        <div className="text-center py-12 text-gray-500">Žádná média</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {files.map((file) => (
            <div
              key={file.id}
              onClick={() => {
                setSelectedFile(file);
                setEditAlt(file.altText || '');
              }}
              className={`group relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                selectedFile?.id === file.id ? 'border-primary-500 shadow-md' : 'border-transparent hover:border-gray-300'
              }`}
            >
              {file.mimeType.startsWith('image/') ? (
                <img
                  src={file.path}
                  alt={file.altText || file.originalName}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs truncate">{file.originalName}</p>
                <p className="text-white/70 text-xs">{formatSize(file.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File Detail Sidebar */}
      {selectedFile && (
        <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 shadow-xl z-40 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Detail souboru</h3>
            <button
              onClick={() => setSelectedFile(null)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {selectedFile.mimeType.startsWith('image/') && (
            <img
              src={selectedFile.path}
              alt={selectedFile.altText || ''}
              className="w-full h-auto rounded-lg mb-4"
            />
          )}

          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-500">Název</p>
              <p className="font-medium text-gray-900">{selectedFile.originalName}</p>
            </div>
            <div>
              <p className="text-gray-500">Velikost</p>
              <p className="text-gray-900">{formatSize(selectedFile.size)}</p>
            </div>
            {selectedFile.width && selectedFile.height && (
              <div>
                <p className="text-gray-500">Rozměry</p>
                <p className="text-gray-900">{selectedFile.width} x {selectedFile.height} px</p>
              </div>
            )}
            <div>
              <p className="text-gray-500">Typ</p>
              <p className="text-gray-900">{selectedFile.mimeType}</p>
            </div>
            <div>
              <p className="text-gray-500">Cesta</p>
              <p className="text-gray-900 text-xs font-mono break-all">{selectedFile.path}</p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedFile.path);
                  toast.success('Cesta zkopírována');
                }}
                className="text-xs text-primary-600 hover:text-primary-700 mt-1"
              >
                Kopírovat cestu
              </button>
            </div>

            <div>
              <label className="block text-gray-500 mb-1">ALT text</label>
              <input
                type="text"
                value={editAlt}
                onChange={(e) => setEditAlt(e.target.value)}
                placeholder="Popis obrázku pro SEO..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={() => handleUpdateAlt(selectedFile.id)}
                className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Uložit ALT
              </button>
            </div>
          </div>

          <button
            onClick={() => handleDelete(selectedFile.id)}
            className="w-full mt-6 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
          >
            Smazat soubor
          </button>
        </div>
      )}
    </div>
  );
}
