import Twemoji from 'react-twemoji';
import { Link, useLocation } from '@remix-run/react';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Modal, modalTypes } from "~/components/Modal/Modal"
import logo_horizontal from '~/assets/logo_horizontal.svg';
import { useBeta } from '~/utils/hooks/useBeta';

type ModalType = keyof typeof modalTypes;

/**
 * Renders the "tabs" with the project logo, the info button and the language switcher 
 */
export default function Topbar() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [type, setType] = useState<ModalType>('info');

    const { search } = useLocation();
    const { i18n } = useTranslation();
    const lang = i18n.language as 'cs'|'en';

    const openModal = useCallback((type: ModalType) => {
        setType(type);
        setIsModalOpen(true);
    }, [setIsModalOpen, setType]);

    const queryParams = new URLSearchParams(search);

    return (
        <div className="flex-row items-center justify-between flex">
            <Modal isOpen={isModalOpen} setIsOpen={setIsModalOpen} type={type} />
            <div className="flex flex-row items-center w-full h-full">
            <div 
                className="text-slate-400 bg-white px-2 py-2 text-sm rounded-md rounded-b-none shadow-md box-border w-5/12 h-full cursor-pointer" 
                onClick={() => setIsModalOpen(true)}
            >
                <img src={logo_horizontal} alt="Charles Explorer logo" />
            </div>
            <span className="flex-1"></span>
            {
                useBeta() && (
                    <button
                    onClick={() => openModal('beta')}
                    className="text-slate-400 bg-white px-2 text-xl rounded-md rounded-b-none shadow-md hover:text-slate-500 p-2 h-full flex flex-col justify-center items-center" 
                    >
                    {
                    <Twemoji options={{ className: 'twemoji' }}>
                        🔮
                    </Twemoji>
                    }
                </button>
                )
            }
            <button
                onClick={() => openModal('info')}
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