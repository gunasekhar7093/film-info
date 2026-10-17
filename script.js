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

document.querySelectorAll("[data-search]").forEach((item) => {
  item.addEventListener("click", () => {
    input.value = item.dataset.search;
    searchMovie();
    document.getElementById("search").scrollIntoView({ behavior: "smooth", block: "center" });
  });
});

async function searchMovie() {
  const movie = input.value.trim();

  if (!movie) {
    input.focus();
    showState("⌕", "Got a title in mind?", "Type a movie name into the search box and I'll look it up.");
    resultsTitle.textContent = "The spotlight.";
    resultBadge.textContent = "ADD A MOVIE TITLE";
    return;
  }

  setLoading(true);
  resultBadge.textContent = "LOOKING IT UP";
  resultsTitle.textContent = "One second…";

  try {
    const url = new URL(BASE_URL);
    url.searchParams.set("api_key", API_KEY);
    url.searchParams.set("query", movie);
    url.searchParams.set("include_adult", "false");
    url.searchParams.set("language", "en-US");
    url.searchParams.set("page", "1");

    const response = await fetch(url.toString());
    if (!response.ok) {
      if (response.status === 401) throw new Error("The movie service couldn't authorise this request. The TMDB API key may need checking.");
      if (response.status === 429) throw new Error("Lots of searches are happening right now. Give it a moment and try again.");
      throw new Error("The movie database isn't responding right now. Please try again in a bit.");
    }

    const data = await response.json();
    const movies = Array.isArray(data.results) ? data.results : [];
    if (!movies.length) {
      resultsTitle.textContent = "Nothing came up.";
      resultBadge.textContent = "NO MATCHES";
      showState("⌕", "Couldn't find “" + movie + "”", "Try a different spelling or a shorter title. Sometimes the simplest search works best.");
      return;
    }

    renderMovie(movies[0]);
    resultsTitle.textContent = "Here's your movie.";
    resultBadge.textContent = movies.length + (movies.length === 1 ? " RESULT" : " RESULTS");
  } catch (error) {
    console.error("Movie search failed:", error);
    resultsTitle.textContent = "A little hiccup.";
    resultBadge.textContent = "SEARCH FAILED";
    showState("!", "Couldn't get the details just now.", error.message || "Check your internet connection and give it another try.");
  } finally {
    setLoading(false);
  }
}

function renderMovie(movie) {
  const title = escapeHTML(movie.title || movie.original_title || "Untitled movie");
  const year = movie.release_date ? movie.release_date.slice(0, 4) : "Year unavailable";
  const rating = Number.isFinite(Number(movie.vote_average)) && Number(movie.vote_average) > 0
    ? Number(movie.vote_average).toFixed(1) + " / 10"
    : "Not rated yet";
  const overview = movie.overview ? escapeHTML(movie.overview) : "No synopsis has been added for this film yet.";
  const poster = movie.poster_path ? IMAGE_BASE + movie.poster_path : "";
  const releaseDate = movie.release_date || "Release date unavailable";

  result.innerHTML = `
    <article class="movie-card">
      <div class="poster-wrap">
        ${poster
          ? `<img class="movie-poster" src="${poster}" alt="Movie poster for ${title}" loading="lazy" referrerpolicy="no-referrer">`
          : '<div class="movie-poster poster-missing"><span aria-hidden="true">▧</span><span>Poster unavailable</span></div>'}
      </div>
      <div class="movie-info">
        <div class="movie-overline"><span class="movie-tag">ON THE RADAR</span><span class="movie-year">${escapeHTML(year)}</span></div>
        <h3>${title}</h3>
        <div class="movie-meta">
          <span class="meta-pill"><span class="rating-star" aria-hidden="true">★</span><strong>${escapeHTML(rating)}</strong></span>
          <span class="meta-pill"><span aria-hidden="true">◷</span>${escapeHTML(releaseDate)}</span>
        </div>
        <h4>A little about the film</h4>
        <p class="movie-overview">${overview}</p>
        <div class="movie-footnote">Film details and poster artwork via TMDB. Ratings come from viewers and can change over time.</div>
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
    <div class="state-panel" role="status">
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
    : 'Search <span aria-hidden="true">↗</span>';

  if (isLoading) {
    result.innerHTML = `
      <div class="state-panel" role="status">
        <div class="spinner" aria-hidden="true"></div>
        <h3>Finding it for you…</h3>
        <p>Checking the movie database. Won't be long.</p>
      </div>
    `;
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
