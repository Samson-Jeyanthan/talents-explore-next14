export interface IPost {
  _id: string;
  isBestWork: false;
  timeAgo: string;
  publishedAt: string;
  numberOfComments: number;
  yourRating: number;
  numberOfRating: number;
  postRating: number;
  website: null;
  shareLinkThumbnail: string | null;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    profileImage: string | null;
    shortBio: string | undefined;
    userName: string;
  };
  about: {
    title: string;
    description: string;
    level: string;
    mainCategoryId: string;
    mainCategory: string;
    subCategoryId: string;
    subCategory: string | null;
    skillId: string;
    skill: string;
    ownRating: number;
    keywords: [string];
    country: string;
    state: string;
  };
  media: [
    {
      _id: string;
      type: "POST" | "SHARELINK";
      userId: string;
      postId: string;
      mediaType: string;
      url: string;
      urlKey: string;
      thumbnailUrl: string;
      thumbnailUrlkey: string;
      views: number;
      status: number;
      createdAt: string;
      updatedAt: string;
    },
  ];
}

export type TPostURLProps = {
  params: { id: string };
};

export type TPostProps = {
  status: 200 | 400;
  _id: string;
  isBestWork: false;
  media: [
    {
      _id: string;
      type: "POST" | "SHARELINK";
      userId: string;
      postId: string;
      mediaType: string;
      url: string | null;
      urlKey: string | null;
      thumbnailUrl: string | null;
      thumbnailUrlkey: string | null;
      views: number;
      status: 1;
      createdAt: string;
      updatedAt: string;
    },
  ];
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    profileImage: string | null;
    shortBio: string | undefined;
    userName: string;
  };
  about: {
    title: string;
    description: string;
    level: string;
    mainCategoryId: string;
    mainCategory: string;
    subCategoryId: string;
    subCategory: string | null;
    skillId: string;
    skill: string;
    ownRating: number;
    keywords: [string];
    country: string;
    countryShortName: string;
    state: string;
    productionName: string;
    productionDate: string | null;
    primaryLanguage: string;
    secondaryLanguage: string;
    primaryLanguageId: string;
    secondaryLanguageId: string;
    peopleTag: [
      {
        _id: string;
        userName: string;
      },
    ];
  };
  isCreditWork: false;
  credit: [
    {
      creditTitle: string;
      peopleTag: [
        {
          _id: string;
          userName: string;
        },
      ];
    },
  ];
  toolsUsed: [
    {
      toolName: string;
      level: string;
    },
  ];
  timeAgo: string;
  publishedAt: string;
  numberOfComments: number;
  yourRating: number;
  numberOfRating: number;
  postRating: number;
  rating: {
    oneStar: number;
    twoStar: number;
    threeStar: number;
    fourStar: number;
    fiveStar: number;
  };
  website: string | null;
  shareLinkThumbnail: string | null;
};

export interface IComments {
  _id: string;
  comment: string;
  createdAt: string;
  author: {
    _id: string;
    userName: string;
    firstName: string;
    lastName: string;
    gender: string;
    dob: string;
    languageKnown: string;
    professional: string;
    profileImage: string | null;
    coverImage: string | null;
    shortBio: string | null;
  };
}

export interface ISavedFolder {
  _id: string;
  collectionName: string;
  status: boolean;
}

export interface ISavedItem {
  status: 200 | 400;
  _id: string;
  isBestWork: boolean;
  media: [
    {
      _id: string;
      type: "POST" | "SHARELINK";
      userId: string;
      postId: string;
      mediaType: string;
      url: string | null;
      urlKey: string | null;
      thumbnailUrl: string | null;
      thumbnailUrlkey: string | null;
      views: number;
      status: 1;
      createdAt: string;
      updatedAt: string;
    },
  ];
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    profileImage: string | null;
    userName: string;
  };
  about: {
    title: string;
    level: string;
    mainCategoryId: string;
    mainCategory: string;
    subCategoryId: string;
    subCategory: null;
    skillId: string;
    skill: string;
    ownRating: number;
  };
  timeAgo: string;
  publishedAt: string;
  numberOfRating: number;
  postRating: number;
  shareLinkThumbnail: string | null;
}
