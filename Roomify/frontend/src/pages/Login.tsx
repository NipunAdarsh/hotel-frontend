import { jwtDecode } from 'jwt-decode';
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const response = await fetch(
        'https://hotel-management-system-1-ejha.onrender.com/api/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);

        const decodedToken: any = jwtDecode(data.token);
        const userRole = decodedToken.role;

        if (userRole === 'Admin' || userRole === 'Manager') {
          navigate('/dashboard');
        } else if (userRole === 'Restaurant') {
          navigate('/pos');
        } else if (userRole === 'Receptionist') {
          navigate('/dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        setErrorMsg(data.error || 'Login failed.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Cannot connect to the server. Is your backend running?');
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex items-center justify-center p-6">
      <main className="w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Login</h2>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-md">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 border rounded"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 border rounded"
          />

          <button
            type="submit"
            className="w-full bg-green-600 text-white p-3 rounded"
          >
            Login
          </button>
        </form>

        <div className="mt-5 space-y-2 text-sm">
          <p>
            Are you a guest?{' '}
            <Link to="/user/login" className="text-blue-500 font-semibold">
              Login here
            </Link>
          </p>
          <p>
            New guest?{' '}
            <Link to="/user/register" className="text-blue-500 font-semibold">
              Create a guest account
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};
