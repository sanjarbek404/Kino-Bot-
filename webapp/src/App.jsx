import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import WebApp from '@twa-dev/sdk';

function App() {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  useEffect(() => {
    WebApp.ready();
    WebApp.expand();
    
    // Yengil theme apply
    document.documentElement.style.setProperty('--tg-theme-bg-color', WebApp.themeParams.bg_color || '#111827');
    document.documentElement.style.setProperty('--tg-theme-text-color', WebApp.themeParams.text_color || '#ffffff');

    fetch('/api/movies')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMovies(data);
        } else {
          console.error("API xatosi, kutilgan ro'yxat o'rniga obyekt:", data);
          setMovies([]);
        }
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  const handleSelect = (movie) => {
    WebApp.HapticFeedback.impactOccurred('medium');
    setToast(`Yuklanmoqda: ${movie.title}`);
    
    // Botga signal yuborish
    WebApp.sendData(JSON.stringify({
      action: 'play_movie',
      code: movie.code
    }));

    setTimeout(() => {
      setToast('');
      WebApp.close();
    }, 1500);
  };

  const filteredMovies = movies.filter(m => m && (
    (m.title && m.title.toLowerCase().includes(search.toLowerCase())) || 
    (m.code && m.code.toString().includes(search)) ||
    (m.genre && m.genre.toLowerCase().includes(search.toLowerCase()))
  ));

  return (
    <div className="p-4 pb-20 max-w-2xl mx-auto min-h-screen">
      <header className="mb-6 sticky top-0 bg-gray-900/80 backdrop-blur-md z-10 py-3 -mx-4 px-4 border-b border-gray-800/50">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">FilmX Katalog</h1>
        <p className="text-sm text-gray-400 mt-1">Saylandi va saralandi 💎</p>
        
        <div className="mt-4 relative">
          <input 
            type="text" 
            placeholder="Kino yoki kod qidirish..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800/80 border border-gray-700/50 text-white text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 pr-10 outline-none transition-all placeholder-gray-500 shadow-inner"
          />
          <Search className="w-5 h-5 text-gray-500 absolute right-3 top-3.5" />
        </div>
      </header>

      <main className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="animate-pulse flex flex-col">
              <div className="w-full aspect-[2/3] bg-gray-800 rounded-xl mb-2"></div>
              <div className="w-3/4 h-3 bg-gray-800 rounded mb-1"></div>
              <div className="w-1/2 h-2 bg-gray-800 rounded"></div>
            </div>
          ))
        ) : filteredMovies.length === 0 ? (
          <p className="text-gray-400 text-center col-span-2 mt-10">Hech narsa topilmadi...</p>
        ) : (
          <AnimatePresence>
            {filteredMovies.map((movie) => {
              const imgUrl = movie.poster && movie.poster.startsWith('http') 
                ? movie.poster 
                : 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&q=80&w=300&h=450';
              
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileTap={{ scale: 0.95 }}
                  key={movie._id || movie.code} 
                  className="flex flex-col relative group cursor-pointer"
                  onClick={() => handleSelect(movie)}
                >
                  <div className="relative overflow-hidden rounded-xl bg-gray-800 shadow-lg border border-gray-700/30">
                    <img src={imgUrl} alt={movie.title} className="w-full aspect-[2/3] object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/40 to-transparent opacity-90"></div>
                    <div className="absolute top-2 right-2">
                        <span className="bg-black/50 backdrop-blur-md text-white/90 text-[10px] px-1.5 py-0.5 rounded shadow-sm border border-white/10">#{movie.code}</span>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                      <span className="bg-blue-600/90 border border-blue-500/50 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm backdrop-blur-sm">👁 {movie.views || 0}</span>
                    </div>
                  </div>
                  <div className="mt-2 px-1">
                    <h3 className="text-sm font-semibold truncate leading-tight text-white/95">{movie.title}</h3>
                    <p className="text-[11px] text-gray-400 truncate mt-0.5">{movie.genre || 'Kino'}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </main>

      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-5 py-2.5 rounded-full shadow-lg text-sm font-medium z-50 whitespace-nowrap border border-blue-400"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
