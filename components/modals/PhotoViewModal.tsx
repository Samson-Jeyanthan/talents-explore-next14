import { DialogClose, DialogContent, DialogTitle } from "../ui/dialog";
import Image from "next/image";
import { MdClose } from "react-icons/md";

const PhotoViewModal = ({
  imgURL,
  onClick,
}: {
  imgURL: string;
  onClick: () => void;
}) => {
  return (
    <DialogContent
      className="flex rounded-xl border-none"
      aria-describedby={undefined}
    >
      <DialogTitle>
        <Image
          src={imgURL}
          width={1024}
          height={1024}
          alt="profile photo"
          className="max-h-[85vh] w-full rounded-xl object-contain"
        />
      </DialogTitle>
      <DialogClose
        className="absolute -right-3 -top-3 cursor-pointer rounded-full bg-dark-400 p-[6px] text-light-900 focus:outline-none"
        onClick={onClick}
      >
        <MdClose className="text-2xl" />
      </DialogClose>
    </DialogContent>
  );
};

export default PhotoViewModal;
