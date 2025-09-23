import { useEffect, useState } from 'react';
import { db } from '@/services/firebase';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import firebaseService from '@/services/firebaseService';

export function useDepartmentsList(): string[] {
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    if (db) {
      try {
        const col = collection(db, 'departments');
        const q = query(col, orderBy('name', 'asc'));
        unsub = onSnapshot(q, async (snap) => {
          const names: string[] = [];
          snap.forEach((d) => {
            const data: any = d.data();
            if (data && typeof data.name === 'string' && data.name.trim()) {
              names.push(data.name.trim());
            }
          });
          if (names.length > 0) {
            setDepartments(names);
          } else {
            try {
              const usersRes = await firebaseService.getCollection<any>('users');
              if (usersRes.success && usersRes.data) {
                const uniq = Array.from(
                  new Set(
                    usersRes.data
                      .map((u: any) => (u && typeof u.department === 'string' ? u.department.trim() : ''))
                      .filter((n: string) => n && n !== 'Unassigned')
                  )
                );
                setDepartments(uniq);
              }
            } catch {
              setDepartments([]);
            }
          }
        });
      } catch {
        // ignore
      }
    }
    return () => {
      if (unsub) unsub();
    };
  }, []);

  return departments;
}


