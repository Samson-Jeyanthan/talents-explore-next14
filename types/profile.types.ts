export type TCurrentUserData = {
  _id: string;
  isTalent: boolean;
  morePersonalInfo: {
    bio: string;
    ethnic: string;
    featuredPhotos: [string];
    socialLinks: [
      {
        type: string;
        url: string;
      },
    ];
    _id: string;
    ethnicId: string;
  };
  personalInfo: {
    firstName: string;
    lastName: string;
    gender: string;
    dob: string;
    languageKnown: string;
    professional: string;
    profileImage: string;
    coverImage: string;
    shortBio: string;
    language: string;
    professionalId: string;
  };
  email: string;
  userName: string;
  callingCode: string | null;
  mobile: number | string | null;
  avgRating: number;
  numberOfRating: number;
  followers: number;
  following: number;
  location: string;
  yourRating: number;
};

export type TPublicUserData = {
  _id: string;
  isTalent: boolean;
  morePersonalInfo: {
    bio: string;
    ethnic: string;
    featuredPhotos: [string];
    socialLinks: [
      {
        type: string;
        url: string;
      },
    ];
    _id: string;
  };
  personalInfo: {
    coverImage: string;
    firstName: string;
    lastName: string;
    shortBio: string;
    profileImage: string;
    language: string;
    professional: string;
    dob: string;
  };
  location: string;
  userName: string;
  email: string;
  callingCode: string | null;
  mobile: number | string | null;
  avgRating: number;
  numberOfRating: number;
  yourRating: number;
  followers: number;
  following: number;
  isFollowing: boolean;
};

export interface ITopPost {
  _id: string;
  isBestWork: boolean;
  about: {
    title: string;
  };
  media: [
    {
      url: string;
      urlKey: string;
      mediaType: string;
      thumbnailUrl: string;
      thumbnailUrlKey: string;
    },
  ];
  postRating: number;
  numberOfRating: number;
  publishedAt: string;
}

export interface IProfileSkills {
  _id: string;
  mainCategoryName: string;
  mainCategoryId: string;
  subCategoryName: string;
  subCategoryId: string;
  skillsHave: [
    {
      skillName: string;
      skillId: string;
      level: string;
    },
  ];
  description: string;
  hashTags: [string];
}

export interface IAwardsOrCertificate {
  _id: string;
  name: string;
  givenBy: string;
  year: number;
}

export interface IEducation {
  _id: string;
  course: string;
  institution: string;
  from: number;
  to: number;
}

export interface ILanguage {
  _id: string;
  languageId: string;
  languageName: string;
  level: string;
}
