import React, { useState, Fragment } from 'react';
import { useQuery } from '@apollo/client';

import { ALL_BOOKS } from '../queries';

const Books = (props) => {
  const books = useQuery(ALL_BOOKS);
  const [genre, setGenre] = useState('');

  const renderGenreButtons = () => {
    const genres = new Set(); // Ensure unique genres
    books.data.allBooks.forEach((book) => {
      book.genres.forEach((genre) => genres.add(genre));
    });
    const buttons = Array.from(genres).map((genre) => (
      <button key={genre} onClick={() => setGenre(genre)}>
        {genre}
      </button>
    ));
    buttons.push(
      <button key="all" onClick={() => setGenre('')}>
        all genres
      </button>
    );
    return buttons;
  };

  const renderBooks = () => {
    if (genre) {
      return books.data.allBooks
        .filter((book) => book.genres.includes(genre))
        .map((a) => (
          <tr key={a.title}>
            <td>{a.title}</td>
            <td>{a.author.name}</td>
            <td>{a.published}</td>
          </tr>
        ));
    }
    return books.data.allBooks.map((a) => (
      <tr key={a.title}>
        <td>{a.title}</td>
        <td>{a.author.name}</td>
        <td>{a.published}</td>
      </tr>
    ));
  };

  return (
    <div>
      <h2>books</h2>

      {!books.data ? (
        <h3>Loading ...</h3>
      ) : (
        <Fragment>
          <table>
            <tbody>
              <tr>
                <th></th>
                <th>author</th>
                <th>published</th>
              </tr>
              {renderBooks()}
            </tbody>
          </table>
          {renderGenreButtons()}
        </Fragment>
      )}
    </div>
  );
};

export default Books;
