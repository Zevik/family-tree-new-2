import useSWR from 'swr';
import { PersonWithRelations } from '@/models/Person';

// בדיקה אם האפליקציה רצה בסביבת ייצור (נטליפיי) או פיתוח (מקומי)
const isProduction = process.env.NODE_ENV === 'production';

// פונקציה שמחזירה את ה-URL המתאים בהתאם לסביבה
const getApiUrl = (path: string) => {
  if (isProduction) {
    // בסביבת ייצור, השתמש בפונקציות של נטליפיי
    return `/.netlify/functions${path.replace('/api', '')}`;
  }
  // בסביבת פיתוח, השתמש ב-API Routes של Next.js
  return path;
};

const fetcher = async (url: string) => {
  console.log('Fetching data from:', url);
  const apiUrl = getApiUrl(url);
  console.log('Actual API URL:', apiUrl);
  
  try {
    const response = await fetch(apiUrl);
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