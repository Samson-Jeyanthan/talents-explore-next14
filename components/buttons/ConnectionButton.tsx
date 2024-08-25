"use client";

import { followUserAction } from "@/actions/connection.action";
import { Button } from "../ui/button";

interface ConnectionButtonProps {
  isFollow: number;
  viewerId: string | undefined;
  userId: string;
}

function ConnectionButton({
  isFollow,
  viewerId,
  userId,
}: ConnectionButtonProps) {
  const handleConnection = () => {
    if (!isFollow) {
      const res = followUserAction(viewerId, userId);
      console.log(res, "res");
    } else {
      const res = followUserAction(viewerId, userId);
      console.log(res, "res");
    }
  };

  return (
    <Button
      className="shad-button_primary rounded-full"
      onClick={handleConnection}
    >
      {isFollow === 1 ? "Following" : "Follow"}
    </Button>
  );
}

export default ConnectionButton;
