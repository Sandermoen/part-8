import React, { Fragment } from 'react';
import { useQuery } from '@apollo/client';

import { BOOK_BY_GENRE } from '../queries';

const Recommended = ({ user }) => {
  const books = useQuery(BOOK_BY_GENRE, {
    variables: { genre: user.favoriteGenre },
  });

  return (
    <div>
      <h2>recommendations</h2>

      {!books.data || !user ? (
        <h3>Loading ...</h3>
      ) : (
        <Fragment>
          <p>
            books in your favorite genre <b>{user.favoriteGenre}</b>
          </p>
          <table>
            <tbody>
              <tr>
                <th></th>
                <th>author</th>
                <th>published</th>
              </tr>
              {books.data.allBooks.map((book) => (
                <tr key={book.title}>
                  <td>{book.title}</td>
                  <td>{book.author.name}</td>
                  <td>{book.published}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Fragment>
      )}
    </div>
  );
};

export default Recommended;
