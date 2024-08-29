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
