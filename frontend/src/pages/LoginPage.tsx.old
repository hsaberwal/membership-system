import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authApi } from '../services/api';
import toast from 'react-hot-toast';

interface LoginForm {
  username: string;
  password: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
  setIsLoading(true);
  try {
    const response = await authApi.login(data.username, data.password);
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    toast.success('Login successful!');
    navigate('/dashboard');  // Make sure this goes to /dashboard
  } catch (error: any) {
    toast.error(error.response?.data?.error || 'Invalid credentials');
  } finally {
    setIsLoading(false);
  }
 };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Membership System Login
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <input
                {...register('username', { required: true })}
                type="text"
                className="input rounded-t-md"
                placeholder="Username"
              />
            </div>
            <div>
              <input
                {...register('password', { required: true })}
                type="password"
                className="input rounded-b-md"
                placeholder="Password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn btn-primary"
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
