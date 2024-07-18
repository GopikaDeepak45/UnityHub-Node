// LandingPage.ts
import mongoose, { Schema, Document } from 'mongoose';

interface Image{
    url:string;
    publicId:string
}
// Interface for core package objects
interface CorePackage {
    name:string
    image: Image;
    shortDescription: string;
}

// Interface for the about object
interface About {
    image: Image|null;
    description: string;
}

// Interface for the LandingPage document
interface LandingPage extends Document {
    hero: Image|null;
    about: About;
    corePackage: CorePackage[];
    images: string[];
}

// Define Mongoose schema for LandingPage
const LandingPageSchema: Schema = new Schema({
    hero: {  url:String,
        publicId:String },
    about: {
        image: { url:String,
            publicId:String },
        description: { type: String }
    },
    corePackage: [{
        name: {
            type: String,
            unique: true,
            required: true
          },
        image: { url:String,
            publicId:String },
        shortDescription: { type: String }
    }],
    images: [{ url:String,
        publicId:String }]
});

const LandingPageModel = mongoose.model<LandingPage>('LandingPage', LandingPageSchema);

export default LandingPageModel;
