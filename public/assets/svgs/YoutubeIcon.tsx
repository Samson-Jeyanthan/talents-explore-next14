import { TConvertedSvgJsxProps } from "@/types/utils.types";

function YoutubeIcon({ fill, width, height }: TConvertedSvgJsxProps) {
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
          d="M3843 4192 c-251 -90 -272 -432 -35 -549 81 -40 183 -40 264 0 107
53 163 144 163 267 0 85 -21 142 -74 203 -72 81 -213 117 -318 79z"
        />
        <path
          d="M2365 3795 c-325 -51 -622 -229 -817 -490 -71 -95 -169 -291 -198
-395 -102 -369 -42 -739 170 -1056 68 -101 223 -256 324 -324 317 -212 687
-272 1056 -170 105 29 300 127 396 199 45 33 116 97 159 142 407 433 458 1071
125 1564 -68 101 -184 222 -285 297 -95 71 -291 169 -395 198 -175 48 -371 61
-535 35z m418 -419 c287 -85 495 -292 584 -583 23 -78 26 -104 26 -233 0 -129
-3 -155 -26 -233 -89 -291 -293 -495 -584 -584 -78 -23 -104 -26 -233 -26
-129 0 -155 3 -233 26 -352 108 -590 403 -614 763 -28 435 274 814 714 894 88
16 269 4 366 -24z"
        />
      </g>
    </svg>
  );
}

export default YoutubeIcon;
