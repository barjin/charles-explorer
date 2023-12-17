import { useMatches } from "@remix-run/react";
import { useEffect, useState } from "react";
import { getFacultyColor } from "~/utils/colors";

export function GraphTooltip({ 
    name, 
    color, 
    faculty, 
    publications, 
    className,
    style,
    followCursor = null,
} : { name: string, color: string, faculty: any, publications?: number, className?: string, style ?: any, followCursor?: any }) {
    const [position, setPosition] = useState([0, 0]);

    const matches = useMatches();  

    const selfName = `${matches[2]?.data?.title.slice(0, 30)}${matches[2]?.data?.title.length > 30 ? '...' : ''}`;

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            setPosition([e.clientX, e.clientY]);
        };

        followCursor?.addEventListener?.('mousemove', handler);

        return () => {
            followCursor?.removeEventListener?.('mousemove', handler);
        }
    }, [followCursor]);

    return (<svg
        xmlns="http://www.w3.org/2000/svg"
        width="334"
        height="176"
        fill="none"
        viewBox="0 0 334 176"
        style={followCursor ? { 
            position: 'fixed', 
            left: position[0] + 15, 
            top: position[1] + 15, 
            display: position[0] === 0 && position[1] === 0 ? 'none' : 'block',
            ...style 
        } : style}
        className={className ?? ''}
    >
      <g filter="url(#filter0_d_10_34)">
        <rect
          width="324"
          height="166"
          x="5"
          y="5"
          fill="#fff"
          rx="7.236"
        ></rect>
      </g>
      <mask
        id="mask0_10_34"
        style={{ maskType: "alpha" }}
        width="324"
        height="166"
        x="5"
        y="5"
        maskUnits="userSpaceOnUse"
      >
        <rect
          width="324"
          height="166"
          x="5"
          y="5"
          fill="#fff"
          rx="7.236"
        ></rect>
      </mask>
      <g mask="url(#mask0_10_34)">
        <g filter="url(#filter1_i_10_34)">
          <path fill="#F5F5F5" d="M-7 80H352V176H-7z"></path>
        </g>
        <text
          fill="#000"
          style={{ whiteSpace: "pre" }}
          fontFamily="Inter"
          fontSize="23.154"
          fontWeight="600"
          letterSpacing="0em"
        >
          <tspan x="55.166" y="40.926">
            {name.slice(0, 20)}{name.length > 20 ? '...' : ''}
          </tspan>
        </text>
        <g filter="url(#filter2_d_10_34)">
          <path fill="#fff" d="M-2 147H332V185H-2z"></path>
        </g>
        <g filter="url(#filter3_i_10_34)">
          <circle cx="32.495" cy="32.977" r="12.059" fill={color}></circle>
        </g>
        <g>
          <circle cx={310 - 8.5*selfName.length} cy="101.977" r="7.505" fill={getFacultyColor(matches[2]?.data?.faculties?.[0]?.id)}></circle>
        </g>
        <text
          fill="#767676"
          style={{ whiteSpace: "pre" }}
          fontFamily="Inter"
          fontSize="15.436"
          letterSpacing="0em"
        >
          <tspan x="55.166" y="63.044">
            osoba na {`${faculty?.abbreviations?.[0]?.value ?? 'neznámé fakultě'} UK`}
          </tspan>
        </text>
        {
            publications &&
            <text
            fill="#767676"
            style={{ whiteSpace: "pre" }}
            fontFamily="Inter"
            fontSize="11"
            letterSpacing="0em"
            >
            <tspan x="190.246" y="128.5">
                {publications} společných publikací
            </tspan>
            </text>
        }
      </g>
      <path
        fill="#616770"
        d="M182.114 120.013h-6.076c-.558 0-1.013.454-1.013 1.013v9.114l4.051-2.315 4.051 2.315v-9.114c0-.559-.454-1.013-1.013-1.013zm0 8.381l-3.038-1.735-3.038 1.735v-7.368h6.076v7.368z"
      ></path>
      <path
        fill="#fff"
        stroke="#fff"
        d="M32.5 32.939a2.812 2.812 0 100-5.625 2.812 2.812 0 000 5.625zm1.875-2.813a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm3.75 7.5c0 .938-.938.938-.938.938h-9.374s-.938 0-.938-.938c0-.937.938-3.75 5.625-3.75 4.688 0 5.625 2.813 5.625 3.75zm-.938-.004c0-.23-.144-.924-.78-1.56-.61-.61-1.761-1.248-3.907-1.248-2.147 0-3.296.637-3.907 1.248-.636.636-.779 1.33-.78 1.56h9.375z"
      ></path>{/*
      <path
        fill="#fff"
        stroke="#fff"
        strokeWidth="0.622"
        d="M153.498 101.953a1.751 1.751 0 10.001-3.503 1.751 1.751 0 00-.001 3.503zm1.167-1.75a1.167 1.167 0 11-2.335-.001 1.167 1.167 0 012.335.001zm2.334 4.667c0 .584-.584.584-.584.584h-5.834s-.584 0-.584-.584c0-.583.584-2.333 3.501-2.333s3.501 1.75 3.501 2.333zm-.584-.002c0-.143-.089-.575-.485-.971-.38-.38-1.096-.777-2.432-.777-1.336 0-2.051.397-2.432.777-.395.396-.484.828-.485.971h5.834z"
      ></path> */}
      <text
        fill="#616770"
        style={{ whiteSpace: "pre" }}
        fontFamily="Inter"
        fontSize="15.436"
        fontWeight="500"
        letterSpacing="0em"
      >
        <tspan x="310.581" y="108.113" textAnchor="end">
          {
            selfName
          }
        </tspan>
      </text>
      <path
        fill="#B4B4B4"
        d="M108 159.088H98v1.149c0 2.639 2.23 4.763 5 4.763s5-2.124 5-4.763v-1.149z"
      ></path>
      <path
        fill="#7F7F7F"
        d="M103.525 158.133H108v-.392c0-2.47-1.953-4.488-4.475-4.737v5.129z"
      ></path>
      <path
        fill="#B4B4B4"
        d="M102.522 153c-2.544.228-4.522 2.256-4.522 4.741v.392h4.522V153zM15 159.088h10v1.149c0 2.639-2.23 4.763-5 4.763s-5-2.124-5-4.763v-1.149z"
      ></path>
      <path
        fill="#7F7F7F"
        d="M19.475 158.133H15v-.392c0-2.47 1.953-4.488 4.475-4.737v5.129z"
      ></path>
      <path
        fill="#B4B4B4"
        d="M20.477 153c2.545.228 4.523 2.256 4.523 4.741v.392h-4.523V153z"
      ></path>
      <text
        fill="#828282"
        style={{ whiteSpace: "pre" }}
        fontFamily="Inter"
        fontSize="10.663"
        letterSpacing="0em"
      >
        <tspan x="113.306" y="163.377">
          Přidat do filtru
        </tspan>
      </text>
      <text
        fill="#828282"
        style={{ whiteSpace: "pre" }}
        fontFamily="Inter"
        fontSize="10.663"
        letterSpacing="0em"
      >
        <tspan x="31" y="163.377">
          Zobrazit
        </tspan>
      </text>
      <defs>
        <filter
          id="filter0_d_10_34"
          width="332.779"
          height="174.779"
          x="0.61"
          y="0.61"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          ></feColorMatrix>
          <feOffset></feOffset>
          <feGaussianBlur stdDeviation="2.195"></feGaussianBlur>
          <feComposite in2="hardAlpha" operator="out"></feComposite>
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"></feColorMatrix>
          <feBlend
            in2="BackgroundImageFix"
            result="effect1_dropShadow_10_34"
          ></feBlend>
          <feBlend
            in="SourceGraphic"
            in2="effect1_dropShadow_10_34"
            result="shape"
          ></feBlend>
        </filter>
        <filter
          id="filter1_i_10_34"
          width="359"
          height="97"
          x="-7"
          y="79"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
          <feBlend
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          ></feBlend>
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          ></feColorMatrix>
          <feMorphology
            in="SourceAlpha"
            radius="3"
            result="effect1_innerShadow_10_34"
          ></feMorphology>
          <feOffset dy="-1"></feOffset>
          <feGaussianBlur stdDeviation="1.5"></feGaussianBlur>
          <feComposite
            in2="hardAlpha"
            k2="-1"
            k3="1"
            operator="arithmetic"
          ></feComposite>
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"></feColorMatrix>
          <feBlend in2="shape" result="effect1_innerShadow_10_34"></feBlend>
        </filter>
        <filter
          id="filter2_d_10_34"
          width="342"
          height="46"
          x="-6"
          y="143"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          ></feColorMatrix>
          <feOffset></feOffset>
          <feGaussianBlur stdDeviation="2"></feGaussianBlur>
          <feComposite in2="hardAlpha" operator="out"></feComposite>
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"></feColorMatrix>
          <feBlend
            in2="BackgroundImageFix"
            result="effect1_dropShadow_10_34"
          ></feBlend>
          <feBlend
            in="SourceGraphic"
            in2="effect1_dropShadow_10_34"
            result="shape"
          ></feBlend>
        </filter>
        <filter
          id="filter3_i_10_34"
          width="24.119"
          height="26.048"
          x="20.436"
          y="20.918"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
          <feBlend
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          ></feBlend>
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          ></feColorMatrix>
          <feOffset dy="1.929"></feOffset>
          <feGaussianBlur stdDeviation="1.206"></feGaussianBlur>
          <feComposite
            in2="hardAlpha"
            k2="-1"
            k3="1"
            operator="arithmetic"
          ></feComposite>
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"></feColorMatrix>
          <feBlend in2="shape" result="effect1_innerShadow_10_34"></feBlend>
        </filter>
        <filter
          id="filter4_i_10_34"
          width="15.01"
          height="16.211"
          x="145.99"
          y="94.472"
          colorInterpolationFilters="sRGB"
          filterUnits="userSpaceOnUse"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix"></feFlood>
          <feBlend
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          ></feBlend>
          <feColorMatrix
            in="SourceAlpha"
            result="hardAlpha"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          ></feColorMatrix>
          <feOffset dy="1.201"></feOffset>
          <feGaussianBlur stdDeviation="0.75"></feGaussianBlur>
          <feComposite
            in2="hardAlpha"
            k2="-1"
            k3="1"
            operator="arithmetic"
          ></feComposite>
          <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"></feColorMatrix>
          <feBlend in2="shape" result="effect1_innerShadow_10_34"></feBlend>
        </filter>
      </defs>
    </svg>  
    )
}