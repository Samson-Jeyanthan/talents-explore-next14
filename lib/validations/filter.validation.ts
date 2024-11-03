import * as z from "zod";

export const postFilterValidation = z.object({
  mainCategory: z.string(),
  subCategory: z.string(),
  skill: z.string(),
  level: z.string(),
  publicRating: z.number(),
  postDescription: z.string(),
  primaryLanguage: z.string(),
  secondaryLanguage: z.string(),
  timeDuration: z.string(),
  country: z.string(),
  state: z.string(),
  creditTitle: z.string(),
});

export const talentFilterValidation = z.object({
  profileRating: z.number(),
  gender: z.string(),
  userLanguage: z.string(),
  userEthnicity: z.string(),
});

// {
//   "_id": "652a67ff192f4d463cc86424",
//   "media": [
//     {
//       "_id": "652a67ff192f4d463cc86426",
//       "type": "SHARELINK",
//       "userId": "652a6578192f4d463cc863ed",
//       "postId": "652a67ff192f4d463cc86424",
//       "mediaType": "image",
//       "url": "https://te-files-media.s3.eu-west-2.amazonaws.com/652a6578192f4d463cc863ed/169727795109991d86fc3-0f81-40df-be97-af9e41fa111b.jpg",
//       "urlKey": "652a6578192f4d463cc863ed/169727795109991d86fc3-0f81-40df-be97-af9e41fa111b.jpg",
//       "thumbnailUrl": "https://te-files-media.s3.eu-west-2.amazonaws.com/652a6578192f4d463cc863ed/169727795109991d86fc3-0f81-40df-be97-af9e41fa111b.jpg",
//       "thumbnailUrlkey": "https://te-files-media.s3.eu-west-2.amazonaws.com/652a6578192f4d463cc863ed/169727795109991d86fc3-0f81-40df-be97-af9e41fa111b.jpg",
//       "views": 0,
//       "status": 1,
//       "createdAt": "2023-10-14T10:05:51.962Z",
//       "updatedAt": "2023-10-14T10:05:51.962Z",
//       "__v": 0
//     }
//   ],
//   "author": {
//     "_id": "652a6578192f4d463cc863ed",
//     "firstName": "jey",
//     "lastName": "siva",
//     "profileImage": "https://te-files-media.s3.eu-west-2.amazonaws.com/652a6578192f4d463cc863ed/169727741798095ec1f5b-7d57-43f1-8841-6f60896be91d.jpg",
//     "shortBio": "smiling buddha",
//     "userName": "jeysiva999"
//   },
//   "publishedAt": "2023-10-14T10:05:51.728Z",
//   "about": {
//     "title": "testing normal user",
//     "description": "i am living my life to the fullest",
//     "skillId": "64a1847aeebee8c20f93e494",
//     "skill": "Karate"
//   }
// },
