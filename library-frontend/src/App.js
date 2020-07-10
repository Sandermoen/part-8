import React, { useState, Fragment, useEffect } from 'react';
import { useApolloClient, useLazyQuery, useSubscription } from '@apollo/client';

import Authors from './components/Authors';
import Books from './components/Books';
import NewBook from './components/NewBook';
import LoginForm from './components/LoginForm';
import Recommended from './components/Recommended';

import { ME, BOOK_ADDED, ALL_BOOKS } from './queries';

const App = () => {
  const [page, setPage] = useState('authors');
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const client = useApolloClient();

  const [getUser, result] = useLazyQuery(ME);

  useEffect(() => {
    const token = localStorage.getItem('token');
    token && setToken(token);
  }, []);

  useEffect(() => {
    if (token) {
      getUser();
    }
  }, [token, getUser]);

  useEffect(() => {
    if (result.data) {
      setUser(result.data.me);
    }
  }, [result, setUser]);

  const handleLogout = () => {
    setToken(null);
    localStorage.clear();
    client.resetStore();
  };

  const updateCacheWith = (addedBook) => {
    const includedIn = (set, object) => {
      return set.map((book) => book.id).includes(object.id);
    };

    const dataInStore = client.readQuery({ query: ALL_BOOKS });
    if (!includedIn(dataInStore.allBooks, addedBook)) {
      client.writeQuery({
        query: ALL_BOOKS,
        data: { allBooks: dataInStore.allBooks.concat(addedBook) },
      });
    }
  };

  useSubscription(BOOK_ADDED, {
    onSubscriptionData: ({ subscriptionData }) => {
      console.log(subscriptionData);
      const book = subscriptionData.data.bookAdded;
      updateCacheWith(book);
    },
  });

  return (
    <div>
      <div>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>
        {!token ? (
          <button onClick={() => setPage('login')}>login</button>
        ) : (
          <Fragment>
            <button onClick={() => setPage('add')}>add book</button>
            <button onClick={() => setPage('recommended')}>recommended</button>
            <button onClick={handleLogout}>logout</button>
          </Fragment>
        )}
      </div>

      {page === 'authors' && <Authors authenticated={!!token} />}
      {page === 'books' && <Books />}
      {page === 'add' && <NewBook user={user} />}
      {page === 'recommended' && <Recommended user={user} />}

      {!token && page === 'login' && (
        <LoginForm setToken={setToken} redirect={() => setPage('authors')} />
      )}
    </div>
  );
};

export default App;
