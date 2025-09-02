import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface GifPickerProps {
  onGifSelect: (gifUrl: string) => void;
}

interface GifResult {
  id: string;
  title: string;
  images: {
    fixed_height_small: {
      url: string;
      width: string;
      height: string;
    };
    original: {
      url: string;
    };
  };
}

const GIPHY_API_KEY = 'GlVGYHkr3WSBnllca54iNt0yFbjz7L65'; // Public API key for demo

const GifPicker: React.FC<GifPickerProps> = ({ onGifSelect }) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);

  // Load trending GIFs on mount
  useEffect(() => {
    loadTrendingGifs();
  }, []);

  const loadTrendingGifs = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20&offset=0&rating=g`
      );
      const data = await response.json();
      setGifs(data.data || []);
    } catch (error) {
      console.error('Error loading trending GIFs:', error);
      toast({
        title: "Error",
        description: "Failed to load trending GIFs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const searchGifs = async (query: string) => {
    if (!query.trim()) {
      loadTrendingGifs();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20&offset=0&rating=g`
      );
      const data = await response.json();
      setGifs(data.data || []);
    } catch (error) {
      console.error('Error searching GIFs:', error);
      toast({
        title: "Error",  
        description: "Failed to search GIFs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchGifs(searchTerm);
  };

  return (
    <div className="w-full max-w-md bg-background border rounded-lg shadow-lg">
      <div className="p-4 border-b">
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            type="text"
            placeholder="Search GIFs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon" variant="outline">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <div className="p-2 max-h-80 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading GIFs...</span>
          </div>
        ) : gifs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Image className="h-12 w-12 mb-2" />
            <p>No GIFs found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() => onGifSelect(gif.images.original.url)}
                className="relative overflow-hidden rounded-lg hover:opacity-80 transition-opacity group"
              >
                <img
                  src={gif.images.fixed_height_small.url}
                  alt={gif.title}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs font-medium px-2 py-1 bg-black/50 rounded">
                    Select
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GifPicker;