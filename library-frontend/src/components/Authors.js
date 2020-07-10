import React, { useState, Fragment, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';

import { ALL_AUTHORS, UPDATE_BIRTH_YEAR } from '../queries';

const Authors = (props) => {
  const [name, setName] = useState('');
  const [year, setYear] = useState(0);
  const authors = useQuery(ALL_AUTHORS);
  const [updateBirthYear] = useMutation(UPDATE_BIRTH_YEAR, {
    refetchQueries: [{ query: ALL_AUTHORS }],
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    updateBirthYear({ variables: { name, setBornTo: Number(year) } });
    setYear(0);
  };

  useEffect(() => {
    if (authors.data) {
      setName(authors.data.allAuthors[0].name);
    }
  }, [authors]);

  return (
    <div>
      <h2>authors</h2>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>born</th>
            <th>books</th>
          </tr>
          {authors.data &&
            authors.data.allAuthors.map((a) => (
              <tr key={a.name}>
                <td>{a.name}</td>
                <td>{a.born}</td>
                <td>{a.bookCount}</td>
              </tr>
            ))}
        </tbody>
      </table>
      {authors.data && props.authenticated && (
        <Fragment>
          <h1>Set birthyear</h1>
          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'baseline',
            }}
          >
            <select
              defaultValue={name}
              onChange={(event) => setName(event.target.value)}
            >
              {authors.data.allAuthors.map((author, idx) => (
                <option key={author.id} value={author.name}>
                  {author.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              onChange={(event) => setYear(event.target.value)}
              value={year}
              placeholder="Birthyear"
            />
            <button type="submit">Update author</button>
          </form>
        </Fragment>
      )}
    </div>
  );
};

export default Authors;
