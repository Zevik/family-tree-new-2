'use client';

import { useState, useEffect } from 'react';
import FamilyTree from '@/components/FamilyTree';
import SearchBar from '@/components/SearchBar';
import UpcomingDates from '@/components/UpcomingDates';
import { useFamilyData } from '@/lib/hooks/useFamilyData';
import AddPersonForm from '@/components/AddPersonForm';

export default function Home() {
  const { data, isLoading, error } = useFamilyData();
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    console.log('Home component mounted');
    console.log('isLoading:', isLoading);
    console.log('error:', error);
    console.log('data:', data);
  }, [isLoading, error, data]);

  const handlePersonSelect = (personId: string) => {
    console.log('Person selected:', personId);
    setSelectedPersonId(personId);
  };

  const handleCloseForm = () => {
    console.log('Form closed');
    setShowAddForm(false);
  };

  return (
    <main className="flex flex-col items-center min-h-screen">
      <header className="w-full bg-primary-500 text-white py-4 px-4 sticky top-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">עץ משפחה</h1>
        </div>
      </header>
      
      <div className="w-full max-w-7xl px-4 py-6">
        <div className="container mx-auto p-4 text-right">
          <h1 className="text-3xl font-bold mb-4">עץ משפחה</h1>
          
          <button
            onClick={async () => {
              if (window.confirm('האם אתה בטוח שברצונך למחוק את כל האנשים?')) {
                const response = await fetch('/.netlify/functions/people', {
                  method: 'DELETE',
                  headers: {
                    'Content-Type': 'application/json',
                  }
                });
                const result = await response.json();
                if (result.success) {
                  window.location.reload();
                } else {
                  alert('שגיאה במחיקת האנשים');
                }
              }
            }}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mb-4"
          >
            מחק את כל האנשים
          </button>
          
          <SearchBar onPersonSelect={handlePersonSelect} />
          <UpcomingDates 
            people={data}
            onPersonSelect={handlePersonSelect}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-lg">טוען נתונים...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-lg text-red-500">שגיאה בטעינת הנתונים: {error.toString()}</p>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-lg mb-4">לא נמצאו נתונים</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              הוסף אדם ראשון
            </button>
          </div>
        ) : (
          <>
            {/* עץ המשפחה */}
            <FamilyTree 
              people={data} 
              selectedPersonId={selectedPersonId}
              onPersonSelect={handlePersonSelect}
            />
          </>
        )}
      </div>

      {showAddForm && (
        <AddPersonForm 
          relatedPersonId={selectedPersonId || ''}
          onClose={handleCloseForm}
        />
      )}
    </main>
  );
} 