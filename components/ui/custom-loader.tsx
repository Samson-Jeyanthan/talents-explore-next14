import { FadeLoader } from "react-spinners";

const CustomLoader = () => {
  const LoaderStyles = {
    margin: "0 0 0 1.2rem",
  };
  return (
    <div>
      <FadeLoader
        color="#747474"
        height={8.5}
        width={2}
        radius={1}
        margin={-9}
        speedMultiplier={1.5}
        loading={true}
        cssOverride={LoaderStyles}
      />
    </div>
  );
};

export default CustomLoader;
