import useSWR from 'swr';
import { PersonWithRelations } from '@/models/Person';

const fetcher = async (url: string) => {
  console.log('Fetching data from:', url);
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('Data fetched successfully:', data ? data.length : 0, 'items');
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

export function useFamilyData() {
  console.log('useFamilyData hook called');
  const { data, error, isLoading, mutate } = useSWR<PersonWithRelations[]>(
    '/api/people',
    fetcher
  );
  
  console.log('useFamilyData state:', { 
    dataExists: !!data, 
    dataLength: data?.length, 
    isLoading, 
    hasError: !!error 
  });
  
  return {
    data,
    isLoading,
    error,
    mutate,
  };
} 