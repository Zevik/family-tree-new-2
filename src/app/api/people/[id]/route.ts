import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import PersonModel from '@/models/PersonModel';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const person = await PersonModel.findOne({ id: params.id }).lean();
    
    if (!person) {
      return NextResponse.json(
        { error: 'Person not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(person);
  } catch (error) {
    console.error('Error fetching person:', error);
    return NextResponse.json(
      { error: 'Failed to fetch person' },
      { status: 500 }
    );
  }
} 