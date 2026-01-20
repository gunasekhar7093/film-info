const API_KEY = "7d4f3fa1f9cadd8fb475b33e208ae43e";
const BASE_URL = "https://api.themoviedb.org/3/search/movie";

function searchMovie(){
    let movie = document.getElementById("movieInput").value;

    fetch(`${BASE_URL}?api_key=${API_KEY}&query=${movie}`)
    .then(response => response.json())
    .then(data => {
        const movieData = data.results[0];

        document.getElementById("movieResult").innerHTML = `
        <div class="movie-card">
            <img src="https://image.tmdb.org/t/p/w500${movieData.poster_path}">
            <h2>${movieData.title}</h2>
            <p>⭐ Rating: ${movieData.vote_average}</p>
            <p>${movieData.overview}</p>
        </div>
        `;
    });
}
