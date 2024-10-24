import { TConvertedSvgJsxProps } from "@/types/utils.types";

function CommandFillIcon({ width, height, fill }: TConvertedSvgJsxProps) {
  return (
    <svg
      version="1.0"
      xmlns="http://www.w3.org/2000/svg"
      width={width || "24px"}
      height={height || "24px"}
      viewBox="0 0 512.000000 512.000000"
      preserveAspectRatio="xMidYMid meet"
    >
      <g
        transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
        fill={fill}
        stroke="none"
      >
        <path
          d="M683 4305 c-170 -46 -304 -181 -348 -350 -22 -88 -23 -2701 0 -2788
47 -179 198 -323 374 -357 73 -14 3627 -14 3702 0 182 34 344 196 379 379 14
74 14 2668 0 2742 -25 129 -125 267 -238 327 -124 66 9 62 -1997 61 -1533 0
-1828 -3 -1872 -14z m702 -794 c27 -13 177 -156 452 -432 445 -448 435 -435
418 -526 -6 -33 -59 -90 -423 -456 -229 -230 -429 -425 -444 -433 -15 -8 -45
-14 -68 -14 -103 0 -175 92 -155 198 6 32 53 83 358 390 l351 352 -351 353
c-307 308 -352 357 -358 390 -15 78 19 146 89 178 52 23 81 23 131 0z m2535
-1583 c56 -39 75 -73 75 -136 0 -70 -28 -115 -89 -143 -39 -18 -79 -19 -706
-19 -627 0 -667 1 -706 19 -61 28 -89 73 -89 143 0 63 19 97 75 136 l33 22
687 0 687 0 33 -22z"
        />
      </g>
    </svg>
  );
}

export default CommandFillIcon;
