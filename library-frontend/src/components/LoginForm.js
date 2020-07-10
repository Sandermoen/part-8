import React, { useState, useEffect, Fragment } from 'react';
import { useMutation } from '@apollo/client';

import { LOGIN } from '../queries';

const LoginForm = ({ setToken, redirect }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [login, result] = useMutation(LOGIN);

  useEffect(() => {
    if (result.data) {
      console.log('test');
      const token = result.data.login.value;
      setToken(token);
      localStorage.setItem('token', token);
      redirect();
    }
  }, [result.data]); // eslint-disable-line

  const handleSubmit = (event) => {
    event.preventDefault();
    login({ variables: { username, password } });
  };

  return (
    <Fragment>
      <h1>Login</h1>
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'baseline',
        }}
      >
        <input
          type="text"
          placeholder="Username"
          onChange={(event) => setUsername(event.target.value)}
          value={username}
        />
        <input
          type="password"
          placeholder="Password"
          onChange={(event) => setPassword(event.target.value)}
          value={password}
        />
        <button type="submit">Log in</button>
      </form>
    </Fragment>
  );
};

export default LoginForm;
