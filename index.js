const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const resultsDiv = document.getElementById('results');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
const favoritesList = document.getElementById('favorites-list');

let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
renderFavorites();

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const query = searchInput.value.trim();
  if (query) {
    searchBooks(query);
  }
});

function searchBooks(query) {
  loading.classList.remove('hidden');
  error.textContent = '';
  resultsDiv.innerHTML = '';

  fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`)
    .then(res => res.json())
    .then(data => {
      loading.classList.add('hidden');
      displayResults(data.docs);
    })
    .catch(() => {
      loading.classList.add('hidden');
      error.textContent = 'Error fetching books';
    });
}

function displayResults(books) {
  if (books.length === 0) {
    resultsDiv.innerHTML = '<p>No books found.</p>';
    return;
  }

  books.forEach(book => {
    const bookDiv = document.createElement('div');
    bookDiv.className = 'book';

    const title = document.createElement('h3');
    title.textContent = book.title;

    const author = document.createElement('p');
    author.textContent = `Author: ${book.author_name ? book.author_name.join(', ') : 'Unknown'}`;

    const coverImg = document.createElement('img');
    const coverId = book.cover_i;
    const isbn = book.isbn ? book.isbn[0] : null;
    if (coverId) {
      coverImg.src = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg`;
    } else if (isbn) {
      coverImg.src = `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
    } else {
      coverImg.src = 'https://via.placeholder.com/150?text=No+Cover';
    }

    bookDiv.appendChild(title);
    bookDiv.appendChild(author);
    bookDiv.appendChild(coverImg);

    bookDiv.addEventListener('click', () => {
      if (book.key) {
        fetchBookDetails(book.key);
      } else {
        alert('No details available.');
      }
    });

    resultsDiv.appendChild(bookDiv);
  });
}

function fetchBookDetails(workKey) {
  loading.classList.remove('hidden');
  fetch(`https://openlibrary.org${workKey}.json`)
    .then(response => {
      if (!response.ok) throw new Error('Book not found');
      return response.json();
    })
    .then(data => {
      const title = data.title;
      const synopsis = data.description
        ? (typeof data.description === 'string' ? data.description : data.description.value)
        : 'Synopsis not available.';
      const coverUrl = data.covers
        ? `https://covers.openlibrary.org/b/id/${data.covers[0]}-L.jpg`
        : 'https://via.placeholder.com/150?text=No+Cover';

      if (data.authors && data.authors.length > 0) {
        const authorKey = data.authors[0].author.key;
        fetch(`https://openlibrary.org${authorKey}.json`)
          .then(res => res.json())
          .then(authorData => {
            const authorName = authorData.name;
            loading.classList.add('hidden');
            showBookDetails(title, authorName, coverUrl, synopsis, workKey);
          })
          .catch(() => {
            loading.classList.add('hidden');
            showBookDetails(title, 'Unknown Author', coverUrl, synopsis, workKey);
          });
      } else {
        loading.classList.add('hidden');
        showBookDetails(title, 'Unknown Author', coverUrl, synopsis, workKey);
      }
    })
    .catch(() => {
      loading.classList.add('hidden');
      alert('Error loading book details');
    });
}

function showBookDetails(title, author, coverUrl, synopsis, workKey) {
  resultsDiv.innerHTML = `
    <div class="book-details">
      <h3>${title}</h3>
      <p>by ${author}</p>
      <img src="${coverUrl}" alt="${title} cover">
      <p><strong>Synopsis:</strong> ${synopsis}</p>
      <button id="add-fav">Add to Favorites</button>
    </div>
  `;

  document.getElementById('add-fav').addEventListener('click', () => {
    addToFavorites(title, author);
  });
}

function addToFavorites(title, author) {
  const exists = favorites.find(fav => fav.title === title && fav.author === author);
  if (!exists) {
    favorites.push({ title, author });
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();
  }
}

function renderFavorites() {
  favoritesList.innerHTML = '';
  favorites.forEach((fav, index) => {
    const li = document.createElement('li');
    li.className = 'favorite-item';
    li.textContent = `${fav.title} by ${fav.author}`;

    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'Remove';
    removeBtn.className = 'remove-btn';
    removeBtn.addEventListener('click', () => {
      favorites.splice(index, 1); // remove from array
      localStorage.setItem('favorites', JSON.stringify(favorites));
      renderFavorites(); // re-render list
    });

    li.appendChild(removeBtn);
    favoritesList.appendChild(li);
  });
}

