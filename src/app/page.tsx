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

type ViewMode = "search" | "saved";

export default function MovieSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<MovieDetails | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [savedMovies, setSavedMovies] = useState<MovieDetails[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("search");

  // Load saved movies from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem("savedMovies");
    if (saved) {
      setSavedMovies(JSON.parse(saved));
    }
  }, []);

  // Save movies to localStorage whenever savedMovies changes
  useEffect(() => {
    localStorage.setItem("savedMovies", JSON.stringify(savedMovies));
  }, [savedMovies]);

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

  const handleSaveMovie = (movie: MovieDetails) => {
    const isAlreadySaved = savedMovies.some((m) => m.imdbID === movie.imdbID);

    if (!isAlreadySaved) {
      const updatedSavedMovies = [...savedMovies, movie];
      setSavedMovies(updatedSavedMovies);

      // Show success feedback
      const saveBtn = document.querySelector(".save-btn");
      if (saveBtn) {
        saveBtn.textContent = "Saved!";
        setTimeout(() => {
          if (saveBtn) {
            saveBtn.innerHTML = '<span class="btn-icon">❤️</span> Saved';
          }
        }, 2000);
      }
    } else {
      // Remove from saved movies
      const updatedSavedMovies = savedMovies.filter(
        (m) => m.imdbID !== movie.imdbID
      );
      setSavedMovies(updatedSavedMovies);

      // If we're in saved view and remove a movie, update the view
      if (viewMode === "saved") {
        setViewMode("saved");
      }
    }
  };

  const isMovieSaved = (imdbID: string) => {
    return savedMovies.some((movie) => movie.imdbID === imdbID);
  };

  const handleWatchTrailer = (title: string, year: string) => {
    const searchQuery = `${title} ${year} official trailer`;
    const youtubeUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      searchQuery
    )}`;
    window.open(youtubeUrl, "_blank");
  };

  const handleViewSavedMovies = () => {
    setViewMode("saved");
    setSearchQuery("");
    setMovies([]);
  };

  const handleBackToSearch = () => {
    setViewMode("search");
  };

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
      setViewMode("search");
      performSearch(searchQuery);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMovie(null);
  };

  const handleMovieClick = (movie: Movie | MovieDetails) => {
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
            Movie Engine
          </h1>
          <p className="movie-subtitle">Discover your next favorite film</p>
        </div>

        <div className="header-controls">
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

          <div className="header-buttons">
            {viewMode === "saved" ? (
              <button className="back-button" onClick={handleBackToSearch}>
                ← Back to Search
              </button>
            ) : (
              <button
                className="saved-movies-button"
                onClick={handleViewSavedMovies}
                disabled={savedMovies.length === 0}
              >
                <span className="saved-count">{savedMovies.length}</span>
                Saved Movies
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="movie-main">
        {viewMode === "saved" ? (
          <div className="saved-movies-view">
            <h2 className="view-title">
              Your Saved Movies ({savedMovies.length})
            </h2>

            {savedMovies.length === 0 ? (
              <div className="empty-saved-state">
                <div className="empty-icon">❤️</div>
                <h3>No movies saved yet</h3>
                <p>
                  Search for movies and click the save button to add them here
                </p>
                <button
                  className="back-to-search-btn"
                  onClick={handleBackToSearch}
                >
                  Start Searching
                </button>
              </div>
            ) : (
              <div className="movies-grid">
                {savedMovies.map((movie) => (
                  <div
                    key={movie.imdbID}
                    onClick={() => handleMovieClick(movie)}
                    className="movie-card"
                  >
                    <div
                      className="saved-indicator"
                      title="Saved to your collection"
                    >
                      ❤️
                    </div>
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
          </div>
        ) : (
          <>
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
                    {isMovieSaved(movie.imdbID) && (
                      <div
                        className="saved-indicator"
                        title="Saved to your collection"
                      >
                        ❤️
                      </div>
                    )}
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

                {savedMovies.length > 0 && (
                  <div className="saved-movies-preview">
                    <h4>Your Saved Movies ({savedMovies.length})</h4>
                    <div className="saved-movies-grid">
                      {savedMovies.slice(0, 4).map((movie) => (
                        <div key={movie.imdbID} className="saved-movie-item">
                          {movie.Poster && movie.Poster !== "N/A" ? (
                            <img src={movie.Poster} alt={movie.Title} />
                          ) : (
                            <span>🎬</span>
                          )}
                          <span className="saved-movie-title">
                            {movie.Title}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      className="view-all-saved-btn"
                      onClick={handleViewSavedMovies}
                    >
                      View All Saved Movies
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {isModalOpen && selectedMovie && (
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
            ) : (
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
                      <button
                        className="action-btn watch-btn"
                        onClick={() =>
                          handleWatchTrailer(
                            selectedMovie.Title,
                            selectedMovie.Year
                          )
                        }
                      >
                        <span className="btn-icon">▶️</span>
                        Watch Trailer
                      </button>
                      <button
                        className={`action-btn save-btn ${
                          isMovieSaved(selectedMovie.imdbID) ? "saved" : ""
                        }`}
                        onClick={() => handleSaveMovie(selectedMovie)}
                      >
                        <span className="btn-icon">
                          {isMovieSaved(selectedMovie.imdbID) ? "❤️" : "🤍"}
                        </span>
                        {isMovieSaved(selectedMovie.imdbID) ? "Saved" : "Save"}
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
