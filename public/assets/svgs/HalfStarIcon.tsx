import { TConvertedSvgJsxProps } from "@/types/utils.types";

function HalfStarIcon({ fill, width, height }: TConvertedSvgJsxProps) {
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
          d="M2460 4881 c-152 -49 -140 -31 -509 -766 -163 -325 -269 -526 -284
-536 -27 -20 -232 -56 -672 -118 -38 -6 -130 -20 -203 -31 -73 -11 -197 -29
-275 -41 -206 -30 -288 -76 -363 -205 -27 -46 -29 -56 -29 -154 0 -97 2 -109
29 -158 21 -38 157 -179 492 -510 412 -408 463 -462 470 -497 8 -45 2 -88 -71
-510 -90 -515 -117 -696 -119 -790 -1 -81 2 -96 28 -147 35 -70 94 -128 166
-165 48 -25 66 -28 147 -28 l91 0 164 82 c89 46 219 112 288 149 517 271 718
374 736 374 12 0 14 284 14 2035 l0 2035 -22 -1 c-13 0 -48 -8 -78 -18z"
        />
      </g>
    </svg>
  );
}

export default HalfStarIcon;
