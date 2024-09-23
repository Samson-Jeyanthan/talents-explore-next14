import { TConvertedSvgJsxProps } from "@/types/utils.types";
function MultiPostIcon({ fill, width, height }: TConvertedSvgJsxProps) {
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
          d="M1714 4789 c-71 -12 -173 -50 -241 -90 -116 -68 -275 -256 -298 -351
l-7 -28 1216 0 c1071 0 1226 -2 1294 -16 297 -61 528 -282 614 -589 l22 -80 6
-1233 5 -1233 70 35 c185 93 333 278 379 476 23 97 23 2472 1 2568 -47 200
-194 385 -379 476 -154 76 -49 71 -1411 72 -671 1 -1243 -2 -1271 -7z"
        />
        <path
          d="M872 3981 c-287 -71 -503 -315 -542 -612 -8 -58 -10 -445 -8 -1259 4
-1324 -3 -1211 85 -1390 80 -164 233 -295 418 -358 l80 -27 1255 0 1255 0 88
31 c122 44 189 87 282 179 92 91 149 189 187 321 l23 79 0 1220 c0 1378 6
1266 -82 1445 -89 182 -261 318 -467 370 -77 19 -114 20 -1290 19 -1130 0
-1216 -2 -1284 -18z"
        />
      </g>
    </svg>
  );
}

export default MultiPostIcon;
