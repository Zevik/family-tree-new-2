import mongoose, { Schema } from 'mongoose';
import { Person } from './Person';

const PersonSchema = new Schema<Person>(
  {
    id: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    birthDateGregorian: { type: String },
    birthDateHebrew: { type: String },
    deathDateGregorian: { type: String },
    deathDateHebrew: { type: String },
    fatherId: { type: String },
    motherId: { type: String },
    spouseId: { type: String },
    marriageDate: { type: String },
    marriageDateHebrew: { type: String },
    email: { type: String },
    phone: { type: String },
    hidden: { type: Boolean, default: false },
    primaryDateFormat: { type: String, enum: ['hebrew', 'gregorian', 'both'], default: 'gregorian' },
    notifyOnBirthday: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// This is important for Next.js to prevent multiple model initialization
export default mongoose.models.Person || mongoose.model<Person>('Person', PersonSchema); 