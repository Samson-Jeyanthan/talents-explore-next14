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

export const getCategoriesIcon = (name: string) => {
  switch (name) {
    case "Sports & Fitness":
      return HeadPhoneFillIcon;
    case "Songs & Music":
      return HeadPhoneFillIcon;
    case "Dance & Styles":
      return DanceFillIcon;
    case "Arts & Crafts":
      return PaintFillIcon;
    case "Graphics & Designs":
      return GraphicsFillIcon;
    case "Programming & Tech":
      return CommandFillIcon;
    case "Video & Animation":
      return AnimationFillIcon;
    case "UX, Writing & Translation":
      return HeadPhoneFillIcon;
    case "Photography":
      return CameraFillIcon;
    case "Film & Entertainment":
      return FilmFillIcon;
    default:
      return HeadPhoneFillIcon;
  }
};

export async function getNameOfCategory(categoryId: string) {
  const mainCat = await getMainCategoriesAction();

  if (mainCat.status === "7400") {
    const categoryData = mainCat.response.find(
      (cat: any) => cat._id === categoryId
    );
    return {
      icon: getCategoriesIcon(categoryData?.name),
      name: categoryData?.name,
    };
  }
}
