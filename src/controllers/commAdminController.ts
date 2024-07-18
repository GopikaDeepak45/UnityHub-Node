import { NextFunction, Request, Response } from "express";
import asyncErrorHandler from "../middlewares/asyncErrorHandler";
import Community from "../models/community";
import CommAdmin from "../models/commAdmin";
import { BadRequestError } from "../errors/BadRequestError";
import sendEmail from "../utils/sendMail";
import { ConflictError } from "../errors/ConflictError";
import UnverifiedCommAdmin from "../models/unverifiedCommAdmin";

const getCommunityAdminData = asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.query
  console.log('enter fetch comm admindtata', id)
  const commAdmin = await CommAdmin.findById(id)
  console.log('fetch comm admin  dta', commAdmin)
  res.status(200).json({ commAdmin: commAdmin })

})

const commAdminRegster = asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {

  const { name, email, password, confirmPassword, mobileNo, communityName, communityLocation } = req.body

  if (password !== confirmPassword) {
    // return res.json({ message: "Passwords do not match" });
    throw new BadRequestError("Passwords do not match");
  }
  // Check if the community already exists (case insensitive)
  const existingCommunity = await Community.findOne({
    name: { $regex: new RegExp(communityName, 'i') },
    location: { $regex: new RegExp(communityLocation, 'i') }
  });

  if (existingCommunity) {
    throw new ConflictError('A community with this name and location already exists.');
  }


  //check if mail id exixts
  const existingCommAdmin = await CommAdmin.findOne({ email })

  if (existingCommAdmin) {
    throw new ConflictError('Email already exists');
  }
  // Create the community admin
  const unverifiedCommunityAdmin = await UnverifiedCommAdmin.create({
    role: 'commAdmin',
    userName: name,
    communityName,
    communityLocation,
    email,
    password,
    mobileNo
  });

  //generate otp and mail data
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const sub = 'Login OTP'
  const msg = `Your OTP for Login : ${otp}`

  //save otp
  unverifiedCommunityAdmin.otp = otp
  await unverifiedCommunityAdmin.save()

  sendEmail(email, sub, msg)

  res.status(200).json({ admin_id: unverifiedCommunityAdmin._id, message: "Community admin registered successfully" });
})

const verifyOTP = asyncErrorHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { pin, id } = req.body
  console.log('enter verify otp', req.body)

  const unverifiedCommAdmin = await UnverifiedCommAdmin.findById(id)

  if (unverifiedCommAdmin?.otp === pin) {
    // Create the community
    const community = await Community.create({ name: unverifiedCommAdmin?.communityName, location: unverifiedCommAdmin?.communityLocation });
    //create the commAdmin as its verified
    if (unverifiedCommAdmin) {
      
      const verifiedCommAdmin = new CommAdmin({
        role: unverifiedCommAdmin.role,
        userName: unverifiedCommAdmin.userName,
        communityId: community._id,
        email: unverifiedCommAdmin.email,
        password: unverifiedCommAdmin.password,
        mobileNo: unverifiedCommAdmin.mobileNo,
        isVerified: true
      });

      await verifiedCommAdmin.save()
    }
    // Delete the unverified user document
    await UnverifiedCommAdmin.findByIdAndDelete(unverifiedCommAdmin?._id);

    res.status(200).json({ message: 'OTP verified, Community Admin registered' })
  } else {
    throw new BadRequestError('Invalid OTP')
  }
})

export {

  commAdminRegster,
  verifyOTP,
  getCommunityAdminData
};
