// components/MovieSearch.tsx
"use client";
import { useState, useEffect } from "react";

const API_KEY = process.env.NEXT_PUBLIC_API_KEY;

interface Movie {
  imdbID: string;
  Title: string;
  Year: string;
  Type: string;
  Poster: string;
}

interface MovieDetails {
  imdbID: string;
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Writer: string;
  Actors: string;
  Plot: string;
  Poster: string;
  imdbRating: string;
  Response?: string;
}

interface ApiResponse {
  Search: Movie[];
  totalResults: string;
  Response: string;
}

export default function MovieSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<MovieDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Debounced search to avoid too many API calls
  useEffect(() => {
    if (searchQuery.length < 3) {
      setMovies([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function performSearch(query: string) {
    setLoading(true);
    try {
      const res = await fetch(
        `https://www.omdbapi.com/?s=${query}&apikey=${API_KEY}`
      );
      const data: ApiResponse = await res.json();

      if (data.Response === "True") {
        setMovies(data.Search || []);
        setImageErrors(new Set());
      } else {
        setMovies([]);
      }
    } catch (error) {
      console.error("Error searching movies:", error);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }

  async function getMovieDetails(id: string) {
    setLoadingDetails(true);
    try {
      const res = await fetch(
        `https://www.omdbapi.com/?i=${id}&apikey=${API_KEY}`
      );
      const data: MovieDetails = await res.json();

      if (data.Response === "True") {
        setSelectedMovie(data);
        setIsModalOpen(true);
      }
    } catch (error) {
      console.error("Error fetching movie details:", error);
    } finally {
      setLoadingDetails(false);
    }
  }

  const handleImageError = (imdbID: string) => {
    setImageErrors((prev) => new Set(prev).add(imdbID));
  };

  const handleModalImageError = () => {
    if (selectedMovie) {
      setImageErrors((prev) => new Set(prev).add(selectedMovie.imdbID));
    }
  };

  const isImageBroken = (imdbID: string) => {
    return imageErrors.has(imdbID);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.length >= 3) {
      performSearch(searchQuery);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMovie(null);
  };

  const handleMovieClick = (movie: Movie) => {
    getMovieDetails(movie.imdbID);
  };

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  return (
    <div className="movie-app">
      <header className="movie-header">
        <div className="header-content">
          <h1 className="movie-title">
            <span className="movie-icon">🎬</span>
            Movie Explorer
          </h1>
          <p className="movie-subtitle">Discover your next favorite film</p>
        </div>

        <form onSubmit={handleSubmit} className="search-form">
          <div className="search-input-container">
            <input
              type="text"
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearchQuery(e.target.value)
              }
              placeholder="Search for a movie..."
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
        </form>
      </header>

      <main className="movie-main">
        {loading && (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Searching for movies...</p>
          </div>
        )}

        {!loading && movies.length > 0 && (
          <div className="movies-grid">
            {movies.map((movie) => (
              <div
                key={movie.imdbID}
                onClick={() => handleMovieClick(movie)}
                className="movie-card"
              >
                {movie.Poster &&
                movie.Poster !== "N/A" &&
                !isImageBroken(movie.imdbID) ? (
                  <div className="poster-container">
                    <img
                      src={movie.Poster}
                      alt={movie.Title}
                      className="movie-poster"
                      onError={() => handleImageError(movie.imdbID)}
                    />
                    <div className="movie-overlay">
                      <span className="view-details">View Details</span>
                    </div>
                  </div>
                ) : (
                  <div className="poster-fallback">
                    <span className="fallback-icon">🎬</span>
                  </div>
                )}
                <div className="movie-info">
                  <h3 className="movie-card-title">{movie.Title}</h3>
                  <p className="movie-card-year">{movie.Year}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && movies.length === 0 && searchQuery.length >= 3 && (
          <div className="empty-state">
            <div className="empty-icon">😢</div>
            <h3>No movies found</h3>
            <p>Try a different search term</p>
          </div>
        )}

        {!loading && searchQuery.length === 0 && (
          <div className="welcome-state">
            <div className="welcome-icon">🍿</div>
            <h3>Start exploring movies</h3>
            <p>Type in the search bar to find your favorite films</p>
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleModalClick}>
          <div className="modal-content">
            <button onClick={closeModal} className="modal-close">
              &times;
            </button>

            {loadingDetails ? (
              <div className="modal-loading">
                <div className="spinner"></div>
                <p>Loading movie details...</p>
              </div>
            ) : selectedMovie ? (
              <>
                <div className="modal-header">
                  {selectedMovie.Poster &&
                  selectedMovie.Poster !== "N/A" &&
                  !isImageBroken(selectedMovie.imdbID) ? (
                    <img
                      src={selectedMovie.Poster}
                      alt={selectedMovie.Title}
                      className="modal-poster"
                      onError={handleModalImageError}
                    />
                  ) : (
                    <div className="modal-poster-fallback">
                      <span className="fallback-icon">🎬</span>
                    </div>
                  )}

                  <div className="modal-info">
                    <h2 className="modal-title">
                      {selectedMovie.Title}{" "}
                      <span className="modal-year">({selectedMovie.Year})</span>
                    </h2>

                    <div className="movie-meta">
                      <div className="meta-item">
                        <span className="meta-icon">⭐</span>
                        <span className="meta-text">
                          {selectedMovie.imdbRating || "N/A"}/10
                        </span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-icon">⏱️</span>
                        <span className="meta-text">
                          {selectedMovie.Runtime}
                        </span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-icon">🎭</span>
                        <span className="meta-text">{selectedMovie.Genre}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-icon">📊</span>
                        <span className="meta-text">{selectedMovie.Rated}</span>
                      </div>
                    </div>

                    <div className="action-buttons">
                      <button className="action-btn watch-btn">
                        <span className="btn-icon">▶️</span>
                        Watch Trailer
                      </button>
                      <button className="action-btn save-btn">
                        <span className="btn-icon">❤️</span>
                        Save
                      </button>
                    </div>
                  </div>
                </div>

                <div className="modal-body">
                  <div className="plot-section">
                    <h3 className="section-title">Plot</h3>
                    <p className="movie-plot">{selectedMovie.Plot}</p>
                  </div>

                  <div className="details-grid">
                    <div className="detail-item">
                      <h4 className="detail-label">Director</h4>
                      <p className="detail-value">{selectedMovie.Director}</p>
                    </div>

                    <div className="detail-item">
                      <h4 className="detail-label">Cast</h4>
                      <p className="detail-value">{selectedMovie.Actors}</p>
                    </div>

                    <div className="detail-item">
                      <h4 className="detail-label">Writer</h4>
                      <p className="detail-value">{selectedMovie.Writer}</p>
                    </div>

                    <div className="detail-item">
                      <h4 className="detail-label">Release Date</h4>
                      <p className="detail-value">{selectedMovie.Released}</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="modal-error">
                <span className="error-icon">❌</span>
                <h3>Failed to load movie details</h3>
                <p>Please try again later</p>
              </div>
            )}
          </div>
        </div>
      )}

      <footer className="movie-footer">
        <p>Powered by OMDB API</p>
        <p>Frontend made by Luis Montaño</p>
      </footer>
    </div>
  );
}
