import React, { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FirebaseError } from 'firebase/app';

const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const getFriendlyAuthError = (errorCode: string): string => {
    switch (errorCode) {
        case 'auth/invalid-email':
            return 'Địa chỉ email không hợp lệ.';
        case 'auth/user-not-found':
        case 'auth/invalid-credential':
             return 'Email hoặc mật khẩu không chính xác.';
        case 'auth/wrong-password':
            return 'Mật khẩu không chính xác.';
        case 'auth/too-many-requests':
            return 'Tài khoản đã bị tạm khóa do quá nhiều lần thử. Vui lòng thử lại sau.';
        default:
            return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
    }
};

const LoginPage: React.FC = () => {
    const { signInWithEmail } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await signInWithEmail(email, password);
            // On successful login, onAuthStateChanged in context will handle the rest
        } catch (err: any) {
            if (err instanceof FirebaseError) {
                setError(getFriendlyAuthError(err.code));
            } else {
                setError('Đã xảy ra lỗi khi đăng nhập.');
            }
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                 <div className="flex justify-center">
                    <div className="w-14 h-14 bg-amber-400 rounded-full flex items-center justify-center shadow-md">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21.8,4.27A2,2,0,0,0,20,3H4A2,2,0,0,0,2.2,4.27l2.85,9.26a2,2,0,0,0,2,1.47H17a2,2,0,0,0,2-1.47Z" />
                            <path d="M5,17H19a1,1,0,0,1,0,2H5a1,1,0,0,1,0-2Z" />
                            <path d="M12 1a3.89 3.89 0 00-4 .78 1 1 0 101.41 1.42A1.9 1.9 0 0112 2a1.89 1.89 0 012.55.79 1 1 0 001.41-1.42A3.88 3.88 0 0012 1zM8 1a3.89 3.89 0 00-4 .78 1 1 0 101.41 1.42A1.9 1.9 0 018 2a1.89 1.89 0 012.55.79 1 1 0 001.41-1.42A3.88 3.88 0 008 1zM16 1a3.89 3.89 0 00-4 .78 1 1 0 101.41 1.42A1.9 1.9 0 0116 2a1.89 1.89 0 012.55.79 1 1 0 001.41-1.42A3.88 3.88 0 0016 1z" />
                        </svg>
                    </div>
                </div>
                <h2 className="mt-4 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                    Trường Mầm non 24/3
                </h2>
                 <p className="mt-2 text-center text-lg text-gray-600 dark:text-gray-400">
                    Đăng nhập hệ thống suất ăn
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow-lg sm:rounded-lg sm:px-10">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Địa chỉ email
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password"className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Mật khẩu
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500 sm:text-sm bg-white dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        </div>

                        {error && (
                            <div role="alert" aria-live="assertive" className="text-red-600 dark:text-red-400 text-sm p-3 bg-red-50 dark:bg-red-900/50 rounded-md">
                                {error}
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-teal-400 dark:disabled:bg-teal-800 disabled:cursor-wait"
                            >
                                {isLoading ? <LoadingSpinner /> : 'Đăng nhập'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;