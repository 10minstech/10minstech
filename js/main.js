// js/main.js

// Utility functions
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// Config
const CONFIG = {
  articlesPerPage: 6,
  animationDuration: 500,
  apiEndpoint: "https://api.10minstech.com/v1", // Replace with your actual API endpoint
};

// State
let state = {
  currentPage: 1,
  articles: [],
  darkMode: false,
};

// Initialize the application
document.addEventListener("DOMContentLoaded", async function () {
  initializeApp();
});

async function initializeApp() {
  loadUserPreferences();
  setupEventListeners();
  await fetchArticles();
  renderArticles();
  initializeAnimatedCounters();
  initializeLazyLoading();
}

// Event Listeners
function setupEventListeners() {
  $("#darkModeToggle").addEventListener("click", toggleDarkMode);
  $("#searchForm").addEventListener("submit", handleSearch);
  $("#loadMore").addEventListener("click", loadMoreArticles);
  $("#newsletterForm").addEventListener("submit", handleNewsletterSubscription);
  $$(".social-share").forEach((btn) =>
    btn.addEventListener("click", handleSocialShare)
  );

  // Smooth scrolling for navigation links
  $$('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
        });
      }
    });
  });
}

// API Calls
async function fetchArticles(page = 1) {
  try {
    const response = await fetch(`${CONFIG.apiEndpoint}/articles?page=${page}`);
    if (!response.ok) throw new Error("Failed to fetch articles");
    const data = await response.json();
    state.articles = [...state.articles, ...data.articles];
    return data.articles;
  } catch (error) {
    console.error("Error fetching articles:", error);
    showErrorMessage("Failed to load articles. Please try again later.");
  }
}

// Rendering functions
function renderArticles() {
  const contentFeed = $("#content-feed");
  const articles = state.articles.slice(
    0,
    state.currentPage * CONFIG.articlesPerPage
  );

  contentFeed.innerHTML = articles
    .map(
      (article) => `
    <div class="content-item" data-aos="fade-up">
      <img src="${article.image}" alt="${article.title}" class="content-img lazy-load">
      <div class="content-info">
        <h3 class="content-title">${article.title}</h3>
        <p class="content-description">${article.description}</p>
        <a href="${article.url}" class="btn btn-primary">Read More</a>
        <div class="social-share-container">
          <button class="social-share" data-platform="facebook" data-url="${article.url}">
            <i class="fab fa-facebook-f"></i>
          </button>
          <button class="social-share" data-platform="twitter" data-url="${article.url}">
            <i class="fab fa-twitter"></i>
          </button>
        </div>
      </div>
    </div>
  `
    )
    .join("");

  if (articles.length >= state.articles.length) {
    $("#loadMore").style.display = "none";
  }
}

// Feature: Dynamic content loading
async function loadMoreArticles() {
  state.currentPage++;
  await fetchArticles(state.currentPage);
  renderArticles();
}

// Feature: Animated counters
function initializeAnimatedCounters() {
  const counters = $$(".counter");
  counters.forEach((counter) => {
    const target = +counter.getAttribute("data-target");
    const duration = CONFIG.animationDuration;
    let current = 0;
    const increment = (target / duration) * 16; // 16ms is roughly 1 frame at 60fps

    const updateCounter = () => {
      current += increment;
      counter.textContent = Math.round(current);
      if (current < target) {
        requestAnimationFrame(updateCounter);
      } else {
        counter.textContent = target;
      }
    };

    updateCounter();
  });
}

// Feature: Search functionality
async function handleSearch(e) {
  e.preventDefault();
  const searchTerm = $("#searchInput").value;
  try {
    const response = await fetch(
      `${CONFIG.apiEndpoint}/search?q=${encodeURIComponent(searchTerm)}`
    );
    if (!response.ok) throw new Error("Search failed");
    const results = await response.json();
    renderSearchResults(results);
  } catch (error) {
    console.error("Error during search:", error);
    showErrorMessage("Search failed. Please try again.");
  }
}

function renderSearchResults(results) {
  const searchResultsContainer = $("#searchResults");
  searchResultsContainer.innerHTML = results
    .map(
      (result) => `
    <div class="search-result">
      <h3>${result.title}</h3>
      <p>${result.snippet}</p>
      <a href="${result.url}" class="btn btn-secondary">Read More</a>
    </div>
  `
    )
    .join("");
}

// Feature: Dark mode toggle
function toggleDarkMode() {
  state.darkMode = !state.darkMode;
  document.body.classList.toggle("dark-mode", state.darkMode);
  localStorage.setItem("darkMode", state.darkMode);
}

// Feature: Lazy loading for images
function initializeLazyLoading() {
  const lazyImages = $$("img.lazy-load");
  const lazyImageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const lazyImage = entry.target;
        lazyImage.src = lazyImage.dataset.src;
        lazyImage.classList.remove("lazy-load");
        observer.unobserve(lazyImage);
      }
    });
  });

  lazyImages.forEach((lazyImage) => lazyImageObserver.observe(lazyImage));
}

// Feature: Social media sharing
function handleSocialShare(e) {
  const platform = e.currentTarget.dataset.platform;
  const url = e.currentTarget.dataset.url;
  let shareUrl;

  switch (platform) {
    case "facebook":
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        url
      )}`;
      break;
    case "twitter":
      shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(
        url
      )}`;
      break;
    default:
      return;
  }

  window.open(shareUrl, "_blank", "width=600,height=400");
}

// Feature: Newsletter subscription
async function handleNewsletterSubscription(e) {
  e.preventDefault();
  const email = $("#newsletterEmail").value;
  try {
    const response = await fetch(`${CONFIG.apiEndpoint}/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) throw new Error("Subscription failed");
    showSuccessMessage("Thank you for subscribing!");
  } catch (error) {
    console.error("Error during subscription:", error);
    showErrorMessage("Subscription failed. Please try again.");
  }
}

// Feature: Local storage for user preferences
function loadUserPreferences() {
  const savedDarkMode = localStorage.getItem("darkMode");
  if (savedDarkMode !== null) {
    state.darkMode = JSON.parse(savedDarkMode);
    document.body.classList.toggle("dark-mode", state.darkMode);
  }
}

// Error handling and user feedback
function showErrorMessage(message) {
  const errorContainer = $("#errorContainer");
  errorContainer.textContent = message;
  errorContainer.style.display = "block";
  setTimeout(() => {
    errorContainer.style.display = "none";
  }, 5000);
}

function showSuccessMessage(message) {
  const successContainer = $("#successContainer");
  successContainer.textContent = message;
  successContainer.style.display = "block";
  setTimeout(() => {
    successContainer.style.display = "none";
  }, 5000);
}

// Error logging
window.addEventListener("error", function (e) {
  console.error("Unhandled error:", e.error);
  // You could send this error to a logging service
});
