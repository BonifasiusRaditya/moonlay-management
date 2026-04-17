import { useQuery } from '@tanstack/react-query';
import { fetchUsers } from '@/api/users';

export function useUsers() {
  const query = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  return {
    users: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
  };
}

