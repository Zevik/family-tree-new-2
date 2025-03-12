import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PersonModel from '@/models/PersonModel';
import { generateUniqueId } from '@/utils/familyUtils';
import { Person } from '@/models/Person';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    
    const data = await request.json();
    
    // Generate a unique ID
    let newId = generateUniqueId();
    let idExists = await PersonModel.findOne({ id: newId }).lean();
    
    // Make sure the ID is unique
    while (idExists) {
      newId = generateUniqueId();
      idExists = await PersonModel.findOne({ id: newId }).lean();
    }
    
    // Create the new person
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
    
    // Save the new person
    const person = await PersonModel.create(newPerson);
    
    // Update relationships based on the relationship type
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
            // Update the related person's spouse ID
            await PersonModel.updateOne(
              { id: data.relatedPersonId },
              { 
                spouseId: newId, 
                marriageDate: data.marriageDate,
                marriageDateHebrew: data.marriageDateHebrew,
              }
            );
            
            // Update the new person's spouse ID (to create a bi-directional relationship)
            await PersonModel.updateOne(
              { id: newId },
              { 
                spouseId: data.relatedPersonId, 
                marriageDate: data.marriageDate,
                marriageDateHebrew: data.marriageDateHebrew
              }
            );
            
            // עדכון ילדים משותפים אם נבחרו
            if (relatedPerson && typeof relatedPerson === 'object' && !('spouseId' in relatedPerson)) { // אם זה בן/בת זוג ראשון
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
            // Update the child's parent IDs based on the gender of the related person
            // Check if the related person has a gender field, otherwise try to determine from existing relationships
            let isRelatedPersonMale = true; // Default assumption
            
            // If the related person has a spouse, check if they are a father or mother to other children
            if (relatedPerson.spouseId) {
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
              // Related person is assumed to be the father
              await PersonModel.updateOne(
                { id: newId },
                { fatherId: data.relatedPersonId }
              );
              
              // If the father has a spouse and the user selected to share the other parent
              if (relatedPerson.spouseId && selectedRelationships.shareOtherParent) {
                await PersonModel.updateOne(
                  { id: newId },
                  { motherId: relatedPerson.spouseId }
                );
              }
            } else {
              // Related person is assumed to be the mother
              await PersonModel.updateOne(
                { id: newId },
                { motherId: data.relatedPersonId }
              );
              
              // If the mother has a spouse and the user selected to share the other parent
              if (relatedPerson.spouseId && selectedRelationships.shareOtherParent) {
                await PersonModel.updateOne(
                  { id: newId },
                  { fatherId: relatedPerson.spouseId }
                );
              }
            }
            break;
            
          case 'sibling':
            // Copy the parent IDs from the sibling based on selection
            if (relatedPerson.fatherId && selectedRelationships.shareFather) {
              await PersonModel.updateOne(
                { id: newId },
                { fatherId: relatedPerson.fatherId }
              );
            }
            
            if (relatedPerson.motherId && selectedRelationships.shareMother) {
              await PersonModel.updateOne(
                { id: newId },
                { motherId: relatedPerson.motherId }
              );
            }
            break;
            
          case 'parent':
            if (data.parentType === 'father') {
              // Update the related person's father ID
              await PersonModel.updateOne(
                { id: data.relatedPersonId },
                { fatherId: newId }
              );
              
              // Update siblings if selected
              if (relatedPerson.motherId) {
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
              // Update the related person's mother ID
              await PersonModel.updateOne(
                { id: data.relatedPersonId },
                { motherId: newId }
              );
              
              // Update siblings if selected
              if (relatedPerson.fatherId) {
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
    
    return NextResponse.json({ success: true, id: newId });
  } catch (error) {
    console.error('Error adding person:', error);
    return NextResponse.json(
      { error: 'Failed to add person' },
      { status: 500 }
    );
  }
} 