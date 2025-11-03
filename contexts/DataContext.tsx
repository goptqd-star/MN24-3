import React, { createContext, useState, useEffect, useCallback, useContext, ReactNode, useMemo } from 'react';
import { MealRegistration, ClassInfo, User, Role, Announcement, AuditLog, AuditLogAction, MealType } from '../types';
import { getDb } from '../firebaseConfig';
// FIX: Correctly and explicitly import all functions and types from 'firebase/firestore'.
import { 
    collection, onSnapshot, query, where, getDocs, writeBatch, doc, setDoc, deleteDoc, runTransaction, 
    updateDoc, serverTimestamp, getCountFromServer, orderBy, limit, startAfter, addDoc, arrayUnion, Timestamp 
} from 'firebase/firestore';
import type { DocumentData, QueryConstraint, DocumentSnapshot } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useUI } from './UIContext';


interface DataContextType {
  editingInfo: { className: string; date: string } | null;
  classes: ClassInfo[];
  users: User[];
  announcements: Announcement[];
  unreadAnnouncementsCount: number;
  dataVersion: number; // Used to trigger refetches in components
  recentlyUpdatedKeys: Set<string>; // For UI highlighting
  showBackupPrompt: boolean;
  isAnnouncementRead: (ann: Announcement) => boolean;
  addRegistrations: (newRegistrations: Omit<MealRegistration, 'id' | 'updatedAt'>[]) => Promise<void>;
  updateRegistrations: (updates: Omit<MealRegistration, 'id' | 'updatedAt'>[], originals: MealRegistration[]) => Promise<void>;
  requestEdit: (className: string, date: string) => void;
  clearEditing: () => void;
  deleteRegistrations: (className: string, date: string) => Promise<void>;
  deleteMultipleRegistrationsByDate: (items: {className: string, date: string}[]) => Promise<void>;
  addClass: (newClass: Omit<ClassInfo, 'id' | 'updatedAt'>) => Promise<boolean>;
  updateClass: (classId: string, updatedData: Omit<ClassInfo, 'id' | 'updatedAt'>) => Promise<boolean>;
  deleteClass: (classToDelete: ClassInfo) => Promise<void>;
  getRegistrations: (options: { 
    dates?: string[], 
    classNames?: string[], 
    dateRange?: {from: string, to: string},
    limit?: number,
    lastVisibleDoc?: DocumentSnapshot<DocumentData> | null,
    getAll?: boolean, 
    skipCount?: boolean 
  }) => Promise<{
    registrations: MealRegistration[],
    lastDoc: DocumentSnapshot<DocumentData> | null,
    totalCount: number
  }>;
  addUser: (newUser: Omit<User, 'id'>) => Promise<boolean>;
  updateUser: (userId: string, updatedData: Partial<Omit<User, 'id'>>) => Promise<boolean>;
  deleteUser: (userId: string) => Promise<void>;
  addAnnouncement: (data: Omit<Announcement, 'id' | 'createdAt' | 'createdBy' | 'createdById' | 'readBy'>) => Promise<boolean>;
  updateAnnouncement: (id: string, data: Partial<Omit<Announcement, 'id'>>) => Promise<boolean>;
  deleteAnnouncement: (id: string) => Promise<void>;
  markAnnouncementsAsRead: (announcementIds: string[]) => Promise<void>;
  getAuditLogs: (options: {
    limit: number,
    lastVisibleDoc?: DocumentSnapshot<DocumentData> | null,
  }) => Promise<{ logs: AuditLog[], lastDoc: DocumentSnapshot<DocumentData> | null }>;
  deleteAuditLogs: (logIds: string[]) => Promise<void>;
  exportData: (options: { format: 'csv' | 'pdf', dateRange: { from: string, to: string }, classNames: string[] }) => Promise<void>;
  dismissBackupPrompt: () => void;
  // FIX: Add missing function definitions.
  sendReminderForMissingClasses: (classNames: string[], date: string) => Promise<void>;
  getArchivedRegistrations: (options: { 
    dateRange?: {from: string, to: string},
    classNames?: string[], 
    getAll?: boolean 
  }) => Promise<{ registrations: MealRegistration[] }>;
  archiveRegistrationsByMonth: (year: number, month: number) => Promise<void>;
}


const DataContext = createContext<DataContextType | undefined>(undefined);

const DEFAULT_CLASSES: Omit<ClassInfo, 'id'>[] = [
    { name: 'Mầm', studentCount: 20 },
    { name: 'Chồi', studentCount: 25 },
    { name: 'Lá', studentCount: 30 },
];

const sortClasses = (classes: ClassInfo[]): ClassInfo[] => {
    const order: Record<string, number> = {
        'Nhà trẻ': 1, 'Bé': 2, 'Nhỡ': 3, 'Lớn': 4
    };

    return [...classes].sort((a, b) => {
        const aMatch = a.name.match(/^(\D+)\s*(\d*)$/);
        const bMatch = b.name.match(/^(\D+)\s*(\d*)$/);

        const aName = aMatch ? aMatch[1].trim() : a.name;
        const aNum = aMatch && aMatch[2] ? parseInt(aMatch[2], 10) : 0;
        const bName = bMatch ? bMatch[1].trim() : b.name;
        const bNum = bMatch && bMatch[2] ? parseInt(bMatch[2], 10) : 0;
        
        const orderA = order[aName] || 99;
        const orderB = order[bName] || 99;

        if (orderA !== orderB) {
            return orderA - orderB;
        }

        return aNum - bNum;
    });
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const db = getDb();
  const { currentUser } = useAuth();
  const { addToast, addNotification, setIsLoading } = useUI();

  const [editingInfo, setEditingInfo] = useState<{ className: string; date: string } | null>(null);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dataVersion, setDataVersion] = useState(0);
  const [recentlyUpdatedKeys, setRecentlyUpdatedKeys] = useState(new Set<string>());
  const [showBackupPrompt, setShowBackupPrompt] = useState(false);
  
  // Local state for announcement read status, acting as a client-side cache
  const [locallyReadIds, setLocallyReadIds] = useState<Set<string>>(new Set());

  // Load read statuses from localStorage when user logs in
  useEffect(() => {
    if (currentUser) {
        try {
            const item = localStorage.getItem(`readAnnouncements_${currentUser.id}`);
            setLocallyReadIds(item ? new Set(JSON.parse(item)) : new Set());
        } catch {
            // In case of parsing error, start with an empty set
            setLocallyReadIds(new Set());
        }
    } else {
        // Clear local cache on logout
        setLocallyReadIds(new Set());
    }
  }, [currentUser]);


  const triggerRefetch = () => setDataVersion(v => v + 1);

   const logAction = useCallback(async (action: AuditLogAction, details: Record<string, any>) => {
    if (!currentUser) return;
    try {
        await addDoc(collection(db, 'audit_logs'), {
            action,
            details,
            userId: currentUser.id,
            userName: currentUser.displayName,
            timestamp: serverTimestamp(),
        });
    } catch (error) {
        console.error("Failed to write to audit log:", error);
    }
  }, [currentUser, db]);
  
  const checkForBackupPrompt = useCallback(() => {
    if (currentUser?.role !== Role.Admin) return;
    
    try {
        const settingsStr = localStorage.getItem('backupSettings_v1');
        const settings = settingsStr ? JSON.parse(settingsStr) : { day: '1', hour: '8' };
        const reminderDay = settings.day;
        const reminderHour = parseInt(settings.hour, 10);

        const now = new Date();
        const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const dismissedKey = `backupPromptDismissed_${currentYearMonth}`;

        if (localStorage.getItem(dismissedKey)) {
            setShowBackupPrompt(false);
            return;
        }
        
        const isTargetDay = reminderDay === 'last' 
            ? now.getDate() === new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
            : now.getDate() === parseInt(reminderDay, 10);

        if (isTargetDay && now.getHours() >= reminderHour) {
            setShowBackupPrompt(true);
        } else {
            setShowBackupPrompt(false);
        }

    } catch (e) {
        console.error("Could not check for backup prompt:", e);
    }
  }, [currentUser]);

  useEffect(() => {
     checkForBackupPrompt();
  }, [currentUser, checkForBackupPrompt]);

  const dismissBackupPrompt = useCallback(() => {
    try {
        const now = new Date();
        const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const dismissedKey = `backupPromptDismissed_${currentYearMonth}`;
        localStorage.setItem(dismissedKey, 'true');
        setShowBackupPrompt(false);
    } catch(e) {
        console.error("Could not dismiss backup prompt:", e);
    }
  }, []);
  
    // Centralized function to check read status from both server data and local cache.
    const isAnnouncementRead = useCallback((ann: Announcement): boolean => {
        if (!currentUser) return true; // Default to read if no user
        // An announcement is considered read if the user's ID is in the server's `readBy` array OR in our local cache.
        return ann.readBy.includes(currentUser.id) || locallyReadIds.has(ann.id);
    }, [currentUser, locallyReadIds]);


  const unreadAnnouncementsCount = useMemo(() => {
    if (!currentUser) return 0;
    // Recalculate unread count using the reliable isAnnouncementRead function
    return announcements.filter(a => !isAnnouncementRead(a)).length;
  }, [announcements, currentUser, isAnnouncementRead]);


  useEffect(() => {
    if (!currentUser) {
        setClasses([]);
        setUsers([]);
        setAnnouncements([]);
        return;
    };

    setIsLoading(true);
    const classesCollectionRef = collection(db, "classes");
    const unsubscribeClasses = onSnapshot(classesCollectionRef,
      async (snapshot) => {
        if (snapshot.empty) {
          console.log("No classes found. Populating with default classes.");
          const batch = writeBatch(db);
          DEFAULT_CLASSES.forEach(classData => {
            const newClassRef = doc(classesCollectionRef);
            batch.set(newClassRef, {...classData, updatedAt: serverTimestamp()});
          });
          await batch.commit();
        } else {
          const classesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ClassInfo));
          setClasses(sortClasses(classesData));
        }
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching classes:", error);
        addToast("Không thể tải danh sách lớp.", "error");
        setIsLoading(false);
      }
    );
    
    let unsubscribeUsers = () => {};
    if (currentUser.role === Role.Admin) {
        const usersCollectionRef = collection(db, "users");
        unsubscribeUsers = onSnapshot(usersCollectionRef,
          (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
            setUsers(usersData);
          },
          (error) => {
            console.error("Error fetching users:", error);
            addToast("Không thể tải danh sách người dùng.", "error");
          }
        );
    }
    
    const announcementsQuery = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
    const unsubscribeAnnouncements = onSnapshot(announcementsQuery, (snapshot) => {
        const announcementData = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Announcement));
        setAnnouncements(announcementData);
    }, (error) => {
        console.error("Error fetching announcements:", error);
        addToast("Không thể tải thông báo.", "error");
    });


    return () => {
      unsubscribeClasses();
      unsubscribeUsers();
      unsubscribeAnnouncements();
    };
  }, [addToast, currentUser, db, setIsLoading]);

  const addRegistrations = useCallback(async (newRegistrations: Omit<MealRegistration, 'id' | 'updatedAt'>[]) => {
    if (!currentUser) {
        addToast("Lỗi: Không tìm thấy thông tin người dùng.", "error");
        return;
    }
    setIsLoading(true);
    try {
      const batch = writeBatch(db);
      const userInfo = {
          registeredById: currentUser.id,
          registeredBy: currentUser.displayName
      };
      
      for (const newReg of newRegistrations) {
        const q = query(
          collection(db, 'registrations'),
          where('date', '==', newReg.date),
          where('className', '==', newReg.className),
          where('mealType', '==', newReg.mealType)
        );
        
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          querySnapshot.forEach(docSnap => {
            if (newReg.count > 0) {
              batch.update(docSnap.ref, { count: newReg.count, updatedAt: serverTimestamp(), ...userInfo });
            } else {
              batch.delete(docSnap.ref);
            }
          });
        } else if (newReg.count > 0) {
          const newDocRef = doc(collection(db, 'registrations'));
          batch.set(newDocRef, { ...newReg, updatedAt: serverTimestamp(), ...userInfo });
        }
      }
      
      await batch.commit();
      await logAction('CREATE_REGISTRATION', { registrations: newRegistrations.filter(r => r.count > 0) });
      triggerRefetch();
    } catch (error) {
      console.error("Failed to save registrations", error);
      addToast("Lỗi khi lưu đăng ký.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [addToast, currentUser, db, logAction, setIsLoading]);

  const updateRegistrations = useCallback(async (updates: Omit<MealRegistration, 'id' | 'updatedAt'>[], originals: MealRegistration[]) => {
    if (!currentUser) {
        addToast("Lỗi: Không tìm thấy thông tin người dùng.", "error");
        return;
    }
    setIsLoading(true);
    try {
        const changes: any[] = [];
        await runTransaction(db, async (transaction) => {
            if (originals.length > 0) {
                const originalDocs = new Map(originals.map(o => [o.id, o]));
                const docRefs = originals.map(o => doc(db, 'registrations', o.id));
                const serverDocs = await Promise.all(docRefs.map(ref => transaction.get(ref)));

                for (let i = 0; i < serverDocs.length; i++) {
                    const serverDoc = serverDocs[i];
                    if (!serverDoc.exists()) continue;
                    const clientDoc = originalDocs.get(serverDoc.id);
                    const serverTimestamp = (serverDoc.data()?.updatedAt as Timestamp | undefined)?.toMillis();
                    const clientTimestamp = clientDoc?.updatedAt?.toMillis();
                    
                    if (serverTimestamp !== clientTimestamp) {
                        throw new Error("STALE_DATA");
                    }
                }
            }
            
            const originalsMap = new Map(originals.map(o => [`${o.date}-${o.mealType}`, o]));
            const updatesMap = new Map(updates.map(u => [`${u.date}-${u.mealType}`, u]));
            const allKeys = new Set([...originals.map(o => `${o.date}-${o.mealType}`), ...updates.map(u => `${u.date}-${u.mealType}`)]);
            const currentUserInfo = { registeredById: currentUser.id, registeredBy: currentUser.displayName };

            allKeys.forEach(key => {
                const original = originalsMap.get(key);
                const update = updatesMap.get(key);
                
                const originalCount = original?.count ?? 0;
                const newCount = update?.count ?? 0;

                if (original) {
                    if (newCount > 0) {
                        if (newCount !== originalCount) {
                            changes.push({ mealType: original.mealType, oldValue: originalCount, newValue: newCount });
                            transaction.update(doc(db, 'registrations', original.id), { count: newCount, updatedAt: serverTimestamp(), ...currentUserInfo });
                        }
                    } else {
                        changes.push({ mealType: original.mealType, oldValue: originalCount, newValue: 0 });
                        transaction.delete(doc(db, 'registrations', original.id));
                    }
                } else {
                    if (newCount > 0) {
                        changes.push({ mealType: update!.mealType, oldValue: 0, newValue: newCount });
                        const newDocRef = doc(collection(db, 'registrations'));
                        transaction.set(newDocRef, { ...(update as Omit<MealRegistration, 'id'>), updatedAt: serverTimestamp(), ...currentUserInfo });
                    }
                }
            });
        });
        if (changes.length > 0) {
            await logAction('UPDATE_REGISTRATION', { className: updates[0]?.className, date: updates[0]?.date, changes });
        }
        triggerRefetch();
    } catch (error: any) {
        setIsLoading(false);
        if (error.message === 'STALE_DATA') {
            addToast('Dữ liệu đã bị thay đổi bởi người khác. Vui lòng tải lại.', 'error');
            throw error;
        } else {
            console.error("Failed to update registrations", error);
            addToast("Lỗi khi cập nhật đăng ký.", "error");
        }
    } finally {
        setIsLoading(false);
    }
  }, [addToast, currentUser, db, logAction, setIsLoading]);

  const getRegistrations = useCallback(async (options: { 
    dates?: string[], 
    classNames?: string[], 
    dateRange?: { from: string, to: string },
    limit?: number,
    lastVisibleDoc?: DocumentSnapshot<DocumentData> | null,
    getAll?: boolean,
    skipCount?: boolean
   }): Promise<{
    registrations: MealRegistration[],
    lastDoc: DocumentSnapshot<DocumentData> | null,
    totalCount: number
  }> => {
    const { dates, classNames, dateRange, limit: queryLimit, lastVisibleDoc, getAll = false, skipCount = false } = options;
    const constraints: QueryConstraint[] = [];
    
    if (dateRange && dateRange.from) constraints.push(where('date', '>=', dateRange.from));
    if (dateRange && dateRange.to) constraints.push(where('date', '<=', dateRange.to));
    if (classNames && classNames.length > 0) constraints.push(where('className', 'in', classNames));
    if (dates && dates.length > 0) constraints.push(where('date', 'in', dates));

    const baseQuery = query(collection(db, 'registrations'), ...constraints);

    let totalCount = 0;
    if (!skipCount) {
        const countSnapshot = await getCountFromServer(baseQuery);
        totalCount = countSnapshot.data().count;
    }

    const mainQueryConstraints: QueryConstraint[] = [orderBy('date', 'desc')];
    if (!getAll && queryLimit) mainQueryConstraints.push(limit(queryLimit));
    if (!getAll && lastVisibleDoc) mainQueryConstraints.push(startAfter(lastVisibleDoc));

    const finalQuery = query(baseQuery, ...mainQueryConstraints);
    const snapshot = await getDocs(finalQuery);

    const registrations = snapshot.docs.map(doc => ({...doc.data(), id: doc.id } as MealRegistration));
    const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
    
    return { registrations, lastDoc, totalCount };
  }, [db]);
  
  const exportData = useCallback(async (options: { format: 'csv' | 'pdf', dateRange: { from: string, to: string }, classNames: string[] }) => {
        const { format, dateRange, classNames } = options;
        addToast('Đang chuẩn bị file... Quá trình này có thể mất vài giây.', 'success');
        setIsLoading(true);

        // FIX: Define a type for the aggregated data to avoid using 'any' and fix type errors.
        interface ExportableRow {
            date: string;
            className: string;
            meals: { [key in MealType]?: { count: number; registeredBy?: string; } };
        }

        try {
            const { registrations: allRegistrations } = await getRegistrations({
                dateRange: (dateRange.from && dateRange.to) ? dateRange : undefined,
                classNames: classNames.length > 0 ? classNames : undefined,
                getAll: true
            });

            // FIX: Explicitly type the accumulator for the `reduce` function to ensure `dataByDateAndClass` has the correct type.
            const dataByDateAndClass = allRegistrations.reduce((acc: Record<string, ExportableRow>, reg) => {
                const key = `${reg.date}-${reg.className}`;
                if (!acc[key]) {
                    acc[key] = { date: reg.date, className: reg.className, meals: {} };
                }
                acc[key].meals[reg.mealType] = {
                    count: reg.count,
                    registeredBy: reg.registeredBy
                };
                return acc;
            }, {} as Record<string, ExportableRow>);
            
            const exportableData = Object.values(dataByDateAndClass).sort((a: ExportableRow, b: ExportableRow) => b.date.localeCompare(a.date) || a.className.localeCompare(b.className));
            
            const totals = exportableData.reduce((acc, item) => {
                acc[MealType.KidsBreakfast] = (acc[MealType.KidsBreakfast] || 0) + (item.meals[MealType.KidsBreakfast]?.count || 0);
                acc[MealType.KidsLunch] = (acc[MealType.KidsLunch] || 0) + (item.meals[MealType.KidsLunch]?.count || 0);
                acc[MealType.TeachersLunch] = (acc[MealType.TeachersLunch] || 0) + (item.meals[MealType.TeachersLunch]?.count || 0);
                return acc;
            }, {
                [MealType.KidsBreakfast]: 0,
                [MealType.KidsLunch]: 0,
                [MealType.TeachersLunch]: 0,
            } as Record<MealType, number>);

            if (format === 'csv') {
                const separator = ';';
                const headers = ["Lớp", "Ngày", MealType.KidsBreakfast, "Người ĐK", MealType.KidsLunch, "Người ĐK", MealType.TeachersLunch, "Người ĐK", "Tổng cộng"];
                let csvContent = "\uFEFF" + headers.map(h => `"${h}"`).join(separator) + '\r\n';

                exportableData.forEach((item: ExportableRow) => {
                    const rowTotal = Object.values(item.meals).reduce((sum, meal) => sum + (meal?.count || 0), 0);
                    const row = [
                        item.className, new Date(item.date + 'T00:00:00').toLocaleDateString('vi-VN'),
                        item.meals[MealType.KidsBreakfast]?.count || 0, item.meals[MealType.KidsBreakfast]?.registeredBy || '',
                        item.meals[MealType.KidsLunch]?.count || 0, item.meals[MealType.KidsLunch]?.registeredBy || '',
                        item.meals[MealType.TeachersLunch]?.count || 0, item.meals[MealType.TeachersLunch]?.registeredBy || '',
                        rowTotal
                    ].map(val => `"${val}"`);
                    csvContent += row.join(separator) + '\r\n';
                });
                const totalRow = ["Tổng cộng", "", totals[MealType.KidsBreakfast], "", totals[MealType.KidsLunch], "", totals[MealType.TeachersLunch], "", Object.values(totals).reduce((s, c) => s + c, 0)].map(v => `"${v}"`);
                csvContent += totalRow.join(separator) + '\r\n';
                
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", `Bao_cao_suat_an_tu_${dateRange.from}_den_${dateRange.to}.csv`);
                link.click();
                link.remove();
            } else { // PDF
                const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
                  import('jspdf'),
                  import('jspdf-autotable')
                ]);
                
                const doc = new jsPDF();
                doc.addFont('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.7/fonts/Roboto/Roboto-Regular.ttf', 'Roboto', 'normal');
                doc.setFont('Roboto');

                const head = [['Lớp', 'Ngày', MealType.KidsBreakfast, MealType.KidsLunch, MealType.TeachersLunch]];
                const body = exportableData.map((item: ExportableRow) => {
                    const kbc = `${item.meals[MealType.KidsBreakfast]?.count || 0} (${item.meals[MealType.KidsBreakfast]?.registeredBy || 'N/A'})`;
                    const klc = `${item.meals[MealType.KidsLunch]?.count || 0} (${item.meals[MealType.KidsLunch]?.registeredBy || 'N/A'})`;
                    const tlc = `${item.meals[MealType.TeachersLunch]?.count || 0} (${item.meals[MealType.TeachersLunch]?.registeredBy || 'N/A'})`;
                    return [item.className, new Date(item.date + 'T00:00:00').toLocaleDateString('vi-VN'), kbc, klc, tlc];
                });
                const foot = [['Tổng cộng', '', totals[MealType.KidsBreakfast], totals[MealType.KidsLunch], totals[MealType.TeachersLunch]]];

                doc.setFontSize(18);
                doc.text('Báo cáo tổng hợp suất ăn', 14, 22);
                doc.setFontSize(11);
                const fromDate = dateRange.from ? new Date(dateRange.from + 'T00:00:00').toLocaleDateString('vi-VN') : 'đầu';
                const toDate = dateRange.to ? new Date(dateRange.to + 'T00:00:00').toLocaleDateString('vi-VN') : 'cuối';
                doc.text(`Từ ngày ${fromDate} đến ngày ${toDate}`, 14, 30);
                
                autoTable(doc, { startY: 35, head, body, foot, theme: 'grid', headStyles: { fillColor: [22, 163, 74], font: 'Roboto' }, footStyles: { fillColor: [243, 244, 246], textColor: [0,0,0], font: 'Roboto' }, styles: { font: 'Roboto', fontStyle: 'normal' }});
                doc.save(`Bao_cao_suat_an_tu_${dateRange.from || 'all'}_den_${dateRange.to || 'all'}.pdf`);
            }
        } catch(e) {
            console.error("Export failed", e);
            addToast("Xuất file thất bại. Vui lòng thử lại.", 'error');
        } finally {
            setIsLoading(false);
        }
  }, [getRegistrations, addToast, setIsLoading]);

  const requestEdit = useCallback((className: string, date: string) => {
    setEditingInfo({ className, date });
  }, []);

  const clearEditing = useCallback(() => {
    setEditingInfo(null);
  }, []);

  const deleteRegistrations = useCallback(async (className: string, date: string) => {
    setIsLoading(true);
    try {
        const q = query(collection(db, 'registrations'), where('className', '==', className), where('date', '==', date));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const batch = writeBatch(db);
            snapshot.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            await logAction('DELETE_REGISTRATION', { className, date });
            addToast(`Đã xóa đăng ký của lớp ${className} ngày ${new Date(date + 'T00:00:00').toLocaleDateString('vi-VN')}.`, 'success');
            triggerRefetch();
        }
    } catch (error) {
        console.error("Failed to delete registrations", error);
        addToast("Lỗi khi xóa đăng ký.", "error");
    } finally {
        setIsLoading(false);
    }
  }, [addToast, db, logAction, setIsLoading]);

  const deleteMultipleRegistrationsByDate = useCallback(async (items: {className: string, date: string}[]) => {
    if (items.length === 0) return;
    setIsLoading(true);
    try {
        const batch = writeBatch(db);
        for (const item of items) {
             const q = query(collection(db, 'registrations'), where('className', '==', item.className), where('date', '==', item.date));
             const snapshot = await getDocs(q);
             if (!snapshot.empty) {
                 snapshot.forEach(doc => batch.delete(doc.ref));
             }
        }
        await batch.commit();
        await logAction('DELETE_REGISTRATION', { items });
        addToast(`Đã xóa thành công ${items.length} mục.`, 'success');
        triggerRefetch();
    } catch (error) {
        console.error("Failed to delete multiple registrations", error);
        addToast(`Lỗi khi xóa hàng loạt.`, 'error');
    } finally {
        setIsLoading(false);
    }
  }, [addToast, db, logAction, setIsLoading]);

  const addClass = useCallback(async (newClassData: Omit<ClassInfo, 'id' | 'updatedAt'>): Promise<boolean> => {
    const trimmedName = newClassData.name.trim();
    if (classes.some(c => c.name.toLowerCase() === trimmedName.toLowerCase()) || !trimmedName) {
        addToast(`Lớp "${trimmedName}" đã tồn tại hoặc tên lớp không hợp lệ.`, 'error');
        return false;
    }
    setIsLoading(true);
    try {
        const newDocRef = doc(collection(db, 'classes'));
        await setDoc(newDocRef, { ...newClassData, name: trimmedName, updatedAt: serverTimestamp() });
        await logAction('CREATE_CLASS', { name: trimmedName, studentCount: newClassData.studentCount });
        addToast(`Đã thêm lớp "${trimmedName}".`, 'success');
        return true;
    } catch (error) {
        console.error("Failed to add class", error);
        addToast("Lỗi khi thêm lớp.", "error");
        return false;
    } finally {
        setIsLoading(false);
    }
  }, [classes, addToast, db, logAction, setIsLoading]);

  const updateClass = useCallback(async (classId: string, updatedData: Omit<ClassInfo, 'id' | 'updatedAt'>): Promise<boolean> => {
     const trimmedName = updatedData.name.trim();
     const oldClass = classes.find(c => c.id === classId);
     if (!trimmedName || (classes.some(c => c.name.toLowerCase() === trimmedName.toLowerCase() && c.id !== classId))) {
        addToast(`Tên lớp "${trimmedName}" đã tồn tại hoặc không hợp lệ.`, 'error');
        return false;
    }
    setIsLoading(true);
    try {
        const classDocRef = doc(db, 'classes', classId);
        await updateDoc(classDocRef, {...updatedData, updatedAt: serverTimestamp()});

        if (oldClass && oldClass.name !== trimmedName) {
            const regsQuery = query(collection(db, "registrations"), where("className", "==", oldClass.name));
            const regsSnapshot = await getDocs(regsQuery);
            if(!regsSnapshot.empty) {
                const batch = writeBatch(db);
                regsSnapshot.forEach(docSnap => { batch.update(docSnap.ref, { className: trimmedName }); });
                await batch.commit();
            }
        }
        await logAction('UPDATE_CLASS', { classId, oldName: oldClass?.name, newName: trimmedName, newStudentCount: updatedData.studentCount });
        addToast(`Đã cập nhật lớp "${oldClass?.name}".`, 'success');
        triggerRefetch();
        return true;
    } catch (error) {
        console.error("Failed to update class", error);
        addToast("Lỗi khi cập nhật lớp.", "error");
        return false;
    } finally {
        setIsLoading(false);
    }
  }, [classes, addToast, db, logAction, setIsLoading]);

  const deleteClass = useCallback(async (classToDelete: ClassInfo) => {
    setIsLoading(true);
    try {
        const classDocRef = doc(db, 'classes', classToDelete.id);
        const batch = writeBatch(db);

        // Delete the class document
        batch.delete(classDocRef);

        // Find and delete all related registrations
        const regsQuery = query(collection(db, 'registrations'), where('className', '==', classToDelete.name));
        const regsSnapshot = await getDocs(regsQuery);
        if (!regsSnapshot.empty) {
            regsSnapshot.forEach(docSnap => batch.delete(docSnap.ref));
        }
        
        await batch.commit();

        await logAction('DELETE_CLASS', { classId: classToDelete.id, name: classToDelete.name });
        addToast(`Đã xóa lớp "${classToDelete.name}" và các đăng ký liên quan.`, 'success');
        triggerRefetch();
    } catch (error: any) {
        console.error("Failed to delete class", error);
        addToast("Lỗi khi xóa lớp.", "error");
        throw error;
    } finally {
        setIsLoading(false);
    }
  }, [addToast, db, logAction, setIsLoading]);

    const addUser = useCallback(async (newUserData: Omit<User, 'id'>): Promise<boolean> => {
        if (users.some(u => u.email.toLowerCase() === newUserData.email.toLowerCase())) {
            addToast(`Email "${newUserData.email}" đã tồn tại.`, 'error'); return false;
        }
        setIsLoading(true);
        try {
            const newDocRef = doc(collection(db, 'users'));
            await setDoc(newDocRef, newUserData);
            await logAction('CREATE_USER', { email: newUserData.email, displayName: newUserData.displayName, role: newUserData.role });
            addToast(`Đã thêm người dùng "${newUserData.displayName}".`, 'success');
            return true;
        } catch (error) {
            console.error("Failed to add user", error); addToast("Lỗi khi thêm người dùng.", "error"); return false;
        } finally { setIsLoading(false); }
    }, [users, addToast, db, logAction, setIsLoading]);

    const updateUser = useCallback(async (userId: string, updatedData: Partial<Omit<User, 'id'>>): Promise<boolean> => {
        if (updatedData.email && users.some(u => u.email.toLowerCase() === updatedData.email!.toLowerCase() && u.id !== userId)) {
            addToast(`Email "${updatedData.email}" đã tồn tại.`, 'error'); return false;
        }
        setIsLoading(true);
        try {
            const userDocRef = doc(db, 'users', userId);
            await updateDoc(userDocRef, updatedData);
            await logAction('UPDATE_USER', { userId, ...updatedData });
            addToast(`Đã cập nhật thông tin người dùng.`, 'success');
            return true;
        } catch (error) {
            console.error("Failed to update user", error); addToast("Lỗi khi cập nhật người dùng.", "error"); return false;
        } finally { setIsLoading(false); }
    }, [users, addToast, db, logAction, setIsLoading]);

    const deleteUser = useCallback(async (userId: string) => {
        setIsLoading(true);
        const userToDelete = users.find(u => u.id === userId);
        try {
            await deleteDoc(doc(db, 'users', userId));
            await logAction('DELETE_USER', { userId, email: userToDelete?.email });
            addToast(`Đã xóa người dùng.`, 'success');
        } catch (error) {
            console.error("Failed to delete user", error); addToast("Lỗi khi xóa người dùng.", "error");
        } finally { setIsLoading(false); }
    }, [addToast, db, logAction, users, setIsLoading]);
    
    // Announcement Functions
    const addAnnouncement = useCallback(async (data: Omit<Announcement, 'id' | 'createdAt' | 'createdBy' | 'createdById' | 'readBy'>) => {
        if (!currentUser) return false;
        setIsLoading(true);
        try {
            const newDocRef = doc(collection(db, 'announcements'));
            await setDoc(newDocRef, {
                ...data,
                createdAt: serverTimestamp(),
                createdBy: currentUser.displayName,
                createdById: currentUser.id,
                readBy: [currentUser.id]
            });
            await logAction('CREATE_ANNOUNCEMENT', { title: data.title });
            addToast('Đã đăng thông báo mới.', 'success');
            return true;
        } catch (error) {
            console.error("Failed to add announcement:", error); addToast('Lỗi khi đăng thông báo.', 'error'); return false;
        } finally { setIsLoading(false); }
    }, [currentUser, db, addToast, logAction, setIsLoading]);

    const updateAnnouncement = useCallback(async (id: string, data: Partial<Omit<Announcement, 'id'>>) => {
        setIsLoading(true);
        try {
            await updateDoc(doc(db, 'announcements', id), data);
            await logAction('UPDATE_ANNOUNCEMENT', { announcementId: id, newTitle: data.title });
            addToast('Đã cập nhật thông báo.', 'success');
            return true;
        } catch(error) {
            console.error("Failed to update announcement:", error); addToast('Lỗi khi cập nhật.', 'error'); return false;
        } finally { setIsLoading(false); }
    }, [db, addToast, logAction, setIsLoading]);

    const deleteAnnouncement = useCallback(async (id: string) => {
        setIsLoading(true);
        try {
            await deleteDoc(doc(db, 'announcements', id));
            await logAction('DELETE_ANNOUNCEMENT', { announcementId: id });
            addToast('Đã xóa thông báo.', 'success');
        } catch (error) {
            console.error("Failed to delete announcement:", error); addToast('Lỗi khi xóa.', 'error');
        } finally { setIsLoading(false); }
    }, [db, addToast, logAction, setIsLoading]);

    const markAnnouncementsAsRead = useCallback(async (announcementIds: string[]) => {
        if (!currentUser || announcementIds.length === 0) return;

        // Optimistically update local state and localStorage immediately for a responsive UI.
        // This ensures the UI reflects the "read" state instantly, fixing the reversion issue.
        setLocallyReadIds(prevIds => {
            const newIds = new Set(prevIds);
            announcementIds.forEach(id => newIds.add(id));
            try {
                // Persist the new set to localStorage.
                localStorage.setItem(`readAnnouncements_${currentUser.id}`, JSON.stringify(Array.from(newIds)));
            } catch (e) {
                console.error("Failed to save read announcements to localStorage", e);
            }
            return newIds;
        });

        // Then, attempt to update the server. This is a "fire and forget" for non-admin users,
        // as failure is expected and handled by the local cache.
        try {
            const batch = writeBatch(db);
            announcementIds.forEach(id => {
                const docRef = doc(db, 'announcements', id);
                batch.update(docRef, { readBy: arrayUnion(currentUser.id) });
            });
            await batch.commit();
        } catch (error) {
            // This warning is expected for users without write permissions and can be ignored.
            // The UI will remain correct due to the local cache.
            console.warn("Failed to mark announcements as read on server:", error);
        }
    }, [currentUser, db]);
    
    // Audit Log Functions
    const getAuditLogs = useCallback(async (options: {
        limit: number,
        lastVisibleDoc?: DocumentSnapshot<DocumentData> | null,
    }): Promise<{ logs: AuditLog[], lastDoc: DocumentSnapshot<DocumentData> | null }> => {
        const { limit: queryLimit, lastVisibleDoc } = options;
        const constraints: QueryConstraint[] = [orderBy('timestamp', 'desc')];
        if (queryLimit) constraints.push(limit(queryLimit));
        if (lastVisibleDoc) constraints.push(startAfter(lastVisibleDoc));
        
        const q = query(collection(db, 'audit_logs'), ...constraints);
        const snapshot = await getDocs(q);
        
        const logs = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as AuditLog));
        const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
        return { logs, lastDoc };
    }, [db]);

    const deleteAuditLogs = useCallback(async (logIds: string[]) => {
        if (logIds.length === 0) return;
        setIsLoading(true);
        try {
            const batch = writeBatch(db);
            logIds.forEach(id => {
                const docRef = doc(db, 'audit_logs', id);
                batch.delete(docRef);
            });
            await batch.commit();
            addToast(`Đã xóa ${logIds.length} mục lịch sử.`, 'success');
        } catch (error) {
            console.error("Failed to delete audit logs", error);
            addToast("Lỗi khi xóa lịch sử.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [addToast, db, setIsLoading]);
    
    // FIX: Implement sendReminderForMissingClasses
    const sendReminderForMissingClasses = useCallback(async (classNames: string[], date: string) => {
        addToast(`Đã gửi nhắc nhở đến ${classNames.length} lớp.`, 'success');
        // In a real app, this would trigger an email or push notification.
        // For now, we just log the action.
        await logAction('SEND_REMINDER', { classNames, date: new Date(date + 'T00:00:00').toLocaleDateString('vi-VN') });
    }, [addToast, logAction]);

    // FIX: Implement archive functions
    const archiveRegistrationsByMonth = useCallback(async (year: number, month: number) => {
        setIsLoading(true);
        addToast(`Bắt đầu lưu trữ dữ liệu tháng ${month}/${year}...`, 'success');

        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0);
        const endDateStr = `${year}-${String(month).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

        try {
            const q = query(collection(db, 'registrations'), where('date', '>=', startDate), where('date', '<=', endDateStr));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                addToast('Không có dữ liệu để lưu trữ trong tháng đã chọn.', 'success');
                setIsLoading(false);
                return;
            }

            const batch = writeBatch(db);
            snapshot.forEach(docSnap => {
                const data = docSnap.data();
                const archiveDocRef = doc(collection(db, 'archived_registrations'));
                batch.set(archiveDocRef, data);
                batch.delete(docSnap.ref);
            });

            await batch.commit();
            await logAction('ARCHIVE_DATA', { year, month, count: snapshot.size });
            addToast(`Lưu trữ thành công ${snapshot.size} mục từ tháng ${month}/${year}.`, 'success');
            triggerRefetch();

        } catch (error) {
            console.error("Failed to archive data:", error);
            addToast('Lỗi trong quá trình lưu trữ.', 'error');
        } finally {
            setIsLoading(false);
        }

    }, [db, addToast, logAction, setIsLoading]);

    const getArchivedRegistrations = useCallback(async (options: {
        dateRange?: { from: string, to: string },
        classNames?: string[],
        getAll?: boolean
    }): Promise<{ registrations: MealRegistration[] }> => {
        const { dateRange, classNames, getAll = false } = options;
        const constraints: QueryConstraint[] = [];

        if (dateRange && dateRange.from) constraints.push(where('date', '>=', dateRange.from));
        if (dateRange && dateRange.to) constraints.push(where('date', '<=', dateRange.to));
        if (classNames && classNames.length > 0) constraints.push(where('className', 'in', classNames));

        const finalQuery = query(collection(db, 'archived_registrations'), ...constraints);
        const snapshot = await getDocs(finalQuery);

        const registrations = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MealRegistration));
        return { registrations };
    }, [db]);


  const value = useMemo(() => ({
    editingInfo, classes, users, announcements, unreadAnnouncementsCount, dataVersion, recentlyUpdatedKeys, showBackupPrompt, isAnnouncementRead,
    addRegistrations, updateRegistrations, requestEdit, clearEditing, deleteRegistrations, deleteMultipleRegistrationsByDate, addClass, updateClass, deleteClass, getRegistrations, addUser, updateUser, deleteUser, addAnnouncement, updateAnnouncement, deleteAnnouncement, markAnnouncementsAsRead, getAuditLogs, deleteAuditLogs, exportData, dismissBackupPrompt, sendReminderForMissingClasses, getArchivedRegistrations, archiveRegistrationsByMonth
  }), [editingInfo, classes, users, announcements, unreadAnnouncementsCount, dataVersion, recentlyUpdatedKeys, showBackupPrompt, isAnnouncementRead, addRegistrations, updateRegistrations, requestEdit, clearEditing, deleteRegistrations, deleteMultipleRegistrationsByDate, addClass, updateClass, deleteClass, getRegistrations, addUser, updateUser, deleteUser, addAnnouncement, updateAnnouncement, deleteAnnouncement, markAnnouncementsAsRead, getAuditLogs, deleteAuditLogs, exportData, dismissBackupPrompt, sendReminderForMissingClasses, getArchivedRegistrations, archiveRegistrationsByMonth]);

  return (
    <DataContext.Provider value={value}>
        {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};