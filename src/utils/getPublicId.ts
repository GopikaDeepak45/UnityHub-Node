
// Function to extract publicId from Cloudinary image URL
export const getPublicIdFromUrl = (imageUrl:any) => {
    const parts = imageUrl.split('/');
    const publicIdIndex = parts.indexOf('upload') + 1; // publicId comes after 'upload'
    if (publicIdIndex !== -1 && publicIdIndex < parts.length) {
        return parts[publicIdIndex + 1]; // Return the segment after 'upload'
    } else {
        // Handle the case where publicId is not found
        return null;
    }
};
