import { Dialog } from '@headlessui/react'
import logo from '~/assets/logo.svg';
import { useTranslation } from 'react-i18next';

export function Modal({ isOpen, setIsOpen } : { isOpen: boolean, setIsOpen: (isOpen: boolean) => void }) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={isOpen}
      onClose={() => setIsOpen(false)}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-xl rounded bg-white p-4 ">
          <img src={logo} className="w-80 mx-auto" alt="logo" />

          <Dialog.Description className="text-justify text-gray-500 mt-4">
            <h3 className="text-sm font-bold">
              {t('modal.descriptionHeading')}
            </h3>
            <p className='text-sm'>
              {t('modal.description')}
            </p>
            <p className='mt-2 text-sm'>
              {t('modal.versionTag')}
            </p>
            <h3 className="text-sm font-bold mt-4">
              {t('modal.authors')}
            </h3>
            <ul className='text-sm decoration-none px-2'>
              <li>
                <a href="https://jindrich.bar" target="_blank" rel="noreferrer" className='text-slate-700'>
                  Jindřich Bär
                </a>
                &nbsp;-&nbsp;
                <span>
                  {t('modal.development')}
                </span>
              </li>
              <li>
                <a href="https://www.mff.cuni.cz/cs/fakulta/organizacni-struktura/lide?hdl=2978" target="_blank" rel="noreferrer" className='text-slate-700'>
                  Tomáš Skopal
                </a>
                &nbsp;-&nbsp;
                <span>
                  {t('modal.teamleader')}
                </span>
              </li>
              <li>
                <a href="https://is.cuni.cz/webapps/whois2/osoba/1658067419202376/?lang=cs" target="_blank" rel="noreferrer" className='text-slate-700'>
                  Petr Mikeš
                </a>
                &nbsp;-&nbsp;
                <span>
                  {t('modal.dataIntegration')}
                </span>
              </li>
            </ul>
            <h3 className="text-sm font-bold mt-4">
              {t('modal.inCollaborationWith')}
            </h3>
            <ul className='text-sm decoration-none px-2'>
              <li>
                <a href="https://www.mff.cuni.cz/cs/fakulta/organizacni-struktura/lide?hdl=1537" target="_blank" rel="noreferrer" className='text-slate-700'>
                  Barbora Vidová-Hladká (MFF UK)
                </a>
              </li>
              <li>
                ...{t('modal.inCollaborationWithOther')}
              </li>
            </ul>
            <p
              className="text-sm mt-4 text-center border-t border-t-slate-600 py-2 my-2"
            >
              {t('modal.contact')}
              <a href="mailto:explorer@jindrich.bar" className='text-slate-700'>
                explorer@jindrich.bar
              </a>.
            </p>
          </Dialog.Description>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}