
import {v2 as cloudinary} from 'cloudinary';

const ConnectCloudinary=async()=>{
    try{
      await  cloudinary.config({
            cloud_name: process.env.CLOUD_NAME,
            api_key: process.env.API_KEY,
            api_secret: process.env.API_SECRET,
          });
          console.log('Cloudinary connected');

    }catch(e){
        console.log('error connecting to cloudinary',e)
    }

}
export default ConnectCloudinary