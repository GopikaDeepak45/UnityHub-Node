// LandingPageController.ts
import { NextFunction, Request, Response } from 'express';
import asyncErrorHandler from '../middlewares/asyncErrorHandler';
import LandingPage from '../models/landingPage';
import { NotFoundError } from '../errors/NotFoundError';
import { BadRequestError } from '../errors/BadRequestError';
import { v2 as cloudinary } from 'cloudinary';
import { ConflictError } from '../errors/ConflictError';
import sendEmail from '../utils/sendMail';

interface CustomRequest extends Request {
    user?: {
        username: string;
        role: string;
    };
}


// GET - Retrieve landing page data
const getLandingPage = asyncErrorHandler(async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {

    const landingPage = await LandingPage.findOne();

    if (!landingPage) {

        throw new NotFoundError('No data found')
    }
    res.status(200).json(landingPage);
   
});
const getLandingPageWithSearch = asyncErrorHandler(async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {

    // const landingPage = await LandingPage.findOne();

    // if (!landingPage) {

    //     throw new NotFoundError('No data found')
    // }
    // res.status(200).json(landingPage);
    const { searchQuery } = req.query as { searchQuery?: string };
    let filter = {};
    let landingPage
console.log('called fetch lp data with',searchQuery)

    if (searchQuery!==undefined) {
        filter = {
            $or: [
                { name: { $regex: new RegExp(searchQuery, 'i') } }, // Case-insensitive search by name
                { shortDescription: { $regex: new RegExp(searchQuery, 'i') } } // Case-insensitive search by shortDescription
            ]
        };
        landingPage = await LandingPage.find(filter);
         // Return an empty array if no documents are found
    if (!landingPage || landingPage.length === 0) {
        res.status(200).json([]);
        return;
    }
    }

     landingPage = await LandingPage.find();

   

    res.status(200).json(landingPage);
});
const addImage = asyncErrorHandler(async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {

    const { imageType, imageUrl, publicId } = req.body

    if (!imageType || !imageUrl || !publicId) {
        throw new BadRequestError("Image type,URL or publicId missing")
    }

    if (imageType === 'common') {
        // Add the imageUrl to the images array
        await LandingPage.updateOne({}, { $push: { images: { url: imageUrl, publicId: publicId } } }, { upsert: true });
        //await LandingPage.updateOne({}, { $addToSet: { images: imageUrl } },{ upsert: true });
        /*} else if (imageType === 'hero' || imageType === 'about') {
            let updateQuery = {};
            if (imageType === 'hero') {
                updateQuery = { $set: { hero: { url: imageUrl, publicId: publicId } } };
            } else if (imageType === 'about') {
                updateQuery = { $set: { 'about.image': { url: imageUrl, publicId: publicId } } };
            }
            await LandingPage.updateOne({}, updateQuery, { upsert: true });
        }*/
    } else if (imageType === 'hero' || imageType === 'about') {
        let updateQuery = {};
        let oldPublicId = null;

        if (imageType === 'hero') {
            const existingHero = await LandingPage.findOne({}, 'hero.publicId');
            if (existingHero && existingHero.hero && existingHero.hero.publicId) {
                oldPublicId = existingHero.hero.publicId;
            }
            updateQuery = { $set: { hero: { url: imageUrl, publicId: publicId } } };
        } else if (imageType === 'about') {
            const existingAbout = await LandingPage.findOne({}, 'about.image.publicId');
            if (existingAbout && existingAbout.about && existingAbout.about.image && existingAbout.about.image.publicId) {
                oldPublicId = existingAbout.about.image.publicId;
            }
            updateQuery = { $set: { 'about.image': { url: imageUrl, publicId: publicId } } };
        }

        await LandingPage.updateOne({}, updateQuery, { upsert: true });

        // Delete old image from Cloudinary if it exists
        if (oldPublicId) {
            await cloudinary.uploader.destroy(oldPublicId);
        }
    }



    else {
        throw new BadRequestError('Invalid image type')
    }

    res.status(200).send({ message: 'Image added successfully' });
})

const deleteImage = asyncErrorHandler(async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
    console.log('d i called', req.body)
    const { imageType, imageUrl, publicId } = req.body;

    if (!imageType) {
        throw new BadRequestError("Image type missing");
    }

    if (imageType === 'common') {
        if (!imageUrl || !publicId) {
            throw new BadRequestError("Image URL or publicId missing");
        }
        // Delete the image from Cloudinary
        const result = await cloudinary.uploader.destroy(publicId);
        // Delete the imageUrl from the images array
        await LandingPage.updateOne({}, { $pull: { images: { publicId: publicId } } });

    } else if (imageType === 'hero' || imageType === 'about') {

        let updateQuery = {};
        if (imageType === 'hero') {
            updateQuery = { $unset: { hero: 1 } };
        } else if (imageType === 'about') {
            updateQuery = { $unset: { 'about.image': 1 } };
        }
        // Delete the image from Cloudinary
        const result = await cloudinary.uploader.destroy(publicId);

        await LandingPage.updateOne(updateQuery);

    } else {
        throw new BadRequestError('Invalid image type');
    }



    res.status(200).send({ message: 'Image deleted successfully' });
});

//for core packages
const addCorePackage = asyncErrorHandler(async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {

    const { name, imageUrl, publicId, shortDescription } = req.body

    if (!name || !imageUrl || !publicId || !shortDescription) {
        throw new BadRequestError("Package name or image or short description is missing")
    }
    const existingPackage = await LandingPage.findOne({ 'corePackage.name': name })
    console.log('e p', existingPackage)
    if (existingPackage) {
        throw new ConflictError('A core package with the same name already exists');
    }
    const dataToAdd = {
        name,
        image: {
            url: imageUrl,
            publicId
        },
        shortDescription
    }

    await LandingPage.updateOne({}, { $push: { corePackage: dataToAdd } }, { upsert: true });

    res.status(200).send({ message: 'core package  added successfully' });
})
const editCorePackage = asyncErrorHandler(async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {

    const { id, name, imageUrl, publicId, shortDescription } = req.body;
   
    if (!name) {
        throw new BadRequestError("Package name is required");
    }
    const landingPage = await LandingPage.findOne();

    const existingPackageIndex = landingPage?.corePackage.findIndex(pkg => (pkg as any)._id.toString() === id);

    if (existingPackageIndex === -1 || existingPackageIndex === undefined) {
        throw new NotFoundError('No package data found');
    }
    const existingPackage = landingPage?.corePackage[existingPackageIndex];
    if (!existingPackage) {
        throw new NotFoundError('No package data found');
    }
// Check for name conflict, excluding the current package being edited
const nameConflict = landingPage.corePackage.find(pkg => pkg.name.toLowerCase() === name.toLowerCase());
if (nameConflict) {
    throw new ConflictError('A core package with the same name already exists');
}
    //store old image data to delete from cloudinary
    const oldImage = existingPackage.image

    //make changes
    const updatedPackage = {
        ...existingPackage,
        name,
        image: { url: imageUrl, publicId },
        shortDescription
    };

    // Update the corePackage array within the LandingPage document
    landingPage.corePackage[existingPackageIndex] = updatedPackage;

    // Save the updated LandingPage document
    await landingPage.save();
//if image changed, delete from cloudinary also.
    if (oldImage.url !== imageUrl) {
        
        await cloudinary.uploader.destroy(oldImage.publicId);
    }


    res.status(200).send({ message: 'Core package updated successfully' });
});

const deleteCorePackage=asyncErrorHandler(async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
const {id}=req.body
console.log('entered delete pkg',req.body)
const landingPage = await LandingPage.findOne();
if (!landingPage) {

    throw new NotFoundError('No data found')
}
const existingPackageIndex = landingPage?.corePackage.findIndex(pkg => (pkg as any)._id.toString() === id);

const existingPackage = landingPage?.corePackage[existingPackageIndex];
    if (!existingPackage) {
        throw new NotFoundError('No package found');
    }

    //store old image data to delete from cloudinary
    const oldImage = existingPackage.image

if (existingPackageIndex === -1 || existingPackageIndex === undefined) {
    throw new NotFoundError('Existing package image not found');
}
// Remove the package from the array
landingPage.corePackage.splice(existingPackageIndex, 1);
// Save the updated landing page document
await landingPage.save();
await cloudinary.uploader.destroy(oldImage.publicId);
  
res.status(200).json({ message: 'Package deleted successfully' });

})

const sendMail = asyncErrorHandler(async (req: CustomRequest, res: Response, next: NextFunction): Promise<void> => {
    const { name, email, message } = req.body

    const to = 'gunityhubgopz@gmail.com'
    const sub = `Email from ${name}, mail id - ${email}`
    const msg = message
    sendEmail(to, sub, msg)
    res.status(200).json({ message: 'Successfully send the Message' })

})


export {
    getLandingPage,
    getLandingPageWithSearch,
    addImage,
    deleteImage,
    addCorePackage,
    sendMail,
    editCorePackage,
    deleteCorePackage
}