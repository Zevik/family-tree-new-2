import mongoose from 'mongoose';
import PersonModel from '../../src/models/PersonModel';
import { Person } from '../../src/models/Person';
import { generateUniqueId } from '../../src/utils/familyUtils';
import { Handler } from '@netlify/functions';

const handler: Handler = async (event, context) => {
  // וידוא שזו בקשת POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // התחברות למסד הנתונים
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI!, {
        bufferCommands: false,
      });
    }
    
    // קבלת הנתונים מהבקשה
    const data = JSON.parse(event.body || '{}');
    
    // יצירת מזהה ייחודי
    let newId = generateUniqueId();
    let idExists = await PersonModel.findOne({ id: newId }).lean();
    
    // וידוא שהמזהה ייחודי
    while (idExists) {
      newId = generateUniqueId();
      idExists = await PersonModel.findOne({ id: newId }).lean();
    }
    
    // יצירת האדם החדש
    const newPerson: Person = {
      id: newId,
      firstName: data.firstName,
      lastName: data.lastName,
      birthDateGregorian: data.birthDateGregorian,
      birthDateHebrew: data.birthDateHebrew,
      deathDateGregorian: data.deathDateGregorian,
      deathDateHebrew: data.deathDateHebrew,
      fatherId: data.fatherId,
      motherId: data.motherId,
      spouseId: data.spouseId,
      marriageDate: data.marriageDate,
      marriageDateHebrew: data.marriageDateHebrew,
      email: data.email,
      phone: data.phone,
      primaryDateFormat: data.primaryDateFormat || 'gregorian',
      notifyOnBirthday: data.notifyOnBirthday || false,
    };
    
    // שמירת האדם החדש
    const person = await PersonModel.create(newPerson);
    
    // עדכון קשרים בהתאם לסוג הקשר
    if (data.relationshipType && data.relatedPersonId) {
      const relatedPerson = await PersonModel.findOne({ id: data.relatedPersonId }).lean();
      
      if (relatedPerson) {
        // קבלת הבחירות של הקשרים הסלקטיביים
        const selectedRelationships = data.selectedRelationships || {
          shareFather: true,
          shareMother: true,
          sharedChildren: {},
          sharedSiblings: {},
          shareOtherParent: true
        };
        
        switch (data.relationshipType) {
          case 'spouse':
            // עדכון ה-spouseId של האדם הקשור
            await PersonModel.updateOne(
              { id: data.relatedPersonId },
              { 
                spouseId: newId, 
                marriageDate: data.marriageDate,
                marriageDateHebrew: data.marriageDateHebrew,
              }
            );
            
            // עדכון ה-spouseId של האדם החדש
            await PersonModel.updateOne(
              { id: newId },
              { 
                spouseId: data.relatedPersonId, 
                marriageDate: data.marriageDate,
                marriageDateHebrew: data.marriageDateHebrew
              }
            );
            
            // עדכון ילדים משותפים אם נבחרו
            if (relatedPerson && typeof relatedPerson === 'object' && !('spouseId' in relatedPerson)) {
              const children = await PersonModel.find({ 
                $or: [
                  { fatherId: data.relatedPersonId },
                  { motherId: data.relatedPersonId }
                ]
              }).lean();
              
              for (const child of children) {
                // בדיקה אם הילד נבחר להיות משותף
                if (selectedRelationships.sharedChildren[child.id]) {
                  // בדיקה אם האדם הקשור הוא האב או האם
                  if (child.fatherId === data.relatedPersonId) {
                    // האדם הקשור הוא האב, האדם החדש יהיה האם
                    await PersonModel.updateOne(
                      { id: child.id },
                      { motherId: newId }
                    );
                  } else if (child.motherId === data.relatedPersonId) {
                    // האדם הקשור הוא האם, האדם החדש יהיה האב
                    await PersonModel.updateOne(
                      { id: child.id },
                      { fatherId: newId }
                    );
                  }
                }
              }
            }
            break;
            
          case 'child':
            // עדכון ה-parentId של הילד בהתאם למגדר של האדם הקשור
            let isRelatedPersonMale = true; // הנחה ברירת מחדל
            
            // אם לאדם הקשור יש בן/בת זוג, בדוק אם הוא אבא או אמא לילדים אחרים
            if ('spouseId' in relatedPerson && relatedPerson.spouseId) {
              const childrenWithRelatedAsFather = await PersonModel.findOne({ 
                fatherId: data.relatedPersonId 
              }).lean();
              
              const childrenWithRelatedAsMother = await PersonModel.findOne({ 
                motherId: data.relatedPersonId 
              }).lean();
              
              if (childrenWithRelatedAsMother) {
                isRelatedPersonMale = false;
              } else if (childrenWithRelatedAsFather) {
                isRelatedPersonMale = true;
              }
            }
            
            if (isRelatedPersonMale) {
              // האדם הקשור הוא האב
              await PersonModel.updateOne(
                { id: newId },
                { fatherId: data.relatedPersonId }
              );
              
              // אם לאב יש בן/בת זוג והמשתמש בחר לשתף את ההורה השני
              if ('spouseId' in relatedPerson && relatedPerson.spouseId && selectedRelationships.shareOtherParent) {
                await PersonModel.updateOne(
                  { id: newId },
                  { motherId: relatedPerson.spouseId }
                );
              }
            } else {
              // האדם הקשור הוא האם
              await PersonModel.updateOne(
                { id: newId },
                { motherId: data.relatedPersonId }
              );
              
              // אם לאם יש בן/בת זוג והמשתמש בחר לשתף את ההורה השני
              if ('spouseId' in relatedPerson && relatedPerson.spouseId && selectedRelationships.shareOtherParent) {
                await PersonModel.updateOne(
                  { id: newId },
                  { fatherId: relatedPerson.spouseId }
                );
              }
            }
            break;
            
          case 'sibling':
            // העתקת ה-parentId מהאח/אחות בהתאם לבחירה
            if (relatedPerson && !Array.isArray(relatedPerson) && 'fatherId' in relatedPerson && 
                relatedPerson.fatherId && selectedRelationships.shareFather) {
              await PersonModel.updateOne(
                { id: newId },
                { fatherId: relatedPerson.fatherId }
              );
            }
            
            if (relatedPerson && !Array.isArray(relatedPerson) && 'motherId' in relatedPerson && 
                relatedPerson.motherId && selectedRelationships.shareMother) {
              await PersonModel.updateOne(
                { id: newId },
                { motherId: relatedPerson.motherId }
              );
            }
            break;
            
          case 'parent':
            if (data.parentType === 'father') {
              // עדכון ה-fatherId של האדם הקשור
              await PersonModel.updateOne(
                { id: data.relatedPersonId },
                { fatherId: newId }
              );
              
              // עדכון אחים אם נבחרו
              if (relatedPerson && typeof relatedPerson === 'object' && !Array.isArray(relatedPerson) && 
                  'motherId' in relatedPerson && relatedPerson.motherId) {
                const siblings = await PersonModel.find({ 
                  motherId: relatedPerson.motherId,
                  id: { $ne: data.relatedPersonId }
                }).lean();
                
                for (const sibling of siblings) {
                  // בדיקה אם האח/אחות נבחרו לקבל את אותו הורה
                  if (selectedRelationships.sharedSiblings[sibling.id]) {
                    await PersonModel.updateOne(
                      { id: sibling.id },
                      { fatherId: newId }
                    );
                  }
                }
              }
            } else if (data.parentType === 'mother') {
              // עדכון ה-motherId של האדם הקשור
              await PersonModel.updateOne(
                { id: data.relatedPersonId },
                { motherId: newId }
              );
              
              // עדכון אחים אם נבחרו
              if (relatedPerson && typeof relatedPerson === 'object' && !Array.isArray(relatedPerson) && 
                  'fatherId' in relatedPerson && relatedPerson.fatherId) {
                const siblings = await PersonModel.find({ 
                  fatherId: relatedPerson.fatherId,
                  id: { $ne: data.relatedPersonId }
                }).lean();
                
                for (const sibling of siblings) {
                  // בדיקה אם האח/אחות נבחרו לקבל את אותו הורה
                  if (selectedRelationships.sharedSiblings[sibling.id]) {
                    await PersonModel.updateOne(
                      { id: sibling.id },
                      { motherId: newId }
                    );
                  }
                }
              }
            }
            break;
        }
      }
    }
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ success: true, id: newId })
    };
  } catch (error) {
    console.error('Error adding person:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: 'Failed to add person', message: (error as Error).message })
    };
  }
};

export { handler }; 