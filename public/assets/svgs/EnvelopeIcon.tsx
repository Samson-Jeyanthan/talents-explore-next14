import { TConvertedSvgJsxProps } from "@/types/utils.types";
import React from "react";

function EnvelopeIcon({ fill, width, height }: TConvertedSvgJsxProps) {
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
          d="M361 4464 c-169 -45 -301 -180 -346 -351 -23 -86 -23 -3020 0 -3106
45 -173 178 -307 350 -352 52 -13 309 -15 2195 -15 2330 0 2184 -4 2302 56 71
36 159 123 197 193 65 122 61 25 61 1671 0 1311 -2 1503 -15 1555 -45 172
-179 305 -352 350 -85 22 -4309 21 -4392 -1z m4326 -312 c7 -4 -388 -354
-1055 -931 -1028 -892 -1067 -924 -1089 -910 -12 8 -495 424 -1072 924 -644
559 -1044 913 -1037 917 15 10 4237 10 4253 0z m-2184 -2221 c38 -16 107 -10
139 12 13 8 503 431 1091 941 l1067 925 -2 -1374 c-3 -1370 -3 -1374 -24
-1401 -11 -15 -33 -37 -48 -48 l-27 -21 -2139 0 -2139 0 -27 21 c-15 11 -37
33 -48 48 -21 27 -21 31 -24 1402 l-2 1374 1075 -933 c592 -512 1090 -938
1108 -946z"
        />
      </g>
    </svg>
  );
}

export default EnvelopeIcon;
