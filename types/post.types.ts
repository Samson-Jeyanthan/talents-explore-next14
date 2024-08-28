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
      status: 1;
      createdAt: string;
      updatedAt: string;
    },
  ];
}
