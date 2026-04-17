import { useQuery } from '@tanstack/react-query';
import { fetchUser } from '@/api/users';

export function useUserData(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });
}

