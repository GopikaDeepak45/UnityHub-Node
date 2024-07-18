
import mongoose from 'mongoose';

// Enhanced type guard to check for distinguishing properties
export function isPopulated<T>(doc: mongoose.Types.ObjectId | T): doc is T {
  // Check for a property that would not exist on a simple ObjectId
  return typeof doc === 'object' && doc !== null && 'isBlocked' in doc;
}
