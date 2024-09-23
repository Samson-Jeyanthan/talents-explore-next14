import { TConvertedSvgJsxProps } from "@/types/utils.types";

function MinimizeScreenIcon({ width, height, fill }: TConvertedSvgJsxProps) {
  return (
    <svg
      version="1.0"
      xmlns="http://www.w3.org/2000/svg"
      width={width || "24px"}
      height={height || "24px"}
      viewBox="0 0 504.000000 405.000000"
      preserveAspectRatio="xMidYMid meet"
    >
      <g
        transform="translate(0.000000,405.000000) scale(0.100000,-0.100000)"
        fill={fill}
        stroke="none"
      >
        <path
          d="M2900 4674 c-46 -20 -77 -50 -103 -99 -22 -40 -22 -44 -25 -810 -2
-561 0 -785 8 -824 17 -77 84 -144 161 -161 39 -8 263 -10 824 -8 l770 3 45
25 c67 38 103 96 108 174 5 71 -14 120 -65 168 -61 58 -56 58 -610 58 l-508 0
577 578 c400 399 582 588 593 614 56 136 -32 286 -174 296 -112 8 -83 33 -718
-601 l-583 -582 0 508 c0 554 0 549 -58 610 -61 64 -162 86 -242 51z"
        />
        <path
          d="M590 2341 c-104 -32 -160 -106 -160 -211 0 -84 53 -161 132 -194 32
-14 109 -16 545 -16 l508 0 -582 -582 c-634 -636 -609 -607 -601 -719 10 -142
160 -230 296 -174 26 11 215 193 615 593 l577 577 0 -508 c0 -554 0 -549 58
-610 48 -51 97 -70 168 -65 78 5 136 41 174 108 l25 45 3 770 c2 540 0 785 -8
822 -8 36 -23 65 -51 97 -70 79 -36 76 -908 75 -421 0 -777 -4 -791 -8z"
        />
      </g>
    </svg>
  );
}

export default MinimizeScreenIcon;
