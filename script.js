const API_KEY = "7d4f3fa1f9cadd8fb475b33e208ae43e";
const BASE_URL = "https://api.themoviedb.org/3/search/movie";
const IMAGE_BASE = "https://image.tmdb.org/t/p/w500";
const form = document.getElementById("searchForm");
const input = document.getElementById("movieInput");
const button = document.getElementById("searchButton");
const result = document.getElementById("movieResult");
const resultsTitle = document.getElementById("resultsTitle");
const resultBadge = document.getElementById("resultBadge");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  searchMovie();
});

async function searchMovie() {
  const movie = input.value.trim();

  if (!movie) {
    input.focus();
    showState("⌕", "Start with a movie title", "Enter the name of a film in the search box above and we’ll find it for you.");
    resultBadge.textContent = "SEARCH FOR A FILM";
    resultsTitle.textContent = "Your discovery space";
    return;
  }

  setLoading(true);
  resultBadge.textContent = "SEARCHING";
  resultsTitle.textContent = "Finding your film";

  try {
    const url = new URL(BASE_URL);
    url.searchParams.set("api_key", API_KEY);
    url.searchParams.set("query", movie);
    url.searchParams.set("include_adult", "false");
    url.searchParams.set("language", "en-US");
    url.searchParams.set("page", "1");

    const response = await fetch(url.toString());
    if (!response.ok) {
      if (response.status === 401) throw new Error("The movie service rejected the API key. Please check the TMDB API configuration.");
      if (response.status === 429) throw new Error("There have been too many requests. Please wait a moment and try again.");
      throw new Error("We couldn't reach the movie database just now. Please try again.");
    }

    const data = await response.json();
    const movies = Array.isArray(data.results) ? data.results : [];
    if (!movies.length) {
      resultsTitle.textContent = "No matches this time";
      resultBadge.textContent = "0 RESULTS";
      showState("⌕", "No films found for “" + movie + "”", "Try a shorter title, check the spelling, or search for another movie.");
      return;
    }

    // The closest search result is shown first, matching the original single-movie experience.
    renderMovie(movies[0]);
    resultsTitle.textContent = "Your film, found";
    resultBadge.textContent = movies.length + (movies.length === 1 ? " MATCH" : " MATCHES");
  } catch (error) {
    console.error("Movie search failed:", error);
    resultsTitle.textContent = "Something went wrong";
    resultBadge.textContent = "TRY AGAIN";
    showState("!", "We couldn't load that film", error.message || "Check your internet connection and try again.");
  } finally {
    setLoading(false);
  }
}

function renderMovie(movie) {
  const title = escapeHTML(movie.title || movie.original_title || "Untitled movie");
  const year = movie.release_date ? movie.release_date.slice(0, 4) : "Release date unavailable";
  const rating = Number.isFinite(Number(movie.vote_average)) && Number(movie.vote_average) > 0
    ? Number(movie.vote_average).toFixed(1) + " / 10"
    : "Not rated yet";
  const overview = movie.overview ? escapeHTML(movie.overview) : "No synopsis is available for this film yet.";
  const poster = movie.poster_path ? IMAGE_BASE + movie.poster_path : "";

  result.innerHTML = `
    <article class="movie-card">
      <div class="poster-wrap">
        ${poster
          ? `<img class="movie-poster" src="${poster}" alt="Poster for ${title}" loading="lazy" referrerpolicy="no-referrer">`
          : '<div class="movie-poster poster-missing"><span aria-hidden="true">▧</span><span>Poster unavailable</span></div>'}
      </div>
      <div class="movie-info">
        <div class="movie-overline"><span class="movie-tag">MOVIE SPOTLIGHT</span><span class="movie-year">${escapeHTML(year)}</span></div>
        <h3>${title}</h3>
        <div class="movie-meta">
          <span class="meta-pill"><span class="rating-star" aria-hidden="true">★</span><strong>${escapeHTML(rating)}</strong></span>
          <span class="meta-pill"><span aria-hidden="true">◷</span>${escapeHTML(movie.release_date || "Release date TBA")}</span>
        </div>
        <h4>The story</h4>
        <p class="movie-overview">${overview}</p>
        <div class="movie-footnote">Movie information and poster artwork provided by TMDB. Ratings reflect community votes and may change over time.</div>
      </div>
    </article>
  `;

  const image = result.querySelector(".movie-poster");
  if (image && image.tagName === "IMG") {
    image.addEventListener("error", () => {
      const fallback = document.createElement("div");
      fallback.className = "movie-poster poster-missing";
      fallback.innerHTML = '<span aria-hidden="true">▧</span><span>Poster unavailable</span>';
      image.replaceWith(fallback);
    }, { once: true });
  }
}

function showState(icon, heading, message) {
  result.innerHTML = `
    <div class="state-panel">
      <div class="state-icon" aria-hidden="true">${escapeHTML(icon)}</div>
      <h3>${escapeHTML(heading)}</h3>
      <p>${escapeHTML(message)}</p>
    </div>
  `;
}

function setLoading(isLoading) {
  button.disabled = isLoading;
  input.disabled = isLoading;
  button.innerHTML = isLoading
    ? '<span class="spinner" aria-hidden="true"></span><span>Searching</span>'
    : '<span>Find a film</span><span aria-hidden="true">↗</span>';

  if (isLoading) {
    result.innerHTML = `
      <div class="state-panel" role="status">
        <div class="spinner" aria-hidden="true"></div>
        <h3>Finding your film…</h3>
        <p>Searching the movie database. Just a moment.</p>
      </div>
    `;
  } else {
    input.disabled = false;
    button.disabled = false;
  }
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}
