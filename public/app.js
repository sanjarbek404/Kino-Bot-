// Initialize Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand(); // Full screen
tg.ready();

const moviesGrid = document.getElementById('moviesGrid');
const searchInput = document.getElementById('searchInput');
const toast = document.getElementById('toast');
let moviesData = [];

// Apply dynamic Telegram Theme colors if present
document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#111827');
document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#ffffff');
if (tg.themeParams.bg_color) {
    document.body.style.backgroundColor = tg.themeParams.bg_color;
    document.body.style.color = tg.themeParams.text_color;
}

// Fetch Movies
async function fetchMovies() {
    try {
        const res = await fetch('/api/movies');
        moviesData = await res.json();
        renderMovies(moviesData);
    } catch (e) {
        moviesGrid.innerHTML = '<p class="text-red-400 text-center col-span-2 mt-10">Kinolarni yuklashda xatolik yuz berdi.</p>';
    }
}

// Render Movies
function renderMovies(movies) {
    moviesGrid.innerHTML = '';
    
    if (movies.length === 0) {
        moviesGrid.innerHTML = '<p class="text-gray-400 text-center col-span-2 mt-10">Hech narsa topilmadi...</p>';
        return;
    }

    movies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card flex flex-col relative group cursor-pointer';
        card.onclick = () => selectMovie(movie);

        // Fallback poster image if none exists
        const imgUrl = movie.poster && movie.poster.startsWith('http') ? movie.poster : 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=300&h=450';
        
        card.innerHTML = `
            <div class="relative overflow-hidden rounded-xl">
                <img src="${imgUrl}" alt="${movie.title}" class="movie-poster" loading="lazy">
                <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-80"></div>
                <div class="absolute bottom-2 left-2 right-2 flex justify-between items-center">
                    <span class="bg-blue-600 border border-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm backdrop-blur-md bg-opacity-80">👁 ${movie.views || 0}</span>
                    <span class="bg-gray-800 border border-gray-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm opacity-90">${movie.code}</span>
                </div>
            </div>
            <div class="mt-2 px-1">
                <h3 class="text-sm font-semibold truncate leading-tight">${movie.title}</h3>
                <p class="text-[11px] text-gray-400 truncate mt-0.5">${movie.genre || 'Kino'}</p>
            </div>
        `;
        moviesGrid.appendChild(card);
    });
}

// Select a movie and send data back to Bot
function selectMovie(movie) {
    tg.HapticFeedback.impactOccurred('medium');
    
    // Show toast locally
    toast.textContent = `Yuklanmoqda: ${movie.title}`;
    toast.classList.add('toast-visible');
    
    // Send data to telegram bot
    tg.sendData(JSON.stringify({
        action: 'play_movie',
        code: movie.code
    }));
    
    setTimeout(() => {
        toast.classList.remove('toast-visible');
        tg.close();
    }, 1500);
}

// Search functionality
searchInput.addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase().trim();
    if (!val) {
        renderMovies(moviesData);
        return;
    }
    const filtered = moviesData.filter(m => 
        (m.title && m.title.toLowerCase().includes(val)) || 
        (m.code && m.code.toString().includes(val)) ||
        (m.genre && m.genre.toLowerCase().includes(val))
    );
    renderMovies(filtered);
});

// Init
fetchMovies();
