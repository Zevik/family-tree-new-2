'use client';

import { useState, useEffect } from 'react';
import { RelationshipType, ParentType, PersonWithRelations, DateFormatType } from '@/models/Person';
import { FaTimes, FaArrowRight, FaArrowLeft, FaBell, FaBellSlash } from 'react-icons/fa';
import { useFamilyData } from '@/lib/hooks/useFamilyData';
import HebrewDatePicker from './HebrewDatePicker';
import ImprovedHebrewDatePicker from './ImprovedHebrewDatePicker';

interface AddPersonFormProps {
  relatedPersonId: string;
  onClose: () => void;
}

export default function AddPersonForm({ relatedPersonId, onClose }: AddPersonFormProps) {
  const { data, mutate } = useFamilyData();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [relatedPerson, setRelatedPerson] = useState<PersonWithRelations | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDateGregorian: '',
    birthDateHebrew: '',
    deathDateGregorian: '',
    deathDateHebrew: '',
    marriageDate: '',
    marriageDateHebrew: '',
    email: '',
    phone: '',
    relationshipType: 'child' as RelationshipType['value'],
    parentType: 'father' as ParentType['value'],
    primaryDateFormat: 'gregorian' as 'hebrew' | 'gregorian',
    notifyOnBirthday: false,
  });

  // מידע על קשרים נבחרים
  const [selectedRelationships, setSelectedRelationships] = useState({
    // להורים (כשמוסיפים אח/אחות)
    shareFather: true,
    shareMother: true,
    
    // לילדים (כשמוסיפים בן/בת זוג)
    sharedChildren: {} as Record<string, boolean>,
    
    // לאחים (כשמוסיפים הורה)
    sharedSiblings: {} as Record<string, boolean>,
    
    // לבן/בת זוג של ההורה (כשמוסיפים ילד)
    shareOtherParent: true,
  });

  const relationshipTypes: RelationshipType[] = [
    { value: 'child', label: 'בן/בת' },
    { value: 'sibling', label: 'אח/אחות' },
    { value: 'spouse', label: 'בן/בת זוג' },
    { value: 'parent', label: 'הורה' },
  ];

  const parentTypes: ParentType[] = [
    { value: 'father', label: 'אבא' },
    { value: 'mother', label: 'אמא' },
  ];

  const dateFormatTypes: DateFormatType[] = [
    { value: 'gregorian', label: 'לועזי' },
    { value: 'hebrew', label: 'עברי' },
    { value: 'both', label: 'שניהם' },
  ];

  // טעינת פרטי האדם הקשור
  useEffect(() => {
    if (data) {
      const person = data.find(p => p.id === relatedPersonId);
      if (person) {
        setRelatedPerson(person);
        
        // אתחול ברירות מחדל לקשרים
        if (person.children) {
          const childrenDefaults = {} as Record<string, boolean>;
          person.children.forEach(child => {
            childrenDefaults[child.id] = true;
          });
          setSelectedRelationships(prev => ({
            ...prev,
            sharedChildren: childrenDefaults
          }));
        }
        
        if (person.siblings) {
          const siblingsDefaults = {} as Record<string, boolean>;
          person.siblings.forEach(sibling => {
            siblingsDefaults[sibling.id] = true;
          });
          setSelectedRelationships(prev => ({
            ...prev,
            sharedSiblings: siblingsDefaults
          }));
        }
      }
    }
  }, [data, relatedPersonId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleRelationshipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked, value } = e.target;
    
    if (name === 'shareFather' || name === 'shareMother' || name === 'shareOtherParent') {
      setSelectedRelationships(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (name.startsWith('sharedChild_')) {
      const childId = name.replace('sharedChild_', '');
      setSelectedRelationships(prev => ({
        ...prev,
        sharedChildren: {
          ...prev.sharedChildren,
          [childId]: checked
        }
      }));
    } else if (name.startsWith('sharedSibling_')) {
      const siblingId = name.replace('sharedSibling_', '');
      setSelectedRelationships(prev => ({
        ...prev,
        sharedSiblings: {
          ...prev.sharedSiblings,
          [siblingId]: checked
        }
      }));
    }
  };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // בדיקה אם האפליקציה רצה בסביבת ייצור (נטליפיי) או פיתוח (מקומי)
      const isProduction = process.env.NODE_ENV === 'production';
      const apiUrl = isProduction 
        ? '/.netlify/functions/add-person' 
        : '/api/people/add';
      
      console.log('Submitting to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          relatedPersonId,
          selectedRelationships
        }),
      });

      if (response.ok) {
        setShowSuccess(true);
        // רענון הנתונים
        mutate();
        
        // סגירת הטופס אחרי 2 שניות
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        console.error('Failed to add person');
      }
    } catch (error) {
      console.error('Error adding person:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // רינדור שלב 1 - פרטים בסיסיים וסוג קשר
  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="relationshipType" className="label">סוג קשר</label>
        <select
          id="relationshipType"
          name="relationshipType"
          className="select"
          value={formData.relationshipType}
          onChange={handleChange}
          required
        >
          {relationshipTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {formData.relationshipType === 'parent' && (
        <div>
          <label htmlFor="parentType" className="label">סוג הורה</label>
          <select
            id="parentType"
            name="parentType"
            className="select"
            value={formData.parentType}
            onChange={handleChange}
            required
          >
            {parentTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label htmlFor="firstName" className="label">שם פרטי</label>
        <input
          type="text"
          id="firstName"
          name="firstName"
          className="input"
          value={formData.firstName}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label htmlFor="lastName" className="label">שם משפחה</label>
        <input
          type="text"
          id="lastName"
          name="lastName"
          className="input"
          value={formData.lastName}
          onChange={handleChange}
          required
        />
      </div>

      {/* תאריך לידה */}
      <div className="border-t pt-4 mt-4">
        <div className="mb-2">
          <label className="label">תאריך לידה</label>
          <select
            name="birthDateFormat"
            className="select mb-2"
            onChange={(e) => {
              const selectedFormat = e.target.value as DateFormatType['value'];
              // אם בחרו "שניהם", לא משנים את הפורמט הראשי
              if (selectedFormat !== 'both') {
                setFormData(prev => ({ ...prev, primaryDateFormat: selectedFormat as 'hebrew' | 'gregorian' }));
              }
            }}
          >
            {dateFormatTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="birthDateGregorian" className="label">תאריך לידה (לועזי)</label>
            <input
              type="date"
              id="birthDateGregorian"
              name="birthDateGregorian"
              className="input"
              value={formData.birthDateGregorian}
              onChange={handleChange}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 text-right mb-1">
              תאריך לידה (עברי)
            </label>
            <ImprovedHebrewDatePicker
              value={formData.birthDateHebrew}
              onChange={(value) => setFormData(prev => ({ ...prev, birthDateHebrew: value }))}
              className="w-full"
              isHebrew={true}
              label=""
            />
          </div>
        </div>
      </div>

      {/* תאריך פטירה */}
      <div className="border-t pt-4 mt-4">
        <div className="mb-2">
          <label className="label">תאריך פטירה (אם רלוונטי)</label>
          <select
            name="deathDateFormat"
            className="select mb-2"
            onChange={(e) => {
              // לא משנים את הפורמט הראשי בתאריך פטירה
            }}
          >
            {dateFormatTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="deathDateGregorian" className="label">תאריך פטירה (לועזי)</label>
            <input
              type="date"
              id="deathDateGregorian"
              name="deathDateGregorian"
              className="input"
              value={formData.deathDateGregorian}
              onChange={handleChange}
            />
          </div>

          <div>
            <label htmlFor="deathDateHebrew" className="label">תאריך פטירה (עברי)</label>
            <ImprovedHebrewDatePicker
              value={formData.deathDateHebrew}
              onChange={(value) => setFormData(prev => ({ ...prev, deathDateHebrew: value }))}
              className="w-full"
              isHebrew={true}
              label=""
            />
          </div>
        </div>
      </div>

      {/* תאריך נישואין */}
      {formData.relationshipType === 'spouse' && (
        <div className="border-t pt-4 mt-4">
          <div className="mb-2">
            <label className="label">תאריך נישואין</label>
            <select
              name="marriageDateFormat"
              className="select mb-2"
              onChange={(e) => {
                const selectedFormat = e.target.value as DateFormatType['value'];
                // אם בחרו "שניהם", לא משנים את הפורמט הראשי
                if (selectedFormat !== 'both') {
                  setFormData(prev => ({ ...prev, primaryDateFormat: selectedFormat as 'hebrew' | 'gregorian' }));
                }
              }}
            >
              {dateFormatTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="marriageDate" className="label">תאריך נישואין (לועזי)</label>
              <input
                type="date"
                id="marriageDate"
                name="marriageDate"
                className="input"
                value={formData.marriageDate}
                onChange={handleChange}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 text-right mb-1">
                תאריך נישואין (עברי)
              </label>
              <ImprovedHebrewDatePicker
                value={formData.marriageDateHebrew}
                onChange={(value) => setFormData(prev => ({ ...prev, marriageDateHebrew: value }))}
                className="w-full"
                isHebrew={true}
                label=""
              />
            </div>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="email" className="label">אימייל</label>
        <input
          type="email"
          id="email"
          name="email"
          className="input"
          value={formData.email}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="phone" className="label">טלפון</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          className="input"
          value={formData.phone}
          onChange={handleChange}
        />
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="button"
          className="btn btn-primary"
          onClick={nextStep}
        >
          הבא <FaArrowLeft className="mr-2" />
        </button>
      </div>
    </div>
  );

  // רינדור שלב 2 - בחירת קשרים
  const renderStep2 = () => {
    if (!relatedPerson) return null;

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">בחירת קשרים משפחתיים:</h3>

        {/* אח/אחות - בחירת הורים משותפים */}
        {formData.relationshipType === 'sibling' && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">בחר אילו הורים יהיו משותפים:</p>
            
            {relatedPerson.father && (
              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="checkbox"
                  id="shareFather"
                  name="shareFather"
                  checked={selectedRelationships.shareFather}
                  onChange={handleRelationshipChange}
                  className="h-4 w-4"
                />
                <label htmlFor="shareFather" className="text-sm">
                  {relatedPerson.father.name} יהיה גם האבא שלך
                </label>
              </div>
            )}
            
            {relatedPerson.mother && (
              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="checkbox"
                  id="shareMother"
                  name="shareMother"
                  checked={selectedRelationships.shareMother}
                  onChange={handleRelationshipChange}
                  className="h-4 w-4"
                />
                <label htmlFor="shareMother" className="text-sm">
                  {relatedPerson.mother.name} תהיה גם האמא שלך
                </label>
              </div>
            )}
          </div>
        )}

        {/* בן/בת - בחירת ההורה השני */}
        {formData.relationshipType === 'child' && relatedPerson.spouse && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">בחר את ההורה השני:</p>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <input
                type="checkbox"
                id="shareOtherParent"
                name="shareOtherParent"
                checked={selectedRelationships.shareOtherParent}
                onChange={handleRelationshipChange}
                className="h-4 w-4"
              />
              <label htmlFor="shareOtherParent" className="text-sm">
                {relatedPerson.spouse.name} יהיה/תהיה גם ההורה השני שלך
              </label>
            </div>
          </div>
        )}

        {/* בן/בת זוג - בחירת ילדים משותפים */}
        {formData.relationshipType === 'spouse' && relatedPerson.children && relatedPerson.children.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">בחר אילו ילדים יהיו משותפים:</p>
            
            {relatedPerson.children.map(child => (
              <div key={child.id} className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="checkbox"
                  id={`sharedChild_${child.id}`}
                  name={`sharedChild_${child.id}`}
                  checked={selectedRelationships.sharedChildren[child.id] || false}
                  onChange={handleRelationshipChange}
                  className="h-4 w-4"
                />
                <label htmlFor={`sharedChild_${child.id}`} className="text-sm">
                  {child.name} יהיה/תהיה גם הילד/ה שלך
                </label>
              </div>
            ))}
          </div>
        )}

        {/* הורה - בחירת אחים שיקבלו את אותו הורה */}
        {formData.relationshipType === 'parent' && relatedPerson.siblings && relatedPerson.siblings.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              בחר אילו אחים/אחיות יקבלו את {formData.parentType === 'father' ? 'האבא' : 'האמא'} החדש/ה:
            </p>
            
            {relatedPerson.siblings.map(sibling => (
              <div key={sibling.id} className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="checkbox"
                  id={`sharedSibling_${sibling.id}`}
                  name={`sharedSibling_${sibling.id}`}
                  checked={selectedRelationships.sharedSiblings[sibling.id] || false}
                  onChange={handleRelationshipChange}
                  className="h-4 w-4"
                />
                <label htmlFor={`sharedSibling_${sibling.id}`} className="text-sm">
                  {sibling.name} יקבל/תקבל גם את {formData.parentType === 'father' ? 'האבא' : 'האמא'} החדש/ה
                </label>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between pt-4">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={prevStep}
          >
            <FaArrowRight className="ml-2" /> הקודם
          </button>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'מוסיף...' : 'הוסף'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto min-h-screen">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative my-8">
        <button
          className="absolute top-4 left-4 text-gray-500 hover:text-gray-700"
          onClick={onClose}
          aria-label="סגור"
        >
          <FaTimes />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-center">הוספת קרוב משפחה</h2>

        {showSuccess ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p className="text-center">הקרוב נוסף בהצלחה!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* מחוון שלבים */}
            <div className="flex justify-center mb-6">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 1 ? 'bg-primary-500 text-white' : 'bg-gray-200'}`}>
                  1
                </div>
                <div className="w-10 h-1 bg-gray-200"></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 2 ? 'bg-primary-500 text-white' : 'bg-gray-200'}`}>
                  2
                </div>
              </div>
            </div>

            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
          </form>
        )}
      </div>
    </div>
  );
} 