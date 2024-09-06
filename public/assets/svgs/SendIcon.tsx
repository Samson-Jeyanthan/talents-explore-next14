import { TConvertedSvgJsxProps } from "@/types/utils.types";

function SendIcon({ fill, width, height }: TConvertedSvgJsxProps) {
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
          d="M895 4457 c-123 -33 -222 -113 -277 -225 -31 -63 -33 -73 -33 -172
l0 -105 251 -590 251 -590 630 -5 629 -5 36 -24 c19 -13 46 -40 59 -59 21 -31
24 -47 24 -122 0 -75 -3 -91 -24 -122 -13 -19 -40 -46 -59 -59 l-36 -24 -629
-5 -630 -5 -239 -540 c-131 -297 -250 -571 -264 -610 -85 -230 51 -478 296
-541 107 -27 157 -17 338 69 163 78 479 227 2141 1007 542 254 1004 475 1028
492 203 146 203 530 0 675 -41 30 -3160 1520 -3242 1550 -57 20 -190 25 -250
10z"
        />
      </g>
    </svg>
  );
}

export default SendIcon;
