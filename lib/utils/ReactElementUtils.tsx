import { getMainCategoriesAction } from "@/actions/utils.action";
import {
  AnimationFillIcon,
  CameraFillIcon,
  CommandFillIcon,
  DanceFillIcon,
  FilmFillIcon,
  GraphicsFillIcon,
  HeadPhoneFillIcon,
  PaintFillIcon,
} from "@/public/assets/svgs";

export const getCategoryDetails = (name: string) => {
  switch (name) {
    case "Sports & Fitness":
      return {
        icon: HeadPhoneFillIcon,
        name,
        description:
          "Stay active and healthy with content focused on sports, exercise routines, and fitness tips.",
      };
    case "Songs & Music":
      return {
        icon: HeadPhoneFillIcon,
        name,
        description:
          "Discover a world of music, from compositions and tutorials to the latest trends in audio creation.",
      };
    case "Dance & Styles":
      return {
        icon: DanceFillIcon,
        name,
        description:
          "Explore various dance styles and learn new moves from experienced dancers.",
      };
    case "Arts & Crafts":
      return {
        icon: PaintFillIcon,
        name,
        description:
          "Unleash your creativity with projects, techniques, and inspiration in arts and crafts.",
      };
    case "Graphics & Designs":
      return {
        icon: GraphicsFillIcon,
        name,
        description:
          "From digital art to branding, find resources and inspiration for graphic design.",
      };
    case "Programming & Tech":
      return {
        icon: CommandFillIcon,
        name,
        description:
          "Stay ahead in the tech world with programming tutorials, tech trends, and development insights.",
      };
    case "Video & Animation":
      return {
        icon: AnimationFillIcon,
        name,
        description:
          "Learn the art of video production and animation with industry tips and tutorials.",
      };
    case "UX, Writing & Translation":
      return {
        icon: HeadPhoneFillIcon,
        name,
        description:
          "Dive into UX design, writing skills, and translation techniques for effective communication.",
      };
    case "Photography":
      return {
        icon: CameraFillIcon,
        name,
        description:
          "Capture moments like a pro with photography tips, gear guides, and editing advice.",
      };
    case "Film & Entertainment":
      return {
        icon: FilmFillIcon,
        name,
        description:
          "Get insights into the film industry, entertainment news, and content creation.",
      };
    default:
      return {
        icon: HeadPhoneFillIcon,
        name: "General",
        description:
          "Explore various topics and find content across multiple interests.",
      };
  }
};

export async function getNameOfCategory(categoryId: string) {
  const mainCat = await getMainCategoriesAction();

  if (mainCat.status === "7400") {
    const categoryData = mainCat.response.find(
      (cat: any) => cat._id === categoryId
    );
    const categoryDetails = getCategoryDetails(categoryData?.name);
    return {
      ...categoryDetails,
    };
  }
}
