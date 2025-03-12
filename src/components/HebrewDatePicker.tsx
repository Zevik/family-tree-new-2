'use client';

import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { toJewishDate, formatJewishDateInHebrew } from 'jewish-date';

interface HebrewDatePickerProps {
  value: string;
  onChange: (value: string, gregorianDate?: Date) => void;
  className?: string;
  placeholder?: string;
  label?: string;
}

export default function HebrewDatePicker({ 
  value, 
  onChange, 
  className, 
  placeholder,
  label
}: HebrewDatePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [hebrewDateText, setHebrewDateText] = useState<string>(value || '');
  
  console.log('HebrewDatePicker rendering with value:', value);

  // עדכון התאריך העברי כאשר משתנה התאריך הנבחר
  useEffect(() => {
    if (selectedDate) {
      try {
        console.log('Converting date to Hebrew:', selectedDate);
        // המרת התאריך הלועזי לתאריך עברי באמצעות הספרייה
        const jewishDate = toJewishDate(selectedDate);
        const hebrewDate = formatJewishDateInHebrew(jewishDate);
        
        console.log('Hebrew date result:', hebrewDate);
        setHebrewDateText(hebrewDate);
        onChange(hebrewDate, selectedDate);
      } catch (error) {
        console.error('Error converting date:', error);
        // במקרה של שגיאה, נשתמש בפורמט פשוט
        const day = selectedDate.getDate();
        const month = selectedDate.getMonth() + 1;
        const year = selectedDate.getFullYear();
        
        const fallbackDate = `${day}/${month}/${year} (עברי)`;
        console.log('Using fallback date format:', fallbackDate);
        setHebrewDateText(fallbackDate);
        onChange(fallbackDate, selectedDate);
      }
    } else if (selectedDate === null && value === '') {
      // כאשר מנקים את התאריך
      console.log('Date cleared');
      setHebrewDateText('');
      onChange('', undefined);
    }
  }, [selectedDate, onChange]);

  // עדכון התאריך הנבחר כאשר משתנה ערך ה-value מבחוץ
  useEffect(() => {
    if (value && value !== hebrewDateText) {
      console.log('Value changed externally:', value);
      setHebrewDateText(value);
    } else if (!value && hebrewDateText) {
      console.log('Value cleared externally');
      setHebrewDateText('');
      setSelectedDate(null);
    }
  }, [value, hebrewDateText]);

  // פונקציה לטיפול בניקוי התאריך
  const handleClear = () => {
    console.log('Clearing date');
    setSelectedDate(null);
    setHebrewDateText('');
    onChange('', undefined);
  };

  return (
    <div className="hebrew-date-picker w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1 text-right">
          {label}
        </label>
      )}
      <DatePicker
        selected={selectedDate}
        onChange={(date: Date | null) => setSelectedDate(date)}
        dateFormat="dd/MM/yyyy"
        className={`input w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-right ${className || ''}`}
        placeholderText={placeholder || 'בחר תאריך'}
        isClearable
        onCalendarClose={() => console.log('Calendar closed')}
        onCalendarOpen={() => console.log('Calendar opened')}
        onClickOutside={() => console.log('Clicked outside')}
        onSelect={(date) => console.log('Date selected:', date)}
      />
      <div className="mt-2 text-sm text-gray-600 text-right">
        {hebrewDateText ? (
          <span>תאריך עברי: {hebrewDateText}</span>
        ) : (
          <span>התאריך העברי יוצג כאן</span>
        )}
      </div>
    </div>
  );
} 