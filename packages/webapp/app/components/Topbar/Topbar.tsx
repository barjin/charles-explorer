import Twemoji from 'react-twemoji';
import { Link, useLocation } from '@remix-run/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Modal } from "~/components/Modal/Modal"
import logo_horizontal from '~/assets/logo_horizontal.svg';

export default function Topbar() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { search } = useLocation();
    const { i18n } = useTranslation();

    const lang = i18n.language as 'cs'|'en';

    const queryParams = new URLSearchParams(search);

    return (
        <div className="flex-row items-center justify-between flex">
            <Modal isOpen={isModalOpen} setIsOpen={setIsModalOpen}  />
            <div className="flex flex-row items-center w-full h-full">
            <div 
                className="text-slate-400 bg-white px-2 py-2 text-sm rounded-md rounded-b-none shadow-md box-border w-5/12 h-full cursor-pointer" 
                onClick={() => setIsModalOpen(true)}
            >
                <img src={logo_horizontal} alt="Charles Explorer logo" />
            </div>
            <span className="flex-1"></span>
            <button
                onClick={() => setIsModalOpen(true)}
                className="text-slate-400 bg-white px-2 text-xl rounded-md rounded-b-none shadow-md hover:text-slate-500 p-2 h-full flex flex-col justify-center items-center" 
                >
                {
                <Twemoji options={{ className: 'twemoji' }}>
                    ℹ️
                </Twemoji>
                }
            </button>
            <Link
                to={{ search: (() => {
                queryParams.set('lang', lang === "cs" ? "en" : "cs");
                return queryParams.toString();
                })() }}
                className="text-slate-400 bg-white px-2 text-xl rounded-md rounded-b-none shadow-md hover:text-slate-500 p-2 h-full flex flex-col justify-center items-center" 
                >
                {
                <Twemoji options={{ className: 'twemoji' }}>
                    { lang === "cs" ? '🇨🇿' : '🇬🇧' }
                </Twemoji>
                }
            </Link>
            </div>
        </div>
    );
}