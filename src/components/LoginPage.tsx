import React, { useState, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
// FIX: Correctly import FirebaseError from 'firebase/app' for modular SDK.
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-1