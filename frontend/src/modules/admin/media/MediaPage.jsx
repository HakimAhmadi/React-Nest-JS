import { useState } from 'react';
import { useApiQuery, useApiMutation } from '@/hooks/useApi';
import { Upload, Copy, Check, Trash2, Search, Image as ImageIcon, ExternalLink, Filter } from 'lucide-react';
import toast from 'react-hot-toast';
import { getApi, postApi } from '@/services/api';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

const MediaPage = () => {
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const BACKEND = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3003';

  const { data: media = [], isLoading, refetch } = useApiQuery(['media'], async () => {
    const res = await getApi('upload');
    const data = res.data;
    return Array.isArray(data) ? data : data?.data || [];
  });

  const uploadMutation = useApiMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      return postApi('upload/cloudinary/image', formData, null, true, {
        'Content-Type': 'multipart/form-data',
      });
    },
    onSuccess: () => {
      toast.success('Media uploaded successfully!');
      refetch();
      setIsUploading(false);
    },
    onError: (err) => {
      toast.error(`Upload failed: ${err.message || 'Unknown error'}`);
      setIsUploading(false);
    }
  });

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    uploadMutation.mutate(file);
  };

  const copyToClipboard = (url, id) => {
    const fullUrl = url.startsWith('http') ? url : `${BACKEND}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    toast.success('URL copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredMedia = media.filter(item => 
    item.filename.toLowerCase().includes(search.toLowerCase())
  ).sort((a, b) => new Date(b.mtime) - new Date(a.mtime));

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Media Library</h1>
          <p className="text-gray-500 text-sm mt-1">Manage all your uploaded assets and images.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="relative cursor-pointer">
            <input 
              type="file" 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <Button 
              as="span" 
              icon={Upload} 
              loading={isUploading}
            >
              Upload Media
            </Button>
          </label>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search filenames..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-900 border border-gray-800 text-sm text-gray-100
              placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-gray-900 animate-pulse border border-gray-800" />
          ))}
        </div>
      ) : filteredMedia.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredMedia.map((item) => (
            <div 
              key={item.filename} 
              className="group relative aspect-square rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden hover:border-primary-500/50 transition-all flex flex-col"
            >
              <div className="flex-1 relative overflow-hidden bg-black/20">
                <img 
                  src={item.url.startsWith('http') ? item.url : `${BACKEND}${item.url}`} 
                  alt={item.filename}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="absolute inset-0 hidden flex-col items-center justify-center text-gray-600 bg-gray-900">
                  <ImageIcon size={32} />
                  <span className="text-[10px] mt-2 uppercase font-bold tracking-tighter">Preview Unavailable</span>
                </div>
                
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                   <button 
                     onClick={() => copyToClipboard(item.url, item.filename)}
                     className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm"
                     title="Copy URL"
                   >
                     {copiedId === item.filename ? <Check size={18} className="text-green-400" /> : <Copy size={18} />}
                   </button>
                   <a 
                     href={item.url.startsWith('http') ? item.url : `${BACKEND}${item.url}`} 
                     target="_blank" 
                     rel="noreferrer"
                     className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-sm"
                     title="Open Original"
                   >
                     <ExternalLink size={18} />
                   </a>
                </div>
              </div>
              
              <div className="p-3 bg-gray-900 border-t border-gray-800">
                <p className="text-[11px] font-medium text-gray-300 truncate" title={item.filename}>
                  {item.filename}
                </p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">
                    {formatSize(item.size)}
                  </span>
                  <span className="text-[9px] text-gray-600 font-mono">
                    {new Date(item.mtime).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center border-2 border-dashed border-gray-800 rounded-3xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gray-900 mb-4 border border-gray-800">
            <ImageIcon className="text-gray-600" size={32} />
          </div>
          <h3 className="text-lg font-bold text-white">No media found</h3>
          <p className="text-gray-500 text-sm max-w-xs mx-auto mt-2">
            Try searching for something else or upload a new asset to get started.
          </p>
        </div>
      )}
    </div>
  );
};

export default MediaPage;
