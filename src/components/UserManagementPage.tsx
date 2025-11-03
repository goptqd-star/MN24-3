import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { useUI } from '../contexts/UIContext';
import { User, Role } from '../types';

const getRoleBadgeClass = (role: Role) => {
    switch (role) {
        case Role.Admin:
            return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        case Role.BGH:
            return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
        case Role.KT_CD:
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        case Role.GV:
            return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
};

const UserManagementPage: React.FC = () => {
    const { classes, users, addUser, updateUser, deleteUser } = useData();
    const { isLoading } = useUI();

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
    const [newUser, setNewUser] = useState<Omit<User, 'id'>>({ email: '', displayName: '', role: Role.GV, assignedClass: '' });
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);

    const modalRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);
    
    // Accessibility: Focus trap for modals
    useEffect(() => {
        const isModalOpen = !!editingUser || !!deletingUser;
        if (isModalOpen && modalRef.current) {
            triggerRef.current = document.activeElement as HTMLElement;
            // FIX: Replaced generic type argument on `querySelectorAll` with a type assertion to fix the "Untyped function calls may not accept type arguments" error.
            const focusableElements = modalRef.current.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            ) as NodeListOf<HTMLElement>;
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key !== 'Tab') return;
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            };

            document.addEventListener('keydown', handleKeyDown);
            firstElement?.focus();

            return () => {
                document.removeEventListener('keydown', handleKeyDown);
                triggerRef.current?.focus();
            };
        }
    }, [editingUser, deletingUser]);

    const filteredUsers = useMemo(() =>
        users.filter(u =>
            u.displayName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        ).sort((a,b) => a.displayName.localeCompare(b.displayName)),
        [users, debouncedSearchTerm]);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        let userToAdd = { ...newUser };
        if (userToAdd.role !== Role.GV) {
            userToAdd.assignedClass = '';
        }
        const success = await addUser(userToAdd);
        if (success) {
            setNewUser({ email: '', displayName: '', role: Role.GV, assignedClass: '' });
        }
    };

    const handleUpdateUser = async () => {
        if (!editingUser) return;
        const { id, ...updatedData } = editingUser;
        let dataToUpdate: Partial<Omit<User, 'id'>> = {
            displayName: updatedData.displayName,
            email: updatedData.email,
            role: updatedData.role,
            assignedClass: updatedData.role === Role.GV ? updatedData.assignedClass : ''
        };
        
        const success = await updateUser(id, dataToUpdate);
        if (success) {
            setEditingUser(null);
        }
    }
    
    const handleDeleteUser = async () => {
        if(deletingUser) {
            await deleteUser(deletingUser.id);
            setDeletingUser(null);
        }
    }

    const handleRoleChange = (role: Role, userStateSetter: React.Dispatch<React.SetStateAction<any>>) => {
        userStateSetter((prev: any) => ({
            ...prev,
            role: role,
            assignedClass: role === Role.GV ? prev.assignedClass : ''
        }));
    };
    
    return (
        <div className="space-y-8">
            {deletingUser && (
                 <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
                    <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="delete-user-title" className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm m-4 modal-content">
                        <h3 id="delete-user-title" className="text-lg font-bold text-gray-900 dark:text-gray-100">Xác nhận xóa</h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                            Bạn có chắc chắn muốn xóa người dùng <span className="font-semibold">{deletingUser.displayName}</span>?
                        </p>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button onClick={() => setDeletingUser(null)} className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Hủy</button>
                            <button onClick={handleDeleteUser} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700">Xóa</button>
                        </div>
                    </div>
                </div>
            )}
            {editingUser && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
                    <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="edit-user-title" className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4 modal-content">
                        <h3 id="edit-user-title" className="text-lg font-bold text-gray-900 dark:text-gray-100">Chỉnh sửa người dùng</h3>
                        <div className="mt-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tên hiển thị</label>
                                <input type="text" value={editingUser.displayName} onChange={e => setEditingUser({...editingUser, displayName: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                <input type="email" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vai trò</label>
                                <select value={editingUser.role} onChange={e => handleRoleChange(e.target.value as Role, setEditingUser)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md">
                                    {Object.values(Role).map(role => <option key={role} value={role}>{role}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lớp phụ trách</label>
                                <select disabled={editingUser.role !== Role.GV} value={editingUser.assignedClass || ''} onChange={e => setEditingUser({...editingUser, assignedClass: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md disabled:bg-gray-100 dark:disabled:bg-gray-600">
                                    <option value="">Không có</option>
                                    {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3">
                            <button onClick={() => setEditingUser(null)} className="px-4 py-2 text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">Hủy</button>
                            <button onClick={handleUpdateUser} className="px-4 py-2 text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700">Lưu</button>
                        </div>
                    </div>
                </div>
            )}

            <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Quản lý người dùng</h2>
                <p className="mt-1 text-gray-600 dark:text-gray-400">Thêm, sửa, và quản lý vai trò của người dùng trong hệ thống.</p>
            </div>

            <div className="space-y-6">
                <details className="p-4 bg-gray-50 dark:bg-gray-800/50 border dark:border-gray-700 rounded-lg group">
                    <summary className="font-medium text-gray-800 dark:text-gray-200 cursor-pointer list-none flex justify-between items-center">
                        Hướng dẫn sửa lỗi User UID khi thêm người dùng mới
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform duration-200 group-open:rotate-180" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </summary>
                    <div className="mt-4 text-sm text-gray-600 dark:text-gray-300 space-y-4 prose prose-sm dark:prose-invert max-w-none">
                        <p>Khi một người dùng mới được tạo trong Firebase Authentication nhưng không thể đăng nhập vào ứng dụng, nguyên nhân thường là do <strong>User UID</strong> trong <strong>Authentication</strong> không khớp với <strong>Document ID</strong> trong <strong>Firestore</strong>. Dưới đây là cách khắc phục:</p>
                        <ol className="list-decimal pl-5 space-y-2">
                            <li>
                                <strong>Bước 1: Tìm và sao chép User UID chính xác</strong>
                                <ul className="list-disc pl-5 mt-1">
                                    <li>Truy cập Firebase Console và chọn dự án của bạn.</li>
                                    <li>Ở menu bên trái, vào mục <strong>Authentication</strong>.</li>
                                    <li>Trong tab <strong>Users</strong>, tìm đến tài khoản người dùng mới mà bạn đã tạo (dựa vào email).</li>
                                    <li>Ở cột <strong>User UID</strong>, hãy sao chép (copy) toàn bộ chuỗi ký tự đó.</li>
                                </ul>
                            </li>
                            <li>
                                <strong>Bước 2: Sửa lại Document trong Firestore</strong>
                                <ul className="list-disc pl-5 mt-1">
                                    <li>Vẫn trong Firebase Console, ở menu bên trái, vào mục <strong>Firestore Database</strong>.</li>
                                    <li>Chọn collection <strong>users</strong>.</li>
                                    <li><strong>Tìm và xóa Document sai:</strong> Tìm đến document của người dùng đang bị lỗi (bạn có thể nhận ra nó qua trường email). Document ID của nó sẽ là một chuỗi ký tự ngẫu nhiên. Hãy nhấn vào dấu ba chấm (...) ở cuối hàng và chọn <strong>Delete document</strong>.</li>
                                    <li><strong>Tạo lại Document đúng:</strong>
                                        <ul className="list-disc pl-5 mt-1">
                                            <li>Nhấn vào nút <strong>+ Add document</strong>.</li>
                                            <li className="font-bold text-red-500">BƯỚC QUAN TRỌNG NHẤT: Trong ô <strong>Document ID</strong>, hãy dán (paste) giá trị User UID mà bạn đã sao chép ở Bước 1. Tuyệt đối không để trống để Firebase tự tạo ID.</li>
                                            <li>Bây giờ, hãy thêm lại các trường (fields) cho người dùng đó:
                                                <ul className="list-disc pl-5 mt-1 font-mono text-xs">
                                                    <li><strong>email</strong> (string): email của người dùng</li>
                                                    <li><strong>displayName</strong> (string): Tên hiển thị</li>
                                                    <li><strong>role</strong> (string): Vai trò (ví dụ: Giáo viên)</li>
                                                    <li><strong>assignedClass</strong> (string): Lớp phụ trách (nếu là giáo viên)</li>
                                                </ul>
                                            </li>
                                            <li>Nhấn <strong>Save</strong>.</li>
                                        </ul>
                                    </li>
                                </ul>
                            </li>
                             <li>
                                <strong>Bước 3: Kiểm tra lại</strong>
                                <p className="mt-1">Bây giờ, hãy yêu cầu người dùng đăng nhập lại. Lỗi sẽ biến mất.</p>
                            </li>
                        </ol>
                    </div>
                </details>

                <form onSubmit={handleAddUser} className="p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg space-y-4">
                    <h3 className="font-medium text-lg text-gray-800 dark:text-gray-200">Thêm người dùng mới</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tên hiển thị <span className="text-red-500">*</span></label>
                            <input required type="text" value={newUser.displayName} onChange={e => setNewUser({...newUser, displayName: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email <span className="text-red-500">*</span></label>
                            <input required type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vai trò <span className="text-red-500">*</span></label>
                            <select value={newUser.role} onChange={e => handleRoleChange(e.target.value as Role, setNewUser)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md">
                                {Object.values(Role).map(role => <option key={role} value={role}>{role}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lớp phụ trách (cho Giáo viên)</label>
                            <select disabled={newUser.role !== Role.GV} value={newUser.assignedClass} onChange={e => setNewUser({...newUser, assignedClass: e.target.value})} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md disabled:bg-gray-100 dark:disabled:bg-gray-600">
                                <option value="">Không có</option>
                                {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <button type="submit" className="w-full sm:w-auto flex-shrink-0 justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700">
                        Thêm người dùng
                    </button>
                </form>

                <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Danh sách người dùng ({users.length})</h3>
                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Tìm kiếm người dùng..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full max-w-sm px-3 py-2 bg-white dark:bg-gray-700 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md"
                        />
                    </div>
                    <div className="bg-white dark:bg-gray-800/50 shadow-sm border dark:border-gray-700 rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tên hiển thị</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Email</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Vai trò</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Lớp phụ trách</th>
                                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredUsers.map(user => (
                                        <tr key={user.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-100">{user.displayName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{user.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">{user.assignedClass || '—'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                                <button onClick={() => setEditingUser(user)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200">Sửa</button>
                                                <button onClick={() => setDeletingUser(user)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200">Xóa</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredUsers.length === 0 && (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-6">{isLoading ? "Đang tải..." : "Không tìm thấy người dùng nào."}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagementPage;